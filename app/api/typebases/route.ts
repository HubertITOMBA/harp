import { db } from "@/lib/db";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
         const servers = await prisma.harptypebase.findMany(
           {  
            select: {
                id: true,
                type_base: true,
             },
            orderBy : {
                type_base: 'asc',
            }
            }
        );
        return NextResponse.json(servers);
    } catch (error) {
        console.error("Erreur lors de la récupération des types de bases:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des types de bases" },
            { status: 500 }
        );
    }
}