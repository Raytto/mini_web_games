from pathlib import Path

from PIL import Image, ImageDraw

def create_game_icon(car_path, output_path):
    print("Creating game icon...")
    # dimensions for the card image header (approx 300x220 based on CSS but let's make it square or 4:3 high res)
    # The css says .card-image-header is 220px height. Width is flexible.
    # Let's make it 600x440 for high DPI.
    W, H = 600, 440
    
    # Create background (Grass)
    img = Image.new('RGB', (W, H), color='#a8e6cf')
    draw = ImageDraw.Draw(img)
    
    # Draw Road (S-curve or diagonal)
    # Simple diagonal road
    road_width = 160
    # Points for a curves road
    # let's just do a big diagonal
    draw.polygon([(0, H), (W, 0), (W, 0+road_width), (0, H+road_width)], fill='#f0f0f0')
    # Border
    border_w = 20
    draw.line([(0, H), (W, 0)], fill='#5c5c5c', width=border_w)
    draw.line([(0, H+road_width), (W, 0+road_width)], fill='#5c5c5c', width=border_w)
    
    # Dashed line
    # Simple approximation
    
    # Draw simple trees (Green circles)
    draw.ellipse((50, 50, 150, 150), fill='#4CAF50')
    draw.ellipse((450, 300, 550, 400), fill='#4CAF50')
    
    try:
        car = Image.open(car_path).convert("RGBA")
        # Resize car
        cw, ch = car.size
        # goal width approx 150
        ratio = 200 / cw
        new_size = (int(cw*ratio), int(ch*ratio))
        car = car.resize(new_size, Image.Resampling.LANCZOS)
        
        # Rotate car to match road roughly
        # Road is from bottom-left to top-right. Angle approx -35 deg?
        # The car sprite is facing Up? 
        # If car faces up (0 deg), we need to rotate it to point top-right (-45) or bottom-left.
        # Let's assume car faces up.
        car = car.rotate(-35, expand=True)
        
        # Paste car centered
        cx, cy = W//2, H//2
        # Adjust for car size
        img.paste(car, (cx - car.width//2, cy - car.height//2), car)
        
    except Exception as e:
        print(f"Error loading car: {e}")
        
    img.save(output_path)
    print(f"Saved icon to {output_path}")

if __name__ == "__main__":
    project_root = Path(__file__).resolve().parent
    car_sprite = project_root / "../../frontend-game/games/car_track/assets/car.png"
    output_image = project_root / "../../frontend-game/upload/img/card_car_track_scene.png"
    create_game_icon(car_sprite, output_image)
