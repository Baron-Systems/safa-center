"use client";

import { useEffect, useRef } from "react";

const BEAT_PX = 190; // متوسط المسافة بين نبضة وأخرى (تتغير عشوائياً حول هذه القيمة)
const SPEED = 55; // سرعة الرسم (بكسل/ثانية) → نبضة كل ~3.5 ثوانٍ، هادئة جداً
const GAP = 22; // الفراغ الذي "يمسح" الخط القديم أمام رأس الرسم

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** نبضة واحدة بقيم عشوائية — كل نبضة تختلف قليلاً عن التي قبلها كالنبض الحقيقي. */
function randomBeat(start: number) {
  return {
    start,
    len: BEAT_PX * rand(0.78, 1.25), // تفاوت المسافة بين النبضات
    qrs: rand(0.5, 0.6), // موضع القمة داخل النبضة
    r: rand(0.72, 1.05), // ارتفاع القمة
    s: rand(0.28, 0.5), // عمق الهبوط بعد القمة
    q: rand(0.08, 0.22),
    p: rand(0.06, 0.16), // الموجة الصغيرة قبل القمة
    t: rand(0.16, 0.32), // الموجة بعد القمة
    tw: rand(0.85, 1.2), // عرض الموجة الأخيرة
  };
}
type Beat = ReturnType<typeof randomBeat>;

function beatShape(b: Beat): [number, number][] {
  const c = b.qrs;
  return [
    [0, 0], [c - 0.26, 0], [c - 0.22, b.p], [c - 0.17, b.p * 0.9], [c - 0.13, 0],
    [c - 0.035, 0], [c - 0.01, -b.q], [c + 0.03, b.r], [c + 0.07, -b.s], [c + 0.1, 0],
    [c + 0.15, 0], [c + 0.15 + 0.06 * b.tw, b.t * 0.75], [c + 0.15 + 0.12 * b.tw, b.t],
    [c + 0.15 + 0.18 * b.tw, b.t * 0.6], [Math.min(c + 0.15 + 0.23 * b.tw, 0.99), 0], [1, 0],
  ];
}

/**
 * مولّد الموجة: يُسأل عن مسافات متزايدة فقط (كما يرسم الجهاز)،
 * فيُنشئ نبضة عشوائية جديدة كلما انتهت السابقة، مع انجراف خفيف في خط الأساس.
 */
function createWave(firstStart = 0) {
  let beat = randomBeat(firstStart);
  let shape = beatShape(beat);
  return (d: number) => {
    while (d >= beat.start + beat.len) {
      beat = randomBeat(beat.start + beat.len);
      shape = beatShape(beat);
    }
    const p = (d - beat.start) / beat.len;
    let v = 0;
    for (let i = 1; i < shape.length; i++) {
      const [x1, y1] = shape[i];
      if (p <= x1) {
        const [x0, y0] = shape[i - 1];
        v = y0 + ((p - x0) / (x1 - x0 || 1)) * (y1 - y0);
        break;
      }
    }
    // انجراف بطيء لخط الأساس (تنفّس/حركة) حتى لا يبدو الخط مسطرة
    return v + Math.sin(d / 97) * 0.035 + Math.sin(d / 37 + 1.3) * 0.015;
  };
}

/**
 * شريط تخطيط قلب أسفل صور الواجهة، يتحرك كشاشة جهاز مراقبة النبض:
 * رأس مضيء يرسم الخط، والأثر القديم يخفت ويُمسح عند المرور التالي. بلا صوت.
 */
export default function PulseStrip() {
  const traceRef = useRef<HTMLCanvasElement>(null);
  const headRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const trace = traceRef.current!;
    const head = headRef.current!;
    const tc = trace.getContext("2d")!;
    const hc = head.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const yOf = (v: number) => h * 0.62 - v * h * 0.5;

    const setup = () => {
      w = trace.clientWidth;
      h = trace.clientHeight;
      for (const c of [trace, head]) {
        c.width = w * dpr;
        c.height = h * dpr;
        c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      tc.lineWidth = 2;
      tc.lineJoin = tc.lineCap = "round";
      tc.strokeStyle = "#5CC6C9";
      tc.shadowColor = "rgba(92,198,201,.9)";
      tc.shadowBlur = 6;
    };
    setup();

    // «تقليل الحركة»: نرسم الخط كاملاً ثابتاً
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const waveAt = createWave();
      tc.beginPath();
      for (let x = 0; x <= w; x += 2) tc.lineTo(x, yOf(waveAt(x)));
      tc.stroke();
      return;
    }

    let x = 0; // موضع الرأس على الشاشة
    const waveAt = createWave();
    let dist = BEAT_PX * 0.2; // المسافة الكلية (تحدد شكل الموجة)
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const step = Math.min(now - last, 50) / 1000 * SPEED; // نتجاهل القفزات بعد إخفاء التبويب
      last = now;

      // خفوت تدريجي للأثر القديم (كوهج شاشة الجهاز)
      tc.save();
      tc.globalCompositeOperation = "destination-out";
      tc.shadowBlur = 0;
      tc.fillStyle = "rgba(0,0,0,0.0012)";
      tc.fillRect(0, 0, w, h);
      tc.restore();

      // رسم المقطع الجديد
      tc.beginPath();
      tc.moveTo(x, yOf(waveAt(dist)));
      let nx = x;
      for (let s = 0; s < step; s += 1.5) {
        nx = Math.min(x + s + 1.5, x + step);
        tc.lineTo(nx, yOf(waveAt(dist + (nx - x))));
      }
      tc.stroke();
      dist += step;
      x += step;
      if (x > w) x = 0;

      // مسح الفراغ أمام الرأس
      tc.clearRect(x + 2, 0, GAP, h);
      if (x + 2 + GAP > w) tc.clearRect(0, 0, x + 2 + GAP - w, h);

      // الرأس المضيء
      hc.clearRect(0, 0, w, h);
      const y = yOf(waveAt(dist));
      const g = hc.createRadialGradient(x, y, 0, x, y, 14);
      g.addColorStop(0, "rgba(255,255,255,.95)");
      g.addColorStop(0.25, "rgba(92,198,201,.7)");
      g.addColorStop(1, "rgba(92,198,201,0)");
      hc.fillStyle = g;
      hc.fillRect(x - 14, y - 14, 28, 28);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => {
      if (trace.clientWidth !== w) {
        setup();
        x = 0;
      }
    });
    ro.observe(trace);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div aria-hidden className="pulse-strip pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-14 md:h-16" dir="ltr">
      <canvas ref={traceRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={headRef} className="absolute inset-0 h-full w-full" />
      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent-gradient" />
    </div>
  );
}
