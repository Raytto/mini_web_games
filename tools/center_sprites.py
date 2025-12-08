from PIL import Image
import glob
import os

files = ['cat_neutral.png', 'cat_happy.png', 'cat_disgust.png']

def trim_and_center(path):
    print(f"Centering {path}...")
    try:
        img = Image.open(path).convert("RGBA")
        
        # Get bounding box of content
        bbox = img.getbbox()
        if not bbox:
            print("Empty image")
            return
            
        cropped = img.crop(bbox)
        
        # Create a new square canvas
        w, h = cropped.size
        size = max(w, h)
        new_size = (int(size * 1.2), int(size * 1.2)) # Add padding
        
        new_img = Image.new("RGBA", new_size, (0, 0, 0, 0))
        
        # Paste centered
        offset = ((new_size[0] - w) // 2, (new_size[1] - h) // 2)
        new_img.paste(cropped, offset)
        
        new_img.save(path) # Overwrite
        print("Done")
    except Exception as e:
        print(f"Error: {e}")

for f in files:
    if os.path.exists(f):
        trim_and_center(f)
