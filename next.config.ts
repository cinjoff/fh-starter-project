import { fileURLToPath } from "node:url";
import createJiti from "jiti";
import type { NextConfig } from "next";

const jiti = createJiti(fileURLToPath(import.meta.url));

// Validate env at build time
jiti("./src/lib/env");

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
