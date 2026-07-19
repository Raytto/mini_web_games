#!/usr/bin/env python3
"""Split generated sprite sheets into transparent production game assets."""

from __future__ import annotations

import argparse
import os
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / "generated_sprite_sources"
OUTPUT = ROOT / "generated_assets"
CODEX_HOME = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
CHROMA_HELPER = CODEX_HOME / "skills/.system/imagegen/scripts/remove_chroma_key.py"
CANVAS_SIZE = 512
SUBJECT_SIZE = 466


SHEETS = {
    "animal_breakfast": {
        "grid": (3, 2),
        "cells": [
            "zone_monkey", "zone_rabbit", "zone_cat",
            "item_banana", "item_carrot", "item_fish",
        ],
    },
    "train_cargo": {
        "grid": (3, 2),
        "cells": [
            "zone_red", "zone_yellow", "zone_blue",
            "item_red-ball", "item_yellow-star", "item_blue-block",
        ],
    },
    "bath_time": {
        "grid": (2, 2),
        "key": "#00ff00",
        "cells": ["zone_baby", "item_soap", "item_shower", "item_towel"],
    },
    "little_chef": {
        "grid": (3, 2),
        "cells": ["zone_bowl", "item_egg", "item_milk", "item_spoon", "item_cake", None],
    },
    "road_helper": {
        "grid": (2, 2),
        "cells": ["zone_road", "item_plank", "item_stone", "item_car"],
    },
    "garden_grow": {
        "grid": (2, 2),
        "cells": ["zone_soil", "item_seed", "item_water", "item_sun"],
    },
    "garden_grow_stages": {
        "grid": (3, 1),
        "cells": ["stage_seeded", "stage_sprout", "stage_flower"],
    },
    "shadow_match": {
        "grid": (3, 1),
        "cells": ["item_cat", "item_dog", "item_bear"],
    },
    "little_band": {
        "grid": (3, 2),
        "cells": [
            "zone_drum", "zone_guitar", "zone_trumpet",
            "item_drum", "item_guitar", "item_trumpet",
        ],
    },
    "weather_dress": {
        "grid": (3, 2),
        "cells": [
            "zone_rain", "zone_sunny", "zone_snow",
            "item_umbrella", "item_hat", "item_scarf",
        ],
    },
    "find_friends": {
        "grid": (3, 3),
        "cells": [
            "zone_red", "zone_blue", "zone_green",
            "item_apple", "item_strawberry", "item_fish",
            "item_diamond", "item_leaf", "item_frog",
        ],
    },
    "monster_dressup": {
        "grid": (3, 2),
        "cells": ["zone_monster", "item_eyes", "item_mouth", "item_hat", "item_bow", None],
    },
    "parcel_sort": {
        "grid": (3, 2),
        "cells": [
            "zone_circle", "zone_square", "zone_triangle",
            "item_circle-box", "item_square-box", "item_triangle-box",
        ],
    },
}


def crop_cell(
    sheet: Image.Image, cols: int, rows: int, index: int
) -> tuple[Image.Image, tuple[int, int, int, int]]:
    col = index % cols
    row = index // cols
    core_left = round(sheet.width * col / cols)
    core_top = round(sheet.height * row / rows)
    core_right = round(sheet.width * (col + 1) / cols)
    core_bottom = round(sheet.height * (row + 1) / rows)
    pad_x = round((core_right - core_left) * 0.14)
    pad_y = round((core_bottom - core_top) * 0.14)
    left = max(0, core_left - pad_x)
    top = max(0, core_top - pad_y)
    right = min(sheet.width, core_right + pad_x)
    bottom = min(sheet.height, core_bottom + pad_y)
    core = (
        core_left - left,
        core_top - top,
        core_right - left,
        core_bottom - top,
    )
    return sheet.crop((left, top, right, bottom)).convert("RGB"), core


def remove_key(source: Image.Image, key: str, work: Path) -> Image.Image:
    raw_path = work / "raw.png"
    alpha_path = work / "alpha.png"
    source.save(raw_path)
    subprocess.run(
        [
            "python", str(CHROMA_HELPER),
            "--input", str(raw_path),
            "--out", str(alpha_path),
            "--key-color", key,
            "--soft-matte",
            "--transparent-threshold", "12",
            "--opaque-threshold", "150",
            "--despill",
            "--edge-contract", "1",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return Image.open(alpha_path).convert("RGBA")


def normalize_sprite(sprite: Image.Image) -> Image.Image:
    bbox = sprite.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("Sprite is fully transparent after chroma-key removal")
    sprite = sprite.crop(bbox)
    sprite.thumbnail((SUBJECT_SIZE, SUBJECT_SIZE), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    x = (CANVAS_SIZE - sprite.width) // 2
    y = (CANVAS_SIZE - sprite.height) // 2
    canvas.alpha_composite(sprite, (x, y))
    return canvas


def keep_cell_components(
    sprite: Image.Image, core: tuple[int, int, int, int]
) -> Image.Image:
    alpha = np.asarray(sprite.getchannel("A"))
    binary = (alpha > 16).astype(np.uint8)
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, 8)
    left, top, right, bottom = core
    keep = []
    for label in range(1, count):
        area = int(stats[label, cv2.CC_STAT_AREA])
        cx, cy = centroids[label]
        if area >= 18 and left <= cx < right and top <= cy < bottom:
            keep.append(label)
    if not keep:
        raise ValueError("No connected sprite component found in expected cell")
    selected = np.isin(labels, keep)
    cleaned_alpha = np.where(selected, alpha, 0).astype(np.uint8)
    cleaned = sprite.copy()
    cleaned.putalpha(Image.fromarray(cleaned_alpha, mode="L"))
    return cleaned


def make_shadow(sprite: Image.Image) -> Image.Image:
    alpha = sprite.getchannel("A")
    shadow = Image.new("RGBA", sprite.size, (32, 29, 43, 0))
    shadow.putalpha(alpha)
    return shadow


def output_path(game: str, cell_name: str) -> Path:
    kind, identifier = cell_name.split("_", 1)
    return OUTPUT / f"{game}_{kind}_{identifier}.png"


def process_game(game: str, spec: dict) -> list[Path]:
    source_path = SOURCES / f"{game}.png"
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    sheet = Image.open(source_path).convert("RGB")
    cols, rows = spec["grid"]
    key = spec.get("key", "#ff00ff")
    created = []

    for index, cell_name in enumerate(spec["cells"]):
        if cell_name is None:
            continue
        with tempfile.TemporaryDirectory(prefix=f"{game}-sprite-") as tmp:
            cell, core = crop_cell(sheet, cols, rows, index)
            sprite = remove_key(cell, key, Path(tmp))
        sprite = normalize_sprite(keep_cell_components(sprite, core))
        destination = output_path(game, cell_name)
        sprite.save(destination, optimize=True)
        created.append(destination)

        if game == "shadow_match":
            identifier = cell_name.split("_", 1)[1]
            shadow_path = OUTPUT / f"{game}_zone_{identifier}.png"
            make_shadow(sprite).save(shadow_path, optimize=True)
            created.append(shadow_path)

    return created


def validate(paths: list[Path]) -> None:
    failures = []
    for path in paths:
        image = Image.open(path).convert("RGBA")
        alpha = image.getchannel("A")
        bbox = alpha.getbbox()
        corners = [alpha.getpixel(point) for point in ((0, 0), (511, 0), (0, 511), (511, 511))]
        coverage = sum(1 for value in alpha.getdata() if value > 16) / (CANVAS_SIZE**2)
        if image.size != (CANVAS_SIZE, CANVAS_SIZE):
            failures.append(f"{path.name}: bad size {image.size}")
        elif not bbox:
            failures.append(f"{path.name}: empty alpha")
        elif any(corners):
            failures.append(f"{path.name}: opaque corner")
        elif not 0.035 <= coverage <= 0.72:
            failures.append(f"{path.name}: suspicious coverage {coverage:.3f}")
    if failures:
        raise RuntimeError("\n".join(failures))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "games",
        nargs="*",
        choices=sorted(SHEETS),
        help="optional subset to process; defaults to all games",
    )
    args = parser.parse_args()
    OUTPUT.mkdir(exist_ok=True)
    all_paths = []
    selected = args.games or list(SHEETS)
    for game in selected:
        spec = SHEETS[game]
        all_paths.extend(process_game(game, spec))
    validate(all_paths)
    print(f"Generated and validated {len(all_paths)} transparent sprites")


if __name__ == "__main__":
    main()
