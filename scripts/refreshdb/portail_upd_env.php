#!/opt/remi/php82/root/usr/bin/php
<?PHP


$path = '/produits/portail_harp/www/htdocs/html/portail/includes';
set_include_path(get_include_path() . PATH_SEPARATOR . $path);

require_once '/data/exploit/harpadm/outils/scripts/fonctions_sh.php';

//==========================================
// Connexion a la base
//==========================================
$db_handle=db_connect();
	
//====================================================
// Login et recuperation des informations utilisateur
//====================================================

if ($db_handle) {
	
   //=========================================================================================================
   // Recuperation du parametrage PSADM 
   //=========================================================================================================
   $SQL = "SELECT param, valeur FROM psadm_param where param='ROOTFILE'";
   $result = mysqli_query($db_handle,$SQL);
   while ($data = mysqli_fetch_array($result)) {
         $rootfile=$data['valeur'];
         echo $data['param']." : ".$rootfile."\n";
   }
   mysqli_free_result ($result);


   //=========================================================================================================
   // On parcourt l'arborescence pour retrouver les fichiers de mise a jour
   //=========================================================================================================
    if (is_dir($rootfile)) {
       if ($dh = opendir($rootfile)) {
          // lecture des sous repertoires environnement
          while (($file = readdir($dh)) !== false) {
                $fullfile=$rootfile.'/'.$file;
                if (is_file($fullfile )) {
                   //echo "fichier $fullfile  \n";
                   list($prefix,$dummy)=explode('.',$file,2);
                   // si fichier prefixe env
                   if ($prefix=='env') {
                      echo "=================================================================\n";
                      echo " Fichier multi-env $file \n";
                      // on lit le fichier pour trouver les informations
                      $monfichier = fopen($fullfile, 'r+');
                      while (list($env,$harprelease,$refreshdt,$datadt,$modetp,$modedt,$cobver,$deploycbl,$orarelease,$ptversion,$psversion,$anonym,$infodt,$dbstatus,$nbdom,$asstatus1, $asstatus2,$asstatus3,$asstatus4,$asstatus5,$lastasdt,$psunxstatus, $psunxdt, $psntstatus,$psntdt, $webstatus, $login, $logindt, $pswd_ft_exploit, $edi) = fgetcsv($monfichier,1024,';'))
                      {
                      echo "*****************************************************************\n";
                      echo " env $env \n";
                      // on traite la release
                      if (substr($harprelease,0,1)!=='G') {
                         $harprelease='N/A';
                      }
                      $SQL = "select count(*) as releaseok from psadm_release where harprelease='$harprelease'";
                      $result = mysqli_query($db_handle,$SQL);
                      while ($data = mysqli_fetch_array($result)) {
                            $releaseok=$data['releaseok'];
                        }
                      mysqli_free_result ($result);
                      if ($releaseok == 0) {
                         echo "Ajout release : release $harprelease  \n";
                         $SQL="INSERT INTO psadm_release values('$harprelease', '$harprelease')";
                         $result = mysqli_query($db_handle,$SQL);
                         if (!$result) {
                            echo 'Impossible de mettre a jour la table psadm_release pour nouvelle release harp '.mysqli_error();
                         }
                      }

                      // on traite la version cobol => champ volum de psadm_env
                      if ($cobver=='null') 
                         $SQLCOBVER=",  volum='N/A' ";
                      else
                         $SQLCOBVER=", volum='$cobver' ";
                      echo "Environnement $env   : cobol $SQLCOBVER  \n";

                      // on traite la version Oracle => champ orarelease de psadm_oracle
                      if ($orarelease=='null')
                         $orarelease='N/A';
                      echo "Environnement $env   : Oracle $orarelease  \n";

                      // on traite la version Ptools => champ ptversion de psadm_env
                      if ($ptversion=='null')
                         $ptversion='N/A';
                      echo "Environnement $env   : PeopleTools $ptversion  \n";

                      // on traite la version Psoft => champ psversion de psadm_env
                      if ($psversion=='null')
                         $psversion='N/A';
                      echo "Environnement $env   : Peoplesoft $psversion  \n";

                      // on traite le champ anonym de psadm_env
                      if ($anonym=='null')
                         $anonym='N';
                      echo "Environnement $env   : Anonymisation (O/N) : $anonym  \n";

                      // on traite le champ edi de psadm_env
                      if ($edi=='null')
                         $edi='N';
                      echo "Environnement $env   : Config EDI (O/N) : $edi  \n";

                      echo "Environnement $env   : release $harprelease  \n";
                      $SQL="UPDATE envsharp set harprelease='$harprelease' $SQLCOBVER , ptversion='$ptversion' , psversion='$psversion', anonym='$anonym', edi='$edi'  WHERE env='$env'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table envsharp (release harp, cobver, ptversion, psversion, anonym, edi) '.mysqli_error();
                      }

                      // on met a jour la base pour les environnements GASSI PRODUCTION
                      $SQL="UPDATE envsharp set edi='O' WHERE env='$env' AND env in ('FHHPR1','GASSI_PRODUCTION')";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table envsharp pour FHHPR1 et GASSI_PRODUCTION '.mysqli_error();
                      }

                      echo "Environnement $env   : deploy cobol $deploycbl  \n";
                      $SQL="UPDATE harpenvinfo set deploycbldt='$deploycbl'  WHERE env='$env'";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvinfo pour deploycbl'.mysqli_error();
                      }

                      // on traite le champ pswd_ft_exploit de harpenvinfo
                      echo "Environnement $env   : mot de passe FT_EXPLOIT xxxxxxxx  \n";
                      if ($pswd_ft_exploit!='null')
                         $SQL="UPDATE harpenvinfo set pswd_ft_exploit='$pswd_ft_exploit'  WHERE env='$env'";
                      else
                         $SQL="UPDATE harpenvinfo set pswd_ft_exploit=null  WHERE env='$env'";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvinfo pour pswd_ft_exploit'.mysqli_error();
                      }

                      $oracle_sid='null';
                      $SQL = "select  b.oracle_sid from envsharp a, harpora b where a.env='$env' and a.id=b.envId";
                      $result = mysqli_query($db_handle,$SQL);
                      while ($data = mysqli_fetch_array($result)) {
                            $oracle_sid=$data['oracle_sid'];
                        }
                      mysqli_free_result ($result);

                      if ($oracle_sid=='null')
                         $oracle_sid='N/A';
                      else
                      {
                         echo "Environnement $env   : ORACLE_SID $oracle_sid  \n";
                         $SQL="UPDATE harpora set orarelease='$orarelease'  WHERE oracle_sid='$oracle_sid' and aliasql='$env'";
                         echo "$SQL \n";
                         $result = mysqli_query($db_handle,$SQL);
                         if (!$result) {
                            echo 'Impossible de mettre a jour la table psadm_oracle pour orarelease'.mysqli_error();
                         }
                       }

                      $SQL="UPDATE harpora set orarelease='$orarelease'  WHERE oracle_sid='$oracle_sid' and aliasql='$env'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpora pour orarelease'.mysqli_error();
                      }

                      // on traite la date de refresh
                      if ($refreshdt=='null') 
                         $SQLDT=" refreshdt=null ";
                      else
                         $SQLDT=" refreshdt='$refreshdt' ";
                      echo "Environnement $env   : refresh $SQLDT  \n";

                      // on traite la date de l'image des donnees
                      if ($datadt=='null') 
                         $SQLDATADT=", datadt=null ";
                      else
                         $SQLDATADT=", datadt='$datadt' ";
                      echo "Environnement $env   : data $SQLDATADT  \n";

                      // on traite le mode TP
                      if ($modetp=='null')
                         $SQLMODETP=", modetp='', modedt=null ";
                      else
                         $SQLMODETP=", modetp='$modetp'  , modedt='$modedt' ";
                      echo "Environnement $env   : mode $SQLMODETP  \n";

                      // on met a jour la base pour les environnements non production
                      $SQL="UPDATE harpenvinfo set datmaj='$infodt',".$SQLDT.$SQLDATADT."  WHERE env='$env' AND env not in ('FHHPR1','FHFPR1','GASSI_PRODUCTION','MY_TOOLS')";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvinfo '.mysqli_error();
                      }
                      // on met a jour la base pour les environnements GASSI => mode restreint
                      $SQL="UPDATE harpenvinfo set datmaj='$infodt'".$SQLMODETP."  WHERE env='$env' AND env in ('FHHPR1','FHFPR1','GASSI_PRODUCTION','MY_TOOLS','FHHPP2','FHFPP2')";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvinfo pour GASSI '.mysqli_error();
                      }

                      // Mise a jour de la table de monitoring 
                      if ($infodt!=''){ 
                         //$SQL="INSERT INTO psadm_monitor values('$env','$infodt',$dbstatus,$nbdom,$asstatus1,$asstatus2,$asstatus3,$asstatus4,$asstatus5,'$lastasdt',$psunxstatus,'$psunxdt',$psntstatus,'$psntdt','$login','$logindt')";
                         $SQL="INSERT INTO harpmonitor values('$env','$infodt',$dbstatus,$nbdom,$asstatus1,$asstatus2,$asstatus3,$asstatus4,$asstatus5,str_to_date(replace('$lastasdt',null,''),'%Y-%m-%d %H:%i:%s'),'$psunxstatus',str_to_date(replace('$psunxdt',null,''),'%Y-%m-%d %H:%i:%s'),$psntstatus,str_to_date(replace('$psntdt',null,''),'%Y-%m-%d %H:%i:%s'),'$login',str_to_date(replace('$logindt',null,''),'%Y-%m-%d %H:%i:%s'))";
                         echo "$SQL \n";
                         $result = mysqli_query($db_handle,$SQL);
                         if (!$result) {
                            echo 'Impossible de mettre a jour la table psadm_monitor '.mysqli_error();
                         }
                      }
                      // on met a jour les status d'environnement DB
                      $SQL="UPDATE harpenvserv set status='$dbstatus'  WHERE env='$env' and typsrv='DB'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status DB '.mysqli_error();
                      }
                      // on met a jour les status d'environnement AS1,2,3,4,5
                      if ($nbdom>1){ 
                      $SQL="UPDATE harpenvserv set status='$asstatus1'  WHERE env='$env' and typsrv='AS' and right(srv,1)='1'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status AS1 '.mysqli_error();
                      }
                      $SQL="UPDATE harpenvserv set status='$asstatus2'  WHERE env='$env' and typsrv='AS' and right(srv,1)='2'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status AS2 '.mysqli_error();
                      }
                      $SQL="UPDATE harpenvserv set status='$asstatus3'  WHERE env='$env' and typsrv='AS' and right(srv,1)='3'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status AS3 '.mysqli_error();
                      }
                      $SQL="UPDATE harpenvserv set status='$asstatus4'  WHERE env='$env' and typsrv='AS' and right(srv,1)='4'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status AS4 '.mysqli_error();
                      }
                      $SQL="UPDATE harpenvserv set status='$asstatus5'  WHERE env='$env' and typsrv='AS' and right(srv,1)='5'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status AS5 '.mysqli_error();
                      }
                      } else {
                       $SQL="UPDATE harpenvserv set status='$asstatus1'  WHERE env='$env' and typsrv='AS' ";
                       echo "$SQL \n";
                       $result = mysqli_query($db_handle,$SQL);
                       if (!$result) {
                          echo 'Impossible de mettre a jour la table harpenvserv pour status AS '.mysqli_error();
                       }
                      }
                      // on met a jour les status d'environnement PRCSUNIX
                      $SQL="UPDATE harpenvserv set status='$psunxstatus' WHERE env='$env' and typsrv='PRCS' and srv in ( select srv from psadm_srv where os='UNIX') ";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status PSUNX '.mysqli_error();
                      }
                      // on met a jour les status d'environnement PRCSNT
                      $SQL="UPDATE harpenvserv set status='$psntstatus' WHERE env='$env' and typsrv='PRCS' and srv in ( select srv from psadm_srv where os='NT')" ;
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status PSNT '.mysqli_error();
                      }
                      // on met a jour les status d'environnement WS
                      $SQL="UPDATE harpenvserv set status='$webstatus' WHERE env='$env' and typsrv='WS'" ;
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table psadm_rolesrv pour status WS '.mysqli_error();
                      }
                      echo "Mise a jour terminee pour $env - OK \n";
                      }
                      fclose($monfichier);
                   
                   } // fin lecture fichier env
                   else {
                    if ($prefix=='release') {
                      list($env)=explode('.',$dummy,-1);
                      echo "*****************************************************************\n";
                      echo " Fichier release env $env \n";
                      // on lit le fichier pour trouver les informations
                      $monfichier = fopen($fullfile, 'r+');
                      list($nomreel,$harprelease,$refreshdt,$datadt,$modetp,$modedt,$cobver,$deploycbl,$orarelease,$ptversion,$psversion,$anonym,$infodt,$dbstatus,$nbdom,$asstatus1,$asstatus2,$asstatus3,$asstatus4,$asstatus5,$lastasdt,$psunxstatus, $psunxdt, $psntstatus,$psntdt, $webstatus, $login, $logindt, $pswd_ft_exploit, $edi) = fgetcsv($monfichier,1024,';');
                      //echo "FICHIER  : release $harprelease  \n";
                      //echo "FICHIER  : refresh $refreshdt  \n";
                      //echo "FICHIER  : datadt $datadt  \n";
                      //echo "FICHIER  : modetp $modetp  \n";
                      //echo "FICHIER  : modedt $modedt  \n";
                      fclose($monfichier);
                      // on traite la release
                      if (substr($harprelease,0,1)!=='G') {
                         $harprelease='N/A';
                      }
                      $SQL = "select count(*) as releaseok from psadm_release where harprelease='$harprelease'";
                      $result = mysqli_query($db_handle,$SQL);
                      while ($data = mysqli_fetch_array($result)) {
                            $releaseok=$data['releaseok'];
                        }
                      mysqli_free_result ($result);
                      if ($releaseok == 0) {
                         echo "Ajout release : release $harprelease  \n";
                         $SQL="INSERT INTO psadm_release values('$harprelease', '$harprelease')";
                         $result = mysqli_query($db_handle,$SQL);
                         if (!$result) {
                            echo 'Impossible de mettre a jour la table psadm_release pour nouvelle release harp '.mysqli_error();
                         }
                      }

                      // on traite la version cobol 
                      if ($cobver=='null') 
                         $SQLCOBVER=",  volum='N/A' ";
                      else
                         $SQLCOBVER=", volum='$cobver' ";
                      echo "Environnement $env   : cobol $SQLCOBVER  \n";

                      // on traite la version Oracle => champ orarelease de psadm_oracle
                      if ($orarelease=='null')
                         $orarelease='N/A';
                      echo "Environnement $env   : Oracle $orarelease  \n";

                      // on traite la version Ptools => champ ptversion de envsharp
                      if ($ptversion=='null')
                         $ptversion='N/A';
                      echo "Environnement $env   : Oracle $ptversion  \n";

                      // on traite la version Psoft => champ psversion de envsharp
                      if ($psversion=='null')
                         $psversion='N/A';
                      echo "Environnement $env   : Oracle $psversion  \n";

                      // on traite le champ anonym de envsharp
                      if ($anonym=='null')
                         $anonym='N';
                      echo "Environnement $env   : Anonymisation (O/N) : $anonym  \n";

                      // on traite le champ edi de envsharp
                      if ($edi=='null')
                         $edi='N';
                      echo "Environnement $env   : Config EDI (O/N) : $edi  \n";

                      echo "Environnement $env   : release $harprelease  \n";
                      $SQL="UPDATE envsharp set harprelease='$harprelease' $SQLCOBVER , ptversion='$ptversion' , psversion='$psversion' , anonym='$anonym', edi='$edi'  WHERE env='$env'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table envsharp (release harp, cobver, ptversion, psversion, anonym, edi) '.mysqli_error();
                      }

                      // on met a jour la base pour les environnements GASSI PRODUCTION
                      $SQL="UPDATE envsharp set edi='O' WHERE env='$env' AND env in ('FHHPR1','GASSI_PRODUCTION')";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table envsharp pour FHHPR1 et GASSI_PRODUCTION '.mysqli_error();
                      }

                      $SQL="UPDATE harpenvinfo set deploycbldt='$deploycbl'  WHERE env='$env'";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvinfo pour deploycbl'.mysqli_error();
                      }

                      // on traite le champ pswd_ft_exploit de harpenvinfo
                      echo "Environnement $env   : mot de passe FT_EXPLOIT xxxxxxxx  \n";
                      if ($pswd_ft_exploit!='null')
                         $SQL="UPDATE harpenvinfo set pswd_ft_exploit='$pswd_ft_exploit'  WHERE env='$env'";
                      else
                         $SQL="UPDATE harpenvinfo set pswd_ft_exploit=null  WHERE env='$env'";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvinfo pour pswd_ft_exploit'.mysqli_error();
                      }

                      $oracle_sid='null';
                      $SQL = "select b.oracle_sid from envsharp a, harpora b where a.env='$env' and a.id=b.envId";
                      $result = mysqli_query($db_handle,$SQL);
                      while ($data = mysqli_fetch_array($result)) {
                            $oracle_sid=$data['oracle_sid'];
                        }
                      mysqli_free_result ($result);

                      if ($oracle_sid=='null')
                         $oracle_sid='N/A';
                      else
                      {
                         echo "Environnement $env   : ORACLE_SID $oracle_sid  \n";
                         $SQL="UPDATE harpora set orarelease='$orarelease'  WHERE oracle_sid='$oracle_sid' and aliasql='$env'";
                         echo "$SQL \n";
                         $result = mysqli_query($db_handle,$SQL);
                         if (!$result) {
                            echo 'Impossible de mettre a jour la table psadm_oracle pour orarelease'.mysqli_error();
                         }
                       }

                      // on traite la date de refresh
                      if ($refreshdt=='null') 
                         $SQLDT=" refreshdt=null ";
                      else
                         $SQLDT=" refreshdt='$refreshdt' ";
                      echo "Environnement $env   : refresh $SQLDT  \n";

                      // on traite la date de l'image des donnees
                      if ($datadt=='null') 
                         $SQLDATADT=", datadt=null ";
                      else
                         $SQLDATADT=", datadt='$datadt' ";
                      echo "Environnement $env   : data $SQLDATADT  \n";

                      // on traite le mode TP
                      if ($modetp=='null') 
                         $SQLMODETP=", modetp='', modedt=null ";
                      else
                         $SQLMODETP=", modetp='$modetp'  , modedt='$modedt' ";
                      echo "Environnement $env   : mode $SQLMODETP  \n";

                      // on met a jour la base pour les environnements non production
                      $SQL="UPDATE harpenvinfo set datmaj='$infodt',".$SQLDT.$SQLDATADT."  WHERE env='$env' AND env not in ('FHHPR1','FHFPR1','GASSI_PRODUCTION','MY_TOOLS')";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvinfo '.mysqli_error();
                      }
                      // on met a jour la base pour les environnements GASSI => mode restreint
                      $SQL="UPDATE harpenvinfo set datmaj='$infodt'".$SQLMODETP."  WHERE env='$env' AND env in ('FHHPR1','FHFPR1','GASSI_PRODUCTION','MY_TOOLS','FHHPP2','FHFPP2')";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvinfo pour GASSI '.mysqli_error();
                      }
                      // Mise a jour de la table de monitoring 
                      if ($infodt!=''){ 
                         //$SQL="INSERT INTO psadm_monitor values('$env','$infodt',$dbstatus,$nbdom,$asstatus1,$asstatus2,$asstatus3,$asstatus4,$asstatus5,'$lastasdt',$psunxstatus,'$psunxdt',$psntstatus,'$psntdt','$login','$logindt')";
                         $SQL="INSERT INTO harpmonitor values('$env','$infodt',$dbstatus,$nbdom,$asstatus1,$asstatus2,$asstatus3,$asstatus4,$asstatus5,str_to_date(replace('$lastasdt',null,''),'%Y-%m-%d %H:%i:%s'),$psunxstatus,str_to_date(replace('$psunxdt',null,''),'%Y-%m-%d %H:%i:%s'),$psntstatus,str_to_date(replace('$psntdt',null,''),'%Y-%m-%d %H:%i:%s'),'$login',str_to_date(replace('$logindt',null,''),'%Y-%m-%d %H:%i:%s'))";
                         echo "$SQL \n";
                         $result = mysqli_query($db_handle,$SQL);
                         if (!$result) {
                            echo 'Impossible de mettre a jour la table harpmonitor '.mysqli_error();
                         }
                      }
                      // on met a jour les status d'environnement DB
                      $SQL="UPDATE harpenvserv set status='$dbstatus'  WHERE env='$env' and typsrv='DB'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status DB '.mysqli_error();
                      }
                      // on met a jour les status d'environnement AS1,2,3,4,5
                      if ($nbdom>1){ 
                      $SQL="UPDATE harpenvserv set status='$asstatus1'  WHERE env='$env' and typsrv='AS' and right(srv,1)='1'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status AS1 '.mysqli_error();
                      }
                      $SQL="UPDATE harpenvserv set status='$asstatus2'  WHERE env='$env' and typsrv='AS' and right(srv,1)='2'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status AS2 '.mysqli_error();
                      }
                      $SQL="UPDATE harpenvsrv set status='$asstatus3'  WHERE env='$env' and typsrv='AS' and right(srv,1)='3'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status AS3 '.mysqli_error();
                      }
                      $SQL="UPDATE harpenvsrv set status='$asstatus4'  WHERE env='$env' and typsrv='AS' and right(srv,1)='4'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvsrv pour status AS4 '.mysqli_error();
                      }
                      $SQL="UPDATE harpenvserv set status='$asstatus5'  WHERE env='$env' and typsrv='AS' and right(srv,1)='5'";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status AS5 '.mysqli_error();
                      }
                      } else {
                         $SQL="UPDATE harpenvserv set status='$asstatus1'  WHERE env='$env' and typsrv='AS' ";
                         echo "$SQL \n";
                         $result = mysqli_query($db_handle,$SQL);
                         if (!$result) {
                            echo 'Impossible de mettre a jour la table harpenvserv pour status AS '.mysqli_error();
                         }
                      }
                      // on met a jour les status d'environnement PRCSUNIX
                      $SQL="UPDATE harpenvserv set status='$psunxstatus' WHERE env='$env' and typsrv='PRCS' and srv in ( select srv from psadm_srv where os='UNIX') ";
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status PSUNX '.mysqli_error();
                      }
                      // on met a jour les status d'environnement PRCSNT
                      $SQL="UPDATE harpenvserv set status='$psntstatus' WHERE env='$env' and typsrv='PRCS' and srv in ( select srv from psadm_srv where os='NT')" ;
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status PSNT '.mysqli_error();
                      }
                      // on met a jour les status d'environnement WS
                      $SQL="UPDATE harpenvserv set status='$webstatus' WHERE env='$env' and typsrv='WS'" ;
                      echo "$SQL \n";
                      $result = mysqli_query($db_handle,$SQL);
                      if (!$result) {
                         echo 'Impossible de mettre a jour la table harpenvserv pour status WS '.mysqli_error();
                      }

                      echo "Mise a jour terminee pour $env - OK \n";
                    }
                   } //fin else
                }
          }
        closedir($dh);
       }
    }

   $SQL="update harpenvinfo  set lastcheckstatus=1 where (env,datmaj) in ( select env,monitordt from  psadm_monitor m1 where (dbstatus=0 or (nbdom=1 and asstatus1=0) or (nbdom=2 and (asstatus1=0 or asstatus2=0)) or (nbdom=3 and (asstatus1=0 or asstatus2=0 or asstatus3=0 )) or (nbdom=4 and (asstatus1=0 or asstatus2=0 or asstatus3=0 or asstatus4=0 )) or (nbdom=5 and (asstatus1=0 or asstatus2=0 or asstatus3=0 or asstatus4=0 or asstatus5=0)) or prcsunxstatus=0 or prcsntstatus=0) and monitordt=(select max(monitordt) from psadm_monitor m2 where m2.env=m1.env))";
   echo "$SQL \n";
   // mysqli_query($db_handle,$SQL) or die ('Impossible de mettre a jour la table harpenvinfo pour status global environnement '.mysqli_error()); 

    mysqli_close($db_handle);

}
else {
   $errorMessage = msg_sql_error ("La base de données PSADM est indisponible"," ", " ");
   echo $errorMessage;
}



?>
