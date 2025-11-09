"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateToolsSchema = z.object({
  cmdpath: z.string().max(255).optional().or(z.literal("")),
  cmd: z.string().min(1, "La commande est requise").max(255),
  version: z.string().max(10).optional().or(z.literal("")),
  descr: z.string().min(1, "La description est requise").max(50),
  tooltype: z.string().length(5, "Le type d'outil doit faire 5 caractères"),
  cmdarg: z.string().max(255).optional().or(z.literal("")),
  mode: z.string().max(10).optional().or(z.literal("")),
  output: z.string().length(1, "L'output doit faire 1 caractère").optional().or(z.literal("")),
});

export async function updateTools(tool: string, formData: FormData) {
  try {
    const rawData = {
      cmdpath: formData.get("cmdpath") as string || "",
      cmd: formData.get("cmd") as string,
      version: formData.get("version") as string || "",
      descr: formData.get("descr") as string,
      tooltype: formData.get("tooltype") as string,
      cmdarg: formData.get("cmdarg") as string || "",
      mode: formData.get("mode") as string || "",
      output: formData.get("output") as string || "",
    };

    const validatedData = UpdateToolsSchema.parse(rawData);

    const existingTool = await db.harptools.findFirst({
      where: { tool },
    });

    if (!existingTool) {
      return { success: false, error: "Outil non trouvé" };
    }

    await db.harptools.update({
      where: { id: existingTool.id },
      data: {
        cmdpath: validatedData.cmdpath || "",
        cmd: validatedData.cmd,
        version: validatedData.version || "",
        descr: validatedData.descr,
        tooltype: validatedData.tooltype,
        cmdarg: validatedData.cmdarg || "",
        mode: validatedData.mode || "",
        output: validatedData.output || "",
      },
    });

    return { 
      success: true, 
      message: `L'outil ${tool} a été mis à jour avec succès` 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour de l'outil:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour de l'outil" 
    };
  } finally {
    revalidatePath("/list/tools");
  }
}

