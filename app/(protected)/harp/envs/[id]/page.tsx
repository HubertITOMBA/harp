import Link from "next/link";
import HarpEnvPage from "@/components/harp/ListEnvs";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { canAccessTypeEnvForSession } from "@/lib/type-env-access";

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
 * Le paramètre d'URL est harptypenv.typenvid.
 * L'accès est décidé par le RBAC des sous-rôles, puis le périmètre
 * 4K/150K est appliqué dans ListEnvs. Le menu n'autorise plus cette page.
 *
 * Transition : EFO users must be reassigned to TMA_LOCAL before RBAC enforcement / GO LIVE.
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

    const familyAllowed = await canAccessTypeEnvForSession(typenvid);
    if (!familyAllowed) {
      return <FamilyAccessDenied />;
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
