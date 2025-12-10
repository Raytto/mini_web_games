from PIL import Image
import os
import glob
import sys

# Increase recursion depth for deep flood fills if using recursion, 
# but we will use iterative to avoid stack overflow.
sys.setrecursionlimit(100000)

files = glob.glob('ref_cat_*.png')

def remove_bg_floodfill(path):
    print(f"Processing {path}...")
    img = Image.open(path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # Visited set
    visited = set()
    queue = []
    
    # Start from corners
    corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    
    for x, y in corners:
        if (x, y) not in visited:
            r, g, b, a = pixels[x, y]
            # If corner is 'white-ish', add to queue
            if r > 240 and g > 240 and b > 240:
                queue.append((x, y))
                visited.add((x, y))
    
    # Directions: Up, Down, Left, Right
    moves = [(0, 1), (0, -1), (1, 0), (-1, 0)]
    
    while queue:
        cx, cy = queue.pop(0)
        
        # Set transparent
        pixels[cx, cy] = (255, 255, 255, 0)
        
        for dx, dy in moves:
            nx, ny = cx + dx, cy + dy
            
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    r, g, b, a = pixels[nx, ny]
                    # Check if pixel is white-ish
                    # Being a bit more strict to avoid bleeding into white fur
                    # Only remove if it's very close to pure white/background color
                    if r > 230 and g > 230 and b > 230:
                        visited.add((nx, ny))
                        queue.append((nx, ny))

    # Save
    new_path = "processed_" + os.path.basename(path)
    img.save(new_path, "PNG")
    print(f"Saved {new_path}")

for f in files:
    remove_bg_floodfill(f)
