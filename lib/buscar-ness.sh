#!/bin/bash

echo "Buscando imágenes de Ness de BlueLock..."

# Lista de URLs conocidas de Ness
urls=(
  "https://cdn.myanimelist.net/images/characters/16/428843.jpg"
  "https://cdn.myanimelist.net/images/characters/11/523706.jpg"
  "https://cdn.myanimelist.net/images/characters/10/428843.jpg"
  "https://cdn.myanimelist.net/images/characters/9/428843.jpg"
)

for i in "${!urls[@]}"; do
  url="${urls[$i]}"
  filename="ness-test-$i.jpg"
  echo "Intentando $i: $url"
  
  curl -sL -o "$filename" "$url" 2>&1 | head -2
  
  if [ -f "$filename" ] && [ -s "$filename" ]; then
    result=$(file "$filename" 2>/dev/null)
    if echo "$result" | grep -q "JPEG\|PNG"; then
      echo "  ✓ $filename: $result"
      ls -lh "$filename" | awk '{print "    Tamaño: " $5}'
    else
      echo "  ✗ No es imagen: $result"
      rm "$filename" 2>/dev/null
    fi
  else
    echo "  ✗ Descarga fallida"
  fi
done
