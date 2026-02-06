import requests
import os

# Ness de BlueLock - ID en MyAnimeList: 523706
print("Buscando Ness de BlueLock...")

# Intentar con diferentes fuentes
urls = [
    ("https://cdn.myanimelist.net/images/characters/11/523706.jpg", "ness1.jpg"),
    ("https://cdn.myanimelist.net/images/characters/11/523706t.jpg", "ness1t.jpg"),
    ("https://cdn.myanimelist.net/images/characters/11/523706l.jpg", "ness1l.jpg"),
    ("https://cdn.myanimelist.net/images/characters/16/523706.jpg", "ness2.jpg"),
    ("https://cdn.myanimelist.net/images/characters/10/523706.jpg", "ness3.jpg"),
    ("https://cdn.myanimelist.net/images/characters/9/523706.jpg", "ness4.jpg"),
]

descargados = []
for url, filename in urls:
    try:
        print(f"Descargando {filename} desde {url}")
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(response.content)
            size = os.path.getsize(filename)
            descargados.append(filename)
            print(f"  ✓ {filename}: {size} bytes")
        else:
            print(f"  ✗ Error {response.status_code}")
    except Exception as e:
        print(f"  ✗ Error: {e}")

print(f"\nTotal descargados: {len(descargados)}")
print(f"Archivos: {', '.join(descargados)}")
