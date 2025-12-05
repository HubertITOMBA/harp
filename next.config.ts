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

    webpack: (config, { isServer }) => {
      // Exclure ssh2 du bundle client car c'est un module natif serveur uniquement
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
        };
        config.externals = config.externals || [];
        config.externals.push({
          'ssh2': 'commonjs ssh2',
        });
      }
      return config;
    },


};

export default nextConfig;
