# Launcher HARP — Guide PORTAL_ADMIN

Ce guide décrit l'exploitation du Launcher pour un compte `PORTAL_ADMIN`. Il ne remplace pas le guide utilisateur : `docs/launcher/LAUNCHER-UTILISATEUR.md`.

Le guide général `MODE_EMPLOI_ADMIN.md` et `GUIDE_UTILISATEUR.md` contiennent des tableaux de rôles plus anciens. Ils ne décrivent pas le contrôle actuel par famille et par périmètre 4K / 150K. Ne pas les utiliser comme référence pour décider si un environnement doit être visible.

## 1. Différence utilisateur / PORTAL_ADMIN

Un utilisateur standard ouvre les environnements autorisés dans `/harp/envs/[typenvid]`. La page contrôle la famille. La liste contrôle le périmètre. Chaque lancement d'outil d'environnement revérifie ces droits.

`PORTAL_ADMIN` ouvre en plus les écrans `/list/...`, dont les fiches serveur. Pour les outils d'environnement, le rôle passe outre la famille et le périmètre, mais le lien entre l'environnement et le serveur reste exigé. `PSADMIN` n'ouvre pas `/list/...` et n'équivaut pas à `PORTAL_ADMIN`.

`/hub` n'est pas réservé à `PORTAL_ADMIN`. Toute session authentifiée peut l'utiliser.

## 2. Administration des serveurs

La fiche serveur est `/list/servers/[srv]`, où `[srv]` est le nom `harpserve.srv`.

La page affiche l'adresse IP, le système, le PS User, le domaine et le PS Home. Ces valeurs sont informatives. Le bouton de connexion n'utilise que l'identifiant interne du serveur.

Sans le rôle, l'ouverture directe de l'adresse affiche **Accès refusé**, **Rôle requis : PORTAL_ADMIN**, et la liste des rôles courants. Le contenu de la fiche n'est pas rendu.

## 3. PuTTY administration

Dans le bloc **Connexion rapide**, le bouton **Ouvrir PuTTY** apparaît lorsque l'identifiant interne du serveur est positif.

Ce lancement :

- part de `harpserve.id` ;
- ne demande pas `envsharp.id` ;
- peut viser un serveur qui n'est lié à aucun environnement ;
- est refusé par l'action elle-même si le compte n'est pas `PORTAL_ADMIN`, même si l'écran avait été affiché ;
- connecte le NetID de l'administrateur connecté ;
- relit le chemin `User.pkeyfile` de ce NetID au moment où le poste demande la commande.

Le PS Home affiché sur la fiche n'entre pas dans la commande PuTTY.

Message de succès côté portail : **PuTTY est en cours de lancement...** Ce message veut dire que le poste a accepté la demande. Le contrôle de la clé a lieu lorsque le Launcher interroge HARP. Si le chemin est vide, cette interrogation répond **Clé SSH absente** et PuTTY n'est pas construit. La fenêtre locale du Launcher porte alors l'erreur, alors que le portail a déjà affiché le message de lancement.

Sans identifiant de serveur : **Lancement indisponible : serveur non identifié.** Le bouton n'est d'ailleurs pas rendu dans ce cas.

Il n'y a pas de bouton Application Designer ni Data Mover sur cette fiche.

## 4. Différence avec PuTTY environnement

| | PuTTY environnement | PuTTY administration | SSH libre `/hub` |
|---|---|---|---|
| Point de départ | Fiche `/harp/envs/[typenvid]`, ligne **Serveur**. Aussi, pour un admin, l'icône PuTTY de `/list/envs/[env]` et la colonne serveur de `/recherche` | `/list/servers/[srv]`, bouton **Ouvrir PuTTY** | `/hub`, **Lancer PuTTY** ou **Ouvrir PuTTY** |
| Qui peut lancer | Utilisateur autorisé sur l'environnement. `PORTAL_ADMIN` pour les écrans `/list` | `PORTAL_ADMIN` seulement, contrôlé dans l'action | Toute session authentifiée |
| Cible | Serveur lié à l'environnement. L'adresse affichée n'est pas l'autorité | Serveur ouvert par son identifiant. Hostname et IP sont lus sur `harpserve` à l'émission | Hôte saisi, puis validé et signé. IPv4, nom court ou nom complet |
| Lien environnement | Obligatoire | Non | Aucun |
| Famille | Oui, sauf contournement `PORTAL_ADMIN` | Non | Non |
| Périmètre 4K / 150K | Oui, sauf contournement `PORTAL_ADMIN` | Non | Non |
| Clé SSH | Relue. Si le chemin est vide, PuTTY part sans option de clé | Obligatoire à la consommation. Chemin vide : **Clé SSH absente** | Obligatoire dès la demande. Chemin vide : **Clé SSH absente**, avant l'ouverture locale |
| Compte SSH | NetID de la session | NetID de l'administrateur connecté | NetID de la session. Le champ **Utilisateur** est en lecture seule |

## 5. Configuration des outils

Les programmes PuTTY, FileZilla, SQL*Plus et SQL Developer sont résolus depuis la table des outils HARP (`harptools`) au moment du lancement : dossier, commande et, pour SQL Developer, arguments.

Application Designer et Data Mover n'utilisent pas ce dossier comme chemin d'exécutable. Leur programme est fixé : `pside.exe` ou `psdmt.exe`, sous `D:\apps\peoplesoft\pt<version>\bin\client\winx86\`. La version vient de la fiche (`8.61` devient `pt861`). La ligne d'outil doit toutefois avoir une commande non vide, sinon le lancement est refusé.

Le navigateur ne choisit ni le chemin, ni le nom de l'exécutable, ni la ligne de commande. Ne pas documenter ni proposer une saisie de ce type dans une adresse ou un formulaire de lancement.

Pour SQL Developer, une commande vide produit **Outil non configuré**. Pour les autres outils, le message utilisateur habituel est **… n'est pas configuré ou non accessible**, ou le libellé renvoyé par le contrôle de disponibilité.

## 6. Diagnostic Launcher

1. Confirmer que l'utilisateur voit **Launcher HARP non détecté** ou, au contraire, le message **… est en cours de lancement...**
2. Lui faire utiliser **Tester /health** sur l'adresse indiquée dans le message. Le port dépend du poste.
3. Si le portail annonce un lancement mais que l'outil ne s'ouvre pas, lire la fenêtre et le journal du Launcher local. HARP ne reçoit pas la confirmation que le programme Windows est resté ouvert.
4. Distinguer un refus d'accès (**Accès refusé** sur la fiche ou au clic) d'un outil absent et d'un exécutable introuvable sur le disque.
5. Les guides d'installation restent `windows/README-INSTALLATION-UTILISATEUR.md`, `windows/GUIDE-INSTALLATION-RAPIDE.md`, `windows/INSTALLATION.md` et `docs/INSTALLATION_LAUNCHER_PRODUCTION.md`.

Le contrôle de disponibilité interroge HARP, pas le service Windows. Un outil peut donc être « disponible » alors que le Launcher local est arrêté. L'arrêt du service se voit au clic suivant, avec **Launcher HARP non détecté**.

En mode développement du portail (`NODE_ENV=development` ou `NEXT_PUBLIC_DEV_MODE`), les boutons d'environnement sautent ce contrôle de disponibilité et enchaînent le lancement. Une recette du contrôle doit se faire hors de ce mode.

## 7. Diagnostic User.pkeyfile

Sur `/user/profile`, le bloc **Clé SSH (pkeyfile)** montre un chemin, ou **Aucune clé SSH configurée**. Il ne montre pas le contenu du fichier.

Le formulaire d'administration d'un utilisateur enregistre aussi un chemin, jamais le texte de la clé privée. Ne pas demander à l'utilisateur de coller la clé.

Constat sans ouvrir le fichier :

- profil vide : FileZilla n'ajoutera pas de clé ; le PuTTY d'environnement peut quand même démarrer sans option de clé ; `/hub` répond **Clé SSH absente** ; le PuTTY d'administration échoue au moment où le poste demande la commande, avec **Clé SSH absente** ;
- profil renseigné, outil qui échoue encore : le chemin peut être faux ou le fichier absent du poste de l'utilisateur. Vérifier le chemin affiché, pas le contenu.

La valeur utilisée est celle présente en base au moment de la demande de commande, y compris si elle a changé après l'ouverture de la page.

## 8. Diagnostic environnement

| Situation | Ce que voit l'utilisateur | Contrôle réel |
|---|---|---|
| Famille refusée | Page `/harp/envs/[typenvid]` : **Accès refusé** | La famille n'est pas accordée par les rôles. Aucune carte, donc aucun clic |
| Périmètre incompatible | La fiche n'apparaît pas dans la liste | Famille ouverte, environnement hors 4K / 150K. Un lancement direct reste **Accès refusé** |
| Environnement invisible pour une autre cause | Liste vide ou fiche absente | Rôles, périmètre, ou environnement inexistant |
| Serveur non lié | Clic PuTTY ou FileZilla : **Accès refusé** | L'identifiant de serveur n'est pas lié à cet environnement |
| Cible non résolue | **Accès refusé** | Serveur sans hostname ni IP, FileZilla sans IP, ou alias / version PeopleTools inutilisable |
| Outil local absent | **SQL Developer n'est pas configuré ou non accessible** ou **Outil non configuré** | Ligne `harptools` de `sqldeveloper` absente ou sans commande |
| Identifiants absents à l'écran | **Lancement indisponible : environnement ou serveur non identifié.** ou **environnement non identifié** | Le bouton n'a pas reçu d'identifiant. Aucune autre cible n'est choisie à la place |
| Environnement inexistant | **Accès refusé** si un lancement est quand même demandé | L'identifiant ne correspond à aucune fiche |

À l'écran, plusieurs refus techniques distincts se présentent sous le seul texte **Accès refusé**. Le libellé ne sépare pas la famille, le périmètre, le lien et la cible vide.

`PORTAL_ADMIN` voit les familles et les périmètres sans ce filtre, y compris dans `/recherche`. Il ne voit pas un serveur comme cible PuTTY d'environnement s'il n'est pas lié à l'environnement choisi. Le PuTTY de `/list/servers/[srv]` est l'autre parcours, volontairement sans environnement.

## 9. Sécurité

En exploitation :

- la cible d'un outil d'environnement est décidée sur le serveur, à partir de l'environnement et, s'il y a lieu, du serveur lié ;
- le compte SSH est le NetID de la session, pas une valeur du navigateur ;
- le chemin de clé, le chemin des programmes et les arguments SQL Developer sont relus côté serveur ;
- l'hôte de `/hub` est la seule saisie libre, et elle est contrôlée avant d'être retenue ;
- un ancien jeton de l'ancien mode de lancement est refusé. Les boutons actuels ne le produisent pas ;
- une autorisation de lancement est de courte durée : 120 secondes. Pendant ce délai, la même autorisation peut être répétée. Elle ne change ni la cible ni le NetID déjà retenus.

Ne pas demander à un utilisateur de copier, modifier ou rejouer une autorisation de lancement.

## 10. Limites connues

- Une autorisation déjà émise reste réutilisable jusqu'à son expiration, 120 secondes. Un second usage répète la même cible et le même NetID. Il ne permet pas d'en substituer d'autres. Il n'existe pas de mécanisme qui consume l'autorisation au premier appel.
- Si le navigateur croit que l'appel au Launcher local a échoué alors que le poste a déjà reçu la demande, une seconde demande peut partir avec la même autorisation. Plusieurs fenêtres du même outil peuvent alors s'ouvrir. Un appel local réussi n'enchaîne pas les autres modes de transport.
- HARP sait qu'il a autorisé une commande. Il ne sait pas que le programme Windows est resté ouvert.
- Le texte d'aide du profil mentionne la clé pour Refresh Info. Le Launcher la relit aussi. Le texte du profil n'a pas été modifié.
- Des constructeurs d'adresses et des écrans anciens restent dans le dépôt sans être montés sur les pages de travail. Ils ne sont pas un parcours utilisateur.

La précondition de mise en production des droits reste : EFO without TMA_LOCAL = 0. Ce guide ne modifie pas les comptes EFO.
