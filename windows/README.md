## Intégration protocole mylaunch:// (Option A)

Contenu:
- `protocol/install-mylaunch.reg` : crée le protocole `mylaunch://` sur Windows.
- `launcher/launcher.ps1` : lanceur PowerShell avec liste blanche d'outils (PuTTY, pside, ptsmt).

### Installation (poste utilisateur)
1. Copier `launcher.ps1` vers `C:\\apps\\portail\\launcher\\launcher.ps1`.
2. (Optionnel) Placer une icône `launcher.ico` dans `C:\\apps\\portail\\`.
3. Double-cliquer `protocol/install-mylaunch.reg` (ou déployer via GPO) pour enregistrer le protocole.

Le protocole appellera PowerShell avec `-ExecutionPolicy Bypass` afin d'exécuter le lanceur. Restreignez l'accès au dossier et signez le script si possible.

### Sécurité
- Whitelist stricte dans `launcher.ps1` (table `$allowed`).
- Journalisation dans `windows/launcher/logs/launcher.log`.
- Limitez les arguments acceptés (host, user, port, sshkey pour PuTTY).

### Navigateur (Edge/Chrome) — autoriser l'origine Intranet
Configurer les stratégies (GPO/Intune):
- `ExternalProtocolDialogShowAlwaysOpenCheckbox` : activer la case "Toujours autoriser".
- `AutoLaunchProtocolsFromOrigins` : ajouter `{ protocol: "mylaunch", origin: "https://intranet.votre-domaine.tld" }`.

Références politiques:
- Microsoft Edge: `Computer Configuration/Administrative Templates/Microsoft Edge`
- Chrome: `Computer Configuration/Administrative Templates/Google/Google Chrome`

### Exemple d'usage dans l'app (Next.js)

Les lancements partent du portail avec un jeton signé. Le poste local reçoit l'outil et le jeton. Une URL `mylaunch://` qui ne contient que `host`, `user` ou `sshkey` ne lance pas PuTTY.


