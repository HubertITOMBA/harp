import { db } from "@/lib/db";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const versionptools = await prisma.ptoolsversion.findMany({
            select: {
                ptversion: true
            },
            orderBy: {
                id: 'desc'  // Pour obtenir la version la plus récente
            }
        });
        
        return NextResponse.json(versionptools);
    } catch (error) {
        console.error("Erreur lors de la récupération de la version des PeopleTools:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération de la version des PeopleTools" },
            { status: 500 }
        );
    }
}