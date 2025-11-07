"use server";

import { db } from "@/lib/db";
import { getUserByNetId } from "@/data/user";
import bcrypt from "bcryptjs";

export async function checkOrCreateUser(netid: string, password: string) {
  try {
    // Vérifier si l'utilisateur existe
    let user = await getUserByNetId(netid);

    if (user) {
      if (user.password) {
        // Vérifier le mot de passe
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) {
          return { 
            success: true, 
            message: "✅ L'utilisateur existe et le mot de passe est correct !",
            user: {
              id: user.id,
              netid: user.netid,
              email: user.email,
              name: user.name,
            }
          };
        } else {
          // Mettre à jour le mot de passe
          const hashedPassword = await bcrypt.hash(password, 10);
          await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
          });
          return { 
            success: true, 
            message: "✅ L'utilisateur existe. Mot de passe mis à jour avec succès !",
            user: {
              id: user.id,
              netid: user.netid,
              email: user.email,
              name: user.name,
            }
          };
        }
      } else {
        // Créer le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        return { 
          success: true, 
          message: "✅ L'utilisateur existe. Mot de passe créé avec succès !",
          user: {
            id: user.id,
            netid: user.netid,
            email: user.email,
            name: user.name,
          }
        };
      }
    } else {
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = await db.user.create({
        data: {
          netid: netid,
          email: `${netid}@example.com`,
          name: netid,
          password: hashedPassword,
        }
      });

      return { 
        success: true, 
        message: "✅ Utilisateur créé avec succès !",
        user: {
          id: user.id,
          netid: user.netid,
          email: user.email,
          name: user.name,
        }
      };
    }
  } catch (error) {
    console.error("Erreur lors de la vérification/création de l'utilisateur:", error);
    
    let errorMessage = "Erreur inconnue";
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Message plus clair pour les erreurs de connexion à la base de données
      if (errorMessage.includes("not allowed to connect")) {
        errorMessage = "❌ Erreur de connexion à la base de données : L'hôte n'est pas autorisé à se connecter. Veuillez vérifier les permissions de la base de données ou utiliser la page d'inscription normale.";
      } else if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND")) {
        errorMessage = "❌ Erreur de connexion à la base de données : Impossible de se connecter au serveur. Vérifiez que la base de données est accessible.";
      }
    }
    
    return { 
      success: false, 
      message: `❌ Erreur: ${errorMessage}` 
    };
  }
}

