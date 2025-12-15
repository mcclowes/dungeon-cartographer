const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["dungeon-cartographer"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "dungeon-cartographer": path.resolve(__dirname, "../src/index.ts"),
      "dungeon-cartographer/render": path.resolve(__dirname, "../src/render/index.ts"),
    };
    return config;
  },
};

module.exports = nextConfig;
