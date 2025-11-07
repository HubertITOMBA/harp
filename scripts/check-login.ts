import { db } from "@/lib/db";
import { getUserByNetId } from "@/data/user";
import bcrypt from "bcryptjs";

async function checkLogin() {
  const netid = "hitomba";
  const password = "hitomba";

  console.log(`\n🔍 Vérification de la connexion pour: ${netid}\n`);

  try {
    // Récupérer l'utilisateur
    const user = await getUserByNetId(netid);

    if (!user) {
      console.log("❌ L'utilisateur n'existe pas dans la base de données");
      return;
    }

    console.log("✅ Utilisateur trouvé:");
    console.log(`   - ID: ${user.id}`);
    console.log(`   - NetID: ${user.netid}`);
    console.log(`   - Email: ${user.email || "Non défini"}`);
    console.log(`   - Nom: ${user.name || "Non défini"}`);
    console.log(`   - Mot de passe hashé: ${user.password ? "Oui" : "Non"}`);

    if (!user.password) {
      console.log("\n❌ L'utilisateur n'a pas de mot de passe défini");
      return;
    }

    // Vérifier le mot de passe
    console.log("\n🔐 Vérification du mot de passe...");
    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (passwordsMatch) {
      console.log("✅ Le mot de passe est correct ! La connexion devrait fonctionner.");
    } else {
      console.log("❌ Le mot de passe est incorrect !");
      console.log(`   Le hash stocké commence par: ${user.password.substring(0, 20)}...`);
    }

  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  } finally {
    await db.$disconnect();
  }
}

checkLogin();

