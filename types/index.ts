import { EnvSchema, insertEnvSchema, insertInstSchema } from './../schemas/index';
import { z } from "zod";
import { insertHarpRoles, insertHarpMenus } from "@/lib/validators";
import { UserSchema } from "@/schemas";



export type HarpRole = z.infer<typeof insertHarpRoles> & {id: number;};
export type HarpMenu = z.infer<typeof insertHarpMenus> & {id: number}; 
export type EnvHarp = z.infer<typeof insertEnvSchema> & {id: number}; 
export type InstHarp = z.infer<typeof insertInstSchema> & {id: number}; 


export type User =  z.infer<typeof UserSchema>;

// export interface HarpEnv extends HarpEnvFormData {
//     id: number
//   } 


export interface HarpEnvModalProps {
    isOpen: boolean
    onClose: () => void
    // onSubmit: (data: HarpEnvFormData) => void
   // harpEnvToEdit?: HarpEnv
  }