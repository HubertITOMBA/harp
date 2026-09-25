"use server"

import  prisma  from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
//import { convertToPlainObject, formatError } from "../utils";
import { revalidatePath } from 'next/cache';
import { InstSchema, updateInstance } from "@/schemas";
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { formatError } from "../utils";
import { requirePortalAdmin } from "@/lib/require-portal-admin";


// Create Env
export async function createInst(data: z.infer<typeof InstSchema>) {
    const admin = await requirePortalAdmin();
    if (!admin.ok) {
      return { success: false, message: admin.error };
    }

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
    const admin = await requirePortalAdmin();
    if (!admin.ok) {
      return { success: false, message: admin.error };
    }

    try {
      const inst = updateInstance.parse(data);
      const instExists = await prisma.harpinstance.findFirst({
        where: { id: inst.id },
      });
  
      if (!instExists) throw new Error('Instance non trouvée !');

      const { id, ...updateData } = inst;
      await prisma.harpinstance.update({
        where: { id },
        data: updateData,
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
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return { success: false, message: admin.error };
  }

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
