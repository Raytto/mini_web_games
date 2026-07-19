#!/usr/bin/env python3
"""Remove only border-connected chroma background from toy-box sprites."""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ASSETS = Path(__file__).with_name("assets")
SOURCES = ASSETS / "generated_sources"


def border_key(rgb: np.ndarray) -> np.ndarray:
    border = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]))
    return np.median(border, axis=0).astype(np.int16)


def remove_connected_background(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGB")
    rgb = np.asarray(image)
    distance = np.max(np.abs(rgb.astype(np.int16) - border_key(rgb)), axis=2)

    # Generated backgrounds vary slightly near the corners. Connected-component
    # filtering keeps similarly colored decorations enclosed by the box outline.
    candidate = (distance <= 145).astype(np.uint8)
    count, labels = cv2.connectedComponents(candidate, connectivity=8)
    border_labels = np.unique(
        np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1]))
    )
    background = np.isin(labels, border_labels[border_labels != 0])

    alpha = np.where(background, 0, 255).astype(np.uint8)
    rgba = np.dstack((rgb, alpha))
    Image.fromarray(rgba, mode="RGBA").save(destination, optimize=True)


def main() -> None:
    for state in ("open", "closed"):
        remove_connected_background(
            SOURCES / f"box_{state}_chroma.png",
            ASSETS / f"box_{state}.png",
        )
    print("Wrote transparent open and closed toy-box sprites")


if __name__ == "__main__":
    main()
