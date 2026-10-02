# Contexte projet HARP

Document de reprise. Il fige les décisions déjà présentes dans le dépôt au moment de la release `c89981181047b566586b7f514f41aa00d7f86218`. Il ne remplace pas une lecture serveur.

Marqueurs :

- `VALIDÉ` : établi dans le code, la configuration versionnée, les scripts ou la documentation du dépôt.
- `À VÉRIFIER SUR SERVEUR` : cité par la documentation ou le code, mais non confirmé sur la machine distante depuis ce dépôt.
- `RESTANT GO-LIVE` : travail encore à faire avant la mise en production.

Ne pas réauditer le lot RBAC / Launcher déjà livré dans ce SHA. Ne pas réimplémenter l'import.

## Architecture générale

`VALIDÉ` — Application Next.js (App Router), React, Prisma, Tailwind, authentification NextAuth. Le paquet npm s'appelle `portailharp`.

`VALIDÉ` — Le client Prisma est généré au `postinstall` et au début de `npm run build` (`package.json`).

`VALIDÉ` — Les opérations métier passent par des Server Actions (`actions/`, `lib/actions/`). Les routes `app/api/*` existent pour des cas déjà en place (authentification, launcher, initialisation). Le middleware laisse passer `/api/` sans contrôle de session ; la protection d'une route API, lorsqu'elle existe, est dans la route elle-même.

`VALIDÉ` — Trois niveaux d'accès page :

- routes publiques listées dans `routes.ts` (`/`, `/test-login`, `/init`) ;
- `app/(protected)` : session exigée par le layout ;
- `app/(dashboard)` : session, puis rôle `PORTAL_ADMIN` uniquement. `PSADMIN` n'ouvre pas cette section ;
- `/hub` est sous `(protected)` : toute session authentifiée, pas réservé à `PORTAL_ADMIN`.

`VALIDÉ` — Tant qu'une charge GO LIVE est en cours (`isMigrationInProgress`), le middleware renvoie vers `/init`, sauf `/init` et les routes `/api/`.

## DEV local

`VALIDÉ` — Démarrage documenté et scripté : `npm run dev` lance `next dev --turbopack -p 9352`.

`VALIDÉ` — Les secrets locaux vivent dans des fichiers non versionnés (`.env`, `.env.local`, `.env.production`). `docs/CONFIGURATION_LOCAL.md` décrit les variables attendues : `AUTH_URL`, `NEXT_PUBLIC_SERVER_URL`, `AUTH_TRUST_HOST`, `AUTH_SECRET`, `DATABASE_URL`.

`VALIDÉ` — `NEXT_PUBLIC_DEV_MODE=true` est le mode développement cité par `MODE_EMPLOI_ADMIN.md`. Dans ce mode, ou si `NODE_ENV=development`, les boutons d'environnement sautent le contrôle de disponibilité du Launcher puis enchaînent le lancement (`docs/launcher/LAUNCHER-PORTAL-ADMIN.md`).

`VALIDÉ` — Fichiers d'environnements lus par le refresh info en DEV Windows : `C:\produits\portail_harp\files` (`MODE_EMPLOI_ADMIN.md`).

## PRE-PROD distante

`VALIDÉ` — Le remote `portaltech` (`https://github.dxc.com/hitomba/portaltech.git`) est le dépôt qui alimente PRE-PROD et sert de copie de secours. Il doit rester sur le même commit que `origin`.

`VALIDÉ` — Les références de suivi locales, lues sans fetch pour ce document, sont :

- `origin` : `https://github.com/HubertITOMBA/harp.git`, branche de suivi `main` ;
- `portaltech` : `https://github.dxc.com/hitomba/portaltech.git` ;
- `HEAD`, `origin/main` et `portaltech/main` : `c89981181047b566586b7f514f41aa00d7f86218`.

`À VÉRIFIER SUR SERVEUR` — Chemin réel de l'application, branche déployée, HEAD déployé, service, port d'écoute et base PRE-PROD. Le dépôt ne prouve pas qu'une machine distante exécute déjà ce SHA.

`À VÉRIFIER SUR SERVEUR` — Exemples d'URL écrits dans la documentation et dans `next.config.ts`, sans confirmation d'écoute : `http://10.173.8.125:9352`, `http://portails.orange-harp.fr:9352`.

## PROD distante

`VALIDÉ` — Chemin des fichiers de refresh documenté : `/produits/portail_harp/files`. Journal associé : `/produits/portail_harp/files/refresh-info-update.log`, avec repli `<racine_projet>/save/refresh-info-update.log` si le processus ne peut pas écrire. Journal Unix du script : `/data/exploit/harpadm/outils/logs/portail_refresh_info.log` (`MODE_EMPLOI_ADMIN.md`).

`VALIDÉ` — `deploy.sh` fixe `APP_DIR="/produits/portail_harp-tech/www/portaltech"`. Les notes Dynatrace citent le répertoire `/produits/portail_harp-tech/www/`. Ces chemins ne sont pas le même objet que `/produits/portail_harp/files`.

`À VÉRIFIER SUR SERVEUR` — Quel chemin est réellement le répertoire de l'application en PROD, et si PRE-PROD utilise le même.

## Apache

`VALIDÉ` — `docs/CONFIG_APACHE_REVERSE_PROXY_9052.md` décrit Apache comme optionnel. Le mode recommandé du même document est Next.js directement sur le port 9352. L'exemple de virtual host écoute 9352 et proxifie vers `127.0.0.1:3000`. Le fichier d'exemple est `/etc/apache2/sites-available/harp-portal.conf`.

`VALIDÉ` — `docs/CONFIGURATION_HTTP_UNIQUEMENT.md` fixe le protocole applicatif sur HTTP. `auth.ts` n'active les cookies sécurisés que si `AUTH_URL` commence par `https://`. Des guides HTTPS Apache existent à part (`docs/CONFIG_HTTPS_APACHE_NEXTJS.md`) ; ils ne contredisent pas le choix HTTP déjà codé, ils décrivent une option non retenue comme mode courant.

`VALIDÉ` — Origines autorisées des Server Actions dans `next.config.ts` : `portails.orange-harp.fr` (avec et sans port 9052 et 9352), `localhost:9352`, `127.0.0.1:9352`, `10.173.8.125:9352`.

`À VÉRIFIER SUR SERVEUR` — Apache est-il réellement en service devant Next.js, ou l'accès est-il direct sur 9352.

## systemd

`VALIDÉ` — La documentation cite `systemctl stop|start harp` comme un exemple, à côté de PM2 (`docs/CONFIGURATION_PRODUCTION_URLS.md`). `docs/CONFIGURATION_SMTP_ADMIN.md` mentionne des logs systemd. Aucun fichier unit `.service` n'est versionné dans le dépôt.

`VALIDÉ` — `deploy.sh` ne passe pas par systemd. Il charge `.env.production`, met à jour `main` depuis `origin`, installe, génère Prisma, rebuild, tue le PID du port 9352 (`lsof`) et relance `nohup npm run start -p 9352`.

`VALIDÉ` — `scripts/start-production.sh` est un autre démarrage : `NODE_ENV=production`, neutralisation Dynatrace / `NODE_OPTIONS`, chargement via `scripts/load-env.sh` si présent, puis `npx next start -p 9352`. Il ne fait pas de git pull ni de build. `portail.sh` ne fait que sourcer `.env.production`, `prisma generate` et `npm run build`.

`À VÉRIFIER SUR SERVEUR` — Nom exact du unit, `ExecStart`, `WorkingDirectory`, utilisateur, fichiers d'environnement et port réellement écouté. Ne pas traiter `deploy.sh` comme la procédure d'exploitation tant que ce unit n'a pas été lu sur la machine.

## Accès utilisateurs via Citrix

`VALIDÉ` — `docs/INSTALLATION_LAUNCHER_PRODUCTION.md` décrit le cas Citrix / multi-sessions : un seul processus peut écouter `http://localhost:8765`, et le premier utilisateur peut recevoir les lancements des autres. La parade documentée est `NEXT_PUBLIC_LAUNCHER_TRANSPORT=protocol`, pour forcer `mylaunch://` dans la session de l'utilisateur et ne plus exiger `http://localhost:8765/health`.

`À VÉRIFIER SUR SERVEUR` — La variable `NEXT_PUBLIC_LAUNCHER_TRANSPORT` réellement définie au build du portail utilisé par les utilisateurs Citrix. Cette variable est figée au build, comme les autres `NEXT_PUBLIC_*`.

## Ports, domaines et chemins documentés

`VALIDÉ`

| Usage | Valeur documentée | Source |
|---|---|---|
| Portail DEV et `npm start` | 9352 | `package.json` |
| Portail, exemples d'URL | `10.173.8.125:9352`, `portails.orange-harp.fr:9352` | docs, `next.config.ts` |
| Ancien port encore autorisé en origine | 9052 | `next.config.ts`, docs launcher |
| Launcher local, contrôle | `http://localhost:8765/health` | `docs/INSTALLATION_LAUNCHER_PRODUCTION.md` |
| Installation launcher prioritaire | `D:\apps\portal\launcher` | même document |
| Autres emplacements launcher | `W:\portal\HARP\launcher`, `%LOCALAPPDATA%\HARP\launcher`, `%TEMP%\HARP\launcher` | même document |
| PeopleTools client | `D:\apps\peoplesoft\pt<version>\bin\client\winx86\` (`pside.exe`, `psdmt.exe`) | `docs/launcher/LAUNCHER-PORTAL-ADMIN.md` |
| Application selon `deploy.sh` | `/produits/portail_harp-tech/www/portaltech` | `deploy.sh` |
| Fichiers refresh DEV | `C:\produits\portail_harp\files` | `MODE_EMPLOI_ADMIN.md` |
| Fichiers refresh PROD | `/produits/portail_harp/files` | `MODE_EMPLOI_ADMIN.md` |
| Proxy Prisma cité | `proxy.adsaft.ft.net:8080` | `docs/CONFIGURATION_PRISMA_PRODUCTION.md` |

`VALIDÉ` — Le launcher de production documenté n'utilise pas 9052. Si un message affiche encore 9052, la doc renvoie vers `launcher-config.json` et `HARP_API_URL`.

## Remotes Git

`VALIDÉ` — Les deux remotes doivent rester synchronisés, sans push forcé. Ordre déjà utilisé pour cette release : pousser `origin` en fast-forward, puis `portaltech` en fast-forward, sur le même SHA.

`VALIDÉ` — Parent du commit de release : `ccf844c04ad9a5138e21d0a34efd94a8198af1c0`. Message : `feat(rbac): securiser les acces et le launcher`.

`VALIDÉ` — Working tree local propre sur `main` au moment de la rédaction de ce document (`git status` sans entrée). Branche locale alignée sur `origin/main`.

## Déploiement documenté

`VALIDÉ` — Trois procédures coexistent dans le dépôt. Aucune n'est prouvée comme étant celle du serveur.

1. `deploy.sh` : pull `origin/main`, `npm install --production=false`, `npx prisma generate`, suppression de `.next`, `npm run build`, kill du port 9352, `nohup npm run start`. Pas de `prisma migrate deploy`. Pas de systemd.
2. `scripts/start-production.sh` : redémarrage d'un build `.next` déjà présent, port 9352, Dynatrace désactivé.
3. Exemples `systemctl` / PM2 dans `docs/CONFIGURATION_PRODUCTION_URLS.md`, unit non versionné.

`À VÉRIFIER SUR SERVEUR` — Laquelle de ces trois voies est réellement utilisée en PRE-PROD et en PROD.

`RESTANT GO-LIVE` — Déployer `c899811` seulement après lecture du service réel et validation explicite. Ne pas lancer `deploy.sh` par défaut.

## PostgreSQL / Prisma

`VALIDÉ` — `prisma/schema.prisma` déclare `provider = "mysql"`. Ce n'est pas PostgreSQL. `MODE_EMPLOI_ADMIN.md` parle de MariaDB et de `mysqldump` / `mysql`. `docs/CONFIGURATION_LOCAL.md` montre un exemple `DATABASE_URL` PostgreSQL : cet exemple n'est pas le provider versionné. La chaîne réelle est dans `DATABASE_URL`, non versionnée.

`VALIDÉ` — Migrations présentes dans `prisma/migrations/` :

- `20241223222800_noel`
- `20241224000000_make_harptools_fields_optional`
- `20250101000000_add_chrono_tasks`
- `20250101000000_remove_duration_from_harptaskitem`
- `20250101000001_remove_duration_from_harptaskitem`
- `20260924180000_add_harpscope` (en-tête : non appliqué au moment de sa rédaction)
- `20260930114800_add_harp_rbac_subroles` (en-tête : SQL isolé, non appliqué)

`À VÉRIFIER SUR SERVEUR` — Contenu de `_prisma_migrations` sur DEV, PRE-PROD et PROD. Le fait qu'un dossier existe dans Git ne dit pas que `migrate deploy` a réussi sur une base.

`RESTANT GO-LIVE` — Avant tout `prisma migrate deploy`, comparer l'historique Prisma et les tables déjà présentes. Une table créée hors historique fait échouer le déploiement de la migration correspondante.

## Import et réimport déjà implémentés

`VALIDÉ` — La logique est dans `lib/harp-import-core.ts`. Ce module n'est pas une Server Action. La frontière Web est `actions/importharp.ts`. L'orchestration GO LIVE est `lib/init-full-migration.ts`.

`VALIDÉ` — Les tables `psadm*` sont lues. Le pipeline n'écrit pas dedans. `harpmenurole` n'est pas alimentée.

`VALIDÉ` — Deux modes :

- `initial` : refuse de démarrer si une table de destination contient déjà des lignes. Aucune purge automatique.
- `reprise` : termine une charge interrompue sans purge et sans écraser les clés déjà créées. Un message « déjà importé » n'est pas une erreur. Une erreur reste bloquante.

`VALIDÉ` — Arrêt à la première étape en échec lorsque l'étape est obligatoire (`mustSucceed: true`), ou en cas d'erreur explicite.

`VALIDÉ` — Ordre des 23 étapes, puis contrôle final (`lib/init-full-migration.ts`) :

1. Types de bases — obligatoire
2. Statuts d'environnement — obligatoire
3. Rôles `harproles` — obligatoire
4. Menus — obligatoire
5. Items HARP — obligatoire
6. Versions PeopleSoft
7. Versions PeopleTools
8. Releases HARP
9. Types d'environnement — obligatoire
10. Outils
11. Serveurs
12. Instances Oracle (SID)
13. Environnements `envsharp` — obligatoire
14. Liens environnement-serveur
15. `envsharp.instanceId`
16. Version Oracle `envsharp`
17. Instances `harpora`
18. Release `envsharp`
19. Informations d'environnement
20. Indisponibilités
21. Monitors
22. Utilisateurs — obligatoire
23. Rôles utilisateurs — obligatoire
24. Contrôle `PORTAL_ADMIN` — bloquant s'il n'existe aucun `PORTAL_ADMIN` moderne, ou aucun candidat source avec un mot de passe au format accepté

`VALIDÉ` — Destinations dont la vacuité est exigée en mode initial : `user`, `harptypebase`, `statutenv`, `harproles`, `harpmenus`, `harpitems`, `psoftversion`, `ptoolsversion`, `releaseenv`, `harptypenv`, `harptools`, `harpserve`, `harpinstance`, `envsharp`, `harpenvserv`, `harpora`, `harpenvinfo`, `harpenvdispo`, `harpmonitor`, `harpuseroles`. Sessions, tâches, e-mails, notifications et `harpevent` n'en font pas partie.

`VALIDÉ` — `forceImportSpecificEnvs` supprime puis réimporte des environnements nommés. Le commentaire du code exige `lierTypeEnvs()` avant, pour remplir `psadm_env.typenvid`. Le `typenvid` est ensuite mappé vers `harptypenv.typenvid`.

`VALIDÉ` — Une fonction historique qui recalcule `harpinstance.serverId` depuis `psadm*` est hors pipeline. Le commentaire interdit de l'utiliser après GO LIVE.

`VALIDÉ` — Scripts npm déjà présents : `migration:run` (`scripts/run-migration.ts`), `migration:init` (`scripts/run-init-migration.ts`), `migration:users` (`scripts/run-migrate-users.ts`). `docs/MIGRATION_AUTOMATIQUE.md` décrit un chemin plus étroit : si `User` est vide, migrer les utilisateurs puis les rôles. La charge complète reste le pipeline de `init-full-migration.ts`.

`VALIDÉ` — Mots de passe acceptés à la connexion : bcrypt (`$2a$`, `$2b$`, `$2y$`) et hash legacy MySQL `PASSWORD()` (`lib/password.ts`). L'authentification est Credentials NextAuth sur le NetID (`auth.config.ts`).

`RESTANT GO-LIVE` — Ne relancer une charge initiale que sur une base dont les destinations sont vides. Sur une base déjà chargée, seul un mode reprise explicitement décidé a un sens. Ce document ne lance rien.

## Authentification

`VALIDÉ` — NextAuth v5, provider Credentials, adaptateur Prisma, session JWT. `AUTH_SECRET` est obligatoire. `trustHost` est activé. Après connexion, `lastlogin` est mis à jour.

`VALIDÉ` — Le middleware redirige un visiteur non connecté vers `/login` en reconstruisant l'origine depuis `X-Forwarded-Host` ou `Host`, pour éviter un renvoi vers `localhost`.

`VALIDÉ` — `AUTH_URL` et `NEXT_PUBLIC_SERVER_URL` doivent être l'URL réellement affichée dans le navigateur, en HTTP, et `NEXT_PUBLIC_*` doit être défini avant le build (`docs/CONFIGURATION_HTTP_UNIQUEMENT.md`, `docs/CONFIGURATION_PRODUCTION_URLS.md`).

## RBAC, rôles, sous-rôles, familles, permissions

`VALIDÉ` — `PORTAL_ADMIN` est le super-utilisateur du portail. Il voit les menus actifs, ouvre `/list/...`, n'est pas filtré par les familles ni par les périmètres 4K / 150K. Il ne se substitue pas au lien environnement-serveur pour un outil d'environnement.

`VALIDÉ` — `PSADMIN` est un rôle PeopleSoft. Il n'ouvre pas le dashboard et n'équivaut pas à `PORTAL_ADMIN`. Les codes `4K` et `150K` sont des périmètres, pas des rôles.

`VALIDÉ` — Famille : `canAccessTypeEnv` (`lib/user-roles.ts`). Sans `PORTAL_ADMIN`, il faut un sous-rôle actif relié au `typenvid`. Tables : `harpsubrole`, `harprolesubrole`, `harpsubroletypenv`. Clés étrangères en cascade vers `harproles`, `harpsubrole` et `harptypenv.typenvid`. La migration ne contient pas d'INSERT de grants.

`VALIDÉ` — Périmètre : `harpscope`, `harpuserscope`, `envsharp.scopeId`. Codes affectables à un utilisateur : `4K` et `150K` seulement. `UNASSIGNED` reste un état d'environnement, invisible pour un non-admin. Une liste de périmètres affectables vide signifie zéro environnement, pas un accès global. Les identifiants ne sont pas codés en dur : ils viennent des lignes lues.

`VALIDÉ` — Visibilité d'un environnement pour un non-admin : famille accordée, puis périmètre. Les deux se combinent. `PORTAL_ADMIN` voit aussi `UNASSIGNED` et `scopeId` null.

`VALIDÉ` — `GUIDE_UTILISATEUR.md` et le tableau de rôles de `MODE_EMPLOI_ADMIN.md` ne décrivent pas ce contrôle. La référence est `docs/launcher/LAUNCHER-PORTAL-ADMIN.md` et `docs/launcher/LAUNCHER-UTILISATEUR.md`.

`VALIDÉ` — Conséquence du code si les trois tables de sous-rôles sont vides : un non-admin n'a aucune famille. `PORTAL_ADMIN` continue de passer sans grant.

`RESTANT GO-LIVE` — Appliquer `20260930114800_add_harp_rbac_subroles` seulement après vérification qu'elle n'est pas déjà enregistrée et que les tables n'existent pas hors historique. La migration ne charge pas les grants. Leur attribution vient après le réimport, dans la séquence GO-LIVE. La perte temporaire de familles pour certains utilisateurs, le temps de les réattribuer, a été acceptée comme suite manuelle, pas comme motif pour réécrire le moteur.

`RESTANT GO-LIVE` — Précondition écrite dans `docs/launcher/RECETTE-LAUNCHER-RBAC.md` et non rejouée : effectif des utilisateurs EFO sans rôle `TMA_LOCAL` égal à 0. Ne pas créer de comptes pour satisfaire la recette.

## Launcher et refus du legacy

`VALIDÉ` — Jeton HMAC-SHA256 (`AUTH_SECRET`), durée de vie 120 secondes (`lib/launcher-token.ts`). Pas de registre anti-rejeu dans ce lot : un jeton reste accepté jusqu'à expiration. Rejouer le même jeton ne change ni la cible signée ni le NetID.

`VALIDÉ` — Versions :

- v1 legacy : reconnue uniquement pour être refusée. Aucun signataire de production. Réponse : 403 « Jeton legacy refusé », avant toute commande.
- v2 cible liée : PuTTY / FileZilla sur environnement + serveur ; SQL*Plus, Application Designer (`pside`) et Data Mover (`psdmt`) sur l'environnement. Autorisation à l'émission : famille, périmètre, et lien `harpenvserv` pour un serveur. `PORTAL_ADMIN` saute famille et périmètre, pas le lien.
- v3 disponibilité : ne délivre pas de commande. Présenté à `GET /api/launcher/tool`, il est refusé (403).
- v4 PuTTY admin-serveur : `PORTAL_ADMIN` exigé dans l'action d'émission, avant lecture de `harpserve`. Pas d'environnement. Clé SSH relue à la consommation ; chemin vide : « Clé SSH absente ».
- v5 SSH libre `/hub` : session suffisante. Hôte normalisé puis signé. Clé exigée à l'émission et relue à la consommation.
- v6 outil local : seul `sqldeveloper`. Aucun chemin dans le jeton. Chemin relu dans `harptools` à la consommation.

`VALIDÉ` — Le navigateur n'envoie pas la cible. Les champs de requête host, IP, alias, version ou chemin sont ignorés à la consommation. `GET /api/launcher/tool` signifie « commande autorisée », pas « programme Windows encore ouvert ». HARP ne reçoit pas le résultat de `Start-Process`.

`VALIDÉ` — Transport documenté après émission : le navigateur appelle le launcher local en HTTP. Si cet appel échoue, repli iframe puis popup, puis `mylaunch://` seulement si `NEXT_PUBLIC_LAUNCHER_TRANSPORT=auto`. Le mode `protocol` force `mylaunch://` (cas Citrix).

`VALIDÉ` — PuTTY v2 peut partir sans option de clé si `User.pkeyfile` est vide. Ce n'est pas le cas de v4 ni de v5.

`VALIDÉ` — Le rôle `PORTAL_ADMIN` du jeton v4 est contrôlé à l'émission, pas relu à la consommation.

`VALIDÉ` — Application Designer et Data Mover cherchent les outils logiques `pside` et `psdmt`, pas les libellés `APPDESIGNER` / `DATAMOVER`.

## Administration

`VALIDÉ` — Catalogue `/list/...` réservé à `PORTAL_ADMIN`. Fiche serveur : `/list/servers/[srv]`, bouton « Ouvrir PuTTY » si l'identifiant interne est positif. Les valeurs affichées (IP, PS Home) ne sont pas l'autorité du lancement.

`VALIDÉ` — Fiches de travail utilisateur : `/harp/envs/[typenvid]`. Famille fermée : « Accès refusé ».

`VALIDÉ` — Page de refresh des environnements : `/refresh-info` (script Unix `refresh_info_harp.ksh`, puis mise à jour depuis `env.*` et `release.*`).

`VALIDÉ` — SMTP d'administration : variables `MAIL_*` décrites dans `docs/CONFIGURATION_SMTP_ADMIN.md` et `docs/CONFIGURATION_LOCAL.md`. Les valeurs ne sont pas dans Git.

## Migrations

`VALIDÉ` — `npx prisma migrate deploy` est la commande citée pour appliquer les migrations. Elle n'est pas dans `deploy.sh`.

`VALIDÉ` — `20260924180000_add_harpscope` ajoute `envsharp.scopeId`, `harpscope`, `harpuserscope`. `20260930114800_add_harp_rbac_subroles` crée les trois tables de sous-rôles. Les deux en-têtes disent que le SQL n'était pas appliqué lors de la rédaction du fichier.

`À VÉRIFIER SUR SERVEUR` — Statut réel de ces deux migrations, et des migrations plus anciennes, dans chaque base. Ne pas utiliser `migrate resolve`, `migrate dev` ou `db push` pour « aligner » un historique sans décision séparée.

## Tests

`VALIDÉ` — Script : `npm test` (Jest). Le lot RBAC / Launcher de cette release a été validé avec 24 suites et 393 tests verts. Cette rédaction ne les a pas relancés.

`VALIDÉ` — La recette manuelle est `docs/launcher/RECETTE-LAUNCHER-RBAC.md`. Les colonnes de résultat sont vides : elles ne sont pas un PASS. Ne pas créer d'utilisateur, de rôle, de périmètre, d'environnement, de serveur, de clé ni de ligne d'outil pour la remplir.

`VALIDÉ` — Les tests automatiques utilisent des mocks. Ils ne sont pas une preuve de l'état des bases DEV, PRE-PROD ou PROD.

## État actuel du DEV

`VALIDÉ` — Release courante du dépôt local : `c89981181047b566586b7f514f41aa00d7f86218`, branche `main`, working tree propre, `origin/main` et `portaltech/main` (références locales) sur ce SHA.

`VALIDÉ` — Le lot RBAC / Launcher est dans ce commit : moteur de familles et de périmètres, jetons v2 à v6, refus du v1, guides `docs/launcher/`, migration RBAC versionnée.

`VALIDÉ` — Cette migration est dans Git. Son en-tête dit qu'elle n'était pas appliquée. L'état de la base DEV n'a pas été relu pour ce document.

`À VÉRIFIER SUR SERVEUR` — Présence réelle de `harpsubrole`, `harprolesubrole`, `harpsubroletypenv` et `harpscope` dans la base DEV, et présence ou absence de la ligne correspondante dans `_prisma_migrations`.

## SHA release actuel

`VALIDÉ`

```
c89981181047b566586b7f514f41aa00d7f86218
```

Parent : `ccf844c04ad9a5138e21d0a34efd94a8198af1c0`.

## Étapes restantes avant go-live

`RESTANT GO-LIVE`

1. Lire PRE-PROD en lecture seule : service réellement utilisé, HEAD réellement déployé, historique Prisma, et l'état nécessaire pour décider de la suite. Ne pas partir de `deploy.sh` tant que cette lecture n'est pas faite.
2. Vérifier que les migrations `20260924180000_add_harpscope` et `20260930114800_add_harp_rbac_subroles` peuvent être appliquées sans collision avec des tables éventuellement déjà présentes hors historique Prisma.
3. Déployer le SHA validé `c89981181047b566586b7f514f41aa00d7f86218` uniquement après validation explicite. Ne pas migrer ni redémarrer dans la même action que la lecture.
4. Appliquer les migrations nécessaires selon l'état réellement constaté sur PRE-PROD. Ne pas utiliser `migrate resolve`, `migrate dev` ou `db push` sans décision séparée.
5. Effectuer le réimport contrôlé des données avec le mécanisme HARP déjà implémenté, avant la recette fonctionnelle. Ne pas créer un nouveau mécanisme d'import. Utiliser `lib/harp-import-core.ts`, `lib/init-full-migration.ts`, `actions/importharp.ts` et les scripts déjà présents (`scripts/run-migration.ts`, `scripts/run-init-migration.ts`, `scripts/run-migrate-users.ts`). Respecter les modes `initial` et `reprise`, l'ordre et les contrôles documentés dans `lib/init-full-migration.ts`. Ne pas purger automatiquement une base déjà chargée. Déterminer le mode uniquement à partir de l'état réel de PRE-PROD. Ce checkpoint documentaire n'exécute aucun import.
6. Après le réimport, attribuer ou charger les grants nécessaires : familles, sous-rôles, permissions et périmètres concernés. La migration RBAC ne crée pas ces grants.
7. Satisfaire la précondition EFO sans `TMA_LOCAL` = 0, sans créer de données ou de comptes artificiels uniquement pour la recette.
8. Exécuter la recette manuelle `docs/launcher/RECETTE-LAUNCHER-RBAC.md` sur PRE-PROD, avec les comptes, environnements, serveurs et outils réellement présents.
9. Confirmer les paramètres du build et de l'exploitation : `AUTH_URL`, `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_LAUNCHER_TRANSPORT` pour Citrix, et le service réellement utilisé.

Ce document n'autorise aucune de ces actions.
