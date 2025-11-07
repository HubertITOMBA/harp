import { db } from "@/lib/db";
import { getUserByNetId } from "@/data/user";
import bcrypt from "bcryptjs";

async function createOrCheckUser() {
  const netid = "hitomba";
  const password = "hitomba";

  console.log(`\n🔍 Vérification/Création de l'utilisateur: ${netid}\n`);

  try {
    // Vérifier si l'utilisateur existe
    let user = await getUserByNetId(netid);

    if (user) {
      console.log("✅ L'utilisateur existe déjà:");
      console.log(`   - ID: ${user.id}`);
      console.log(`   - NetID: ${user.netid}`);
      console.log(`   - Email: ${user.email || "Non défini"}`);
      console.log(`   - Nom: ${user.name || "Non défini"}`);

      if (user.password) {
        console.log("\n🔐 Vérification du mot de passe...");
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) {
          console.log("✅ Le mot de passe est correct ! La connexion devrait fonctionner.");
        } else {
          console.log("❌ Le mot de passe est incorrect !");
          console.log("   Mise à jour du mot de passe...");
          
          const hashedPassword = await bcrypt.hash(password, 10);
          await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
          });
          console.log("✅ Mot de passe mis à jour avec succès !");
        }
      } else {
        console.log("\n🔐 L'utilisateur n'a pas de mot de passe. Création...");
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log("✅ Mot de passe créé avec succès !");
      }
    } else {
      console.log("📝 L'utilisateur n'existe pas. Création...");
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = await db.user.create({
        data: {
          netid: netid,
          email: `${netid}@example.com`,
          name: netid,
          password: hashedPassword,
        }
      });

      console.log("✅ Utilisateur créé avec succès !");
      console.log(`   - ID: ${user.id}`);
      console.log(`   - NetID: ${user.netid}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Mot de passe: Défini ✓`);
    }

    // Test final de connexion
    console.log("\n🧪 Test final de connexion...");
    const testUser = await getUserByNetId(netid);
    if (testUser && testUser.password) {
      const testMatch = await bcrypt.compare(password, testUser.password);
      if (testMatch) {
        console.log("✅ Test de connexion réussi ! Vous pouvez maintenant vous connecter avec:");
        console.log(`   NetID: ${netid}`);
        console.log(`   Mot de passe: ${password}`);
      }
    }

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await db.$disconnect();
  }
}

createOrCheckUser();

