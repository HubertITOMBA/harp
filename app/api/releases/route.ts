import { db } from "@/lib/db";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
         const releases = await prisma.releaseenv.findMany(
           {  
            select: {
                id: true,
                harprelease: true,
             },
            orderBy : {
                id: 'desc',
            }
            }
        );
        return NextResponse.json(releases);
    } catch (error) {
        console.error("Erreur lors de la récupération des releases:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des releases" },
            { status: 500 }
        );
    }
}