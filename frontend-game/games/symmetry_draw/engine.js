// Each pair is a rotation and its reflection: D_(parts / 2), not a radial stamp.
// The first axis is vertical, so two parts behave like a familiar left/right mirror.
export const SIZE = 1200;
export const MODES = [2, 4, 6, 8];
export const COLORS = [
  ['red', '#e36e64', '红色'], ['orange', '#e49a40', '橙色'],
  ['yellow', '#dfb941', '黄色'], ['green', '#80a878', '绿色'],
  ['teal', '#53a59d', '青色'], ['blue', '#648fbe', '蓝色'],
  ['purple', '#9e85bf', '紫色'], ['pink', '#d58da8', '粉色'],
  ['brown', '#997353', '棕色'], ['black', '#424b49', '黑色']
];
export const PEN_SIZES = [8, 20, 38];
export const ERASER_SIZES = [30, 60, 100];

export function copies(x, y, parts) {
  const result = [], px = x - SIZE / 2, py = y - SIZE / 2;
  for (let k = 0; k < parts / 2; k++) {
    const angle = k * 4 * Math.PI / parts, c = Math.cos(angle), s = Math.sin(angle);
    result.push([600 + c * px - s * py, 600 + s * px + c * py]);
    result.push([600 - c * px - s * py, 600 - s * px + c * py]);
  }
  return result;
}

function clipPaper(ctx) {
  ctx.beginPath(); ctx.arc(600, 600, 600, 0, Math.PI * 2); ctx.clip();
}

// Stroke all symmetry copies as one path. This avoids cumulative dark seams
// when copies coincide on an axis, and also treats single taps as round dots.
export function segment(ctx, stroke, from, to) {
  ctx.save(); clipPaper(ctx);
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const starts = copies(from[0], from[1], stroke.parts), ends = copies(to[0], to[1], stroke.parts);
  ctx.beginPath();
  if (from[0] === to[0] && from[1] === to[1]) {
    for (const [x, y] of starts) { ctx.moveTo(x + stroke.width / 2, y); ctx.arc(x, y, stroke.width / 2, 0, Math.PI * 2); }
    ctx.fill();
  } else {
    starts.forEach(([x, y], i) => { ctx.moveTo(x, y); ctx.lineTo(...ends[i]); });
    ctx.stroke();
  }
  ctx.restore();
}

export function action(ctx, item) {
  if (item.type === 'clear') { ctx.clearRect(0, 0, SIZE, SIZE); return; }
  const points = item.points;
  if (points.length === 1) { segment(ctx, item, points[0], points[0]); return; }
  // Replay uses exactly the same segments as live input, including the first dot.
  segment(ctx, item, points[0], points[0]);
  for (let i = 1; i < points.length; i++) segment(ctx, item, points[i - 1], points[i]);
}

export function hasInk(baseInk, actions) {
  let ink = baseInk;
  for (const item of actions) {
    if (item.type === 'clear') ink = false;
    else if (item.tool === 'pen') ink = true;
  }
  return ink;
}

export function validateDocument(value) {
  if (!value || value.version !== 1 || !MODES.includes(value.parts) ||
      !Array.isArray(value.actions) || value.actions.length > 160 ||
      typeof value.base !== 'string' || value.base.length > 5000000 ||
      (value.base && !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value.base))) return null;
  let points = 0;
  for (const item of value.actions) {
    if (item?.type === 'clear') continue;
    if (item?.type !== 'stroke' || !MODES.includes(item.parts) ||
        !['pen', 'eraser'].includes(item.tool) || !COLORS.some(c => c[1] === item.color) ||
        ![...PEN_SIZES, ...ERASER_SIZES].includes(item.width) ||
        !Array.isArray(item.points) || !item.points.length) return null;
    points += item.points.length;
    if (points > 150000) return null;
    if (item.points.some(p => !Array.isArray(p) || p.length !== 2 ||
        p.some(n => !Number.isFinite(n) || n < -SIZE || n > SIZE * 2))) return null;
  }
  return value;
}
