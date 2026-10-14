// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   images: {
//     unoptimized: true,
//   },
//   async rewrites() {
//     return [
//       {
//         source: "/api/:path*",
//         destination: "http://localhost:9000/api/:path*",
//       },
//     ]
//   },
// }
//
// export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // БЛОК REWRITES МЫ УДАЛИЛИ, так как теперь работает middleware.ts
};

export default nextConfig;
