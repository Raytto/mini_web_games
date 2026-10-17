import {LAYERS as SOIL_LAYERS,DIG_LINES as SOIL_LINES} from './content.js?v=20261014dig11';
export {DINOSAURS,TOOLS,VERSION} from './content.js?v=20261014dig11';
export const LAYERS=[{"id": "rock", "tool": "pick", "en": "Rock crust", "zh": "薄薄的石头层", "color": "#999181", "clip": "dd5_rock_tap", "done": "dd5_rock_done"},...SOIL_LAYERS];
export const DIG_LINES={...SOIL_LINES,...{"dd5_pick_start": "Let's tap the rocks with our little pick.", "dd5_rock_tap": "Tap a rock, and watch a big piece come away!", "dd5_rock_done": "The rocks are gone. Now we can use our little shovel."}};
