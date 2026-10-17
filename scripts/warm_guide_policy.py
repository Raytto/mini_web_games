"""Apply the approved default guide by audio library and ID; preserve character voices."""
import json
from functools import lru_cache
from pathlib import Path

@lru_cache(maxsize=1)
def _policy():
    value = json.loads((Path(__file__).parent / "warm-guide" / "policy.json").read_text())
    for library, entries in value["libraries"].items():
        if not library.startswith("frontend-game/games/") or not library.endswith("/audio"):
            raise ValueError(f"Invalid audio library: {library}")
        for ident, item in entries.items():
            if item["voice_profile"] != "warm_guide" or len(item["instruction"]) > 100:
                raise ValueError(f"Invalid guide policy: {library}/{ident}")
            if item["rate"] <= 0 or not isinstance(item["seed"], int) or item["seed"] < 0:
                raise ValueError(f"Invalid guide parameters: {library}/{ident}")
    return value["libraries"]

def apply_lines(audio_library, lines):
    """Return new target rows. Changed approved text requires a deliberate policy update."""
    entries = _policy().get(audio_library, {})
    result, seen = [], set()
    for item in lines:
        ident = item["id"]
        if ident in seen:
            raise ValueError(f"Duplicate speech ID: {ident}")
        seen.add(ident)
        approved = entries.get(ident)
        if approved is None:
            result.append(item)
            continue
        if item["text"] != approved["approved_text"]:
            raise ValueError(f"Update warm-guide policy for changed text: {audio_library}/{ident}")
        result.append({**item, **{key: approved[key] for key in ("voice_profile", "instruction", "rate", "seed")}})
    return result
