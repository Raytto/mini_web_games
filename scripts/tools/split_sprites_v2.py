from PIL import Image, ImageOps
import sys
import os

def split_spritesheet(path):
    print(f"Analyzing {path}...")
    img = Image.open(path).convert("RGBA")
    width, height = img.size
    
    # 1. Create a binary mask to find content
    # Anything not White (tolerance) is content
    img_data = img.getdata()
    
    # Project to X axis (column has ANY non-white pixel?)
    x_has_content = [False] * width
    
    for x in range(width):
        for y in range(height):
            idx = y * width + x
            r, g, b, a = img_data[idx]
            # If not white
            if r < 240 or g < 240 or b < 240:
                x_has_content[x] = True
                break
    
    # 2. Find connected segments of "True"
    segments = []
    in_segment = False
    start = 0
    
    for x in range(width):
        if x_has_content[x]:
            if not in_segment:
                in_segment = True
                start = x
        else:
            if in_segment:
                in_segment = False
                if x - start > 10: # Min width 10px
                    segments.append((start, x))
    
    if in_segment:
        segments.append((start, width))
        
    print(f"Found {len(segments)} sprites: {segments}")
    
    # 3. Save segments
    # If we found chunks that are just noise, ignore them? 
    # Let's hope for exactly 3 big chunks.
    
    saved_count = 0
    for i, (start, end) in enumerate(segments):
        # Crop
        sprite = img.crop((start, 0, end, height))
        
        # Trim Vertical
        bbox = sprite.getbbox()
        if bbox:
            sprite = sprite.crop(bbox)
        
        out_name = f"split_auto_{saved_count}.png"
        sprite.save(out_name)
        print(f"Saved {out_name}")
        saved_count += 1

if __name__ == "__main__":
    if len(sys.argv) > 1:
        split_spritesheet(sys.argv[1])
    else:
        split_spritesheet("cat_spritesheet_wide.png")
