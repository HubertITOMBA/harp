# Guide de dépannage - Erreurs TLS/SSL

## Erreur : "The handshake failed due to an unexpected packet format"

Cette erreur indique un problème de négociation TLS/SSL entre PowerShell et le serveur API.

## Solutions à essayer

### Solution 1 : Tester la connexion manuellement

1. **Ouvrir PowerShell en tant qu'administrateur**

2. **Tester la connexion avec Invoke-WebRequest** :
   ```powershell
   # Configurer TLS 1.2
   [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
   
   # Désactiver la vérification SSL (temporaire pour test)
   [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
   
   # Tester la connexion
   $url = "https://localhost:9352/api/launcher/tool?tool=sqldeveloper&netid=hitomba"
   Invoke-WebRequest -Uri $url -UseBasicParsing
   ```

3. **Si ça fonctionne**, le problème vient peut-être du script. Vérifier les logs.

4. **Si ça ne fonctionne pas**, continuer avec les solutions suivantes.

### Solution 2 : Vérifier le proxy

Si vous êtes derrière un proxy d'entreprise :

1. **Vérifier les variables d'environnement** :
   ```powershell
   $env:HTTP_PROXY
   $env:HTTPS_PROXY
   ```

2. **Configurer le proxy si nécessaire** :
   ```powershell
   $env:HTTP_PROXY = "http://proxy.adsaft.ft.net:8080"
   $env:HTTPS_PROXY = "http://proxy.adsaft.ft.net:8080"
   ```

3. **Tester à nouveau la connexion**

### Solution 3 : Vérifier la connectivité réseau

1. **Tester la connectivité de base** :
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 9352
   ```

2. **Tester avec curl (si disponible)** :
   ```powershell
   curl.exe -k https://localhost:9352/api/launcher/tool?tool=sqldeveloper&netid=hitomba
   ```

### Solution 4 : Vérifier le certificat SSL

1. **Vérifier le certificat** :
   ```powershell
   $request = [System.Net.HttpWebRequest]::Create("https://localhost:9352")
   $request.GetResponse()
   ```

2. **Si le certificat est auto-signé ou invalide**, le script devrait le gérer automatiquement avec `TrustAllCertsPolicy`.

### Solution 5 : Utiliser une version différente de TLS

Si TLS 1.2 ne fonctionne pas, essayer TLS 1.0 (moins sécurisé mais parfois nécessaire) :

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls
```

**Note** : TLS 1.0 est obsolète et ne devrait être utilisé qu'en dernier recours.

### Solution 6 : Vérifier les logs du serveur

Si vous avez accès au serveur, vérifier les logs Next.js pour voir si la requête arrive :

```bash
# Sur le serveur
tail -f logs/nextjs.log
# ou
pm2 logs
```

## Diagnostic avancé

### Activer le mode verbose dans PowerShell

```powershell
$VerbosePreference = "Continue"
$DebugPreference = "Continue"
```

### Capturer les détails de l'erreur

```powershell
try {
    $response = Invoke-RestMethod -Uri "https://localhost:9352/api/launcher/tool?tool=sqldeveloper&netid=hitomba" -ErrorAction Stop
} catch {
    Write-Host "Erreur complète:" -ForegroundColor Red
    $_.Exception | Format-List -Force
    Write-Host "`nStack trace:" -ForegroundColor Red
    $_.ScriptStackTrace
}
```

## Solution temporaire : Utiliser HTTP au lieu de HTTPS

**ATTENTION** : Cette solution n'est pas sécurisée et ne devrait être utilisée qu'en développement ou sur un réseau interne sécurisé.

1. **Modifier l'URL de l'API** :
   ```powershell
   $env:HARP_API_URL = "https://localhost:9352"
   ```

2. **Ou modifier directement dans le script** (ligne 14) :
   ```powershell
   $API_BASE_URL = "https://localhost:9352"
   ```

## Vérification après correction

Une fois le problème résolu, tester le lancement :

```powershell
D:\apps\portail\launcher\launcher.ps1 "mylaunch://sqldeveloper"
```

Vous devriez voir dans les logs :
- "Réponse API reçue avec succès"
- Les informations de l'outil (chemin, arguments, etc.)

## Contact support

Si aucune de ces solutions ne fonctionne, fournir :
1. Les logs complets de `D:\apps\portail\launcher\logs\launcher.log`
2. Le résultat de `Test-NetConnection -ComputerName localhost -Port 9352`
3. La version de PowerShell : `$PSVersionTable`
4. La configuration du proxy (si applicable)

