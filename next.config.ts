import type { NextConfig } from "next";

// Configuration Webpack pour la production uniquement
// Cette configuration n'est pas utilisée en développement avec Turbopack
const webpackConfig = (config: any, { isServer }: { isServer: boolean }) => {
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
  } catch {
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
};

const nextConfig: NextConfig = {
  /* config options here */

  // Configuration pour la production
  // ⚠️ IMPORTANT : Les variables NEXT_PUBLIC_* doivent être définies dans .env ou .env.production AVANT le build
  // Ne pas définir de valeur par défaut ici pour éviter les URLs incorrectes en production
  // Si NEXT_PUBLIC_SERVER_URL n'est pas défini, Next.js utilisera des URLs relatives (recommandé pour les RSC)
  // 
  // Pour la production avec reverse proxy Apache :
  // NEXT_PUBLIC_SERVER_URL=https://portails.orange-harp.fr:9052
  // AUTH_URL=https://portails.orange-harp.fr:9052
  //
  // Note: La section env est supprimée pour éviter les valeurs par défaut problématiques
  // Les variables d'environnement seront utilisées directement par Next.js

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

  // Configuration Webpack uniquement pour la production (build)
  // En développement, Turbopack est utilisé via --turbopack dans le script dev
  // On ne définit webpack que pour la production pour éviter le warning Turbopack
  ...(process.env.NODE_ENV === 'production' ? {
    webpack: webpackConfig,
  } : {}),

};

export default nextConfig;
