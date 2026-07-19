import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter


OUT = Path(__file__).with_name("generated_assets")
OUT.mkdir(exist_ok=True)


def gradient(size, top, bottom):
    img = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(img)
    h = size[1]
    for y in range(h):
        t = y / max(1, h - 1)
        color = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line((0, y, size[0], y), fill=color)
    return img.convert("RGBA")


def shadow(draw, xy, radius=24):
    x0, y0, x1, y1 = xy
    draw.ellipse((x0, y0, x1, y1), fill=(0, 0, 0, radius))


def save_bg(name, top, bottom, drawer):
    img = gradient((1440, 900), top, bottom)
    d = ImageDraw.Draw(img, "RGBA")
    drawer(d)
    img.save(OUT / f"{name}_bg.png", optimize=True)


def sprite(name, draw_fn, size=(360, 360)):
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    draw_fn(d, size)
    img = img.filter(ImageFilter.UnsharpMask(radius=0.8, percent=110, threshold=3))
    img.save(OUT / name, optimize=True)


def rr(d, xy, r, fill, outline=None, width=1):
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def animal_head(kind, name):
    def draw(d, s):
        w, h = s
        cx, cy = w // 2, h // 2 + 16
        colors = {
            "monkey": ((178, 119, 61, 255), (245, 178, 108, 255)),
            "rabbit": ((220, 231, 232, 255), (255, 169, 176, 255)),
            "cat": ((255, 184, 48, 255), (255, 132, 26, 255)),
            "dog": ((168, 108, 70, 255), (242, 199, 138, 255)),
            "bear": ((138, 91, 55, 255), (210, 157, 93, 255)),
            "frog": ((94, 181, 79, 255), (198, 236, 120, 255)),
        }
        main, accent = colors[kind]
        shadow(d, (78, 284, 282, 334), 34)
        if kind == "rabbit":
            d.ellipse((105, 18, 155, 172), fill=main)
            d.ellipse((205, 18, 255, 172), fill=main)
            d.ellipse((120, 44, 142, 146), fill=accent)
            d.ellipse((218, 44, 240, 146), fill=accent)
        elif kind in {"cat", "bear", "monkey"}:
            if kind == "cat":
                d.polygon([(95, 120), (128, 54), (155, 126)], fill=main)
                d.polygon([(205, 126), (232, 54), (265, 120)], fill=main)
            else:
                d.ellipse((72, 112, 138, 182), fill=main)
                d.ellipse((222, 112, 288, 182), fill=main)
        elif kind == "dog":
            d.ellipse((64, 98, 136, 210), fill=main)
            d.ellipse((224, 98, 296, 210), fill=main)
        d.ellipse((88, 92, 272, 284), fill=main)
        if kind in {"monkey", "bear"}:
            d.ellipse((124, 150, 236, 255), fill=accent)
        elif kind == "frog":
            d.ellipse((92, 70, 152, 140), fill=main)
            d.ellipse((208, 70, 268, 140), fill=main)
        d.ellipse((132, 162, 150, 184), fill=(32, 32, 32, 255))
        d.ellipse((210, 162, 228, 184), fill=(32, 32, 32, 255))
        if kind == "cat":
            d.polygon([(176, 190), (190, 190), (183, 202)], fill=(40, 40, 40, 255))
            for x in (96, 222):
                d.line((x, 198, x - 38, 184), fill=(75, 65, 50, 255), width=5)
                d.line((x, 212, x - 40, 212), fill=(75, 65, 50, 255), width=5)
            for x in (264, 138):
                d.line((x, 198, x + 38, 184), fill=(75, 65, 50, 255), width=5)
                d.line((x, 212, x + 40, 212), fill=(75, 65, 50, 255), width=5)
        d.arc((140, 178, 220, 238), 20, 160, fill=(80, 58, 48, 255), width=8)
    sprite(name, draw)


def food(kind, name):
    def draw(d, s):
        shadow(d, (80, 278, 280, 322), 30)
        if kind == "banana":
            d.arc((72, 62, 278, 286), 15, 170, fill=(255, 213, 64, 255), width=36)
            d.arc((88, 84, 256, 260), 22, 165, fill=(255, 240, 128, 255), width=16)
        elif kind == "carrot":
            d.polygon([(88, 250), (260, 72), (294, 106), (130, 282)], fill=(246, 118, 35, 255))
            d.line((136, 230, 260, 108), fill=(255, 171, 65, 255), width=13)
            d.polygon([(252, 82), (270, 22), (286, 82)], fill=(64, 168, 73, 255))
            d.polygon([(272, 90), (332, 58), (298, 118)], fill=(83, 191, 81, 255))
        elif kind == "fish":
            d.ellipse((70, 118, 250, 236), fill=(47, 159, 219, 255))
            d.polygon([(246, 176), (320, 112), (320, 240)], fill=(34, 119, 190, 255))
            d.polygon([(138, 118), (190, 68), (214, 128)], fill=(75, 190, 233, 255))
            d.ellipse((110, 154, 128, 172), fill=(20, 45, 70, 255))
            d.arc((72, 164, 124, 208), 285, 75, fill=(255, 255, 255, 255), width=5)
        elif kind == "egg":
            d.ellipse((112, 50, 248, 286), fill=(255, 243, 202, 255), outline=(226, 178, 88, 255), width=9)
        elif kind == "milk":
            rr(d, (112, 66, 248, 286), 18, (236, 250, 255, 255), (106, 175, 212, 255), 8)
            rr(d, (125, 92, 235, 170), 12, (100, 188, 230, 255))
        elif kind == "spoon":
            d.ellipse((86, 48, 174, 146), fill=(216, 224, 232, 255), outline=(151, 161, 173, 255), width=7)
            d.line((158, 132, 278, 278), fill=(151, 161, 173, 255), width=28)
            d.line((158, 132, 278, 278), fill=(234, 239, 244, 255), width=14)
        elif kind == "cake":
            rr(d, (92, 146, 268, 282), 28, (255, 190, 84, 255), (201, 119, 50, 255), 7)
            d.rectangle((96, 132, 264, 185), fill=(255, 112, 157, 255))
            d.ellipse((108, 102, 252, 170), fill=(255, 230, 242, 255))
        elif kind == "apple":
            d.ellipse((88, 100, 258, 276), fill=(235, 55, 50, 255), outline=(174, 31, 39, 255), width=7)
            d.arc((146, 72, 228, 126), 190, 330, fill=(91, 62, 38, 255), width=10)
            d.ellipse((206, 74, 278, 124), fill=(83, 176, 77, 255))
        elif kind == "strawberry":
            d.polygon([(180, 284), (90, 116), (270, 116)], fill=(235, 55, 80, 255))
            for x, y in [(132, 150), (176, 176), (220, 150), (156, 222), (205, 224)]:
                d.ellipse((x, y, x + 12, y + 18), fill=(255, 236, 114, 255))
            d.polygon([(138, 118), (180, 62), (220, 118)], fill=(73, 176, 72, 255))
        elif kind == "leaf":
            d.ellipse((92, 92, 284, 248), fill=(88, 190, 92, 255), outline=(39, 128, 66, 255), width=7)
            d.line((116, 232, 268, 104), fill=(231, 255, 212, 255), width=9)
        elif kind == "diamond":
            d.polygon([(180, 48), (304, 180), (180, 312), (56, 180)], fill=(42, 145, 238, 255), outline=(18, 95, 178, 255))
        elif kind == "water":
            d.polygon([(180, 52), (104, 182), (180, 296), (256, 182)], fill=(80, 183, 237, 255))
            d.ellipse((104, 160, 256, 312), fill=(80, 183, 237, 255), outline=(35, 126, 202, 255), width=6)
        elif kind == "sun":
            for a in range(0, 360, 45):
                import math
                x = 180 + math.cos(math.radians(a)) * 115
                y = 180 + math.sin(math.radians(a)) * 115
                d.line((180, 180, x, y), fill=(252, 185, 45, 255), width=20)
            d.ellipse((92, 92, 268, 268), fill=(255, 210, 65, 255), outline=(240, 149, 45, 255), width=7)
    sprite(name, draw)


def simple_object(kind, name):
    def draw(d, s):
        shadow(d, (76, 286, 284, 326), 28)
        if kind == "train-red":
            rr(d, (75, 130, 275, 230), 20, (239, 81, 75, 255), (164, 37, 43, 255), 7)
            d.rectangle((105, 96, 235, 142), fill=(249, 207, 91, 255))
            for x in (116, 234):
                d.ellipse((x, 214, x + 42, 256), fill=(48, 60, 82, 255))
        elif kind == "train-yellow":
            rr(d, (75, 130, 275, 230), 20, (245, 194, 52, 255), (179, 119, 28, 255), 7)
            d.rectangle((105, 96, 235, 142), fill=(92, 194, 224, 255))
            for x in (116, 234):
                d.ellipse((x, 214, x + 42, y:=256), fill=(48, 60, 82, 255))
        elif kind == "train-blue":
            rr(d, (75, 130, 275, 230), 20, (67, 152, 227, 255), (34, 93, 158, 255), 7)
            d.rectangle((105, 96, 235, 142), fill=(255, 226, 99, 255))
            for x in (116, 234):
                d.ellipse((x, 214, x + 42, 256), fill=(48, 60, 82, 255))
        elif kind == "soap":
            rr(d, (80, 140, 280, 246), 45, (255, 146, 179, 255), (219, 82, 127, 255), 7)
            for x, y, r in [(105, 100, 26), (254, 106, 20), (220, 78, 14)]:
                d.ellipse((x, y, x + r, y + r), fill=(218, 250, 255, 180), outline=(255, 255, 255, 220))
        elif kind == "shower":
            d.line((96, 96, 230, 96), fill=(132, 150, 170, 255), width=24)
            d.pieslice((190, 70, 310, 190), 200, 20, fill=(186, 202, 216, 255), outline=(120, 137, 154, 255), width=6)
            for x in (130, 168, 206, 244):
                d.line((x, 190, x - 36, 278), fill=(80, 178, 235, 190), width=10)
        elif kind == "towel":
            rr(d, (92, 88, 268, 278), 28, (247, 179, 92, 255), (198, 119, 50, 255), 8)
            for x in (120, 160, 200):
                d.arc((x, 108, x + 56, 190), 0, 180, fill=(255, 230, 169, 255), width=10)
        elif kind == "plank":
            rr(d, (74, 130, 286, 232), 18, (157, 99, 55, 255), (98, 64, 38, 255), 7)
            d.line((94, 166, 266, 166), fill=(208, 151, 91, 255), width=7)
            d.line((94, 202, 266, 202), fill=(113, 73, 43, 255), width=5)
        elif kind == "stone":
            d.polygon([(94, 240), (128, 112), (224, 78), (292, 160), (250, 270), (146, 284)], fill=(136, 145, 147, 255), outline=(91, 99, 103, 255))
            d.line((134, 142, 220, 92), fill=(184, 194, 196, 180), width=8)
        elif kind == "car":
            rr(d, (70, 156, 290, 238), 28, (232, 67, 59, 255), (149, 34, 39, 255), 7)
            d.polygon([(118, 154), (158, 98), (226, 98), (266, 154)], fill=(255, 192, 92, 255), outline=(149, 34, 39, 255))
            for x in (108, 224):
                d.ellipse((x, 220, x + 54, 274), fill=(45, 54, 70, 255))
                d.ellipse((x + 14, 234, x + 40, 260), fill=(226, 235, 242, 255))
        elif kind == "pot":
            d.polygon([(110, 118), (250, 118), (230, 286), (130, 286)], fill=(176, 106, 72, 255), outline=(123, 70, 49, 255))
            d.rectangle((92, 96, 268, 134), fill=(141, 88, 61, 255))
        elif kind == "seed":
            d.ellipse((132, 118, 228, 250), fill=(127, 77, 48, 255), outline=(78, 49, 34, 255), width=6)
            d.arc((142, 118, 226, 250), 250, 80, fill=(198, 143, 89, 180), width=8)
        elif kind == "umbrella":
            d.pieslice((60, 78, 300, 278), 180, 360, fill=(92, 119, 255, 255), outline=(33, 69, 191, 255), width=7)
            d.line((180, 178, 180, 282), fill=(80, 75, 90, 255), width=11)
            d.arc((180, 246, 238, 304), 0, 180, fill=(80, 75, 90, 255), width=11)
        elif kind == "cap":
            d.pieslice((86, 92, 274, 280), 180, 360, fill=(58, 158, 221, 255), outline=(20, 101, 176, 255), width=7)
            rr(d, (188, 174, 308, 216), 20, (43, 138, 205, 255), (20, 101, 176, 255), 5)
        elif kind == "scarf":
            rr(d, (80, 118, 280, 178), 28, (226, 55, 62, 255), (166, 30, 44, 255), 7)
            rr(d, (174, 166, 244, 294), 20, (226, 55, 62, 255), (166, 30, 44, 255), 7)
            for y in (132, 154, 204, 238):
                d.line((92, y, 268, y), fill=(255, 209, 92, 200), width=5)
        elif kind == "eyes":
            for x in (102, 202):
                d.ellipse((x, 116, x + 80, 236), fill=(255, 255, 255, 255), outline=(55, 45, 74, 255), width=6)
                d.ellipse((x + 28, 158, x + 58, 198), fill=(48, 35, 62, 255))
        elif kind == "mouth":
            d.ellipse((80, 120, 280, 250), fill=(245, 69, 122, 255), outline=(141, 34, 74, 255), width=8)
            d.arc((122, 126, 238, 222), 20, 160, fill=(255, 230, 240, 255), width=12)
        elif kind == "hat":
            d.rectangle((124, 82, 236, 214), fill=(42, 39, 55, 255))
            d.rectangle((78, 202, 282, 242), fill=(42, 39, 55, 255))
            d.rectangle((122, 174, 238, 204), fill=(170, 80, 214, 255))
        elif kind == "bow":
            d.polygon([(178, 180), (70, 110), (88, 250)], fill=(244, 74, 147, 255), outline=(164, 37, 96, 255))
            d.polygon([(182, 180), (290, 110), (272, 250)], fill=(244, 74, 147, 255), outline=(164, 37, 96, 255))
            d.ellipse((152, 152, 208, 208), fill=(255, 185, 214, 255), outline=(164, 37, 96, 255), width=5)
        elif kind == "circle":
            d.ellipse((90, 90, 270, 270), fill=(255, 139, 37, 255), outline=(202, 73, 22, 255), width=8)
        elif kind == "square":
            rr(d, (90, 90, 270, 270), 20, (79, 190, 96, 255), (38, 128, 65, 255), 8)
        elif kind == "triangle":
            d.polygon([(180, 78), (292, 270), (68, 270)], fill=(244, 70, 70, 255), outline=(180, 36, 50, 255))
    sprite(name, draw)


def bg_common_floor(d, floor_color):
    d.rectangle((0, 610, 1440, 900), fill=floor_color)
    for x in range(-80, 1520, 180):
        d.ellipse((x, 620, x + 260, 930), fill=(255, 255, 255, 28))


def make_backgrounds():
    save_bg("animal_breakfast", (255, 226, 164), (255, 244, 206), lambda d: (
        d.ellipse((-120, 560, 1560, 1160), fill=(122, 205, 117, 255)),
        rr(d, (360, 520, 1080, 720), 80, (174, 103, 60, 255), (112, 68, 44, 255), 8),
        d.rectangle((430, 690, 490, 850), fill=(112, 68, 44, 255)),
        d.rectangle((950, 690, 1010, 850), fill=(112, 68, 44, 255)),
        d.ellipse((60, 80, 230, 240), fill=(92, 183, 96, 255)),
        d.ellipse((1180, 70, 1360, 260), fill=(95, 186, 103, 255))
    ))
    save_bg("train_cargo", (196, 236, 255), (242, 251, 255), lambda d: (
        bg_common_floor(d, (205, 225, 221, 255)),
        d.rectangle((0, 710, 1440, 780), fill=(118, 101, 92, 255)),
        d.line((0, 735, 1440, 735), fill=(65, 70, 80, 255), width=12),
        rr(d, (240, 290, 1200, 650), 42, (255, 244, 196, 255), (207, 169, 90, 255), 9),
        d.polygon([(180, 300), (720, 120), (1260, 300)], fill=(240, 126, 74, 255))
    ))
    save_bg("bath_time", (205, 250, 246), (236, 255, 252), lambda d: (
        d.rectangle((0, 590, 1440, 900), fill=(170, 232, 226, 255)),
        rr(d, (390, 410, 1050, 720), 120, (245, 255, 255, 255), (105, 190, 208, 255), 9),
        d.rectangle((160, 190, 1280, 590), fill=(225, 250, 248, 180)),
        d.ellipse((1030, 160, 1180, 310), fill=(225, 250, 255, 255), outline=(120, 191, 207, 255), width=8)
    ))
    save_bg("little_chef", (255, 239, 192), (255, 248, 220), lambda d: (
        d.rectangle((0, 610, 1440, 900), fill=(226, 172, 111, 255)),
        rr(d, (180, 260, 1260, 660), 42, (255, 248, 226, 255), (199, 138, 84, 255), 8),
        rr(d, (260, 500, 1180, 760), 36, (214, 135, 76, 255), (151, 89, 54, 255), 8),
        d.rectangle((0, 0, 1440, 180), fill=(255, 220, 142, 120))
    ))
    save_bg("road_helper", (211, 248, 163), (244, 255, 218), lambda d: (
        d.ellipse((-200, 590, 1640, 1160), fill=(111, 192, 92, 255)),
        d.polygon([(500, 900), (650, 420), (790, 420), (960, 900)], fill=(92, 99, 107, 255)),
        d.line((720, 440, 720, 900), fill=(255, 232, 122, 255), width=16),
        rr(d, (140, 240, 340, 470), 32, (255, 246, 197, 255), (143, 108, 54, 255), 7),
        d.ellipse((1040, 120, 1230, 310), fill=(122, 199, 94, 255))
    ))
    save_bg("garden_grow", (219, 255, 207), (247, 255, 229), lambda d: (
        d.ellipse((-180, 565, 1620, 1120), fill=(111, 201, 102, 255)),
        d.rectangle((0, 690, 1440, 900), fill=(126, 84, 57, 255)),
        d.ellipse((80, 120, 230, 270), fill=(255, 219, 73, 255)),
        d.rectangle((340, 500, 1100, 700), fill=(129, 92, 55, 255))
    ))
    save_bg("shadow_match", (236, 232, 255), (251, 248, 255), lambda d: (
        bg_common_floor(d, (218, 210, 235, 255)),
        d.polygon([(720, 120), (300, 760), (1140, 760)], fill=(255, 249, 208, 150)),
        rr(d, (240, 140, 1200, 720), 44, (248, 244, 255, 210), (175, 160, 205, 255), 8)
    ))
    save_bg("little_band", (255, 226, 237), (255, 246, 250), lambda d: (
        d.rectangle((0, 590, 1440, 900), fill=(156, 82, 137, 255)),
        d.ellipse((120, 520, 1320, 930), fill=(222, 103, 158, 255)),
        d.rectangle((0, 0, 1440, 260), fill=(255, 198, 222, 255)),
        d.ellipse((140, 80, 280, 220), fill=(255, 246, 148, 180)),
        d.ellipse((1160, 80, 1300, 220), fill=(255, 246, 148, 180))
    ))
    save_bg("weather_dress", (214, 242, 255), (250, 253, 255), lambda d: (
        bg_common_floor(d, (225, 235, 240, 255)),
        rr(d, (130, 170, 1310, 700), 42, (250, 255, 255, 230), (145, 197, 219, 255), 8),
        rr(d, (220, 250, 510, 520), 26, (185, 225, 255, 255), (108, 172, 209, 255), 7),
        rr(d, (570, 250, 870, 520), 26, (255, 243, 170, 255), (225, 177, 80, 255), 7),
        rr(d, (930, 250, 1220, 520), 26, (235, 247, 255, 255), (145, 197, 219, 255), 7)
    ))
    save_bg("find_friends", (238, 255, 205), (251, 255, 229), lambda d: (
        d.ellipse((-160, 590, 1600, 1160), fill=(126, 205, 96, 255)),
        d.rectangle((0, 720, 1440, 900), fill=(168, 115, 72, 255)),
        d.rectangle((120, 360, 390, 640), fill=(255, 245, 208, 255)),
        d.rectangle((585, 330, 855, 640), fill=(255, 245, 208, 255)),
        d.rectangle((1050, 360, 1320, 640), fill=(255, 245, 208, 255))
    ))
    save_bg("monster_dressup", (242, 229, 255), (252, 247, 255), lambda d: (
        bg_common_floor(d, (222, 205, 238, 255)),
        rr(d, (270, 160, 1170, 700), 48, (251, 246, 255, 235), (181, 139, 220, 255), 8),
        rr(d, (1060, 220, 1260, 650), 24, (218, 190, 238, 255), (160, 110, 205, 255), 7),
        d.ellipse((160, 120, 300, 260), fill=(255, 235, 145, 170))
    ))
    save_bg("parcel_sort", (255, 229, 216), (255, 247, 240), lambda d: (
        bg_common_floor(d, (226, 198, 177, 255)),
        rr(d, (220, 240, 1220, 700), 42, (255, 248, 240, 235), (198, 143, 108, 255), 8),
        rr(d, (80, 120, 340, 300), 32, (206, 150, 94, 255), (128, 83, 54, 255), 7),
        rr(d, (1100, 120, 1360, 300), 32, (206, 150, 94, 255), (128, 83, 54, 255), 7)
    ))
    split_reference_backgrounds()


def split_reference_backgrounds():
    reference = OUT / "scene_style_reference.png"
    if not reference.exists():
        return
    names = [
        "animal_breakfast", "train_cargo", "bath_time",
        "little_chef", "road_helper", "garden_grow",
        "shadow_match", "little_band", "weather_dress",
        "find_friends", "monster_dressup", "parcel_sort",
    ]
    src = Image.open(reference).convert("RGBA")
    cols, rows = 3, 4
    cell_w = src.width / cols
    cell_h = src.height / rows
    for idx, name in enumerate(names):
        row, col = divmod(idx, cols)
        inset = 5
        box = (
            int(col * cell_w) + inset,
            int(row * cell_h) + inset,
            int((col + 1) * cell_w) - inset,
            int((row + 1) * cell_h) - inset,
        )
        tile = src.crop(box)
        target_ratio = 1440 / 900
        ratio = tile.width / tile.height
        if ratio > target_ratio:
            new_w = int(tile.height * target_ratio)
            left = (tile.width - new_w) // 2
            tile = tile.crop((left, 0, left + new_w, tile.height))
        else:
            new_h = int(tile.width / target_ratio)
            top = max(0, (tile.height - new_h) // 2)
            tile = tile.crop((0, top, tile.width, top + new_h))
        tile = tile.resize((1440, 900), Image.Resampling.LANCZOS)
        tile.save(OUT / f"{name}_bg.png", optimize=True)


def make_targets():
    for kind in ["monkey", "rabbit", "cat", "dog", "bear", "frog"]:
        animal_head(kind, f"animal_breakfast_zone_{kind}.png" if kind in {"monkey", "rabbit", "cat"} else f"shared_{kind}.png")
    food("banana", "animal_breakfast_item_banana.png")
    food("carrot", "animal_breakfast_item_carrot.png")
    food("fish", "animal_breakfast_item_fish.png")

    for color, kind in [("red", "train-red"), ("yellow", "train-yellow"), ("blue", "train-blue")]:
        simple_object(kind, f"train_cargo_zone_{color}.png")
    simple_object("circle", "train_cargo_item_red-ball.png")
    food("sun", "train_cargo_item_yellow-star.png")
    food("diamond", "train_cargo_item_blue-block.png")

    animal_head("bear", "bath_time_zone_baby.png")
    simple_object("soap", "bath_time_item_soap.png")
    simple_object("shower", "bath_time_item_shower.png")
    simple_object("towel", "bath_time_item_towel.png")

    simple_object("pot", "little_chef_zone_bowl.png")
    food("egg", "little_chef_item_egg.png")
    food("milk", "little_chef_item_milk.png")
    food("spoon", "little_chef_item_spoon.png")
    food("cake", "little_chef_item_cake.png")

    simple_object("stone", "road_helper_zone_road.png")
    simple_object("plank", "road_helper_item_plank.png")
    simple_object("stone", "road_helper_item_stone.png")
    simple_object("car", "road_helper_item_car.png")

    simple_object("pot", "garden_grow_zone_soil.png")
    simple_object("seed", "garden_grow_item_seed.png")
    food("water", "garden_grow_item_water.png")
    food("sun", "garden_grow_item_sun.png")

    for kind in ["cat", "dog", "bear"]:
        def black(d, s, source=kind):
            animal_head(source, "_tmp.png")
        # Make black silhouettes directly from the colorful heads.
        animal_head(kind, f"shadow_match_item_{kind}.png")
        src = Image.open(OUT / f"shadow_match_item_{kind}.png").convert("RGBA")
        mask = src.getchannel("A")
        dark = Image.new("RGBA", src.size, (34, 34, 38, 220))
        dark.putalpha(mask)
        dark.save(OUT / f"shadow_match_zone_{kind}.png", optimize=True)

    animal_head("monkey", "little_band_zone_drum.png")
    animal_head("rabbit", "little_band_zone_guitar.png")
    animal_head("cat", "little_band_zone_trumpet.png")
    simple_object("pot", "little_band_item_drum.png")
    simple_object("plank", "little_band_item_guitar.png")
    simple_object("car", "little_band_item_trumpet.png")

    food("water", "weather_dress_zone_rain.png")
    food("sun", "weather_dress_zone_sunny.png")
    simple_object("stone", "weather_dress_zone_snow.png")
    simple_object("umbrella", "weather_dress_item_umbrella.png")
    simple_object("cap", "weather_dress_item_hat.png")
    simple_object("scarf", "weather_dress_item_scarf.png")

    simple_object("circle", "find_friends_zone_red.png")
    food("diamond", "find_friends_zone_blue.png")
    food("leaf", "find_friends_zone_green.png")
    food("apple", "find_friends_item_apple.png")
    food("strawberry", "find_friends_item_strawberry.png")
    food("fish", "find_friends_item_fish.png")
    food("diamond", "find_friends_item_diamond.png")
    food("leaf", "find_friends_item_leaf.png")
    animal_head("frog", "find_friends_item_frog.png")

    animal_head("frog", "monster_dressup_zone_monster.png")
    simple_object("eyes", "monster_dressup_item_eyes.png")
    simple_object("mouth", "monster_dressup_item_mouth.png")
    simple_object("hat", "monster_dressup_item_hat.png")
    simple_object("bow", "monster_dressup_item_bow.png")

    simple_object("circle", "parcel_sort_zone_circle.png")
    simple_object("square", "parcel_sort_zone_square.png")
    simple_object("triangle", "parcel_sort_zone_triangle.png")
    simple_object("circle", "parcel_sort_item_circle-box.png")
    simple_object("square", "parcel_sort_item_square-box.png")
    simple_object("triangle", "parcel_sort_item_triangle-box.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--with-fallback-sprites",
        action="store_true",
        help="also regenerate the legacy geometric placeholder sprites",
    )
    args = parser.parse_args()
    make_backgrounds()
    if args.with_fallback_sprites:
        make_targets()
    tmp = OUT / "_tmp.png"
    if tmp.exists():
        tmp.unlink()
    generated = "backgrounds and fallback sprites" if args.with_fallback_sprites else "backgrounds"
    print(f"Generated {generated} in {OUT}")
