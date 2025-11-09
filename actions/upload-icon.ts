"use server"

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from "next/cache";

export async function uploadIcon(formData: FormData) {
  try {
    const file = formData.get("icon") as File;
    
    if (!file) {
      return { success: false, error: "Aucun fichier fourni" };
    }

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      return { success: false, error: "Le fichier doit être une image" };
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "L'image ne doit pas dépasser 2MB" };
    }

    // Créer le répertoire s'il n'existe pas
    const uploadDir = join(process.cwd(), 'public', 'icones');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Le répertoire existe déjà, c'est OK
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${originalName}`;
    const filePath = join(uploadDir, fileName);

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retourner le nom du fichier (sans le chemin public)
    return { 
      success: true, 
      fileName: fileName,
      message: "Image uploadée avec succès"
    };
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image:", error);
    return { 
      success: false, 
      error: "Erreur lors de l'upload de l'image" 
    };
  }
}

