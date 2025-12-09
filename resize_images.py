import os
from PIL import Image

image_files = [
    "card_fruit.png",
    "card_balloon.png",
    "card_cat.png",
    "card_ants.png",
    "bubble_pop_thumbnail.png",
    "card_animal_tap.png",
    "card_monster.png",
    "card_time_magic.png",
    "card_puzzle.png"
]

base_dir = "upload/img"

for filename in image_files:
    path = os.path.join(base_dir, filename)
    if not os.path.exists(path):
        console.log(f"Warning: {path} not found")
        continue

    try:
        with Image.open(path) as img:
            original_size = img.size
            new_size = (original_size[0] // 2, original_size[1] // 2)
            
            # Using LANCZOS for high quality downsampling
            resized_img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Create new filename
            name, ext = os.path.splitext(filename)
            new_filename = f"{name}_small{ext}"
            new_path = os.path.join(base_dir, new_filename)
            
            resized_img.save(new_path)
            print(f"Resized {filename} {original_size} -> {new_filename} {new_size}")
    except Exception as e:
        print(f"Error processing {filename}: {e}")
