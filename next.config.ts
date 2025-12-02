import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

    // ACTIVER AVANT LE BUILD
    //  XXX output: "export",
    eslint: {
      // XXX Warning: This allows production builds to successfully complete even if
      // XXX your project has ESLint errors.
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },


    experimental: {
      // Désactiver les workers pour éviter les problèmes avec NODE_OPTIONS (Dynatrace)
      workerThreads: false,
      // Limiter à 1 CPU pour éviter les workers
      cpus: 1,
    },


};

export default nextConfig;
