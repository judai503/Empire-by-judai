#!/bin/bash

echo "Buscando imágenes de Ness de BlueLock..."

# Ness es de Blue Lock - caracterizado por su cabello rojo/blanco y gafas
# Intentar con diferentes fuentes

urls=(
    # Fandom/Wiki
    "https://static.wikia.nocookie.net/blue-lock/images/4/4d/Ness_profile.png"
    "https://static.wikia.nocookie.net/blue-lock/images/5/55/Ness_Full_Body.png"
    "https://static.wikia.nocookie.net/blue-lock/images/2/26/Ness_Blue_Lock_Anime.png"
    
    # Anime Pictures
    "https://cdn.anime-pictures.net/pictures/261067/5260442-8a68-452e-8c1c-035f6967c8e8.jpg"
)

descargados=0
for i in "${!urls[@]}"; do
    url="${urls[$i]}"
    filename="ness-blue-$i.png"
    
    echo "Intentando $i: $url"
    
    # User agent para evitar bloqueos
    response=$(curl -sL -w "%{http_code}" -o "$filename" "$url" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    
    if [ "$response" = "200" ] && [ -f "$filename" ]; then
        file_type=$(file "$filename" 2>/dev/null | grep -o "PNG\|JPEG")
        if [ ! -z "$file_type" ]; then
            size=$(ls -lh "$filename" | awk '{print $5}')
            descargados=$((descargados + 1))
            echo "  ✓ Descargado: $filename ($size) - $file_type"
        else
            rm "$filename" 2>/dev/null
            echo "  ✗ No es imagen válida"
        fi
    else
        echo "  ✗ Error HTTP $response"
    fi
done

echo -e "\nTotal descargados: $descargados"
