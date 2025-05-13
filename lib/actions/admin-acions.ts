"use server"

import { auth } from '@/auth';
import prisma  from '@/lib/prisma';



// Get sales data and order summary
export async function getAdminSummary(){
    // Get counts for each resource
    const envsCount = await prisma.envsharp.count();
    const serverCount = await prisma.psadm_srv.count();
    const usersCount = await prisma.user.count();
  
 


    return {
        envsCount ,
        serverCount,
        usersCount,
    }


 }