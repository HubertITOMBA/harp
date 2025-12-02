#!/bin/ksh
${DEBUGSHELL}
#==============================================================================
#@ SCRIPT : refresh_envt.ksh
#==============================================================================
#@
#@ USAGE : Rafraichissement d'une base PeopleSoft apres clonage depuis une autre base 
#
#@ Parametres:  -e environnement a traiter:  Obligatoire
#@              -v : verification des pre-requis uniquement. Optionnel
#@              -f : Mode force. En cas de seconde relance
#
#@ IMPACT PT_ORA_APP : 101
#=======================================================================================================================
#V Historique des versions
#V 16/11/2010 : V1.1.0 : BZH0LL  : EDS/HP PROJET HARP :   Creation
#V 30/05/2012 : V1.1.1 : XZRLW0  : EDS/HP PROJET HARP :   Modification - Style PSFT QC 21643
#V 11/10/2012 : V1.1.2 : XZRLW0  : EDS/HP PROJET HARP :   Modification - GOROCO
#V 22/01/2013 : V1.1.3 : XZRLW0  : EDS/HP PROJET HARP :   Modification PRCSUNX pour process scheduler distant
#V 29/01/2013 : V1.1.4 : XZRLW0  : EDS/HP PROJET HARP :   Purge repertoire (HARP_FILES QC23000, log_output, ...)
#V 27/02/2013 : V1.1.5 : XZRLW0  : EDS/HP PROJET HARP :   Gestion Pagelet
#V 30/04/2013 : V1.1.6 : XZRLW0  : EDS/HP PROJET HARP :   Trace activation Pagelet
#V 02/07/2013 : V1.1.7 : XZRLW0  : EDS/HP PROJET HARP :   PRCSUX + PT852
#V 13/09/2013 : V1.1.8 : XZRLW0  : EDS/HP PROJET HARP :   PT852
#V 26/09/2013 : V1.1.9 : XZRLW0  : EDS/HP PROJET HARP :   Modif Pagelet => cas de copie RE1 6>RE2, QP1->QP2, ...
#V 25/10/2013 : V1.2.0 : XZRLW0  : EDS/HP PROJET HARP :   Gestion cookie GASSI
#V 11/12/2013 : V1.2.1 : XZRLW0  : EDS/HP PROJET HARP :   Gestion script SQL fin de refresh + modif psdbowner + purge psreports
#V 02/01/2014 : V1.2.2 : XZRLW0  : EDS/HP PROJET HARP :   Modif NAME_WEB/NAME_ENV pour gerer cas particuliers
#V 12/02/2014 : V1.2.3 : XZRLW0  : EDS/HP PROJET HARP :   Verification si deja lance et ajout mode force pour relance complete. 
#V 28/03/2014 : V1.2.4 : XZRLW0  : EDS/HP PROJET HARP :   Modification webprofile NEWGASSI pour environnement GASSI
#V 17/06/2014 : V1.2.5 : XZRLW0  : EDS/HP PROJET HARP :   Modification purge HARP_FILES QC30664
#V 24/09/2014 : V1.2.6 : XZRLW0  : EDS/HP PROJET HARP :   Ajout SetVersion
#V 19/03/2015 : V1.2.7 : THIERRY : HP PROJET HARP     :   PT853 Style PSFT QC 32506
#V 25/03/2015 : V1.2.8 : THIERRY : HP PROJET HARP     :   Suppression 8.9 des DMS
#V 21/05/2015 : V1.2.9 : THIERRY : HP PROJET HARP     :   Correction PSWEBPROFNVP
#V 27/08/2015 : V1.2.10: DZDKKT  : HP PROJET HARP     :   Modif Pagelet : autres cas
#V 08/12/2015 : V1.2.11: THIERRY : HP PROJET HARP     :   Ajout PS_SERVDIR
#V 21/01/2016 : V1.2.12: FMO     : HP PROJET HARP     :   Ajout fonction create_dblink_dev
#V 15/06/2016 : V1.2.13: THIERRY : HP PROJET HARP     :   Récup et modif des mots de passe par NAME_ENV plutot que DBALIAS
#                                                         et remplacement DBALIAS par NAME_ENV dans arborescence a purger
#V 15/06/2016 : V1.2.14: THIERRY : HP PROJET HARP     :   PT855 : style graphique, refresh par dms
#V 26/10/2016 : V1.2.15: THIERRY : HP PROJET HARP     :   ajout gestion GASSI en 8.55(proxy, cookie,...)
#========================================================================================================================

# Definition des fonctions
# ========================

#F usage : description des parametres du script
# ============================================
usage() {
${DEBUGFCT}
 get_script_version ${SCRIPT}.ksh
 LogToFile $1 " USAGE : Rafraichissement d'une base PeopleSoft apres clonage depuis une autre base"
 LogToFile $1 "    --> ${SCRIPT}.ksh -e <environnement> [-v] [-f]"
 LogToFile $1 "    -->  -e : Environnement a traiter - Obligatoire"
 LogToFile $1 "    -->  -v : verification des pre-requis - Optionnel"
 LogToFile $1 "    -->  -f : mode force. Pour forcer toutes les etapes du refresh sur un environnement deja rafraichi"
}

#F run_endsql : Execution script SQL en fin de refresh
# =====================================================================
run_endsql() {
${DEBUGFCT}
if [ ! -z "${ENDSQL}" ]; then
 LogToFile I " Lancement script SQL ${ENDSQL} ..."
 ${HARPSHELL}/exec_script_sql.ksh -e ${NAME_ENV} -f ${ENDSQL}  >> ${LOG}
 rc=$?
 if [ $rc -ne 0 ]; then
    sortie_erreur $rc "Probleme pour executer script SQL"
 else
    LogToFile S " Execution script SQL OK."
 fi
else
 LogToFile I " Pas de script SQL a lancer "
fi
}

#F manage_pagelet_accueil : Mise a jour du pagelet accueil FT
# ============================================
manage_pagelet_accueil() {
${DEBUGFCT}
if [ "${PAGELETACCUEIL}" = "Y" ]; then
   LogToFile I " Mise a jour du pagelet d'accueil"
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET LONG 130
SET LINESIZE 160
SET VERIFY off
spool ${HARPLOG}/update_pagelet_${NAME_WEB}_${SCHEMA_CIBLE}.log
declare
l_long varchar2(30000);
begin
 SELECT HTMLAREA INTO l_long FROM PS_PTPPB_PGLT_HTML WHERE PTPPB_PAGELET_ID IN ('ACCUEIL'); 
 l_long := replace(l_long,'FHHPR1','${NAME_WEB}');
 l_long := replace(l_long,'FHFPR1','${NAME_WEB}');
 l_long := replace(l_long,'HR89RFP','${NAME_WEB}');
 l_long := replace(l_long,'FS89RFP','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE1','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE1','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE2','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE2','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE3','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE3','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE4','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE4','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE5','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE5','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP1','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP1','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP2','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP2','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP3','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP3','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP4','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP4','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP6','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP6','${NAME_WEB}');
 l_long := replace(l_long,'FHHPP5','${NAME_WEB}');
 l_long := replace(l_long,'FHFPP5','${NAME_WEB}');
 l_long := replace(l_long,'FHHUP1','${NAME_WEB}');
 l_long := replace(l_long,'FHFUP1','${NAME_WEB}');
 l_long := replace(l_long,'FHHUP2','${NAME_WEB}');
 l_long := replace(l_long,'FHFUP2','${NAME_WEB}');
 UPDATE PS_PTPPB_PGLT_HTML SET HTMLAREA=l_long, lastupddttm=sysdate WHERE PTPPB_PAGELET_ID IN ('ACCUEIL'); 
 SELECT HTMLAREA INTO l_long FROM PS_PTPPB_HTML_LANG WHERE PTPPB_PAGELET_ID IN ('ACCUEIL'); 
 l_long := replace(l_long,'FHHPR1','${NAME_WEB}');
 l_long := replace(l_long,'FHFPR1','${NAME_WEB}');
 l_long := replace(l_long,'HR89RFP','${NAME_WEB}');
 l_long := replace(l_long,'FS89RFP','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE1','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE1','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE2','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE2','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE3','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE3','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE4','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE4','${NAME_WEB}');
 l_long := replace(l_long,'FHHRE5','${NAME_WEB}');
 l_long := replace(l_long,'FHFRE5','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP1','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP1','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP2','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP2','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP3','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP3','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP4','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP4','${NAME_WEB}');
 l_long := replace(l_long,'FHHQP6','${NAME_WEB}');
 l_long := replace(l_long,'FHFQP6','${NAME_WEB}');
 l_long := replace(l_long,'FHHPP5','${NAME_WEB}');
 l_long := replace(l_long,'FHFPP5','${NAME_WEB}');
 l_long := replace(l_long,'FHHUP1','${NAME_WEB}');
 l_long := replace(l_long,'FHFUP1','${NAME_WEB}');
 l_long := replace(l_long,'FHHUP2','${NAME_WEB}');
 l_long := replace(l_long,'FHFUP2','${NAME_WEB}');
 UPDATE PS_PTPPB_HTML_LANG SET HTMLAREA=l_long , lastupddttm=sysdate WHERE PTPPB_PAGELET_ID IN ('ACCUEIL'); 
 UPDATE PSLOCK SET VERSION=VERSION+1 WHERE OBJECTTYPENAME IN ('PRSM');
 UPDATE PSVERSION SET VERSION = VERSION + 1 WHERE OBJECTTYPENAME IN ('PRSM','SYS') ;
 UPDATE PSPRSMDEFN SET VERSION=(SELECT VERSION FROM PSVERSION WHERE OBJECTTYPENAME='PRSM'), lastupddttm=sysdate WHERE PORTAL_OBJNAME IN ('ADMN_ACCUEIL_HMPG','PEOPLESOFT_APPS') AND PORTAL_NAME='EMPLOYEE';
end;
/
COMMIT;
SELECT HTMLAREA , lastupddttm FROM PS_PTPPB_PGLT_HTML WHERE PTPPB_PAGELET_ID IN ('ACCUEIL');
SELECT HTMLAREA , lastupddttm FROM PS_PTPPB_HTML_LANG WHERE PTPPB_PAGELET_ID IN ('ACCUEIL');
spool off
exit
EOF
   cat ${HARPLOG}/update_pagelet_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
   grep "ORA-|SP2-0157" ${HARPLOG}/update_pagelet_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
        LogToFile W " Erreur pendant la mise a jour du pagelet  "
   else
        LogToFile S " Mise a jour du pagelet OK "
   fi
   $HARPSHELL/manage_pagelet.ksh -e ${NAME_ENV} -p ACCUEIL -a >> ${LOG}
   rc=$?
   if [ $rc -ne 0 ]; then
       sortie_erreur $rc "Probleme pour activer le pagelet"
   else
       LogToFile S " Activation du pagelet OK."
   fi
else
   LogToFile I " Pas de pagelet a gerer"
fi
}

#F DMS_Refresh : lancement datamover refresh
# ============================================
DMS_Refresh() {
${DEBUGFCT}
FILE_DMS=${HARPTMP}/Refresh_Envt_${SCHEMA_CIBLE}_${TYPE}.dms
LogToFile I " Execution du script ${FILE_DMS} via datamover"
LOG_DMS=Refresh_Envt_${SCHEMA_CIBLE}_${TYPE}.log
export PS_SERVDIR=${HOME}/PS_CACHE
$PS_HOME/bin/psdmtx -CT ORACLE -CD ${DBALIAS} -CO ${SCHEMA_CIBLE} -CP ${PASSWORD_ORACLE}  -FP ${FILE_DMS} > ${HARPLOG}/${LOG_DMS}
}

#F DMS_appmsgpurgeall : lancement datamover de purge application messaging
# =========================================================================
DMS_appmsgpurgeall() {
${DEBUGFCT}
LogToFile I " Lancement de la purge Application Messaging via datamover"
LOG_DMS=DMS_appmsgpurgeall_Envt_${SCHEMA_CIBLE}_${TYPE}.log
FILE_DMS=$PS_HOME/scripts/appmsgpurgeall.dms
export PS_SERVDIR=${HOME}/PS_CACHE
$PS_HOME/bin/psdmtx -CT ORACLE -CD ${DBALIAS} -CO ${SCHEMA_CIBLE} -CP ${PASSWORD_ORACLE}  -FP ${FILE_DMS} > ${HARPLOG}/${LOG_DMS}
}

#F DMS_rptclr : lancement datamover de purge des tables report repository
# ======================================================================
DMS_rptclr() {
${DEBUGFCT}
LOG_DMS=DMS_rptclr_Envt_${SCHEMA_CIBLE}_${TYPE}.log
FILE_DMS=$PS_HOME/scripts/rptclr.dms
export PS_SERVDIR=${HOME}/PS_CACHE
$PS_HOME/bin/psdmtx -CT ORACLE -CD ${DBALIAS} -CO ${SCHEMA_CIBLE} -CP ${PASSWORD_ORACLE}  -FP ${FILE_DMS} > ${HARPLOG}/${LOG_DMS}
cat ${HARPLOG}/${LOG_DMS} >> $LOG
}

#F VERIF_DMS : Verification des logs datamover
# ========================================================
VERIF_DMS() {
${DEBUGFCT}
cat ${HARPLOG}/$1 | grep Error | egrep -v "ORA-00942|UPDATE" > /dev/null
if [ $? -ne 0 ]; then
   LogToFile S " Execution DMS OK"
else
   #sortie_erreur 367 " Execution DMS KO"
   LogToFile W " Execution DMS A VERIFIER"
fi
}

#F SUB_DMS_Refresh : Preparation du fichier dms et purge eventuelle des tables du report repository
# ==================================================================================================
SUB_DMS_Refresh() {
${DEBUGFCT}
# si fichier dms specifique a la version, on l'utilise. sinon, on prend le fichier dms sans version
if [  -f ${HARPDMS}/Refresh_Envt_${TYPE}_${HARPPTRELEASE}.dms ]; then
   REFRESH_ENVT_TEMPLATE_DMS=${HARPDMS}/Refresh_Envt_${TYPE}_${HARPPTRELEASE}.dms   
else
   REFRESH_ENVT_TEMPLATE_DMS=${HARPDMS}/Refresh_Envt_${TYPE}.dms
fi
LogToFile I " Preparation du script de refresh ${HARPTMP}/Refresh_Envt_${SCHEMA_CIBLE}_${TYPE}.dms depuis ${REFRESH_ENVT_TEMPLATE_DMS}"
sed "s|HARPRACINE|$HARP_RACINE|g" ${REFRESH_ENVT_TEMPLATE_DMS} | sed "s|PSLOGHOME|$PS_LOG_HOME|g" | sed "s|NAME_WEB|$NAME_WEB|g" | sed "s|PASSWORD_ORACLE|${PASSWORD_ORACLE}|g" |sed "s|SCHEMA_CIBLE|${SCHEMA_CIBLE}|g" |sed "s|PASSWORD_PS|$PASSWORD_PS|g" |sed "s|PASSWORD_WS|$PASSWORD_WS|g" |sed "s|PORTHTTP_GASSY|$PORTHTTP_GASSY|g" |sed "s|PORTHTTP|$PORTHTTP|g" |sed "s|DISTNODEURL|$DISTNODEURL|g" |sed "s|DEFAULTPROTOCOL|$DEFAULTPROTOCOL|g" |sed "s|PIAURL|$PIAURL_IP|g" |sed "s|Port_web_bis|$Port_web_bis|g" | sed "s|CONF_WEB_PROF|$CONF_WEB_PROF|g" | sed "s|PRCSUNX|$PRCSUX1|g" | sed "s|PRCSNT|$PRCSNT|g" | sed "s|MAXAPIAWARE_UNIX|$MAXAPIAWARE_UNIX|g" | sed "s|MAXAPIAWARE_NT|$MAXAPIAWARE_NT|g" |sed "s|MAXCOBOLUNIX|$MAXCOBOLUNIX|g" | sed "s|MAXAEUNIX|$MAXAEUNIX|g" | sed "s|MAXCOBOLNT|$MAXCOBOLNT|g" | sed "s|MAXAENT|$MAXAENT|g" | sed "s|IBPSWD|$IBPSWD|g" | sed "s|NAME_ENV|$NAME_ENV|g" | sed "s|HARPPSRELEASE|$HARPPSRELEASE|g" > $HARPTMP/Refresh_Envt_${SCHEMA_CIBLE}_${TYPE}.dms

if [ $GESTION_REPORT = "Y" ]; then
   echo "UPDATE ${SCHEMA_CIBLE}.PS_CDM_LIST SET OUTPUTDIR=REPLACE(OUTPUTDIR,'${SCHEMA_SOURCE}','${SCHEMA_CIBLE}') WHERE OUTPUTDIR LIKE '${SCHEMA_SOURCE}%';" >> $HARPTMP/Refresh_Envt_${SCHEMA_CIBLE}_${TYPE}.dms
   echo "COMMIT;" >> $HARPTMP/Refresh_Envt_${SCHEMA_CIBLE}_${TYPE}.dms
fi
}

#F PURGE_LOG_TMP_APPSERV : suppression du fichier APPSRV.LOG
# =============================================================================
PURGE_LOG_TMP_APPSERV() {
${DEBUGFCT}
if [ -e ${HARPLOG}/APPSRV.LOG ]; then
   LogToFile I " Purge du fichier ${HARPLOG}/APPSRV.LOG "
   rm ${HARPLOG}/APPSRV.LOG
fi
}

#F Verif_Repertoire : verification et creation des repertoires interfaces
# =======================================================================
Verif_Repertoire() {
${DEBUGFCT}
if [ ${CREAT_REP_INTERFACE} = "Y" ]; then
   LogToFile I " Verification des repertoires pour $NAME_WEB"
   for i in `cat $HARPTMP/Refresh_Envt_${SCHEMA_CIBLE}_${TYPE}.dms | grep "$PS_HOME" | awk -F"=URL'" '{print$2}' | tr -s "'" " " | awk '{print $1}'`
   do 
     if [ ! -d $i ]; then
	LogToFile W " Le repertoire $i n'existe pas  "
	mkdir -p $i
	LogToFile I " Le repertoire $i a ete cree "
     fi
    done
fi
}

#F Delete_Repository : purge du repertoire du report repository
# =======================================================================
Delete_Repository() {
${DEBUGFCT}
if [ "${GESTION_REPORT}" = "N" ] ; then
   LogToFile I " Lancement de la purge des tables du  report repository PeopleSoft via le DMS rptclr "
   DMS_rptclr
   VERIF_DMS ${LOG_DMS}
   clean_psreports
   clean_log_output
else
   LogToFile I " Pas de purge des tables et du repertoire du report repository "
fi
}

#F clean_harpfiles : Gestion du repertoire HARP_FILES/env
#F Si absent ou N, non traite. Si P, purge a 30j. QC 23000 
#F QC 30664 ajout parametre pour purger uniquement Interface, GRD et majem
# =======================================================================
clean_harpfiles() {
${DEBUGFCT}
case "${CLEANHARPFILES}" in
       "N") LogToFile I " Pas d'action sur le repertoire ${HARP_RACINE}/${NAME_ENV}/$1"
            ;;
       "P") SRVPSUNX=`grep "PRCSUX1" ${HARPCONF}/${NAME_ENV}.conf | cut -d";" -f3`
            CNXSSHUNIX=${OWNERUNX}@${SRVPSUNX}
            if [ "${SRVPSUNX}" != "${HOST}" ]; then
               # L'arborescence est sur une autre machine
               GetRemoteVar ${CNXSSHUNIX} HARP_RACINE REMOTE_HARP_RACINE
               LogToFile I " Purge de tous les fichiers du repertoire distant ${SRVPSUNX}:${REMOTE_HARP_RACINE}/${NAME_ENV}/$1 a 30 jours..."
               ExecSSH.ksh ${CNXSSHUNIX} "purgedir.ksh -d ${REMOTE_HARP_RACINE}/${NAME_ENV}/$1 -m file -r 30 -n"
            else
               # L'arborecence est locale
               if [  -z "${HARP_RACINE}" -o ! -d ${HARP_RACINE}/${NAME_ENV}/$1 ]; then
                  LogToFile I " Pas d'action sur le repertoire HARP_FILES/${NAME_ENV}/$1"
               else 
                  LogToFile I " Purge de tous les fichiers du repertoire ${HARP_RACINE}/${NAME_ENV}/$1 a 30 jours..."
                  ExecSSH.ksh ${CNXSSHUNIX} "purgedir.ksh -d ${HARP_RACINE}/${NAME_ENV}/$1 -m file -r 30 -n"
               fi
            fi
            ;;
       * ) LogToFile I " Pas d'action sur le repertoire ${HARP_RACINE}/${NAME_ENV}"
            ;;
esac
}

#F clean_logoutput : Purge du repertoire log_output
# =======================================================================
clean_log_output() {
${DEBUGFCT}
SRVPSUNX=`grep "PRCSUX1" ${HARPCONF}/${NAME_ENV}.conf | cut -d";" -f3`
CNXSSHUNIX=${OWNERUNX}@${SRVPSUNX}
if [ "${SRVPSUNX}" != "${HOST}" ]; then
    # L'arborescence est sur une autre machine
    GetRemoteVar ${CNXSSHUNIX} PS_LOG_HOME REMOTE_PS_LOG_HOME
    LogToFile I " Purge de tout le contenu du repertoire distant ${SRVPSUNX}:${REMOTE_PS_LOG_HOME}/LOG_OUTPUT/${NAME_ENV}/${PRCSUX1}"
    ExecSSH.ksh ${CNXSSHUNIX} "purgedir.ksh -d ${REMOTE_PS_LOG_HOME}/LOG_OUTPUT/${NAME_ENV}/${PRCSUX1} -m full -n"
else
    # L'arborecence est locale
   if [  -z "${PS_LOG_HOME}" -o ! -d ${PS_LOG_HOME}/LOG_OUTPUT/${DBALIAS}/${PRCSUX1} ]; then
      LogToFile I " Pas d'action sur le repertoire ${PS_LOG_HOME}/LOG_OUTPUT/${DBALIAS}/${PRCSUX1}"
   else 
      LogToFile I " Purge de tout le contenu du repertoire ${PS_LOG_HOME}/LOG_OUTPUT/${NAME_ENV}/${PRCSUX1} ..."
      ExecSSH.ksh ${CNXSSHUNIX} "purgedir.ksh -d ${PS_LOG_HOME}/LOG_OUTPUT/${NAME_ENV}/${PRCSUX1} -m full -n"
   fi
fi
}

#F clean_psreports : Purge du repertoire psreports
# =======================================================================
clean_psreports() {
${DEBUGFCT}
CNXSSHUNIX=${OWNERWSUNX}@${HOST}
# L'arborecence est locale
 if [  -d ${REPORTPATH}/${DBALIAS} ]; then
      LogToFile I " Purge de tout le contenu du repertoire psreports ${REPORTPATH}/${NAME_ENV} ..."
      ExecSSH.ksh ${CNXSSHUNIX} "purgedir.ksh -d ${REPORTPATH}/${NAME_ENV} -m full -n"
fi
}

#F revoke : nettoyage des informations sensibles des fichiers dms ou logs
# =======================================================================
revoke() {
${DEBUGFCT}
sed "s|ACCESSPSWD = '${PASSWORD_ORACLE}'|ACCESSPSWD=<SECURITY REMOVED>|g" $1 | sed "s|OPERPSWD='${PASSWORD_PS}'|OPERPSWD=<SECURITY REMOVED>|g" | sed "s|OPERPSWD='${PASSWORD_WS}'|OPERPSWD=<SECURITY REMOVED>|g"  | sed "s|STM_ACCESS_PSWD='${PASSWORD_ORACLE}'|STM_ACCESS_PSWD=<SECURITY REMOVED>|g" | sed "s|PTOPERPSWDV2='${PASSWORD_PS}'|PTOPERPSWDV2=<SECURITY REMOVED>|g" | sed "s|PTOPERPSWDV2='${PASSWORD_WS}'|PTOPERPSWDV2=<SECURITY REMOVED>|g" > $1.tmp
if [ $? -eq 0 ]; then
   mv $1.tmp $1
   if [ $? -ne 0 ]; then
      LogToFile W " Probleme pour renommer $1.tmp en $1 apres nettoyage des donnees sensibles "
   else
    LogToFile S " les donnees sensibles de $1 ont ete nettoyees "
   fi
else
    LogToFile W " Impossible de nettoyer les donnees sensibles de $1 "
fi

if [ -e $PS_HOME/log/datamove.log ]; then
   sed "s|ACCESSPSWD = '${PASSWORD_ORACLE}'|ACCESSPSWD=<SECURITY REMOVED> |g" $PS_HOME/log/datamove.log | sed "s|OPERPSWD='${PASSWORD_PS}'|OPERPSWD='<SECURITY REMOVED>'|g"  | sed "s|OPERPSWD='${PASSWORD_WS}'|OPERPSWD='<SECURITY REMOVED>'|g" | sed "s|STM_ACCESS_PSWD='${PASSWORD_ORACLE}'|STM_ACCESS_PSWD=<SECURITY REMOVED>|g" | sed "s|PTOPERPSWDV2='${PASSWORD_PS}'|PTOPERPSWDV2=<SECURITY REMOVED>|g" | sed "s|PTOPERPSWDV2='${PASSWORD_WS}'|PTOPERPSWDV2=<SECURITY REMOVED>|g"> $PS_HOME/log/datamove.log.tmp
   if [ $? -eq 0 ]; then
      mv $PS_HOME/log/datamove.log.tmp $PS_HOME/log/datamove.log
      if [ $? -ne 0 ]; then
         LogToFile W " Probleme pour renommer $PS_HOME/log/datamove.log.tmp en $PS_HOME/log/datamove.log apres nettoyage des donnees sensibles "
      else
         LogToFile S " les donnees sensibles de $PS_HOME/log/datamove.log ont ete nettoyees "
      fi
   else
     LogToFile W " Impossible de nettoyer les donnees sensibles de PS_HOME/log/datamove.log "
   fi
fi
}

#F Verif_env : Verification  TNSPING
# ==================================
Verif_env() {
${DEBUGFCT}
TnsPing $1  
}

#F Gestion_url_rpg : Verification si reverse proxy a configurer 
# ===========================================================
Gestion_url_rpg() {
${DEBUGFCT}
PIAURL_IP=`echo $PIAURL | tr -s '://' '   ' | awk '{print $2}'`
LogToFile I " Verification si un reverse proxy doit etre configure "
if [ ${ACTIV_REVERSE_PROXY} = "N" ]; then
   LogToFile I " Reverse proxy OFF"
   Port_web_bis=`echo ${PORTHTTP}`
   PORTHTTP=`echo :${PORTHTTP}`
else
   LogToFile I " Reverse proxy ON"
   Port_web_bis=`echo $PORTHTTP`
   PORTHTTP=`echo :${PORTHTTP}`
fi
LogToFile I " Fin de la verification reverse proxy "
}

#F Gestion_gassi :  Parametrage GASSI 
# ===========================================================
Gestion_gassi() {
${DEBUGFCT}
LogToFile I " Verification si configuration GASSI requise "
if [ ${ACTIV_GASSI} = "Y" ]; then
   LogToFile I " Configuration Cookie GASSI pour version ${HARPPTRELEASE}"
   update_gassi_cookie${HARPPTRELEASE} 
else
   LogToFile I " Pas de configuration GASSI"
fi
}

#F Update_style_PSFT : Modification du style graphique PSFT 
#F pour differencier de la production => changement couleur menu
# ===============================================================
Update_style_PSFT() {
${DEBUGFCT}
if [ ! -z "${MENUCOLOR}" ]; then
   if [ ! -f ${HARPDAT}/PORTAL_STYLE_${MENUCOLOR}_${HARPPTRELEASE}.dat -a ! -f ${HARPDAT}/PORTAL_STYLE_${MENUCOLOR}.dat ]; then
      LogToFile W " Pas de fichier PORTAL_STYLE_${MENUCOLOR}.dat ou PORTAL_STYLE_${MENUCOLOR}_${HARPPTRELEASE}.dat pour mettre a jour le style graphique"
  else
   if [ -f ${HARPDAT}/PORTAL_STYLE_${MENUCOLOR}_${HARPPTRELEASE}.dat ]; then
      MENUCOLOR=${MENUCOLOR}_${HARPPTRELEASE}
   fi
   FILE_DMS=${HARPTMP}/Update_Style_${MENUCOLOR}_${DBALIAS}.dms
   LOG_DMS=Update_Style_${MENUCOLOR}_${DBALIAS}.log
   LogToFile I " Preparation du script DMS ${FILE_DMS} pour mise a jour du style ${MENUCOLOR}"
   sed "s|HARPDAT|$HARPDAT|g" ${HARPDMS}/import_STYLE_${HARPPSRELEASE}.dms | sed "s|MENUCOLOR|$MENUCOLOR|g" > ${FILE_DMS}
   LogToFile I " Mise a jour du style graphique PSFT pour relase ${HARPPSRELEASE} ..."
   export PS_SERVDIR=${HOME}/PS_CACHE
   $PS_HOME/bin/psdmtx -CT ORACLE -CD ${DBALIAS} -CO ${SCHEMA_CIBLE} -CP ${PASSWORD_ORACLE}  -FP ${FILE_DMS} > ${HARPLOG}/${LOG_DMS}
   VERIF_DMS ${LOG_DMS}
  fi
fi
}

#F Update_GOROCO : Modification de la release HARP
#F utilise uniquement pour les env DV/IT qd refresh pour nouvelle ligne
# =====================================================================
Update_GOROCO() {
${DEBUGFCT}
if [ ! -z "${GOROCO}" ]; then
LogToFile I " Mise a jour release HARP GOROCO ..."
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
spool ${HARPLOG}/update_goroco_${NAME_WEB}_${SCHEMA_CIBLE}.log
--
-- Update Goroco
--
UPDATE PSPRUHDEFN SET PORTAL_GREETING254='${GOROCO}' WHERE PORTAL_GREETING254 IS NOT NULL;
COMMIT;
spool off
exit
EOF

if [ -e ${HARPLOG}/update_goroco_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-|SP2-0157" ${HARPLOG}/update_goroco_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
	LogToFile W " Erreur pendant la mise a jour de la release HARP GOROCO ...  "
   else
	LogToFile S " Mise a jour de la release HARP GOROCO ... "
   fi
   cat ${HARPLOG}/update_goroco_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
else
   LogToFile W " Verifier la modification de la release HARP GOROCO (pas de log)"
fi
else
   LogToFile I " Pas de mise a jour de la release HARP GOROCO"
fi
}

# ===========================================================
update_gassi_cookie852() {
${DEBUGFCT}
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
--
-- Update Profil Web 
--
spool ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log
-- regles cookie
UPDATE PSWEBPROFCOOK SET COOKIEPATTERN='*${NAME_WEB}*' WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND COOKIEPATTERN like '*FH%PR1*';
-- Modification du webprofile NEWGASSI si c'est le web profile de l'environnement
-- Cookie forward domain
UPDATE PSWEBPROFCOOK SET FORWARDDOMAIN='$DISTNODEURL' WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND WEBPROFILENAME='NEWGASSI' AND COOKIEPATTERN='*';
-- Modif chemin cache
UPDATE PSWEBPROFNVP SET PT_PROPVALUE=REPLACE(PT_PROPVALUE,'new','new${NAME_WEB}') WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND WEBPROFILENAME='NEWGASSI' AND PT_PROPVALUE LIKE '/cache%';
-- Suppression domaine authentification
DELETE FROM PSWEBPROFNVP WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND WEBPROFILENAME='NEWGASSI' AND PROPERTYNAME='AUTHTOKENDOMAIN';
-- cookie logonid
DELETE FROM PSWEBPROFNVP WHERE WEBPROFILENAME='NEWGASSI' AND PROPERTYNAME='USERIDCOOKIEAGE';
INSERT INTO PSWEBPROFNVP SELECT '$CONF_WEB_PROF','USERIDCOOKIEAGE','0' FROM DUAL WHERE '$CONF_WEB_PROF' = 'NEWGASSI';
COMMIT;
spool off
exit
EOF
if [ -e ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-|SP2-0157" ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
	LogToFile W " Erreur pendant la configuration du cookie gassi  "
   else
	LogToFile S " Configuration cookie gassi OK"
   fi
   cat ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
else
   LogToFile W " Verifier la configuration du cookie gassi (pas de log) "
fi
}
# ===========================================================
update_gassi_cookie853() {
${DEBUGFCT}
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
--
-- Update Profil Web 
--
spool ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log
-- regles cookie
UPDATE PSWEBPROFCOOK SET COOKIEPATTERN='*${NAME_WEB}*' WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND COOKIEPATTERN like '*FH%PR1*';
-- Modification du webprofile NEWGASSI si c'est le web profile de l'environnement
-- Cookie forward domain
UPDATE PSWEBPROFCOOK SET FORWARDDOMAIN='$DISTNODEURL' WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND WEBPROFILENAME='NEWGASSI' AND COOKIEPATTERN='*';
-- Modif chemin cache
UPDATE PSWEBPROFNVP SET PT_LPROPVALUE=REPLACE(PT_LPROPVALUE,'new','new${NAME_WEB}') WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND WEBPROFILENAME='NEWGASSI' AND PT_LPROPVALUE LIKE '/cache%';
-- Suppression domaine authentification
DELETE FROM PSWEBPROFNVP WHERE WEBPROFILENAME='$CONF_WEB_PROF'  AND WEBPROFILENAME='NEWGASSI' AND PROPERTYNAME='AUTHTOKENDOMAIN';
-- cookie logonid
DELETE FROM PSWEBPROFNVP WHERE WEBPROFILENAME='NEWGASSI' AND PROPERTYNAME='USERIDCOOKIEAGE';
INSERT INTO PSWEBPROFNVP SELECT '$CONF_WEB_PROF','USERIDCOOKIEAGE',' ','0' FROM DUAL WHERE '$CONF_WEB_PROF' = 'NEWGASSI';
COMMIT;
spool off
exit
EOF
if [ -e ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-|SP2-0157" ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
	LogToFile W " Erreur pendant la configuration du cookie gassi  "
   else
	LogToFile S " Configuration cookie gassi OK"
   fi
   cat ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
else
   LogToFile W " Verifier la configuration du cookie gassi (pas de log) "
fi
}
# ===========================================================
update_gassi_cookie855() {
${DEBUGFCT}
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
--
-- Update Profil Web 
--
spool ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log
-- regles cookie
UPDATE PSWEBPROFCOOK SET COOKIEPATTERN='*${NAME_WEB}*' WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND COOKIEPATTERN like '*FH%PR1*';
-- Modification du webprofile NEWGASSI si c'est le web profile de l'environnement
-- Cookie forward domain
UPDATE PSWEBPROFCOOK SET FORWARDDOMAIN='$DISTNODEURL' WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND WEBPROFILENAME='NEWGASSI' AND COOKIEPATTERN='*';
-- Modif chemin cache
UPDATE PSWEBPROFNVP SET PT_LPROPVALUE=REPLACE(PT_LPROPVALUE,'new','new${NAME_WEB}') WHERE WEBPROFILENAME='$CONF_WEB_PROF' AND WEBPROFILENAME='NEWGASSI' AND PT_LPROPVALUE LIKE '/cache%';
-- Suppression domaine authentification
DELETE FROM PSWEBPROFNVP WHERE WEBPROFILENAME='$CONF_WEB_PROF'  AND WEBPROFILENAME='NEWGASSI' AND PROPERTYNAME='AUTHTOKENDOMAIN';
-- cookie logonid
DELETE FROM PSWEBPROFNVP WHERE WEBPROFILENAME='NEWGASSI' AND PROPERTYNAME='USERIDCOOKIEAGE';
INSERT INTO PSWEBPROFNVP SELECT '$CONF_WEB_PROF','USERIDCOOKIEAGE',' ','0' FROM DUAL WHERE '$CONF_WEB_PROF' = 'NEWGASSI';
COMMIT;
spool off
exit
EOF
if [ -e ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-|SP2-0157" ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
	LogToFile W " Erreur pendant la configuration du cookie gassi  "
   else
	LogToFile S " Configuration cookie gassi OK"
   fi
   cat ${HARPLOG}/cookie_gassi_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
else
   LogToFile W " Verifier la configuration du cookie gassi (pas de log) "
fi
}
#F Reverse_proxy_sql_on : configuration si reverse proxy  
# ===========================================================
Reverse_proxy_sql_on852() {
${DEBUGFCT}
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
--
-- Update Profil Web 
--
spool ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='DEFAULTPORT';
INSERT INTO PSWEBPROFNVP(WEBPROFILENAME,PROPERTYNAME,PT_PROPVALUE) VALUES('$CONF_WEB_PROF','DEFAULTPORT','$PORTHTTP_GASSY');
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='PSWEBSERVERNAME';
INSERT INTO PSWEBPROFNVP(WEBPROFILENAME,PROPERTYNAME,PT_PROPVALUE) VALUES('$CONF_WEB_PROF','PSWEBSERVERNAME','$PIAURL_IP');
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='DEFAULTSCHEME';
INSERT INTO PSWEBPROFNVP(WEBPROFILENAME,PROPERTYNAME,PT_PROPVALUE) VALUES('$CONF_WEB_PROF','DEFAULTSCHEME','$DEFAULTPROTOCOL');
COMMIT;
spool off
exit
EOF
if [ -e ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-|SP2-0157" ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
	LogToFile W " Erreur pendant la configuration du reverse proxy  "
   else
	LogToFile S " Configuration du reverse proxy OK"
   fi
   cat ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
else
   LogToFile W " Verifier la configuration du reverse proxy (pas de log) "
fi
}

Reverse_proxy_sql_on853() {
${DEBUGFCT}
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
--
-- Update Profil Web 
--
spool ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='DEFAULTPORT';
INSERT INTO PSWEBPROFNVP(WEBPROFILENAME,PROPERTYNAME,PT_PROPVALUE, PT_LPROPVALUE) VALUES('$CONF_WEB_PROF','DEFAULTPORT',' ','$PORTHTTP_GASSY');
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='PSWEBSERVERNAME';
INSERT INTO PSWEBPROFNVP(WEBPROFILENAME,PROPERTYNAME,PT_PROPVALUE, PT_LPROPVALUE) VALUES('$CONF_WEB_PROF','PSWEBSERVERNAME',' ','$PIAURL_IP');
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='DEFAULTSCHEME';
INSERT INTO PSWEBPROFNVP(WEBPROFILENAME,PROPERTYNAME,PT_PROPVALUE, PT_LPROPVALUE) VALUES('$CONF_WEB_PROF','DEFAULTSCHEME',' ', '$DEFAULTPROTOCOL');
COMMIT;
spool off
exit
EOF
if [ -e ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-|SP2-0157" ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
	LogToFile W " Erreur pendant la configuration du reverse proxy  "
   else
	LogToFile S " Configuration du reverse proxy OK"
   fi
   cat ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
else
   LogToFile W " Verifier la configuration du reverse proxy (pas de log) "
fi
}

Reverse_proxy_sql_on855() {
${DEBUGFCT}
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
--
-- Update Profil Web 
--
spool ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='DEFAULTPORT';
INSERT INTO PSWEBPROFNVP(WEBPROFILENAME,PROPERTYNAME,PT_PROPVALUE, PT_LPROPVALUE) VALUES('$CONF_WEB_PROF','DEFAULTPORT',' ','$PORTHTTP_GASSY');
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='PSWEBSERVERNAME';
INSERT INTO PSWEBPROFNVP(WEBPROFILENAME,PROPERTYNAME,PT_PROPVALUE, PT_LPROPVALUE) VALUES('$CONF_WEB_PROF','PSWEBSERVERNAME',' ','$PIAURL_IP');
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='DEFAULTSCHEME';
INSERT INTO PSWEBPROFNVP(WEBPROFILENAME,PROPERTYNAME,PT_PROPVALUE, PT_LPROPVALUE) VALUES('$CONF_WEB_PROF','DEFAULTSCHEME',' ', '$DEFAULTPROTOCOL');
COMMIT;
spool off
exit
EOF
if [ -e ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-|SP2-0157" ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
	LogToFile W " Erreur pendant la configuration du reverse proxy  "
   else
	LogToFile S " Configuration du reverse proxy OK"
   fi
   cat ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
else
   LogToFile W " Verifier la configuration du reverse proxy (pas de log) "
fi
}

#F Reverse_proxy_sql_off : desactivation reverse proxy 
# ===========================================================
Reverse_proxy_sql_off() {
${DEBUGFCT}
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
--
-- Update Profil Web 
--
spool ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='DEFAULTPORT';
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='PSWEBSERVERNAME';
DELETE from PSWEBPROFNVP where WEBPROFILENAME='$CONF_WEB_PROF' and PROPERTYNAME='DEFAULTSCHEME';
COMMIT;
spool off
exit
EOF
if [ -e ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-" ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
      LogToFile W " Erreur pendant la desactivation du reverse proxy  "
   else
      LogToFile S " Desactivation du reverse proxy OK"
   fi
   cat ${HARPLOG}/Reverse_proxy_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
else
   LogToFile W " Verifier la desactivation du reverse proxy (pas de log)"
fi
}

#F create_dblink : Creation des dblinks
# ====================================
create_dblink() {
${DEBUGFCT}
if [ $TYPE = "HRMS" ]; then
   TYPE_DBLINK=FSCM
elif [ $TYPE = "FSCM" ]; then
     TYPE_DBLINK=HRMS
fi
if [ "$DBLINK_CIBLE_SCHEMA" = "" -o "$DBLINK_CIBLE_ALIAS" = "" ]; then
   LogToFile I ' Suppression du dblink  '
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
spool ${HARPLOG}/Drop_dblink_${NAME_WEB}_${SCHEMA_CIBLE}.log
declare
code_sql_1 varchar2(300);
code_sql_2 varchar2(300);
begin
code_sql_1:='drop DATABASE LINK $TYPE_DBLINK';
for c1 in (select count(1) cnt from dba_db_links where owner='${SCHEMA_CIBLE}' and DB_LINK like '${TYPE_DBLINK}%') loop
begin
if      (c1.cnt = 1) then
execute immediate code_sql_1;
end if;
exception
when others then
dbms_output.put_line(sqlerrm);
end;
end loop;
end;
/
spool off
exit
EOF
  LogToFile I " Le dblink a ete supprime  "
  cat ${HARPLOG}/Drop_dblink_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
else
LogToFile I " Suppression et recreation du dblink "
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
spool ${HARPLOG}/Create_dblink_${NAME_WEB}_${SCHEMA_CIBLE}.log
declare
code_sql_1 varchar2(300);
code_sql_2 varchar2(300);
begin
code_sql_1:='DROP DATABASE LINK $TYPE_DBLINK';
code_sql_2:='CREATE DATABASE LINK $TYPE_DBLINK CONNECT TO $DBLINK_CIBLE_SCHEMA IDENTIFIED BY "${PASSWORD_ORACLE_DBLINK_CIBLE}" USING ''$DBLINK_CIBLE_ALIAS''';
for c1 in (select count(1) cnt from dba_db_links where owner='${SCHEMA_CIBLE}' and DB_LINK like '${TYPE_DBLINK}%') loop
begin
if      (c1.cnt = 1) then
execute immediate code_sql_1;
execute immediate code_sql_2;
else
execute immediate code_sql_2;
end if;
exception
when others then
dbms_output.put_line(sqlerrm);
end;
end loop;
end;
/
spool off
exit
EOF
LogToFile I " Le dblink a ete cree"
cat ${HARPLOG}/Create_dblink_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
fi
}

#F create_dblink_dev : Creation des dblinks DEV
# =============================================
create_dblink_dev() {
${DEBUGFCT}
TYPE_ENV=$(echo ${NAME_ENV} | cut -c4-5 )

if [ "${TYPE_ENV}" = "DV" ]; then
LogToFile I " Suppression et recreation des dblinks DEV"
for DBNAME in `awk -F: ' /^FHXDV/ { print $1 }' /etc/oratab | grep -v ${ORACLE_SID}`
do
ENV_CIBLE=$(echo ${NAME_ENV} | cut -c1-3 )$(echo ${DBNAME} | cut -c4-6 )
TYPE_DBLINK=${ENV_CIBLE}
DBLINK_CIBLE_ALIAS=${ENV_CIBLE}
DBLINK_CIBLE_SCHEMA=${SCHEMA_CIBLE}
GetPassword ${ENV_CIBLE} ORCL ${DBLINK_CIBLE_SCHEMA}
PASSWORD_ORACLE_DBLINK_CIBLE=`echo ${COMPTEPSWD}`
sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS} <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
spool ${HARPLOG}/Create_dblink_dev_${NAME_WEB}_${SCHEMA_CIBLE}.log
declare
code_sql_1 varchar2(300);
code_sql_2 varchar2(300);
begin
code_sql_1:='DROP PUBLIC DATABASE LINK ${TYPE_DBLINK}';
code_sql_2:='CREATE PUBLIC DATABASE LINK ${TYPE_DBLINK} CONNECT TO ${DBLINK_CIBLE_SCHEMA} IDENTIFIED BY "${PASSWORD_ORACLE_DBLINK_CIBLE}" USING ''${DBLINK_CIBLE_ALIAS}''';
for c1 in (select count(1) cnt from dba_db_links where owner='${SCHEMA_CIBLE}' and DB_LINK='${TYPE_DBLINK}') loop
begin
if      (c1.cnt = 1) then
execute immediate code_sql_1;
execute immediate code_sql_2;
else
execute immediate code_sql_2;
end if;
exception
when others then
dbms_output.put_line(sqlerrm);
end;
end loop;
end;
/
spool off
exit
EOF
cat ${HARPLOG}/Create_dblink_dev_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
if [ -e ${HARPLOG}/Create_dblink_dev_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-" ${HARPLOG}/Create_dblink_dev_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
      LogToFile W " Creation du DB link ${TYPE_DBLINK} => KO"
   else
      LogToFile S " Creation du DB link ${TYPE_DBLINK} => OK"
   fi
else
   LogToFile W "  Verifier la creation du DB link ${TYPE_DBLINK} (pas de log)"
fi
done
fi
}

#F dbowner : Mise a jour de la table ps.psdbowner
# ===========================================================
dbowner() {
${DEBUGFCT}
#ORACLE_SID=`tnsping ${DBALIAS} | grep Attempting | tr -s "(" " " | tr -s ")" " " | tr -s "=" " " | awk '{ print $15}'`
#export ORACLE_SID
sqlplus -s / > /dev/null <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
spool ${HARPLOG}/Update_dbowner_${NAME_WEB}_${SCHEMA_CIBLE}.log
delete from ps.psdbowner where DBNAME=substr('$NAME_WEB',1,8) and OWNERID='${SCHEMA_CIBLE}';
insert into ps.psdbowner values (substr('$NAME_WEB',1,8) ,'${SCHEMA_CIBLE}');
delete from ps.psdbowner where DBNAME=substr('$DBALIAS',1,8) and OWNERID='${SCHEMA_CIBLE}';
insert into ps.psdbowner values (substr('$DBALIAS',1,8) ,'${SCHEMA_CIBLE}');
COMMIT;
spool off
exit
EOF
if [ $? -ne 0 ]; then
   sortie_erreur 121  " Impossible de mettre a jour la table ps.psdbowner. Verifier si le compte externaly existe pour ${ORACLE_SID}"
fi
cat ${HARPLOG}/Update_dbowner_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
if [ -e ${HARPLOG}/Update_dbowner_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-" ${HARPLOG}/Update_dbowner_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
      LogToFile W " La mise a jour de la table ps.psdbowner est KO"
   else
      LogToFile S " La mise a jour de la table ps.psdbowner est OK"
   fi
else
   LogToFile W "  Verifer la mise a jour de la table ps.psdbowner (pas de log)"
fi
}

#F refreshdt : Mise a jour de la table ps_maintenance_log
#F avec date de refresh
# ===========================================================
refreshdt() {
${DEBUGFCT}
sqlplus -s / > /dev/null <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
spool ${HARPLOG}/insert_refreshdt_${NAME_WEB}_${SCHEMA_CIBLE}.log
delete from ${SCHEMA_CIBLE}.ps_maintenance_log where update_id='REFRESH_HARP';
insert into ${SCHEMA_CIBLE}.ps_maintenance_log values('REFRESH_HARP','Rafraichissement HARP',sysdate,'HP','HP','HARP',sysdate,'HARP','HP','Rafraichissement HARP');
COMMIT;
spool off
exit
EOF
if [ $? -ne 0 ]; then
   sortie_erreur 121  " Impossible de mettre a jour la table ps_maintenance_log du schema ${SCHEMA_CIBLE}. Verifier si le compte externaly existe pour ${ORACLE_SID}"
fi
cat ${HARPLOG}/insert_refreshdt_${NAME_WEB}_${SCHEMA_CIBLE}.log >> $LOG
if [ -e ${HARPLOG}/insert_refreshdt_${NAME_WEB}_${SCHEMA_CIBLE}.log ]; then
   grep "ORA-" ${HARPLOG}/insert_refreshdt_${NAME_WEB}_${SCHEMA_CIBLE}.log
   if [ $? -eq 0 ]; then
      LogToFile W " La mise a jour de la table ps_maintenance_log est KO"
   else
      LogToFile S " La mise a jour de la table ps_maintenance_log est OK"
   fi
else
   LogToFile W "  Verifer la mise a jour de la table ps_maintenance_log (pas de log)"
fi
}

#F cryptage :  recuperation des donnes cryptees
# ===========================================================
cryptage() {
${DEBUGFCT}
GetPassword ${NAME_ENV} ORCL ${SCHEMA_CIBLE}
PASSWORD_ORACLE=`echo $COMPTEPSWD`
GetPassword ${NAME_ENV} PSFT ${USER_START_PEOPLESOFT}
PASSWORD_PS=`echo $COMPTEPSWD`
GetPassword COMMUN PSFT PTWEBSERVER
PASSWORD_WS=`echo $COMPTEPSWD`
GetPassword ${NAME_ENV} PSFT ${USER_AE_DMS}
PASSWORD_USER_AE_DMS=`echo $COMPTEPSWD`
if [ "$DBLINK_CIBLE_SCHEMA" = "" -o "$DBLINK_CIBLE_ALIAS" = "" ]; then
   LogToFile W " Pas de parametres dblink dans le fichier de configuration "
else
   GetPassword ${DBLINK_CIBLE_ALIAS} ORCL ${DBLINK_CIBLE_SCHEMA}
   PASSWORD_ORACLE_DBLINK_CIBLE=`echo ${COMPTEPSWD}`
fi
}

#F change_password_admin : Changement des mots de passe PSFT pour les comptes ADMIN
# ================================================================================
change_password_admin() {
${DEBUGFCT}
LogToFile I " Changement des mots de passe des comptes d'administration PeopleSoft"
if [ "$TYPE" = "HRMS" ]; then
   CheckPassword ${NAME_ENV} PSFT PS
   if [ $? -eq 0 ]; then
	LogToFile I " Traitement du compte PS"
	${HARPSHELL}/ps_passwd.ksh -e ${NAME_ENV} -o PS  > /dev/null
	rc=`echo $?`
	if [ $rc -ne 0 ]; then
		sortie_erreur $rc 
	else
		LogToFile S " Le mot de passe du compte PS a ete modifie"
	fi
    else
	LogToFile W " Compte PS non modifie car pas de mot de passe enregistre pour ce compte"
	fi
else
   CheckPassword ${NAME_ENV} PSFT VP1
   if [ $? -eq 0 ]; then
	LogToFile I " Traitement du compte VP1"
	${HARPSHELL}/ps_passwd.ksh -e ${NAME_ENV} -o VP1  > /dev/null
	rc=`echo $?`
	if [ $rc -ne 0 ]; then
		sortie_erreur $rc
	else
		LogToFile S " Le mot de passe du compte VP1 a ete modifie"
	fi
   else
	LogToFile W " Compte VP1 non modifie car pas de mot de passe enregistre pour ce compte"
   fi
fi
CheckPassword ${NAME_ENV} PSFT FT_EXPLOIT
if [ $? -eq 0 ]; then
   LogToFile I " Changement du password FT_EXPLOIT de PeopleSoft"
   ${HARPSHELL}/ps_passwd.ksh -e ${NAME_ENV} -o FT_EXPLOIT  > /dev/null
   rc=`echo $?`
   if [ $rc -ne 0 ]; then
	sortie_erreur $rc
   else
	LogToFile S " Le mot de passe du compte FT_EXPLOIT a ete modifie"
   fi
else
  LogToFile W " Compte FT_EXPLOIT non modifie car pas de mot de passe enregistre pour ce compte"
fi
}

#F Create_orausers : Creation des users Oracle de ORAUSERS (FTPACKRH, FTQUERY, MEP, ...)
# =====================================================================================
Create_orausers() {
${DEBUGFCT}
if [ ! -z $ORAUSERS  ]; then
        LogToFile I " schema(s) Oracle a creer pour cet environnement : ${ORAUSERS} "
        for u in `echo ${ORAUSERS} | sed "s|-| |g" `
        do
	 CheckPassword ${NAME_ENV} ORCL $u
	 if [ $? -eq 0 ]; then
		LogToFile I " Creation du compte $u"
                username=$(echo $u| tr "[A-Z]" "[a-z]")
                USERSCRIPTNAME=`echo "create_user_${username}.ksh"`
		if [ -e ${HARPSHELL}/${USERSCRIPTNAME} ]; then
			${HARPSHELL}/${USERSCRIPTNAME} -e ${NAME_ENV}
		else
			LogToFile I " le script ${HARPSHELL}/${USERSCRIPTNAME} n'existe pas"
		fi
	else
		LogToFile I " Compte $u non cree car pas de mot de passe enregistre pour ce compte"
		sortie_erreur 113 " Merci de renseigner le mot de passe du compte Oracle $u"
	fi
       done
else
	LogToFile I " Pas de schema Oracle supplementaire a creer pour cet environnement "
fi
}

#F init_password : Modification du mot de passe du schema PSFT
# ===========================================================
init_password() { 
${DEBUGFCT}
LogToFile I " Mise a jour mot du passe du schema peoplesoft (${SCHEMA_CIBLE})"
sqlplus -s '/ as sysdba' <<EOF
set head off
SET feedback off
SET showmode off
SET VERIFY off
alter user ${SCHEMA_CIBLE} identified by "${PASSWORD_ORACLE}";
exit
EOF
}

#F Desactive_mode_restreint : Desactivation mode restreint
# ===========================================================
Desactive_mode_restreint() {
${DEBUGFCT}
LogToFile I " Desactivation du mode restreint "
if [ -e ${HARPSHELL}/acces_restreint.ksh ]; then
        ${HARPSHELL}/acces_restreint.ksh -e ${NAME_ENV} -d >> ${LOG}
        if [ $? -eq 0 ]; then
           LogToFile I " Desactivation du mode restreint OK"
        else
           LogToFile W " Desactivation du mode restreint KO"
        fi
else
        LogToFile I " le script ${HARPSHELL}/acces_restreint.ksh n'existe pas"
fi
}

#F verif_pre_requis :  Verification des pre-requis
# ===========================================================
verif_pre_requis() {
${DEBUGFCT}
LogToFile I " Verification des pre-requis"
GetConfParam ${NAME_ENV} ORCL DBALIAS ${HOST}
GetConfParam ${NAME_ENV} ORCL ORACLE_SID ${HOST}
GetConfParam ${NAME_ENV} ORCL SCHEMA_CIBLE ${HOST}
GetConfParam ${NAME_ENV} PSFT USER_START_PEOPLESOFT ${HOST}
GetConfParam ${NAME_ENV} PSFT USER_AE_DMS ${HOST}
GetConfParam ${NAME_ENV} PSFT NAME_WEB
GetConfParam ${NAME_ENV} ORCL DBLINK_CIBLE_SCHEMA ${HOST}
GetConfParam ${NAME_ENV} ORCL DBLINK_CIBLE_ALIAS ${HOST}
GetConfParam ${NAME_ENV} PSFT PRCSUX1 
GetConfParam ${NAME_ENV} PSFT PRCSNT 
GetConfParam ${NAME_ENV} PSFT MAXAPIAWARE_UNIX ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXAPIAWARE_NT ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXCOBOLUNIX ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXAEUNIX ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXCOBOLNT ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXAENT ${HOST}
GetConfParam ${NAME_ENV} PSFT REPORTPATH
GetConfParam ${NAME_ENV} PSFT GESTION_REPORT ${HOST}
GetConfParam ${NAME_ENV} PSFT CREAT_REP_INTERFACE ${HOST}
GetConfParam ${NAME_ENV} PSFT IBPSWD
GetConfParam ${NAME_ENV} PSFT OWNERUNX
GetConfParam ${NAME_ENV} PSFT OWNERWSUNX
GetConfParam ${NAME_ENV} PSFT PIAURL 
GetConfParam ${NAME_ENV} PSFT DISTNODEURL 
GetConfParam ${NAME_ENV} PSFT HARPPSRELEASE 
GetConfParam ${NAME_ENV} PSFT HARPPTRELEASE 
GetOptionalConfParam ${NAME_ENV} PSFT MENUCOLOR
GetOptionalConfParam ${NAME_ENV} PSFT GOROCO
GetOptionalConfParam ${NAME_ENV} PSFT CLEANHARPFILES
GetOptionalConfParam ${NAME_ENV} PSFT PAGELETACCUEIL
GetOptionalConfParam ${NAME_ENV} ORCL ENDSQL
GetPassword ${NAME_ENV} ORCL ${SCHEMA_CIBLE}
GetPassword ${NAME_ENV} PSFT ${USER_START_PEOPLESOFT}
GetPassword ${NAME_ENV} PSFT ${USER_AE_DMS}
GetPassword COMMUN PSFT PTWEBSERVER
GetConfOracle ${ORACLE_SID} ORCL ORAUSERS
if [ "$DBLINK_CIBLE_SCHEMA" != "" -a "$DBLINK_CIBLE_ALIAS" != "" ]; then
   GetPassword ${DBLINK_CIBLE_ALIAS} ORCL ${DBLINK_CIBLE_SCHEMA}
fi
LogToFile S " Verification des pre-requis OK"
}

# Environnement
# ==================
if [ "${HARPSHELL}" = "" ]; then
   sortie_erreur 109 "La variables HARPSHELL n'existe pas. Arret de l'execution"
fi

if [ ! -d ${HARPSHELL} ] ; then
   sortie_erreur 250 " Le repertoire HARPSHELL ${HARPSHELL} n'existe pas. Arret de l'execution."
fi

if [ ! -f ${HARPSHELL}/SetEnvHarpAdm.ksh ] ; then
   sortie_erreur 251 " Le fichier ${HARPSHELL}/SetEnvHarpAdm.ksh  n'existe pas. Arret de l'execution."
fi
. ${HARPSHELL}/SetEnvHarpAdm.ksh

# Variables Locales requises
# ==========================
SCRIPT=`basename $0 | tr -s . " " | awk '{print $1}'`          # Nom du script
LOG="${HARPLOG}/${Date01}_${2}_${SCRIPT}.$$.log"               # Fichier log
MSG="SCRIPT DE RAFRAICHISSEMENT ENVIRONNEMENT PSFT " # Message sur le role du script

# Variables Locales specifiques
# =====================
BASEDIRE=`dirname $0`
DMS="${BASEDIRE}/../dms"
DAT="${BASEDIRE}/../dat"

#@
#@ ACTIONS : 
#@ Ouverture du log et purge des anciens logs de ce script
# ==========================================================
OpenLogFile ${SCRIPT} "${MSG}"
LogToFile I " Ligne de commande : $0 $* "

#@ Verification des arguments
# ==========================================================
MODEFORCE=false
while getopts :e:E:t:T:fvhFV Option ; do
  case ${Option} in
    h) usage I
       sortie_erreur 0 ;;
    :) usage E
       sortie_erreur 103 " l'option -${OPTARG} a besoin d'un argument " ;;
    \?) usage E
        sortie_erreur 104 E " l'option -${OPTARG} est invalide " ;;
    e|E) NAME_ENV=${OPTARG}
       LOGSFX=${NAME_ENV};;
    v|V) VERIF=true;;
    f|F) MODEFORCE=true;;
    t|T) ;;
  esac
done

#@ Verification parametres : Le nom de l'environnement (option -e) et le type (option -t) sont obligatoires
# ==========================================================================================================
if [  -z "${NAME_ENV}" ]; then
   usage E
   sortie_erreur 101 " L'option -e environnement est obligatoire"
fi

#@  Positionnement des variables selon les version
# =====================================================================================================================================
SetVersion E ${NAME_ENV}

#@ Sinon, test TNSPING et recuperation des parametres depuis les fichiers de configuration .conf et .oraconf et le fichier de securite
# =====================================================================================================================================
GetConfParam ${NAME_ENV} ORCL DBALIAS ${HOST}
GetConfParam ${NAME_ENV} ORCL ORACLE_SID ${HOST}
export ORACLE_SID

#@ si mode verif (-v), verification des pre-requis seulement depuis les fichiers .conf et .oraconf + TNSPING
# ==========================================================================================================
if [ ! -z "${VERIF}" ]; then
   Verif_env ${ORACLE_SID}
   verif_pre_requis ${NAME_ENV}
   sortie_erreur 0
else
   Verif_env ${ORACLE_SID}
fi

GetConfParam ${NAME_ENV} ORCL SCHEMA_CIBLE ${HOST}
GetConfParam ${NAME_ENV} PSFT USER_AE_DMS ${HOST}
GetConfParam ${NAME_ENV} PSFT PIAURL 
GetConfParam ${NAME_ENV} PSFT DISTNODEURL 
GetConfParam ${NAME_ENV} PSFT DEFAULTPROTOCOL 
GetConfParam ${NAME_ENV} PSFT PORTHTTP 
GetConfParam ${NAME_ENV} PSFT NAME_WEB
GetConfParam ${NAME_ENV} PSFT GESTION_REPORT ${HOST}
GetConfParam ${NAME_ENV} PSFT USER_START_PEOPLESOFT ${HOST}
GetConfParam ${NAME_ENV} PSFT ACTIV_REVERSE_PROXY ${HOST}
GetConfParam ${NAME_ENV} PSFT PORTHTTP_GASSY 
GetConfParam ${NAME_ENV} PSFT ACTIV_GASSI 
GetConfParam ${NAME_ENV} PSFT CREAT_REP_INTERFACE ${HOST}
GetConfParam ${NAME_ENV} PSFT CONF_WEB_PROF 
GetConfParam ${NAME_ENV} ORCL DBLINK_CIBLE_SCHEMA ${HOST}
GetConfParam ${NAME_ENV} ORCL DBLINK_CIBLE_ALIAS ${HOST}
GetConfParam ${NAME_ENV} PSFT PRCSUX1
GetConfParam ${NAME_ENV} PSFT PRCSNT 
GetConfParam ${NAME_ENV} PSFT MAXAPIAWARE_UNIX ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXAPIAWARE_NT ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXCOBOLUNIX ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXAEUNIX ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXCOBOLNT ${HOST}
GetConfParam ${NAME_ENV} PSFT MAXAENT ${HOST}
GetConfParam ${NAME_ENV} PSFT REPORTPATH
GetConfParam ${NAME_ENV} PSFT GESTION_REPORT ${HOST}
GetConfParam ${NAME_ENV} PSFT IBPSWD
GetConfParam ${NAME_ENV} PSFT OWNERUNX
GetConfParam ${NAME_ENV} PSFT OWNERWSUNX
GetConfParam ${NAME_ENV} PSFT HARPPSRELEASE 
GetConfParam ${NAME_ENV} PSFT HARPPTRELEASE 
GetOptionalConfParam ${NAME_ENV} PSFT MENUCOLOR
GetOptionalConfParam ${NAME_ENV} PSFT GOROCO
GetOptionalConfParam ${NAME_ENV} PSFT CLEANHARPFILES
GetOptionalConfParam ${NAME_ENV} PSFT PAGELETACCUEIL
GetOptionalConfParam ${NAME_ENV} ORCL ENDSQL
GetConfOracle ${ORACLE_SID} ORCL ORAUSERS
GetConfParam ${NAME_ENV} PSFT MODULE
export TYPE=$MODULE

#@ Recuperation des donnes de securite cryptees
# ============================================================================
cryptage

#@ Verification si le refresh a ete deja lance : le nom dans table PSOPTIONS
#@ colonne SHORTNAME correspond au nom web
# ============================================================================
DEJAFAIT=`sqlplus -s ${SCHEMA_CIBLE}/${PASSWORD_ORACLE}@${DBALIAS}<<EOF
set pages 0
set head off
set feed off
select count(*) from PSOPTIONS where SHORTNAME=SUBSTR('$NAME_ENV',1,8);
exit
EOF `
DEJAFAIT=$(echo ${DEJAFAIT})
if [ "${DEJAFAIT}" = "1" ]; then
   if [ "${MODEFORCE}" = "false" ]; then
      LogToFile W " L'environnement a deja ete rafraichi. Seules les operations non destructrices vont etre executees"
      LogToFile W " Pour relance du refresh integral, utiliser l'option -f pour forcer et taper CTRL-C pour annuler avant 30 secondes"
   else
      LogToFile W " L'environnement a deja ete rafraichi mais option -f demandee pour forcer le refresh integral"
      LogToFile W " Taper CTRL-C pour annuler avant 30 secondes"
   fi
   sleep 30
else
   LogToFile W " L'environnement n'a pas encore ete rafraichi. Un refresh complet va etre lance dans 30 secondes"
   LogToFile W " taper CTRL-C pour annuler "
   sleep 30
fi

#@ Modification du mot de passe Oracle du schema PSFT
# ============================================================================
init_password

#@ Verification si reverse proxy a configurer
# ============================================================================
Gestion_url_rpg

#@ Selon le cas configuration ou desactivation reverse proxy via SQL*Plus (modification du Web Profile) 
# ======================================================================================================
if [ ${ACTIV_REVERSE_PROXY} = "N" ]; then
   Reverse_proxy_sql_off
else
   Reverse_proxy_sql_on${HARPPTRELEASE}
fi

#@ Verification si gestion GASSI en plus du RPG
# ============================================================================
Gestion_gassi

#@ Preparation du script dms de refresh depuis le fichier modele ${HARPDMS}/Refresh_Envt_${TYPE}.dms par substitution de variables
#@ le fichier modele peut etre lié a la version PeopleTools 
#@ Purge si demande (parametre GESTION_REPORT=N) les tables du report repository via datamover
# ============================================================================================================================
SUB_DMS_Refresh

#@ verification de l'existence et creation si necessaires des repertoires interfaces
#@ obsolete
# ===================================================================================
# Verif_Repertoire

#@ Mise a jour de la table ps.psdbowner via SQL*Plus
# ============================================================================
dbowner

#@ lancement  de datamover pour excuter le script de refresh
# ============================================================================
DMS_Refresh

#@ Apres execution, nettoyage des informations sensibles des fichiers DMS et logs avant verification des erreurs eventuelles
# ================================================================================================================================
revoke ${FILE_DMS}
revoke ${HARPLOG}/${LOG_DMS}
cat ${HARPLOG}/${LOG_DMS} >> $LOG
VERIF_DMS ${LOG_DMS}

#@ Mise a jour du style PSFT => Changement couleur menu
# ============================================================================
Update_style_PSFT

#@ lancement datamover de purge application messaging
# ============================================================================
DMS_appmsgpurgeall
cat ${HARPLOG}/${LOG_DMS} >> $LOG
VERIF_DMS ${LOG_DMS}

#@ Creation des dblinks
# ============================================================================
create_dblink

#@ Creation des dblinks DEV
# ============================================================================
create_dblink_dev

#@ Changement des mots de passe PSFT pour les comptes ADMIN: PS, FT_EXPLOIT, VP1
# ==============================================================================
change_password_admin

#@ Desactivation systematique du mode restreint
# ============================================================================
Desactive_mode_restreint 

#@ Gestion du pagelet
# ============================================================================
manage_pagelet_accueil

#@ Mise a jour de la date de refresh dans ps_maintenance_log
# ============================================================================
refreshdt

if [ ! "${DEJAFAIT}" = "1" -o "${MODEFORCE}" = "true" ]; then
   #@ purge du repertoire du report repository
   # ============================================================================
   Delete_Repository

   #@ Creation des comptes Oracle supplementaires si necessaire - ORAUSERS
   # ============================================================================
   Create_orausers
   
   #@ Mise a jour GOROCO - Uniquement si le parametre existe donc DV/IT
   #@ Utilise au demarrage des nouvelles lignes de dev/it
   # ============================================================================
   Update_GOROCO

   #@ Gestion repertoire HARP_FILES : QC 23000 et 30664
   #  ============================================================================
   clean_harpfiles GRD
   clean_harpfiles Interface
   clean_harpfiles majem

   #@ Execution du scripts sql de fin
   # ============================================================================
   run_endsql

   #@ Mise a jour de la date de refresh dans ps_maintenance_log
   # ============================================================================
   refreshdt
fi

#@ Sortie du  script
# ======================
sortie_erreur 0
