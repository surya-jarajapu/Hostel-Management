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
