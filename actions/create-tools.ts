"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateToolsSchema = z.object({
  tool: z.string().min(1, "Le nom de l'outil est requis").max(255),
  cmdpath: z.string().max(255).optional().or(z.literal("")).nullable(),
  cmd: z.string().max(255).optional().or(z.literal("")).nullable(),
  version: z.string().max(10).optional().or(z.literal("")).nullable(),
  descr: z.string().max(50).optional().or(z.literal("")).nullable(),
  tooltype: z.string().max(5).optional().or(z.literal("")).nullable(),
  cmdarg: z.string().max(255).optional().or(z.literal("")).nullable(),
  mode: z.string().max(10).optional().or(z.literal("")).nullable(),
  output: z.string().length(1, "L'output doit faire 1 caractère").optional().or(z.literal("")).nullable(),
});

export async function createTools(formData: FormData) {
  try {
    const rawData = {
      tool: formData.get("tool") as string,
      cmdpath: formData.get("cmdpath") as string || "",
      cmd: formData.get("cmd") as string || "",
      version: formData.get("version") as string || "",
      descr: formData.get("descr") as string || "",
      tooltype: formData.get("tooltype") as string || "",
      cmdarg: formData.get("cmdarg") as string || "",
      mode: formData.get("mode") as string || "",
      output: formData.get("output") as string || "",
    };

    const validatedData = CreateToolsSchema.parse(rawData);

    // Vérifier si l'outil existe déjà
    const existingTool = await db.harptools.findFirst({
      where: { tool: validatedData.tool },
    });

    if (existingTool) {
      return { success: false, error: "Un outil avec ce nom existe déjà" };
    }

    const newTool = await db.harptools.create({
      data: {
        tool: validatedData.tool,
        cmdpath: validatedData.cmdpath && validatedData.cmdpath.trim() !== "" ? validatedData.cmdpath : null,
        cmd: validatedData.cmd && validatedData.cmd.trim() !== "" ? validatedData.cmd : null,
        version: validatedData.version && validatedData.version.trim() !== "" ? validatedData.version : null,
        descr: validatedData.descr && validatedData.descr.trim() !== "" ? validatedData.descr : null,
        tooltype: validatedData.tooltype && validatedData.tooltype.trim() !== "" ? validatedData.tooltype : null,
        cmdarg: validatedData.cmdarg && validatedData.cmdarg.trim() !== "" ? validatedData.cmdarg : null,
        mode: validatedData.mode && validatedData.mode.trim() !== "" ? validatedData.mode : null,
        output: validatedData.output && validatedData.output.trim() !== "" ? validatedData.output : null,
      },
    });

    return { 
      success: true, 
      message: `L'outil ${validatedData.tool} a été créé avec succès`,
      tool: newTool.tool
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Construire un message d'erreur plus détaillé
      const errorMessages = error.errors.map(err => {
        const field = err.path.join('.');
        return `${field}: ${err.message}`;
      });
      
      return { 
        success: false, 
        error: errorMessages.length > 0 
          ? `Erreurs de validation : ${errorMessages.join(', ')}`
          : "Erreur de validation des données"
      };
    }
    console.error("Erreur lors de la création de l'outil:", error);
    return { 
      success: false, 
      error: "Une erreur inattendue s'est produite lors de la création de l'outil. Veuillez réessayer." 
    };
  } finally {
    revalidatePath("/list/tools");
  }
}

