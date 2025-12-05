<?PHP
//==========================================================================================================
// SCRIPT : fonctions_sh.php
//==========================================================================================================
//
// USAGE : Fonctions PHP
//
// Parametres:  Aucun
//
//==========================================================================================================
// Historique des versions
// 30/06/2023 : V1.0.0 : MOUNIER  : DXC PROJET HARP :  Version PHP 8.2
//==========================================================================================================
//error_reporting(E_ERROR | E_WARNING | E_PARSE);
date_default_timezone_set('Europe/Paris');
//==========================================
//	Connexion a la base de données
//==========================================
require_once '/produits/portail_harp/www/htdocs/html/portail/admin1/includes/art_config.php';
function db_connect(){
global $config_user;
global $config_password;
global $config_db;
global $config_host;

$db_handle = mysqli_connect($config_host, $config_user, $config_password);
$db_found = mysqli_select_db($db_handle, $config_db);

if ($db_found) {
      return $db_handle;
    }
}

//==========================================
//      Traitement anti SQL injection
//==========================================
function quote_smart($value, $handle) {
   if (!is_numeric($value)) {
       $value = "'" . mysqli_real_escape_string($handle,$value) . "'";
   }
   return $value;
}

//==========================================
//	Erreur SQL
//==========================================
function msg_sql_error ($comment,$phpfile, $sqltext){
	if ( $_SESSION['DEBUGSQL'] == "Y" ) {
	     $errormsg = "Problème de traitement de la requête SQL : ".$sqltext."      MESSAGE : ".mysqli_error()."      FICHIER : ".$phpfile;
	}
	else {
	     $errormsg = "Problème de traitement de la requête SQL : ".$comment."      FICHIER : ".$phpfile;
	}
	return $errormsg;
}
?>
