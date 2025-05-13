'use server';

// import { shippingAddressSchema, signInFormSchema, signUpFormSchema, paymentMethodSchema, updateUserSchema } from "../validators";
// import { auth, signIn, signOut } from "@/auth";
// import { isRedirectError } from "next/dist/client/components/redirect-error";
import  prisma  from "@/lib/prisma";
import { z } from 'zod';
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { updateEnvironment } from "@/schemas";
import { formatError } from "@/lib/utils";


export async function getAllEnvs({
 // limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const queryFilter: Prisma.envsharpWhereInput =
    query && query !== 'all'
      ? {
          env: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  const data = await prisma.envsharp.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createddt: 'desc' },
    //take: limit,
    //skip: (page - 1) * limit,
  });

  const dataCount = await prisma.envsharp.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / 10),
  };
}

// Delete a user
export async function deleteEnvsharp(id: number) {
  try {
    await prisma.envsharp.delete({ where: { id } });

    revalidatePath('/list/envs');

    return {
      success: true,
      message: "L'environnement a été supprimé avec succès !",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
} 

// Update a user
export async function updateEnvsharp(env: z.infer<typeof updateEnvironment>) {
  try {
    await prisma.envsharp.update({
      where: { id: env.id },
      data: {
        env: env.env,
        //role: user.role,
      },
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
