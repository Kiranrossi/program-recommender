/** @type {import('next').NextConfig} */
const nextConfig = {
  // API proxy is implemented in app/api/v1/[...slug]/route.ts (reliable for POST + multipart uploads).
  async redirects() {
    return [
      // Old path often served stale bundles; canonical admin login is /admin/sign-in
      { source: "/admin/login", destination: "/admin/sign-in", permanent: false },
    ];
  },
};

export default nextConfig;
