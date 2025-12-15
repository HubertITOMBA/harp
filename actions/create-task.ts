"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  descr: z.string().optional(),
  date: z.date().optional().nullable(),
  estimatedDuration: z.number().optional().nullable(),
});

export async function createTask(data: z.infer<typeof createTaskSchema>) {
  try {
    const validatedData = createTaskSchema.parse(data);

    const task = await db.harptask.create({
      data: {
        title: validatedData.title,
        descr: validatedData.descr || null,
        status: "EN_ATTENTE",
        date: validatedData.date || null,
        estimatedDuration: validatedData.estimatedDuration || null,
        effectiveDuration: null, // Sera calculé automatiquement quand des items seront ajoutés
      },
    });

    revalidatePath("/list/tasks");
    return { success: true, data: task };
  } catch (error) {
    console.error("Erreur lors de la création de la chrono-tâche:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Erreur lors de la création de la chrono-tâche" };
  }
}
