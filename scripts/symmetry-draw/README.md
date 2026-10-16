# Symmetry Draw / 对称画

2026-10-16 上线，游戏 ID `symmetry_draw`，首页第 2 张卡片。实现位于 `frontend-game/games/symmetry_draw/`；入口复用全站 Home 按钮、语言选择、统计和已解锁的英语音频环境。没有新增服务或数据库改动。

## 玩法和维护边界

- 2、4、6、8 等分，默认 6。第一条轴竖直，两等分表现为左右镜像。`engine.js` 使用 `D_(n/2)` 的旋转与反射变换；相邻扇区为镜像，不是单纯旋转复制。在任意扇区落笔都有效。
- 10 色、三档画笔/橡皮擦、撤销/重做、新画纸确认。切换模式只改变后续笔画；每笔保存自身模式，所以既有画作保留。橡皮擦按当前模式同步擦除。点击颜色会自动回到画笔。
- 虚线可以开关，位于独立 SVG 图层，不写入画作。保存导出白底 1200×1200 PNG，提供预览、下载、可用时的系统分享，以及手机长按图片的提示。不会声称文件已经保存到相册。
- 画布使用 Pointer Events 和 pointer capture；只跟踪第一个落笔指针，忽略同时出现的其他指针。取消、失去捕获、切后台或离开页面会收好当前笔画。尺寸变化不重建画布，不丢图。
- 草稿保存在当前浏览器的 `xiaoxiaoSymmetryDraw.v1`。包含颜色、笔粗、模式、工具、虚线状态、底图及操作记录。超过 120 条操作或 80,000 个点时合并较早笔画为底图，保留近期撤销；很长的一次手势会分段。新画纸同样可以撤销。草稿仅保留当前一张，清理浏览器数据会清除它，保存 PNG 是独立的文件导出。
- 拒绝读取损坏、不符合版本或越界的草稿。存储受限/配额不足时提示用户保存 PNG，画笔和下载仍可使用。
- 全尺寸颜色按钮为 44×44 px；手机竖屏使用两排颜色，低高度横屏使用左工具、右画板。小屏优先保证画板、颜色和工具可达。

## 英语语音

沿用 CosyVoice 3.5 Plus / Pip，共 18 段：开场、四种等分、画笔/橡皮擦、作品准备好和十种颜色。`speech-lines.json` 是文案与方向的权威来源；成品、模型、测量和 SHA 在游戏 `audio/manifest.json`。`voice-check.json` 保存本次独立 ASR 的匹配证据。

从合集点击卡片会借用父页面音频环境并自动开场；直接打开页面时服从浏览器自动播放限制，在首次交互解锁。语音可关闭；切后台停止，过期下载不会补播，网络失败不影响作画。没有周期闲置催促。

重新生成时使用唯一工作区、持静态发布锁，不创建开发副本。生成原 WAV 只写任务运行目录，验收后删除：

```bash
python3 scripts/english-learning/generate-speech.py --env-file /srv/data/chatgpt-work/config/app.env --lines scripts/symmetry-draw/speech-lines.json --out frontend-game/games/symmetry_draw/audio --raw-dir "$CWW_JOB_RUNTIME/symmetry-voice-raw"
python3 scripts/game-voices/verify-speech.py --env-file /srv/data/chatgpt-work/config/app.env --lines scripts/symmetry-draw/speech-lines.json --audio frontend-game/games/symmetry_draw/audio --out "$CWW_JOB_RUNTIME/symmetry-asr"
```

## 原创封面与验证

`make-cover.cjs` 用游戏的真实镜像引擎绘制花形，再以 Canvas 排成 720×450 WebP 封面，输出到 `assets/thumbnails/symmetry-draw-v1.webp`。没有外部图片或字体依赖。`COVER_RUNTIME` 必须指向任务过程目录，用于少量生成中间件；默认读取同一工作区的临时静态 HTTP 服务 18879，也可指定 `SYMMETRY_BASE`。

`tests/symmetry-draw.cjs` 通过真实浏览器输入验证反射几何、任意扇区、中心点、同步擦除、撤销/重做、换纸确认、模式与尺寸切换、草稿恢复、长会话合并、存储/语音失败、实际 PNG 下载、触屏和双指容错、颜色按钮尺寸，以及中英文的六种屏幕布局。独立几何判定按扇区边界逐片反射，不引用生产变换函数。

WebKit 对透明 PNG 的预乘/反预乘会产生少数抗锯齿边缘的 RGB 舍入。长会话合并复测要求 alpha 与完全不透明像素相同，只有透明边缘容许不超过 3/255 的可见通道偏差；本次测得最大 2.72/255。普通撤销、恢复、模式切换仍检查完全相同的画布结果。

```bash
SYMMETRY_ENGINE=chromium SYMMETRY_EVIDENCE="$CWW_JOB_RUNTIME/symmetry-chromium" node tests/symmetry-draw.cjs
SYMMETRY_ENGINE=webkit SYMMETRY_EVIDENCE="$CWW_JOB_RUNTIME/symmetry-webkit" node tests/symmetry-draw.cjs
SYMMETRY_BASE=https://xiaoxiao.cool SYMMETRY_ENGINE=webkit SYMMETRY_GROUPS=home SYMMETRY_EVIDENCE="$CWW_JOB_RUNTIME/symmetry-public" node tests/symmetry-draw.cjs
```

两个内核串行运行，测试拦截统计写入。正式站 `home` 组检查首页入口、封面、父音频环境、自动欢迎、Home 返回和中文继承。浏览器与触屏模拟不等于儿童或 iPhone/iPad 真机试玩。发布、知识库索引与 Git 回退见 PPHK 知识库 `projects/mini-web-game/docs/symmetry-draw.md`。
