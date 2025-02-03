import * as z from "zod";
// import { UserRole } from "@prisma/client";


export const LoginSchema = z.object({
   email: z.string().email({message: "L'adresse email n'est pas obligatoire ici !"}),
   password: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
   name: z.string().min(3, {message: "Le nom LOGIN n'est pas obligatoire ici !"}),
});


export const RegisterSchema = z.object({
    email: z.string().email({message: "L'adresse email n'est pas obligatoire ici !"}),
    password: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    name: z.string().min(3, {message: "Le netID est obligatoire ici !"}),
    netid: z.string().min(6, {message: "Le netID est obligatoire ici !"}),
 });

export const EnvSchema = z.object({
    display: z.number().min(1, {message: "L'ordre est obligatoire"}), 
    env : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    site: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    typenv: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    url: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    oracle_sid : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    aliasql: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    oraschema: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    appli: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    psversion: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    ptversion: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    harprelease: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    volum: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    datmaj: z.date(),        
    gassi: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    rpg: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    msg: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    descr: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    anonym: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    edi: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"})
});

export const UserSchema = z.object({
    display: z.number().min(1, {message: "L'ordre est obligatoire"}), 
    env : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    site: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    typenv: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    url: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    oracle_sid : z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    aliasql: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    oraschema: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    appli: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    psversion: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    ptversion: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    harprelease: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    volum: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    datmaj: z.date(),        
    gassi: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    rpg: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    msg: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    descr: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    anonym: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"}),
    edi: z.string().min(6, {message: "Le mot de passe doit contenir au moins 6 caractères"})
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

 