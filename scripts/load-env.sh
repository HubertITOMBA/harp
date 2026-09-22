#!/bin/bash

# Script pour charger les variables d'environnement depuis .env
# Gère correctement les valeurs avec des espaces, guillemets, etc.

if [ ! -f .env ]; then
    echo "❌ Le fichier .env n'existe pas"
    exit 1
fi

echo "📋 Chargement des variables depuis .env..."

# Lire le fichier .env ligne par ligne
while IFS= read -r line || [ -n "$line" ]; do
    # Ignorer les lignes vides et les commentaires
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extraire la clé et la valeur
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Supprimer les espaces au début et à la fin de la clé
        key=$(echo "$key" | xargs)
        
        # Supprimer les guillemets au début et à la fin de la valeur si présents
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # Exporter la variable
        export "$key=$value"
        echo "  ✅ $key chargée"
    fi
done < .env

echo ""
echo "✅ Variables chargées avec succès !"
echo ""
echo "Vérification des variables importantes :"
for key in AUTH_URL NEXT_PUBLIC_SERVER_URL AUTH_SECRET AUTH_TRUST_HOST; do
    if [ -n "${!key:-}" ]; then
        echo "  ✅ $key définie"
    else
        echo "  ❌ $key NON DÉFINIE"
    fi
done
