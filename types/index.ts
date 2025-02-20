import { z } from "zod";
import { insertHarpRoles, insertHarpMenus } from "@/lib/validators";
import { UserSchema } from "@/schemas";



export type HarpRole = z.infer<typeof insertHarpRoles> & {id: number;};
export type HarpMenu = z.infer<typeof insertHarpMenus> & {id: number}; 


export type User =  z.infer<typeof UserSchema>;