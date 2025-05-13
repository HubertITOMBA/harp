export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "TMA Harp";
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION ||"Portail TMA Harp built with next.js by Hubert ITOMBA";
export const SERVER_URL =  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";






export const envDefaultValues = {
  env: '',           
  url: '', 
  aliasql: '', 
  orarelease: '', 
  oraschema: '', 
//   appli: '', 
//   versionId : null, 
//   psversion: '', 
//   ptversion: '', 
//   harprelease: '', 
//   volum : '', 
//   datmaj: new Date(),
//   gassi: '', 
//   rpg : '', 
//   msg: '', 
//   descr: '', 
//   anonym: 'N', 
//   edi: 'N', 
//   instanceId: null,  
//   typenvid: null, 
//   statenvId: null, 
//   releaseId: null, 
 };


 export const instDefaultValues = {
  oracle_sid: '',      
  serverId: null, 
  descr: '',    
 };



 export const USER_ROLES = process.env.USER_ROLES
    ? process.env.USER_ROLES.split(', ')
    : [
        'ADMIN',
        'USER',
        'PSADMIN',
        'TMA_LOCAL',
        'TMA_OFFSHORE',
        'DADS',
        'DMOSTD',
        'DRP',
        'EFO',
        'FR_FT_UNIX',
        'FT_MOE',
        'HP_MUTUALISE',
        'METRO',
        'POC92',
        'PORTAL_ADMIN',
        'PORTAL_SECURITY',
        'PUM',
        'REF',
        'REFRESH_INFOS',
        'UPDSTATUS_DEV',
        'UPGRADE92',
     ];