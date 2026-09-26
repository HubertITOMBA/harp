"use server";

/**
 * Ancien helper de test de connexion.
 * Il ne lit ni n'écrit User : la création de compte et le remplacement
 * de hash passaient par une route publique.
 *
 * @param _netid - NetID ignoré
 * @param _password - Mot de passe ignoré
 * @returns Un refus, sans accès à la base
 */
export async function checkOrCreateUser(_netid: string, _password: string) {
  return {
    success: false,
    message: "Accès refusé",
  };
}
