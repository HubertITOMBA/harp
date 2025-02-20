/**
 * Un tableau de routes accessibles au public
 * Cette route ne nécessite pas d'authentification
 * @type {string[]}
 */

export const publicRoutes = [
    "/",
    // "/lists",
    // "/harp/"
    
];


/**
 * Routes utilisées pour l'authentification
 * Ces routes redirigeront les utilisateurs connectés vers /home
 * @type {string[]}
 */
export const authRoutes = [
   "/login",
   "/register",
   "/error",
   "/reset",
   "/new-password",  
];

/**
 * Le préfixe des routes d'authentification API
 * Les routes commençant par ce préfixe sont utilisées à des fins d'authentification API
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth"; 


/**
 * Le chemin de redirection par défaut après la connexion
 * @type {string}
*/
export const DEFAULT_LOGIN_REDIRECT = "/home ";
