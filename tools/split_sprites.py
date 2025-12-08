from PIL import Image, ImageOps
import sys
import os

def split_spritesheet(path):
    img = Image.open(path).convert("RGBA")
    width, height = img.size
    
    # 1. Create a binary mask to find content
    # Anything not White (tolerance) is content
    mask = Image.new('L', (width, height), 0)
    img_data = img.getdata()
    mask_data = []
    
    for item in img_data:
        # Check if pixel is NOT white (content)
        if item[0] < 240 or item[1] < 240 or item[2] < 240:
             mask_data.append(255) # Content
        else:
             mask_data.append(0)   # Background
             
    mask.putdata(mask_data)
    
    # 2. Project to X axis to find gaps
    # Simple histogram approach
    x_hist = [0] * width
    for x in range(width):
        for y in range(height):
            if mask.getpixel((x, y)) > 0:
                x_hist[x] = 1
                break # Found content in this column
    
    # 3. Find segments
    segments = []
    in_segment = False
    start = 0
    
    for x in range(width):
        if x_hist[x] == 1:
            if not in_segment:
                in_segment = True
                start = x
        else:
            if in_segment:
                in_segment = False
                # End of segment, add it if it's wide enough to be a sprite
                if x - start > 20: 
                    segments.append((start, x))
    
    # Handle edge case if segment goes to end
    if in_segment:
         segments.append((start, width))
         
    print(f"Found {len(segments)} sprites.")
    
    # 4. Save segments
    for i, (start, end) in enumerate(segments):
        # Add a little padding if possible
        # Crop vertical too? Yes, let's find Y bounds for this X range
        
        # Find Y bounds
        y_min = height
        y_max = 0
        for cx in range(start, end):
            for cy in range(height):
                if mask.getpixel((cx, cy)) > 0:
                    if cy < y_min: y_min = cy
                    if cy > y_max: y_max = cy
        
        # Crop
        sprite = img.crop((start, y_min, end, y_max + 1))
        
        # Save as temp
        out_name = f"sprite_{i}.png"
        sprite.save(out_name)
        print(f"Saved {out_name}")

if __name__ == "__main__":
    split_spritesheet("cat_spritesheet.png")
