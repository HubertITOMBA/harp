/**
 * Webpack loader qui ignore les fichiers .node (modules natifs)
 * Retourne un module vide pour éviter que webpack essaie de parser ces fichiers binaires
 */
module.exports = function ignoreNodeLoader() {
  // Retourner un module vide
  return 'module.exports = {};';
};

