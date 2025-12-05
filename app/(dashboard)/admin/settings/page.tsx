import { redirect } from "next/navigation";

/**
 * Page de redirection /admin/settings vers /settings
 * Cette page redirige automatiquement vers la page settings principale
 */
export default function AdminSettingsPage() {
  redirect("/settings");
}

