import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A lockfile in the home directory makes Next infer ~/ as the workspace root.
  // Pin it to this project so module + asset tracing resolve here.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
