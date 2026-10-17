#!/usr/bin/env python3
"""Generate the rock-layer extension without changing the existing soil content."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
rows=json.loads(Path(__file__).with_name('speech-rocks.json').read_text())
rock=dict(id='rock',tool='pick',en='Rock crust',zh='薄薄的石头层',color='#999181',clip='dd5_rock_tap',done='dd5_rock_done')
text="import {LAYERS as SOIL_LAYERS,DIG_LINES as SOIL_LINES} from './content.js?v=20261014dig11';\nexport {DINOSAURS,TOOLS,VERSION} from './content.js?v=20261014dig11';\n"
text+='export const LAYERS=['+json.dumps(rock,ensure_ascii=False)+',...SOIL_LAYERS];\n'
text+='export const DIG_LINES={...SOIL_LINES,...'+json.dumps({r['id']:r['text'] for r in rows},ensure_ascii=False)+'};\n'
p=root/'frontend-game/games/dino_dig/rock-content.js';temp=p.with_suffix('.js.tmp');temp.write_text(text);temp.replace(p)
