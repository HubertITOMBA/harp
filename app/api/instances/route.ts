import { db } from "@/lib/db";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
          const instances = await prisma.harpinstance.findMany(
           {  
            select: {
                id: true,
                oracle_sid: true,
             },
            orderBy : {
                oracle_sid: 'asc',
            }
            }
        );
        return NextResponse.json(instances);
    } catch (error) {
        console.error("Erreur lors de la récupération des instances:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des instances" },
            { status: 500 }
        );
    }
}