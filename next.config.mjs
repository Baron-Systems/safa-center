/** @type {import('next').NextConfig} */
const nextConfig = {
  // يسمح لسكربت النشر بالبناء في مجلد منفصل دون إيقاف الموقع العامل (انظر deploy.sh)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  trailingSlash: true,
  images: { unoptimized: true },
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
};
export default nextConfig;
