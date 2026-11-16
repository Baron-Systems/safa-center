#!/usr/bin/env bash
# =============================================================================
#  نشر/تحديث موقع الصفا للجراحات التخصصية على سيرفر Ubuntu
#
#  الاستخدام (من داخل مجلد المشروع، بمستخدم الموقع وليس root):
#     ./deploy.sh            ← يسحب آخر تحديث، يبني، ويشغّل كـ production
#     ./deploy.sh --force    ← يعيد البناء والتشغيل حتى لو لا يوجد تحديث جديد
#
#  الموقع يعمل دائماً على المنفذ 4786 (ثابت).
#  البناء يتم في مجلد منفصل، فيبقى الموقع الحالي شغّالاً أثناء البناء.
#  إن فشل البناء أو لم يستجب الموقع الجديد → يرجع تلقائياً للنسخة السابقة.
# =============================================================================
set -Eeuo pipefail

readonly PORT=4786                     # ثابت — لا يُغيَّر
readonly APP_NAME="alsafa"
readonly HOST="${HOST:-0.0.0.0}"       # 127.0.0.1 إن كان الموقع خلف nginx فقط
readonly BRANCH="${BRANCH:-}"          # فارغ = الفرع الحالي
readonly ENV_FILE=".env.production.local"
readonly NODE_MIN_MAJOR=18

FORCE=0
[[ "${1:-}" == "--force" || "${1:-}" == "-f" ]] && FORCE=1

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

# ---------- أدوات الطباعة ----------
if [[ -t 1 ]]; then G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; B=$'\e[1m'; N=$'\e[0m'; else G= Y= R= B= N=; fi
step() { echo; echo "${B}==> $*${N}"; }
ok()   { echo "${G}✔ $*${N}"; }
warn() { echo "${Y}⚠ $*${N}"; }
die()  { echo "${R}✘ $*${N}" >&2; exit 1; }
trap 'die "توقف السكربت بسبب خطأ في السطر $LINENO. الموقع الحالي لم يتغيّر إلا إن ذُكر غير ذلك أعلاه."' ERR

# ---------- 1. فحص المتطلبات ----------
step "فحص المتطلبات"
[[ $EUID -eq 0 ]] && warn "تشغّل السكربت كـ root. يُفضّل تشغيله بمستخدم الموقع (مثلاً: sudo -iu alsafa)."

command -v node >/dev/null || die "Node.js غير مثبت. ثبّته: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs build-essential python3"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
(( NODE_MAJOR >= NODE_MIN_MAJOR )) || die "إصدار Node.js قديم ($(node -v)). المطلوب ${NODE_MIN_MAJOR}.18 أو أحدث (يُنصح بـ 20)."
ok "Node.js $(node -v)"

if ! command -v pm2 >/dev/null; then
  warn "pm2 غير مثبت — جارٍ تثبيته…"
  if [[ $EUID -eq 0 ]]; then npm install -g pm2; else sudo npm install -g pm2; fi
fi
# نشغّل خدمة pm2 الخلفية أولاً ومخرجاتها مُحوّلة — وإلا تبقى ممسكة بمخرجات أوامر $(pm2 …) فيتعلّق السكربت
pm2 ping >/dev/null 2>&1 </dev/null || die "تعذّر تشغيل pm2. جرّب: pm2 kill ثم أعد تشغيل السكربت."
ok "pm2 جاهز"

# ---------- 2. الإعدادات ومجلد البيانات ----------
step "الإعدادات"
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<'ENV'
# أُنشئ تلقائياً بواسطة deploy.sh — عدّل القيم ثم أعد تشغيل السكربت
NEXT_PUBLIC_SITE_URL=https://alsafa-surgeries.com
DATA_DIR=/var/lib/alsafa
MEDIA_QUOTA_MB=1024
MAX_IMAGE_MB=2
MAX_POSTS=2000
# اجعلها 1 فقط إن كنت تفتح لوحة التحكم عبر http بدون شهادة SSL (غير مستحسن)
# INSECURE_COOKIES=1
ENV
  warn "أُنشئ $ENV_FILE بقيم افتراضية — راجعه (خصوصاً NEXT_PUBLIC_SITE_URL)."
fi
DATA_DIR=$(grep -E '^DATA_DIR=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"' || true)
DATA_DIR=${DATA_DIR:-$APP_DIR/data}
if [[ ! -d "$DATA_DIR" ]]; then
  mkdir -p "$DATA_DIR" 2>/dev/null || sudo mkdir -p "$DATA_DIR"
  sudo chown "$(id -un):$(id -gn)" "$DATA_DIR" 2>/dev/null || true
fi
[[ -w "$DATA_DIR" ]] || die "مجلد البيانات $DATA_DIR غير قابل للكتابة. نفّذ: sudo chown $(id -un): $DATA_DIR"
ok "مجلد البيانات: $DATA_DIR"

# ---------- 3. سحب آخر تحديث ----------
step "سحب آخر تحديث"
CHANGED=0
if [[ -d .git ]]; then
  CUR_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  TARGET=${BRANCH:-$CUR_BRANCH}
  if ! git diff --quiet || ! git diff --cached --quiet; then
    die "يوجد تعديلات محلية على ملفات المشروع في السيرفر. احفظها أو تخلّص منها أولاً (git status)."
  fi
  BEFORE=$(git rev-parse HEAD)
  SELF_BEFORE=$(sha256sum deploy.sh | cut -d' ' -f1)
  [[ "$TARGET" != "$CUR_BRANCH" ]] && git checkout "$TARGET"
  git pull --ff-only origin "$TARGET"
  AFTER=$(git rev-parse HEAD)
  # إن تغيّر هذا السكربت نفسه في التحديث، نعيد تشغيله بنسخته الجديدة
  if [[ -z "${DEPLOY_REEXEC:-}" && "$(sha256sum deploy.sh | cut -d' ' -f1)" != "$SELF_BEFORE" ]]; then
    warn "تم تحديث deploy.sh نفسه — إعادة التشغيل بالنسخة الجديدة…"
    DEPLOY_REEXEC=1 DEPLOY_PREV_HEAD="$BEFORE" exec "$APP_DIR/deploy.sh" "$@"
  fi
  [[ -n "${DEPLOY_PREV_HEAD:-}" ]] && BEFORE=$DEPLOY_PREV_HEAD
  if [[ "$BEFORE" != "$AFTER" ]]; then
    CHANGED=1
    ok "تحديث جديد: ${BEFORE:0:7} → ${AFTER:0:7}"
    git --no-pager log --oneline "${BEFORE}..${AFTER}" | head -10
  else
    ok "لا يوجد تحديث جديد (${AFTER:0:7})"
  fi
else
  warn "المجلد ليس مستودع git — لن يُسحب تحديث. (الكود الحالي في المجلد هو الذي سيُبنى)"
  CHANGED=1
fi

# هل يلزم بناء جديد؟
mkdir -p .deploy-state
# بصمة الكود: رقم آخر commit، أو (بدون git) بصمة محتوى الملفات
if [[ -d .git ]]; then
  SRC_HASH=$(git rev-parse HEAD)
else
  SRC_HASH=$(find src public scripts package.json package-lock.json next.config.mjs tailwind.config.ts postcss.config.mjs tsconfig.json \
    -type f -print0 2>/dev/null | sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1)
fi
app_online() {
  pm2 jlist 2>/dev/null | node -e '
    let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
      try { const a = JSON.parse(s).find((p) => p.name === process.argv[1]); process.exit(a && a.pm2_env.status === "online" ? 0 : 1); }
      catch { process.exit(1); }
    });' "$APP_NAME"
}
RUNNING=0
app_online && RUNNING=1
if [[ $FORCE -eq 0 && -d .next && -f .deploy-state/built && "$(cat .deploy-state/built)" == "$SRC_HASH" && -n "$SRC_HASH" && $RUNNING -eq 1 ]]; then
  ok "الموقع محدَّث ويعمل على المنفذ $PORT — لا حاجة لإعادة البناء (استخدم --force لإجباره)."
  exit 0
fi

# ---------- 4. المكتبات ----------
step "المكتبات"
LOCK_HASH=$(sha256sum package-lock.json | cut -d' ' -f1)
if [[ ! -d node_modules || ! -f .deploy-state/lock || "$(cat .deploy-state/lock)" != "$LOCK_HASH" ]]; then
  # --include=dev: أدوات البناء (tailwind/typescript) مطلوبة حتى لو كان NODE_ENV=production
  npm ci --include=dev --no-audit --no-fund
  echo "$LOCK_HASH" > .deploy-state/lock
  ok "تم تثبيت المكتبات"
else
  ok "المكتبات لم تتغيّر"
fi

# ---------- 5. البناء (في مجلد منفصل — الموقع الحالي يبقى يعمل) ----------
step "بناء نسخة الإنتاج"
rm -rf .next-build
NODE_ENV=production NEXT_DIST_DIR=.next-build npx next build || { rm -rf .next-build; die "فشل البناء — الموقع الحالي ما زال يعمل بالنسخة السابقة."; }
ok "تم البناء"

# ---------- 6. التأكد أن المنفذ 4786 غير مستخدم من برنامج آخر ----------
step "فحص المنفذ $PORT"
PM2_PID=$(pm2 pid "$APP_NAME" 2>/dev/null | tail -1 || true)
if command -v ss >/dev/null && ss -ltnH "sport = :$PORT" | grep -q .; then
  OWNER=$(ss -ltnpH "sport = :$PORT" 2>/dev/null | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)
  # نقبل إن كان المستخدِم هو تطبيقنا أو أحد أبنائه
  if [[ -n "$OWNER" && -n "$PM2_PID" && "$PM2_PID" != "0" ]] && { [[ "$OWNER" == "$PM2_PID" ]] || pgrep -P "$PM2_PID" | grep -qx "$OWNER"; }; then
    ok "المنفذ $PORT مستخدم من الموقع الحالي (سيُستبدل)"
  elif [[ $RUNNING -eq 1 && -z "$OWNER" ]]; then
    ok "المنفذ $PORT مستخدم — على الأرجح من الموقع الحالي"
  else
    rm -rf .next-build
    die "المنفذ $PORT مستخدم من برنامج آخر (pid ${OWNER:-?}). أوقفه أولاً: sudo ss -ltnp 'sport = :$PORT'"
  fi
else
  ok "المنفذ $PORT متاح"
fi

# ---------- 7. التبديل والتشغيل ----------
step "تشغيل النسخة الجديدة على المنفذ $PORT"
rm -rf .next-old
[[ -d .next ]] && mv .next .next-old
mv .next-build .next

start_app() {
  pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
  NODE_ENV=production pm2 start "$APP_DIR/node_modules/next/dist/bin/next" \
    --name "$APP_NAME" --cwd "$APP_DIR" --time \
    --max-memory-restart 600M \
    -- start -p "$PORT" -H "$HOST" >/dev/null
}

healthy() {
  for _ in $(seq 1 30); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/ar/" || true)
    [[ "$code" == "200" ]] && return 0
    sleep 1
  done
  return 1
}

start_app
if healthy; then
  ok "الموقع يعمل ويستجيب على المنفذ $PORT"
  echo "$SRC_HASH" > .deploy-state/built
  pm2 save >/dev/null
  rm -rf .next-old
else
  warn "النسخة الجديدة لم تستجب — آخر سجلات الأخطاء:"
  pm2 logs "$APP_NAME" --lines 30 --nostream --err || true
  if [[ -d .next-old ]]; then
    warn "الرجوع للنسخة السابقة…"
    rm -rf .next-failed && mv .next .next-failed && mv .next-old .next
    start_app
    healthy && pm2 save >/dev/null && die "تم الرجوع للنسخة السابقة وهي تعمل. النسخة الفاشلة محفوظة في .next-failed للفحص."
  fi
  die "الموقع لا يستجيب. افحص: pm2 logs $APP_NAME"
fi

# ---------- 8. تشغيل تلقائي عند إقلاع السيرفر ----------
if ! systemctl is-enabled "pm2-$(id -un)" >/dev/null 2>&1; then
  warn "لتشغيل الموقع تلقائياً بعد إعادة تشغيل السيرفر، نفّذ مرة واحدة:"
  echo "    sudo env PATH=\$PATH:$(dirname "$(command -v node)") $(command -v pm2) startup systemd -u $(id -un) --hp $HOME"
fi

echo
ok "${B}تم النشر بنجاح${N}"
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "   الموقع:       http://${IP:-SERVER_IP}:$PORT/"
echo "   لوحة التحكم:  http://${IP:-SERVER_IP}:$PORT/admin/"
echo "   السجلات:      pm2 logs $APP_NAME"
echo "   الحالة:       pm2 status"
