"use server"

import { NewPasswordSchema } from "@/schemas";
import * as z from "zod";
import { getUserByEmail, getUserByNetId } from "@/data/user";
//import { getPasswordResetTokenByToken, getUserByNetId } from "."
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"


export const newPassword = async( values: z.infer<typeof NewPasswordSchema> ) => {

    const validatedFields = NewPasswordSchema.safeParse(values);

    if(!validatedFields.success) {
        return { error: "Champs non valides !" }
    }

    const { password } = validatedFields.data
    
    const existingUser = await getUserByNetId(values.netid)

    if(!existingUser) {
        return { error: "Le netid n'existe pas !" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.user.update({
        where: { id: existingUser.id },
        data: {
            password: hashedPassword
        }
    })

    
    return { success: "Votre Mot de passe est mis à jour "}

}