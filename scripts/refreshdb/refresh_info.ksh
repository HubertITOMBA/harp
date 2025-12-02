#!/bin/ksh
${DEBUGSHELL}
#==============================================================================
#@ SCRIPT:   refresh_info.ksh
#==============================================================================
#
#@  PORTAIL TMA HARP : Utilise par refresh_info du portail pour recuperer les informations sur les
#@  environnements depuis chaque serveur
#
#@ IMPACT PT_ORA_APP : 000
#========================================================================================================
#V Historique des versions
#V 25/03/2015 : V1.0.1 : THIERRY : HP PROJET HARP  : Ajout entete
#========================================================================================================

ssh psoft@$HOSTNAME ". ~/.profile > /dev/null 2>&1;$HARPSHELL/portail_get_info.ksh > $HARPLOG/portail_get_info.log 2>&1 "
rc=$?
if [ ${rc} -eq 0 ]; then
   ssh psoft@$HOSTNAME ". ~/.profile > /dev/null 2>&1;$HARPSHELL/portail_upd_env.php > $HARPLOG/portail_upd_env.log  2>&1"
   rc=$?
   exit ${rc} 
else
   exit ${rc} 
fi
