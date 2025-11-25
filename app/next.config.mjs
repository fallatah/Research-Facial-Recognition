/** @type {import("next").NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false
    };
    return config;
  },

  experimental: {
    serverActions: false
  },

  async headers() {
    return [
      {
        source: "/haar.xml",
        headers: [
          { key: "Content-Type", value: "text/xml" }
        ]
      }
    ];
  }
};

export default nextConfig;