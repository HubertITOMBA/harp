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
      workerThreads: false,
      cpus: 1,
    },

    webpack: (config, { isServer }) => {
      // Ignorer les fichiers binaires .node (modules natifs)
      // Créer un loader inline qui retourne un module vide
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      
      // Règle pour ignorer complètement les fichiers .node
      // Utiliser un loader inline qui retourne module.exports = {}
      try {
        config.module.rules.push({
          test: /\.node$/,
          use: {
            loader: require.resolve('./webpack-loaders/ignore-node-loader.js'),
          },
        });
      } catch (error) {
        // Si le loader n'existe pas, utiliser une approche alternative
        // Utiliser asset/inline pour éviter le parsing
        config.module.rules.push({
          test: /\.node$/,
          type: 'asset/inline',
        });
      }
      // Empêcher webpack de résoudre les fichiers .node
      config.resolve = config.resolve || {};
      config.resolve.extensions = config.resolve.extensions || [];
      // Ne pas inclure .node dans les extensions résolues automatiquement
      config.resolve.extensions = config.resolve.extensions.filter((ext: string) => ext !== '.node');

      // Exclure ssh2 complètement du bundle webpack
      const originalExternals = config.externals;
      
      const ssh2External = (data: { context: string; request: string }, callback: (err?: Error | null, result?: string) => void) => {
        const { request } = data;
        // Exclure ssh2 et tous ses sous-modules
        if (request === 'ssh2' || request.startsWith('ssh2/')) {
          return callback(null, `commonjs ${request}`);
        }
        
        // Si originalExternals est une fonction, l'appeler
        if (typeof originalExternals === 'function') {
          return originalExternals(data, callback);
        }
        
        callback();
      };

      if (Array.isArray(originalExternals)) {
        config.externals = [...originalExternals, ssh2External];
      } else if (typeof originalExternals === 'function') {
        config.externals = [originalExternals, ssh2External];
      } else if (originalExternals) {
        config.externals = [originalExternals, ssh2External];
      } else {
        config.externals = ssh2External;
      }

      // Exclure ssh2 du bundle client avec fallback pour les modules Node.js
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
        };
      }
      
      return config;
    },


};

export default nextConfig;
