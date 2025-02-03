"use server";

import * as z from "zod";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"



export const register = async (values: z.infer<typeof RegisterSchema>) => {
    // console.log(values);
    const validatedFields = RegisterSchema.safeParse(values);
    
    if (!validatedFields.success) {
      return { error: "Informations de connexion invalides !"}
  }
    

    const { netid, email, password, name} = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    // const existingUser = await getUserByNetId(netid);
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return { error: " Le mail est déjà utilisé !"}
    }

    await db.user.create({
      data: {
          name, 
          email,
          password: hashedPassword,
          netid,
      }
     });
      


   
   return { success: "Compte créé avec succès !"}

   
};
