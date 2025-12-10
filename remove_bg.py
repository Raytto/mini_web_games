from PIL import Image
import sys
import os

def remove_white_bg(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # More aggressive threshold: 200 instead of 240
            # Also check for "near white" relative to other colors
            # If R, G, B are all high, it's likely background or highlight
            # But we must be careful not to remove white highlights on the car window/body.
            # The car is Red. So B and G should be lower than R usually?
            # White background: R,G,B are all high ~255.
            # Red Car: R is high, G and B are lower.
            # White Highlights: R,G,B are high.
            
            # Simple thresholding is risky for highlights.
            # Let's assume the top-left pixel is background color and flood fill?
            # No, simple iteration is safer if we just target "Very White".
            
            if item[0] > 220 and item[1] > 220 and item[2] > 220:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Saved to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input> <output>")
    else:
        remove_white_bg(sys.argv[1], sys.argv[2])
