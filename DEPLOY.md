# رفع موقع الصفا على سيرفر خاص (VPS)

الموقع تطبيق Next.js يعمل على Node.js، ويخزّن الأخبار في ملف **SQLite** والصور على قرص السيرفر.
كل البيانات في مجلد واحد (`DATA_DIR`)، ونسخه الاحتياطي يكفي لحفظ كل شيء.

الخطوات أدناه لـ **Ubuntu 22.04 / 24.04**.

---

## 1. تجهيز السيرفر (مرة واحدة)

```bash
# Node.js 20 + أدوات البناء (لمكتبة SQLite) + nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3 nginx sqlite3
sudo npm install -g pm2

# مستخدم خاص بالموقع ومجلد البيانات
sudo useradd -m -s /bin/bash alsafa
sudo mkdir -p /var/lib/alsafa && sudo chown alsafa:alsafa /var/lib/alsafa
```

## 2. رفع الكود

**الطريقة المفضّلة — git:** ارفع المشروع إلى مستودع (GitHub/GitLab…) ثم على السيرفر:

```bash
sudo -iu alsafa
git clone <رابط-المستودع> ~/site
```

بهذا يستطيع سكربت النشر سحب آخر تحديث تلقائياً.

**أو بدون git:** انسخ المجلد بـ rsync (بدون `node_modules` و`.next` و`data`):

```bash
rsync -av --exclude node_modules --exclude .next --exclude data \
  "safa center/" alsafa@SERVER_IP:/home/alsafa/site/
```

## 3. التشغيل — سكربت `deploy.sh`

```bash
sudo -iu alsafa
cd ~/site
./deploy.sh
```

السكربت يقوم بكل شيء:

1. يتحقق من Node.js وpm2 (ويثبّت pm2 إن لم يكن موجوداً).
2. يُنشئ `.env.production.local` بقيم افتراضية إن لم يوجد — **راجعه** (خصوصاً `NEXT_PUBLIC_SITE_URL`).
3. يسحب آخر تحديث من git (`git pull`).
4. يثبّت المكتبات فقط إن تغيّرت.
5. يبني نسخة الإنتاج **في مجلد منفصل** — الموقع الحالي يبقى يعمل أثناء البناء.
6. يشغّل الموقع عبر pm2 على المنفذ **4786** (ثابت دائماً).
7. يتأكد أن الموقع يستجيب؛ وإن لم يستجب **يرجع تلقائياً للنسخة السابقة**.

إن لم يوجد تحديث جديد والموقع يعمل، لا يفعل شيئاً. لإجبار إعادة البناء: `./deploy.sh --force`

**أول مرة فقط:**

```bash
# حساب المشرف (كلمة مرور 10 أحرف على الأقل)
DATA_DIR=/var/lib/alsafa npm run admin -- add admin@alsafa-surgeries.com 'كلمة-مرور-قوية'

# تشغيل الموقع تلقائياً عند إقلاع السيرفر (السكربت يطبع الأمر الدقيق لسيرفرك)
exit
sudo env PATH=$PATH pm2 startup systemd -u alsafa --hp /home/alsafa
```

خيارات إضافية (متغيرات بيئة):

| المتغير | الافتراضي | الاستخدام |
|---|---|---|
| `HOST` | `0.0.0.0` | اجعله `127.0.0.1` إن كان الموقع خلف nginx فقط (لا يُفتح المنفذ 4786 من الخارج) |
| `BRANCH` | الفرع الحالي | فرع git الذي يُسحب منه التحديث |

مثال: `HOST=127.0.0.1 ./deploy.sh`

## 5. nginx + HTTPS

أنشئ `/etc/nginx/sites-available/alsafa`:

```nginx
server {
    listen 80;
    server_name alsafa-surgeries.com www.alsafa-surgeries.com;

    client_max_body_size 5m;   # حجم رفع الصور

    location / {
        proxy_pass http://127.0.0.1:4786;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/alsafa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# شهادة SSL مجانية
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d alsafa-surgeries.com -d www.alsafa-surgeries.com
```

> ⚠️ لوحة التحكم تحتاج **HTTPS**: كوكي تسجيل الدخول لا يعمل على http في وضع الإنتاج.
> للتجربة المؤقتة عبر `http://IP:4786` أضف `INSECURE_COOKIES=1` إلى `.env.production.local` ثم `./deploy.sh --force` — واحذفه بعد تفعيل HTTPS.

لوحة التحكم: `https://alsafa-surgeries.com/admin/`

---

## النسخ الاحتياطي (مهم)

نسخة يومية لقاعدة البيانات والصور، مع الاحتفاظ بآخر 14 نسخة:

```bash
sudo mkdir -p /var/backups/alsafa
sudo tee /etc/cron.daily/alsafa-backup >/dev/null <<'EOF'
#!/bin/sh
set -e
D=$(date +%F)
sqlite3 /var/lib/alsafa/alsafa.db ".backup /var/backups/alsafa/db-$D.sqlite"
tar -czf /var/backups/alsafa/uploads-$D.tar.gz -C /var/lib/alsafa uploads
find /var/backups/alsafa -type f -mtime +14 -delete
EOF
sudo chmod +x /etc/cron.daily/alsafa-backup
```

انسخ مجلد `/var/backups/alsafa` إلى مكان خارج السيرفر من وقت لآخر.

## تحديث الموقع لاحقاً

```bash
sudo -iu alsafa
cd ~/site && ./deploy.sh
```

البيانات في `/var/lib/alsafa` لا تتأثر بالتحديث.

## إدارة المشرفين

```bash
cd /home/alsafa/site
DATA_DIR=/var/lib/alsafa npm run admin -- list
DATA_DIR=/var/lib/alsafa npm run admin -- add    email@example.com 'password'
DATA_DIR=/var/lib/alsafa npm run admin -- passwd email@example.com 'new-password'
DATA_DIR=/var/lib/alsafa npm run admin -- remove email@example.com
```

## التشغيل على جهازك للتجربة

```bash
npm run admin -- add test@example.com 'TestPass12345'   # تُحفظ في ./data
npm run dev
# افتح http://localhost:3000/admin/
```
