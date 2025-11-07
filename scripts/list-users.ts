import { db } from "@/lib/db";

async function listUsers() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        netid: true,
        email: true,
        name: true,
        password: true,
      },
      take: 20,
    });

    console.log(`\n📋 Utilisateurs trouvés (${users.length}):\n`);

    if (users.length === 0) {
      console.log("Aucun utilisateur trouvé dans la base de données.");
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. NetID: ${user.netid}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Email: ${user.email || "Non défini"}`);
        console.log(`   - Nom: ${user.name || "Non défini"}`);
        console.log(`   - Mot de passe: ${user.password ? "Défini ✓" : "Non défini ✗"}`);
        console.log("");
      });
    }

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
  } finally {
    await db.$disconnect();
  }
}

listUsers();

