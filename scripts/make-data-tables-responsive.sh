#!/bin/bash

# Script pour rendre tous les data-table.tsx responsive

# Fonction pour mettre à jour les data-tables
update_data_table() {
    local file="$1"
    if [ -f "$file" ]; then
        # Remplacer les flex items-center justify-between par flex flex-col sm:flex-row
        sed -i 's/flex items-center justify-between text-gray-500  font-semibold/flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-gray-500 font-semibold/g' "$file"
        sed -i 's/flex items-center justify-between text-gray-500 font-semibold/flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-gray-500 font-semibold/g' "$file"
        
        # Remplacer max-w-sm par max-w-sm w-full sm:w-auto pour les inputs
        sed -i 's/className="rounded-lg max-w-sm"/className="rounded-lg max-w-sm w-full sm:w-auto"/g' "$file"
        sed -i "s/className='rounded-lg max-w-sm'/className='rounded-lg max-w-sm w-full sm:w-auto'/g" "$file"
        
        # Ajouter overflow-x-auto autour des tables
        sed -i 's/<div className=" bg-white rounded-xl shadow-xl overflow-hidden">/<div className="bg-white rounded-xl shadow-xl overflow-hidden">\n      <div className="overflow-x-auto">/g' "$file"
        sed -i 's/<div className="bg-white rounded-xl shadow-xl overflow-hidden">/<div className="bg-white rounded-xl shadow-xl overflow-hidden">\n      <div className="overflow-x-auto">/g' "$file"
        
        # Fermer la div overflow-x-auto après </Table>
        sed -i 's|</Table>\n    </div>|</Table>\n      </div>\n    </div>|g' "$file"
        
        # Rendre la pagination responsive
        sed -i 's/flex items-center justify-between py-5/flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 py-3 sm:py-5 px-2 sm:px-4/g' "$file"
        sed -i 's/space-x-6 lg:space-x-8/space-x-2 sm:space-x-4 lg:space-x-8 flex-wrap justify-center sm:justify-start/g' "$file"
        
        echo "✓ Updated: $file"
    fi
}

# Trouver tous les data-table.tsx
find app/\(dashboard\)/list -name "data-table.tsx" -type f | while read file; do
    update_data_table "$file"
done

echo "✅ Tous les data-tables ont été mis à jour pour être responsive"

