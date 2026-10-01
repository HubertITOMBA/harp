# Launcher HARP — Guide utilisateur

Ce guide s'adresse à un utilisateur du portail. Il explique comment ouvrir les outils installés sur le poste Windows depuis une fiche d'environnement, et comment utiliser la connexion SSH libre.

Le catalogue d'administration (`/list/...`) n'est pas une zone de travail standard. Les fiches d'environnement se consultent depuis `/harp/envs/...`.

## 1. À quoi sert le Launcher ?

Le portail peut demander à votre poste Windows d'ouvrir un outil déjà installé : PuTTY, FileZilla, SQL*Plus, Application Designer, Data Mover ou SQL Developer.

HARP choisit la cible autorisée. Vous cliquez le lien déjà placé sur la fiche. Vous ne saisissez pas l'adresse du serveur, le compte ni le chemin du programme au moment du clic.

## 2. Prérequis

Avant un lancement :

- être connecté au portail ;
- avoir le Launcher HARP installé et démarré sur le poste ;
- avoir l'outil Windows installé ;
- voir l'environnement dans `/harp/envs/...` ;
- pour PuTTY, FileZilla et la connexion SSH libre, disposer d'un chemin de clé SSH renseigné sur le profil lorsque l'outil l'exige.

L'installation du programme local est décrite dans les guides déjà présents dans le dépôt :

- `windows/README-INSTALLATION-UTILISATEUR.md`
- `windows/GUIDE-INSTALLATION-RAPIDE.md`
- `windows/INSTALLATION.md`
- `docs/INSTALLATION_LAUNCHER_PRODUCTION.md`

Si le Launcher ne répond pas, le portail affiche **Launcher HARP non détecté**, l'adresse de contrôle locale, puis les pistes **install-launcher-server.ps1 -AddToStartup** et **D:\apps\portal\launcher\start-launcher-server.bat**. Le bouton **Tester /health** ouvre ce contrôle. Le bouton **Continuer quand même** retente le lancement.

## 3. Accéder à mes environnements

Ouvrir `/harp/envs/` suivi du numéro de famille qui vous a été indiqué, par exemple `/harp/envs/1`.

La page n'affiche que les environnements permis par vos rôles et par votre périmètre. Deux personnes connectées ne voient pas forcément les mêmes fiches.

Si la famille ne vous est pas ouverte, la page affiche **Accès refusé** et le texte **Vous n'avez pas les permissions nécessaires pour accéder à cette section.** Aucun outil de cette famille n'est alors proposé.

Le guide général du portail est `GUIDE_UTILISATEUR.md`. Il ne décrit pas le détail famille et périmètre utilisé pour ces fiches. En cas de fiche manquante, contacter l'administrateur plutôt que d'ouvrir `/list/...`.

## 4. Ouvrir PuTTY depuis un environnement

1. Ouvrir la fiche environnement autorisée.
2. Repérer la ligne **Serveur**.
3. Cliquer le nom du serveur. L'infobulle indique **Putty**.

Le serveur est déjà celui de la fiche. Aucun second choix d'environnement n'est demandé. Le compte de connexion est votre NetID de session, pas un compte saisi dans la page. L'adresse affichée à côté du nom ne sert pas de cible : HARP utilise le serveur lié à l'environnement.

Message de succès : **PuTTY est en cours de lancement...**

Si la ligne n'a pas d'identifiant d'environnement ou de serveur, le message est **Lancement indisponible : environnement ou serveur non identifié.**

## 5. Ouvrir FileZilla

1. Sur la même fiche, repérer la ligne **PS Home**.
2. Cliquer le texte affiché, souvent un chemin suivi de `/HARP_FILES`, ou **N/A**. L'infobulle indique **FileZilla**.

Ce texte est un libellé. Le dossier PS Home n'est pas l'adresse de connexion. FileZilla s'ouvre en SFTP vers l'adresse du serveur lié à l'environnement, avec votre NetID. La clé SSH du profil est relue par le serveur HARP au moment du lancement.

Message de succès : **FileZilla est en cours de lancement...**

Sans identifiant d'environnement ou de serveur : **Lancement indisponible : environnement ou serveur non identifié.**

## 6. Ouvrir SQL*Plus

1. Repérer la ligne **Alias SQL*Net / Schéma**.
2. Cliquer la valeur. L'infobulle indique **SqlPlus**.

L'alias utilisé est celui de l'environnement autorisé. Il n'est pas possible de le remplacer en modifiant le texte affiché. SQL*Plus doit être installé et configuré pour cet alias sur le poste.

Message de succès : **SQL*Plus est en cours de lancement...**

Sans environnement identifié : **Lancement indisponible : environnement non identifié.**

Un alias incorrect se reconnaît ainsi : SQL*Plus s'ouvre, puis la connexion Oracle échoue, ou l'alias demandé n'est pas celui inscrit sur la fiche. Dans ce cas, ne pas chercher un autre alias dans l'adresse du navigateur. Signaler la fiche à l'administrateur.

## 7. Ouvrir PeopleSoft Application Designer / PSIDE

Le libellé de la fiche est **Version PSoft (Designer)**. La valeur cliquable est la version PeopleSoft affichée. L'infobulle indique **Application Designer**.

Le lancement utilise la version PeopleTools de la fiche, au format `X.YY` (exemple : `8.61`), et l'alias SQL*Net de cet environnement. Le programme ouvert est Application Designer (`pside.exe`) de cette version.

Message de succès : **Application Designer (PTools 8.61 / pt861) en cours de lancement...** Les numéros suivent la fiche.

Messages possibles avant le lancement :

- **Version PTools manquante pour cet environnement. Impossible de lancer l'outil PeopleSoft.**
- **Version PTools vide pour cet environnement. Impossible de lancer l'outil PeopleSoft.**
- **Version PTools invalide (« … »). Renseignez une version au format X.YY (exemple : 8.61).**
- **Format de Version PTools non reconnu (« … »). Attendu: X.YY (exemple : 8.61).**
- **Lancement indisponible : environnement non identifié.**

Il n'y a pas de bouton Application Designer sur une fiche serveur d'administration.

## 8. Ouvrir Data Mover / PSDMT

Le libellé de la fiche est **Schéma Oracle (DataMover)**. La valeur cliquable est le schéma Oracle affiché. L'infobulle indique **Datamover**.

Le principe est le même que pour Application Designer : même environnement, même alias, même version PeopleTools. Le programme ouvert est Data Mover (`psdmt.exe`).

Message de succès : **Data Mover (PTools 8.61 / pt861) en cours de lancement...**

Les messages de version ou d'environnement manquant sont les mêmes que pour Application Designer, avec **PSDMT n'est pas configuré ou non accessible** si l'outil n'est pas en place.

## 9. Ouvrir SQL Developer

SQL Developer est un outil local. Le fait de cliquer depuis une carte environnement ne signifie pas que HARP ouvre automatiquement une connexion à cet environnement.

Sur la fiche, la ligne s'appelle **Instance Oracle**. Le lien affiche l'alias et la version Oracle. L'infobulle indique **SqlDeveloper**. Ce texte situe l'outil sur la carte. Il n'est pas envoyé comme cible de connexion.

Aucun serveur, aucun alias et aucune clé SSH ne sont exigés pour ce clic. Le programme ouvert est celui configuré par l'administrateur pour SQL Developer.

Message de succès : **SQL Developer est en cours de lancement...**

Si l'outil n'est pas configuré : **SQL Developer n'est pas configuré ou non accessible**, ou **Outil non configuré**.

La connexion à une base, le cas échéant, se fait ensuite dans SQL Developer, avec les moyens prévus sur le poste. HARP ne la crée pas depuis la fiche.

## 10. Utiliser Connexion SSH /hub

La page `/hub` s'intitule **Connexion SSH**. Elle est ouverte à toute personne connectée. Elle ne dépend pas d'une famille ni d'un périmètre d'environnement.

1. Saisir une adresse IPv4, un nom d'hôte ou un nom complet (exemple : `srv-01.interne.local`).
2. Vérifier le champ **Utilisateur**. Il reprend le NetID de la session et n'est pas modifiable.
3. Cliquer **Lancer PuTTY**, ou **Ouvrir PuTTY** dans le second bloc.

Le compte SSH est le NetID connecté. La clé est celle du profil, relue par HARP. Les droits obtenus sur la machine distante ne sont pas décidés par les familles ni par les périmètres HARP. Ils dépendent de ce NetID et de la clé associée.

Champ vide : **Veuillez entrer un hôte (IP ou nom de serveur)**.

Hôte refusé (vide après contrôle, adresse IP invalide, caractères non autorisés) : **Hôte invalide**.

Sans clé sur le profil : **Clé SSH absente**. PuTTY n'est pas lancé.

Cette connexion n'est pas le PuTTY d'une fiche environnement. La fiche ouvre le serveur déjà lié à l'environnement. Le hub ouvre l'hôte que vous venez de saisir.

## 11. Ma clé SSH

Le profil (`/user/profile`) affiche **Clé SSH (pkeyfile)**. La valeur est un chemin de fichier, ou le texte **Aucune clé SSH configurée**.

Ce chemin est relu par HARP au moment de certains lancements. Vous ne le saisissez pas dans l'écran de lancement.

Ne collez jamais le contenu d'une clé privée dans un formulaire du portail. Ne l'envoyez pas par message. Si le profil indique qu'aucune clé n'est configurée, demander à l'administrateur d'enregistrer le chemin.

Conséquence selon le lancement :

- PuTTY d'une fiche environnement peut s'ouvrir même si ce chemin est vide. La connexion SSH risque alors de demander un autre moyen d'authentification, parce que l'option de clé n'est pas ajoutée.
- FileZilla utilise le chemin lorsqu'il est renseigné.
- Le PuTTY d'administration et la connexion `/hub` exigent un chemin non vide. Sinon le message est **Clé SSH absente**.
- SQL Developer n'utilise pas cette clé.

## 12. Que faire si rien ne se lance ?

1. Le Launcher est-il installé, selon les guides Windows cités plus haut ?
2. Est-il démarré ? Sinon le message est **Launcher HARP non détecté**.
3. L'outil est-il installé ? Sinon un message indique qu'il n'est pas configuré ou non accessible.
4. L'environnement est-il visible dans `/harp/envs/...` ?
5. Le profil a-t-il un chemin de clé si le lancement l'exige ?
6. Quel message HARP affiche-t-il exactement ?

Le message **… est en cours de lancement...** signifie que le portail a transmis la demande au poste. Si la fenêtre de l'outil ne s'ouvre pas ensuite, regarder la fenêtre du Launcher local : l'exécutable peut être absent du disque.

## 13. Messages fréquents

| Message | Cause probable | Action utilisateur | Quand contacter l'administrateur |
|---|---|---|---|
| Launcher HARP non détecté | Le service local ne répond pas | Démarrer le Launcher, puis **Tester /health** ou relancer l'action | Si le service ne démarre pas après installation |
| Accès refusé | Famille, périmètre ou lien environnement/serveur refusé | Rester sur les fiches visibles | Si une fiche attendue est absente |
| Vous n'avez pas les permissions nécessaires pour accéder à cette section. | La famille de l'adresse n'est pas autorisée | Revenir à l'accueil | Pour faire vérifier le rôle |
| Lancement indisponible : environnement ou serveur non identifié. | Le lien n'a pas les identifiants attendus | Ne pas réessayer en modifiant l'adresse | Oui, avec le nom de la fiche |
| Lancement indisponible : environnement non identifié. | SQL*Plus, Application Designer ou Data Mover sans environnement | Idem | Oui |
| PuTTY / FileZilla / SQL*Plus / PSIDE / PSDMT / SQL Developer n'est pas configuré ou non accessible | Outil absent de la configuration HARP, ou contrôle impossible | Vérifier que l'outil est installé sur le poste | Oui si l'installation du poste est correcte |
| Outil non configuré | SQL Developer sans commande en base | — | Oui |
| Clé SSH absente | Aucun chemin de clé pour `/hub` | Vérifier le profil | Oui pour enregistrer le chemin |
| Hôte invalide | Saisie `/hub` refusée | Corriger l'adresse ou le nom | Non, sauf si un nom interne légitime est refusé |
| Veuillez entrer un hôte (IP ou nom de serveur) | Champ hôte vide sur `/hub` | Renseigner l'hôte | Non |
| Version PTools manquante, vide ou au mauvais format | La fiche n'a pas une version `X.YY` | Ne pas lancer Application Designer ni Data Mover | Oui, pour corriger la fiche |
| Session utilisateur non disponible. Le lancement peut échouer. | Session incomplète dans le navigateur | Se reconnecter | Si cela revient après connexion |
| Non authentifié | Session absente au moment de la demande | Se reconnecter | Non |
| Identité de session incomplète | NetID absent de la session | Se reconnecter | Oui si le compte n'a pas de NetID |
| Erreur lors du lancement de … | Échec inattendu du clic | Noter le message complet | Oui |

Les messages **… est en cours de lancement...** et **Application Designer (PTools …)** / **Data Mover (PTools …)** indiquent une demande acceptée par le portail, pas encore la réussite durable du programme Windows.

## 14. Ce que le Launcher ne fait pas

- Il n'accorde pas de droits sur le serveur distant ni sur la base. Voir une fiche dépend des rôles et du périmètre HARP. Entrer sur la machine dépend du compte SSH et de la clé.
- SQL Developer n'ouvre pas automatiquement la base de la carte.
- `/hub` est une connexion SSH libre. Ce n'est pas une autorisation d'environnement, et ce n'est pas filtré par famille ni par périmètre.
- `/list/...` n'est pas l'espace de travail d'un utilisateur standard.
- Un ancien mode de lancement n'est plus proposé par les boutons. Il n'y a rien à activer de ce côté.

## 15. Bonnes pratiques

- Ne pas partager le compte du portail.
- Ne pas partager la clé privée, ni son contenu.
- Lancer les outils depuis les environnements visibles, ou depuis `/hub` seulement pour une connexion SSH libre assumée.
- Signaler le message affiché plutôt que de contourner un bouton absent ou un refus.
