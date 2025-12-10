from PIL import Image
import sys

def force_split(path, count=3):
    img = Image.open(path).convert("RGBA")
    width, height = img.size
    
    segment_width = width // count
    
    for i in range(count):
        left = i * segment_width
        right = (i + 1) * segment_width
        
        # Crop
        sprite = img.crop((left, 0, right, height))
        
        output_name = f"ref_cat_split_{i}.png"
        sprite.save(output_name)
        print(f"Saved {output_name}")

if __name__ == "__main__":
    force_split("cat_spritesheet.png")
