from PIL import Image
import os
files = ['processed_split_auto_0.png', 'processed_split_auto_1.png', 'processed_split_auto_2.png']
# Resize to uniform size and center
for f in files:
    try:
        img = Image.open(f)
        img.thumbnail((500, 500), Image.Resampling.LANCZOS)
        
        # Center in 500x500 canvas
        new_img = Image.new('RGBA', (500, 500), (0,0,0,0))
        w, h = img.size
        new_img.paste(img, ((500-w)//2, (500-h)//2))
        new_img.save(f)
    except: pass
