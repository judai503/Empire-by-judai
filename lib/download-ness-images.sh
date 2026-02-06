#!/bin/bash
echo "Buscando imágenes de Ness de BlueLock..."

# Intentar descargar de múltiples fuentes
urls=(
  "https://i.imgur.com/HxY6x1h.png"
  "https://i.imgur.com/wtqJz5h.png"
  "https://i.imgur.com/N7K0Lqh.png"
  "https://i.imgur.com/mHJWbVwh.png"
  "https://i.imgur.com/6PQ0nJh.png"
)

for i in "${!urls[@]}"; do
  url="${urls[$i]}"
  filename="ness-$i.jpg"
  echo "Intentando descarga $i: $url"
  curl -sL -o "$filename" "$url" 2>&1 | head -3
  if [ -f "$filename" ] && [ -s "$filename" ]; then
    file "$filename"
    ls -lh "$filename"
  else
    echo "Falló descarga $i"
  fi
done
