// الصفحة الجذرية "/" تحوّل إلى النسخة العربية (تعمل مع التصدير الثابت).
export default function RootRedirect() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/ar/" />
      <link rel="canonical" href="/ar/" />
      <p style={{ fontFamily: "system-ui", padding: 24 }}>
        <a href="/ar/">الصفا للجراحات التخصصية</a> · <a href="/en/">Al Safa Specialized Surgeries</a>
      </p>
    </>
  );
}
