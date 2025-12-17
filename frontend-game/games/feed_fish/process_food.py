from PIL import Image
import sys
import collections

def process_image(path):
    try:
        img = Image.open(path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        # We'll treat pixels as "background" if they are close to white
        # OR if they are close to the color of the corner pixel (if the corner is light)
        
        # Let's get corner colors
        corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
        
        # Determine strict white or corner color
        # We'll assume the background is supposed to be white/light.
        
        def is_match(p):
            # p is (r, g, b, a)
            # Check if close to white (255, 255, 255)
            # Tolerance 30
            if p[0] > 220 and p[1] > 220 and p[2] > 220:
                return True
            return False

        # Queue for BFS
        q = collections.deque()
        visited = set()
        
        # Add all border pixels that match "white-ish" to queue
        for x in range(width):
            for y in [0, height-1]:
                if is_match(pixels[x, y]):
                    q.append((x, y))
                    visited.add((x, y))
                    
        for y in range(height):
            for x in [0, width-1]:
                if (x, y) not in visited and is_match(pixels[x, y]):
                    q.append((x, y))
                    visited.add((x, y))
                    
        # BFS
        replacement = (0, 0, 0, 0)
        while q:
            x, y = q.popleft()
            pixels[x, y] = replacement
            
            # Neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        if is_match(pixels[nx, ny]):
                            visited.add((nx, ny))
                            q.append((nx, ny))
                            
        img.save(path)
        print(f"Processed {path}: Removed background using BFS.")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    process_image('/root/dev/mini_web_games/frontend/games/feed_fish/food.png')
