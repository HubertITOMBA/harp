"use server"

import  prisma  from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
//import { convertToPlainObject, formatError } from "../utils";
import { revalidatePath } from 'next/cache';
import { EnvSchema, updateEnvironment } from "@/schemas";
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { formatError } from "../utils";


// Create Env
export async function createEnv(data: z.infer<typeof EnvSchema>) {
    try {
      const envs = EnvSchema.parse(data);
      await prisma.envsharp.create({ data: envs });
  
      revalidatePath('/list/envs');
  
      return {
        success: true,
        message: 'Environnement créé avec succès !',
      };
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  }
  
  // Update Env
  export async function updateEnv(data: z.infer<typeof updateEnvironment>) {
    try {
      const envs = updateEnvironment.parse(data);
      const envExists = await prisma.envsharp.findFirst({
        where: { id: parseInt(envs.id) },
      });
  
      if (!envExists) throw new Error('Environnement non trouvé !');
  
      await prisma.envsharp.update({
        where: { id: parseInt(envs.id) },
        data: envs,
      });
  
      revalidatePath('/list/envs');
  
      return {
        success: true,
        message: 'Environnement mis à jour avec succès',
      };
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  }


  // Delete ENV
export async function deleteEnvs(id: number) {
  try {
    const envExists = await prisma.envsharp.findFirst({
      where: { id  },
    });

    if (!envExists) throw new Error('Environnement non trouvé !');

    await prisma.envsharp.delete({ where: {id } });

    revalidatePath('/list/envs');

    return {
      success: true,
      message: 'Environnement supprimé avec succès !',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
