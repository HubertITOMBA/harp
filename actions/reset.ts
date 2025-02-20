"use server"

import * as z from "zod";

import { ResetSchema } from "@/schemas";
import { getUserByEmail, getUserByNetId } from "@/data/user";

export const reset = async ( values: z.infer<typeof ResetSchema>) => {
    const validatedFields = ResetSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Email invalide"};
    }

    const { email } = validatedFields.data;

    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
        return { error: "Email non trouvé !"}
    }

    return { success: "Lien de reinitialisation du mot de passe envoyé !"}

}

