import { db } from "@/lib/db";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
         const servers = await prisma.harpserve.findMany(
           {  
            select: {
                id: true,
                srv: true,
             },
            orderBy : {
                srv: 'asc',
            }
            }
        );
        return NextResponse.json(servers);
    } catch (error) {
        console.error("Erreur lors de la récupération des serveurs:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des serveurs" },
            { status: 500 }
        );
    }
}