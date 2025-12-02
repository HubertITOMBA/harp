import * as z from "zod";
// import { UserRole } from "@prisma/client";


export const LoginSchema = z.object({
   netid: z.string().min(3, {message: "Le netid doit contenir au moins 6 caractères !"}),
   // email: z.string().email({message: "L'adresse email n'est pas obligatoire ici !"}),
   password: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
  
});

export const RegisterSchema = z.object({
    netid: z.string().min(6, {message: "Le netID est obligatoire ici !"}),
    email: z.string().email({message: "L'adresse email n'est pas obligatoire ici !"}),
    password: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
   // name: z.string().min(3, {message: "Le netID est obligatoire ici !"}),
  });


  export const NewPasswordSchema = z.object({
    // netid: z.string().min(3, {message: "Le netid doit contenir au moins 6 caractères !"}),
    // email: z.string().email({message: "L'adresse email est obligatoire !"}),
     password: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
   }); 

  export const ResetSchema = z.object({
   // netid: z.string().min(3, {message: "Le netid doit contenir au moins 6 caractères !"}),
    email: z.string().email({message: "L'adresse email est obligatoire !"}),
   // password: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
   
 });  

export const EnvSchema = z.object({
    instanceId : z.number().int().nonnegative("L'environnement doit avoir une instance"),
    env : z.string().min(6, {message: "L'environnement doit contenir au moins 6 caractères"}),
   //url: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    aliasql: z.string().min(6, {message: "L'alias' doit contenir au moins 6 caractères"}),
    oraschema: z.string().min(6, {message: "Le schema doit contenir au moins 6 caractères"}),
    orarelease: z.string().min(6, {message: "La version oracle doit contenir au moins 10 caractères"}),
    psversionId : z.number().int().nonnegative("L'environnement doit avoir une version de PeopleSoft"),
    ptversionId : z.number().int().nonnegative("L'environnement doit avoir une version de Peopletools"),
    releaseId : z.number().int().nonnegative("L'environnement doit avoir une release"),
    
     appli: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    // psversion: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    // ptversion: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    // harprelease: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    volum: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    datmaj: z.date(),        
    gassi: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    rpg: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    msg: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    descr: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    anonym: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    edi: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"})

    // oracle_sid : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    // site: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    // typenv: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
});

 
  export const insertEnvSchema = z.object({
    instanceId : z.number().int().nonnegative("L'environnement doit avoir une instance"),
      env : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    //  url: z.string().min(1, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
      aliasql: z.string().min(6, {message: "L'alias' doit contenir au moins ZZZZZ"}),
      orarelease: z.string().min(6, {message: "La version oracle doit contenir au moins 10 caractères"}),
      oraschema: z.string().min(6, {message: "Le schema doit contenir au moins 8 caractères"}),
      psversionId : z.number().int().nonnegative("L'environnement doit avoir une version de PeopleSoft"),
      ptversionId : z.number().int().nonnegative("L'environnement doit avoir une version de Peopletools"),
      releaseId : z.number().int().nonnegative("L'environnement doit avoir une release"),
    //   appli: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    //   versionId: z.number().int().nonnegative("L'application doit avoir une version"),
    //   psversion: z.string().min(6, {message: "La version de peopleSoft est requise"}), 
    //   ptversion: z.string().min(6, {message: "La version de peopleTools est requise"}), 
    //   harprelease: z.string().min(6, {message: "La realease est requise"}), 
    //   volum: z.string().min(6, {message: "volum mot de passe doit contenir au moins 6 caractères"}),
    //   datmaj: z.date(),
    //   gassi: z.string().min(6, {message: "GASSI de passe doit contenir au moins 6 caractères"}),
    //   rpg: z.string().min(6, {message: "RPG de passe doit contenir au moins 6 caractères"}),
    //   msg : z.string().min(6, {message: "MSG de passe doit contenir au moins 6 caractères"}),
    //   descr: z.string().min(6, {message: "DESCR mot de passe doit contenir au moins 6 caractères"}),
    //   anonym: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    //   edi: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    
    //   typenvid : z.number().int().nonnegative("L'application doit avoir un TYPE"),
    //   statenvId: z.number().int().nonnegative("L'application doit avoir un STATUT"),      
    //   releaseId: z.number().int().nonnegative("L'application doit avoir une RELEASE"),
     });

  // Schema for updating envsharp
  export const updateEnvSchema = insertEnvSchema.extend({
    id: z.number().min(1, "L'identifiant de l'environnemt est obligatoire"),
  });


  export const InstSchema = z.object({
    oracle_sid: z.string()
    .min(8, "Le nom de l'instance doit contenir au moins 8 caractères")
    .max(8, "Le nom de l'instance doit pas depasser  8 caractères"),
    serverId: z.number().min(1, "L'identifiant du serveur pour cet instance est obligatoire"),
    typebaseId: z.number().min(1, "Le type de baes doit être renseigné"),
    descr: z.string()
    .min(6, {message: "Ajouter une description doit contenir au moins 6 caractères"})
    .max(50, "La description ne doit pas dépasser 50 caractères"),
  });


  export const insertInstSchema = z.object({
    oracle_sid: z.string().min(8, "Le nom de l'instance est obligatoire et doit contenir au moins 8 caractères"),
    serverId: z.number().min(1, "Le serveur pour cette instance est obligatoire"),
    typebaseId: z.number().min(1, "Le type de baes doit être renseigné"),
    descr: z.string().min(6, {message: "Ajouter une description doit contenir au moins 6 caractères"}),
  });

   // Schema for updating harpinstance
   export const updateInstance = insertInstSchema.extend({
    id: z.number().min(1, "L'identifiant de l'instance est obligatoire"),
  });




export const UserSchema = z.object({
    netid: z.string().min(6, {message: "Le netID est obligatoire ici !"}),
    email: z.string().email({message: "L'adresse email n'est pas obligatoire ici !"}),
    password: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    name: z.string().min(3, {message: "Le netID est obligatoire ici !"}),
    role: z.string().min(3, {message: "Le role par defaut est obligatoire ici !"}),

    image: z.string().min(6, {message: "Le netID est obligatoire ici !"}),
    unxid: z.string().min(6, {message: "Le netID est obligatoire ici !"}),
    oprid: z.string().min(6, {message: "Le netID est obligatoire ici !"}),
    nom: z.string().min(6, {message: "Le netID est obligatoire ici !"}), 
    prenom: z.string().min(6, {message: "Le netID est obligatoire ici !"}),
    pkeyfile: z.string().min(6, {message: "Le netID est obligatoire ici !"}),

});

// Schéma pour la mise à jour du profil utilisateur
export const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100).optional(),
  pkeyfile: z.string().max(255, "Le chemin de la clé SSH ne doit pas dépasser 255 caractères").optional().or(z.literal("")),
  email: z.string().email().optional(), // Champ en lecture seule, mais nécessaire pour le formulaire
});


//   display      Int            
//   level        Int            
//   menu         String        
//   href         String?        
//   descr        String?        
//   icone        String?       
//   active       Int          

export const MenuSchema = z.object({
    netid: z.string().min(6, {message: "Le netID est obligatoire ici !"}),
    email: z.string().email({message: "L'adresse email n'est pas obligatoire ici !"}),
    password: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    name: z.string().min(3, {message: "Le netID est obligatoire ici !"}),
});




export const HarpserSchema = z.object({
    srv    : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    ip     : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    pshome : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    os     : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    psuser : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    domain : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    env    : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    typsrv : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    status : z.number().min(6, {message: "Le Le statut est en erreur"}),
})

 