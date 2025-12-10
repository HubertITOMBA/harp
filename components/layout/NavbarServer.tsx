import Navbar from "@/components/home/Navbar";

interface NavbarServerProps {
  roles: string;
}

/**
 * Wrapper serveur pour Navbar
 * Permet d'utiliser Navbar (composant serveur async) depuis un composant client
 */
export async function NavbarServer({ roles }: NavbarServerProps) {
  return <Navbar DroitsUser={roles} />;
}

