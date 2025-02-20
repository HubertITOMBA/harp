import { z } from "zod";



// Fonction pour générer un slug à partir d'un texte
export function generateSlug(text: string): string {
  return text
    .toLowerCase() // Convertir en minuscules
    .normalize('NFD') // Normaliser les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, '') // Supprimer les tirets au début et à la fin
    .trim(); // Supprimer les espaces inutiles
}



// Schema insertion nouveau role
export const insertHarpRoles = z.object({
    role: z.string().min(3, "Le rôle doit avoir au moins 3 caractères"), 
    // slug: z.string().min(3, 'Le slug doit comporter au moins 3 caractères'),        
    slug: z.string().min(3, 'Le slug doit comporter au moins 3 caractères')
          .optional() // Rendre le slug optionnel car il sera généré automatiquement
          .transform((val, ctx) => {
            // Si aucun slug n'est fourni, on le génère à partir du rôle
            if (!val) {
              const role = ctx.parent.role;
              return generateSlug(role);
            }
            return val;
          }),
    descr: z.string().min(3, "La description doit avoir un minimum de 3 caractères"),
});


// Schema insertion Menus
export const insertHarpMenus = z.object({
  display: z.number().int().nonnegative('Le display doit être un nombre positif'),
  level:   z.number().int().nonnegative('Le niveau doit soit 1, 2 ou 3'),
  menu:    z.string().min(3, 'Le menu doit comporter au moins 3 caractères'),
  href:    z.string().min(3, 'Le lien doit avoir au mois 1 caractère par exemple "/"'),
  descr:   z.string().min(3, 'La description doit avoir un minimum de 3 caractères'),
  icone:   z.string().min(1, 'Le menu doit comporter au moins une icôme'),
  active:  z.number().int().nonnegative('La valeur doit être soit 0 soit 1'),
  roles:   z.array(z.string()).min(1, 'Le produit doit avoir au moins une rôle'),
});  