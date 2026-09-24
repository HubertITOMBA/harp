import Link from "next/link";
import HarpEnvPage from "@/components/harp/ListEnvs";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { authorizeIdentifiedMenu } from "@/lib/user-roles";

/**
 * Message de refus déjà utilisé par le layout dashboard.
 * Le texte ne réclame pas PORTAL_ADMIN : un TMA_LOCAL peut ouvrir
 * certaines familles et doit être refusé sur les autres.
 */
function FamilyAccessDenied() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Accès refusé</h1>
        <p className="text-muted-foreground mb-4">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.
        </p>
        <Link href="/home" className="text-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}

/**
 * Page d'une famille d'environnements.
 * Le paramètre d'URL est harptypenv.typenvid, égal à harpmenus.display
 * pour le menu de niveau 3 du même nom.
 *
 * @param params - Segment dynamique id de l'URL /harp/envs/[id]
 */
const EnvSinglePage = async ({ params }: { params: { id: string } }) => {
  try {
    const { id } = await params;
    const typenvid = parseInt(id, 10);

    if (isNaN(typenvid) || typenvid <= 0) {
      return notFound();
    }

    let typenv;
    try {
      typenv = await prisma.harptypenv.findUnique({
        where: { typenvid },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du type d'environnement:", error);
      return notFound();
    }

    if (!typenv) {
      return notFound();
    }

    const menu = await prisma.harpmenus.findFirst({
      where: {
        level: 3,
        display: typenvid,
        menu: typenv.typenv,
      },
      include: {
        harpmenurole: {
          include: {
            harproles: {
              select: { role: true },
            },
          },
        },
      },
    });

    const menuRoles = new Set<string>();
    if (menu?.role) {
      menuRoles.add(String(menu.role));
    }
    for (const relation of menu?.harpmenurole ?? []) {
      if (relation.harproles?.role) {
        menuRoles.add(String(relation.harproles.role));
      }
    }

    const userRoles = await getAllUserRoles();
    const allowed = authorizeIdentifiedMenu(
      userRoles,
      menu
        ? { active: menu.active, roles: [...menuRoles] }
        : null
    );

    if (!allowed) {
      return <FamilyAccessDenied />;
    }

    // Point d'insertion ultérieur : périmètre d'équipe, puis filtre envsharp.
    // PORTAL_ADMIN contournera ce niveau. Il n'est pas implémenté ici.
    return (
      <div>
        <HarpEnvPage typenvid={typenvid} />
      </div>
    );
  } catch (error) {
    console.error("Erreur dans EnvSinglePage:", error);
    return notFound();
  }
};

export default EnvSinglePage;
