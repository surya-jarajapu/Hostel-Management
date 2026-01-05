const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xjvstqbmbbicflrjkmhs.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

module.exports = nextConfig;

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
});

