"use server"

import  prisma  from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
//import { convertToPlainObject, formatError } from "../utils";
import { revalidatePath } from 'next/cache';
import { InstSchema, updateInstance } from "@/schemas";
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { formatError } from "../utils";


// Create Env
export async function createInst(data: z.infer<typeof InstSchema>) {
    try {
      const inst = InstSchema.parse(data);
      await prisma.harpinstance.create({ data: inst });
  
      revalidatePath('/list/instora');
  
      return {
        success: true,
        message: 'Instance créée avec succès !',
      };
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  }
  
  // Update Env
  export async function updateInst(data: z.infer<typeof updateInstance>) {
    try {
      const inst = updateInstance.parse(data);
      const instExists = await prisma.harpinstance.findFirst({
        where: { id: inst.id },
      });
  
      if (!instExists) throw new Error('Instance non trouvée !');
  
      await prisma.envsharp.update({
        where: { id: inst.id  },
        data: inst,
      });
  
      revalidatePath('/list/instora');
  
      return {
        success: true,
        message: 'Instance mise à jour avec succès',
      };
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  }


  // Delete ENV
export async function deleteInst(id: number) {
  try {
    const instExists = await prisma.harpinstance.findFirst({
      where: { id  },
    });

    if (!instExists) throw new Error('Instance non trouvée !');

    await prisma.harpinstance.delete({ where: {id } });

    revalidatePath('/list/instora');

    return {
      success: true,
      message: 'Instance supprimée avec succès !',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
