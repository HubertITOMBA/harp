"use server"

import { signOut } from "@/auth";
import { redirect } from "next/navigation";

export const logOut = async () => {
    // votre code ici avant la deconnexion
    await signOut();
    redirect("/");
};