from PIL import Image
import os
import glob
import math

files = glob.glob('ref_cat_*.png')

def remove_white_bg(path):
    print(f"Processing {path}...")
    img = Image.open(path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    
    # Analyze corners to find background color (roughly)
    # But user asked for white background removal, let's stick to that but make it robust
    # Or just use the hardcoded white check as before which worked well for generated images
    
    for item in datas:
        # Check for white (with some tolerance)
        # 240 is a good threshold for "white" background from generation
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Save to a temp name first
    new_path = "processed_" + os.path.basename(path)
    img.save(new_path, "PNG")
    print(f"Saved {new_path}")

for f in files:
    remove_white_bg(f)
