import { db } from "@/lib/db";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
         const versionpsofts = await prisma.psoftversion.findMany(
           {  
            select: {
                id: true,
                psversion: true,
                ptversion: true, 
             },
            orderBy : {
                id: 'desc',
            }
            }
        );
        return NextResponse.json(versionpsofts);
    } catch (error) {
        console.error("Erreur lors de la récupération des versions PeopleSoft:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des versions PeopleSoft" },
            { status: 500 }
        );
    }
}