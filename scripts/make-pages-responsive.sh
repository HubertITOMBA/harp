#!/bin/bash

# Script pour rendre toutes les pages de liste responsive

# Fonction pour mettre à jour les pages
update_page() {
    local file="$1"
    if [ -f "$file" ]; then
        # Remplacer px-4 py-2 par px-2 sm:px-4 py-2
        sed -i 's/className="px-4 py-2"/className="px-2 sm:px-4 py-2"/g' "$file"
        sed -i "s/className='px-4 py-2'/className='px-2 sm:px-4 py-2'/g" "$file"
        
        # Remplacer container  par container mx-auto max-w-full
        sed -i 's/className="container "/className="container mx-auto max-w-full"/g' "$file"
        sed -i "s/className='container '/className='container mx-auto max-w-full'/g" "$file"
        
        # Remplacer text-3xl par text-xl sm:text-2xl lg:text-3xl pour les titres
        sed -i 's/className="text-3xl font-semibold"/className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4"/g' "$file"
        sed -i "s/className='text-3xl font-semibold'/className='text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4'/g" "$file"
        
        echo "✓ Updated: $file"
    fi
}

# Trouver toutes les pages de liste
find app/\(dashboard\)/list -name "page.tsx" -type f | while read file; do
    update_page "$file"
done

echo "✅ Toutes les pages ont été mises à jour pour être responsive"

