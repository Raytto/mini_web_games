## 2026-10-17 石层（当前入口）

四层顺序：石层 → 表土 → 沙土 → 细尘。`rock-content.js` 为内容扩展，导入原 `content.js` 的 20 种恐龙和三层土，避免重生成旧配音；后续重新生成基础内容不会丢失新增石层。石层使用现有小挖镐，18 块随机 Voronoi 多边形，每次点按整块移除；长按、划动和键盘重复不连击，清空洞不清相邻块。工具首次用起后收起，防止遮挡手机右上角石块；换层再次显示下一工具。

`rock.js` 管理几何、命中与图层，`rock-audio.js` 提供短促金属轻敲加碎石瞬态；后面三层继续使用 `scrub-audio.js`。只有全部 18 块敲完才换小铲；原土层的按住 100%／松手超过 95% 规则保留。单个石面贴图和工具复用，不按恐龙复制资源。

新增 3 条 CosyVoice 3.5 Plus 英语提示，来源 `speech-rocks.json`，独立 ASR 3/3 匹配。图像用内置 image_gen 生成，再缩放压缩为 `assets/layer-rock-v1.webp`；完整提示词、输出哈希和语音哈希见 `rock-assets.json`。不把 API 凭据、签名 URL 或原始 WAV 写入 Git。

```bash
python3 scripts/dino-dig/build-rock-content.py
DIG_BASE=https://xiaoxiao.cool CWW_JOB_RUNTIME=/path/to/runtime node tests/dino-rock.cjs
DIG_BASE=https://xiaoxiao.cool CWW_JOB_RUNTIME=/path/to/runtime node tests/dino-rock-loading.cjs
```

`tests/dino-release.cjs` 先真实敲掉 18 块石头，再回归原三土层；`tests/dino-scrub-audio.cjs` 也先进入小铲层。两个脚本继续使用原有 `DIG_ENGINE` / `DIG_EVIDENCE` 参数（音效脚本自行遍历双引擎）。新测试支持 `DIG_GAME_OVERRIDE` 仅在验收时通过浏览器路由加载待发布的单个入口文件，不创建开发副本或改变线上入口。

版本：入口 `20261017rock1`，基础物种、素材与语音资源版本仍为 `20261014dig11`；新资源使用新文件名。发布、规则和回退以知识库 `projects/mini-web-game/docs/dino-rock-layer.md` 为准。下列版本记录保留历史背景。

---

# 当前内容：每种一配色与可辨物种（dig11，2026-10-14）

当前入口/内容版本 `20261014dig11`。保留青绿色三角龙，将外形相近的戟龙、尖角龙替换为小盗龙、双脊龙，仍有 20 种；每种固定一款活体图片，不生成换色副本。按住至 100%、主动松手超过 95% 的 dig10 交互原样保留。

`build-content.py` 是活跃 20 种与当前 76 条文案的唯一来源，并生成四段新配音子集 `speech-distinct.json`。八幅独立 image_gen 源图、提示词、科学事实来源及四段 CosyVoice 3.5 Plus 录音见 `art/dino-distinct/README.md`；打包用 `uv run --with pillow --no-project python scripts/dino-dig/build-distinct-assets.py`。旧图声继续保留以便回退，运行 MP3 总计 80 段（含历史声音），不请求退役物种的素材。

旧发现记录中的两个退役 ID 原样保留存储但不计入当前 20 种；其他记录保留，新两种需要亲自发现。`tests/dino-distinct.cjs` 支持 DIG_BASE / DIG_ENGINE / DIG_EVIDENCE：仅固定随机起始物种，真实清理三层、播新名称/特征、双语名称、下一只、三种视口和旧存储兼容。全量随机轮换继续用 `tests/dino-handoff.cjs` 的 rounds 组。测试拦截统计写入。

当前内容与回退见服务器知识库 `projects/mini-web-game/docs/dino-distinct.md`。以下版本为交互维护和历史背景。

---

# Dino Dig 当前维护入口

## 2026-10-14 按住至 100%，松手超过 95% 补清（dig10）

当前交互版本 `20261014dig10`，内容与素材仍为 dig8。用户明确纠正 dig9：按住时继续清扫，不因超过 95% 而淡出、换状态或提前建议换工具；中央有效区域清理到 100% 才完成本层。主动松开鼠标/手指时，进度严格大于 95% 则帮忙渐隐残余，否则继续当前层。空格/Enter 连按视为按住，keyup 才检查辅助门槛。

`SoilLayer.complete` 要求中央有效网格全部清除。低于 1/255 的透明度余量按 8 位显示精度归零，避免重复乘法无限趋近于 100% 而无法完成；不会将整层 99% 舍入到 100%。`finishOnRelease()` 只从有效 pointerup/keyup 调用，pointercancel、后台取消和重来不触发补清。上一层淡出未完成时记录一次释放资格；若重新按下继续擦则撤销该资格，避免定时器在新手势中提前完成。

结束后仍显示右上角下一工具，下一次点土/点工具/拖工具进入下一层。普通残土动画为 0.95 秒、减少动态效果为 0.3 秒；20 种不重复队列与大号下一只按钮保留。

当前专项 `tests/dino-release.cjs`：Chromium/WebKit 三层持续按住跨 95% 至 100%，低于 95% 松手不完成、超过 95% 松手完成三层、原生触摸、取消/后台不触发、新手势恢复、键盘松开、重来与下一只。支持 `DIG_BASE`、`DIG_ENGINE`、`DIG_EVIDENCE`。`dino-handoff.cjs` 的键盘逐次松开流程仍可用于工具/慢图片回归；`dino-continuous.cjs` 保留 dig9 历史，不能用于当前规则验收。

最新维护与回退见服务器知识库 `projects/mini-web-game/docs/dino-release.md`。下方版本仅为历史记录。

## 2026-10-14 按住达到 95% 即淡出（dig9，已被用户纠正）

当前交互版本 `20261014dig9`，内容/图片/声音沿用 dig8。中央覆盖率门槛从 98% 调整为 95%；达标时立即启动本层残土淡出（普通 0.95 秒、减少动态效果 0.3 秒），不必松手或再次点按才看见变化。手指/鼠标的原有捕获保留到松手，不再在门槛处强制取消；旧手势不穿透下一层。右上角新工具此时可见并发光，松手后可点工具、拖工具或直接触土接着挖。

`offerTool()` 启动淡出，`takeTool()` 只换工具而不重新开始淡出；最终层也在同一门槛自动淡出揭晓。后续素材较慢时仍能淡出当前层，因下一张露骨画面已在当前层开挖前就绪；更后面的图片到齐后启用新工具，不自动切层。暂停、重来与前后台继续取消指针/冻结计时，避免残留旧操作。

当前专项 `tests/dino-continuous.cjs` 使用真实鼠标/触摸事件持续按住跨门槛，检查三层 95% 时开始改变残土像素、直到淡出结束都不要求松手、下一工具与下一只、慢素材、后台暂停与重来。支持 `DIG_BASE`、`DIG_ENGINE=chromium|webkit`、`DIG_EVIDENCE`。`dino-handoff.cjs` 的门槛、main/network 流程已同步；unified/layouts/touch 等继续检查原控制方式。历史“达标取消手势、接工具才淡出”的预期不再适用。

当前发布与回退见服务器知识库 `projects/mini-web-game/docs/dino-continuous.md`；下方各版本保留历史背景。

## 2026-10-13 二十种恐龙与主动下一轮（dig8 历史）

当前版本 `20261013dig8`。20 种恐龙入场即全量洗牌，第一只也随机；每轮队列内不重复，20 种用尽后重新洗牌，若第一只与刚玩过的相同则与第二只交换。重新打开游戏开始新队列；发现图鉴跨访问保存，队列与半途挖掘只保留在当前页面。重来按钮仍重新挖当前只。

挖完后自动揭晓活体，底部出现明显的绿色大按钮 “Next dinosaur!” / “下一只恐龙！”，带箭头与英语引导；等待不会自动切换。点按或键盘激活后只推进一次，短告别后开始队列下一只。右上角统一工具、中央 98% 与残土渐隐沿用 dig7。当前轮结束释放旧恐龙图片与土层画布；图片只预取当前物种，避免一次加载 20 种。

`build-content.py` 是 20 种资料和 76 条保留配音文案的内容源。新增 14 种名称、特征与下一轮提示共 29 段，子集 `speech-twenty.json`；`speech-twenty-retry.json` 为重录的 3 段。CosyVoice 3.5 Plus，29 段均 ASR 严格匹配；转写不能代替真人听审。DigVoice 接受 dd1_ 至 dd5_。

新增 56 张独立源图和 56 张运行 WebP，原图、来源与完整提示词在 `art/dino-twenty/`。14 种各有活体、少量露骨、部分露骨、完整化石。源图由内置 image_gen 分别生成；运行版只压缩/缩放及透明边界整理，不用代码绘画替代图像。逐图签名与大小见 `asset-manifest.json`，物种事实出处见 `species.json`。这是一套儿童简化插画，不是精确骨骼图谱。

```bash
python3 scripts/dino-dig/build-content.py
uv run --with pillow --no-project python scripts/dino-dig/build-twenty-assets.py
DIG_BASE=http://127.0.0.1:18866 DIG_EVIDENCE=/path/to/evidence DIG_GROUPS=rounds,randomStarts node tests/dino-handoff.cjs
```

当前交互验收用 `tests/dino-handoff.cjs`；`discovery` 检查大按钮、六视口、语言与不自动推进；`rounds` 完成 20 种全部 60 层并进入第 21 轮、检查跨袋相邻不重复；`randomStarts` 检查五次首只随机及不请求其他物种图片。`main,unified,layouts,network,touch,audio` 继续验证原交互和声音。可设 `DIG_ENGINE=webkit`。

发布与回退见服务器知识库 `projects/mini-web-game/docs/dino-twenty.md`。以下旧版本段落仅为历史背景。

---

## 2026-10-13 统一右上角工具（dig7 历史）

当前版本 `20261013dig7`。第一把小铲和后续软刷、细毛刷统一出现在挖掘画面右上角，新工具发光提示。工具只是提示入口：可点击、从按钮拖出，或直接触摸挖掘区域开始使用，包括首次进入。按下即停止光效并收起按钮，松手恢复普通图标；只有下一件新工具再次发光。底部不再重复放置工具，释放空间给挖掘画面。

中央 98% 清理门槛、残土 0.95 秒渐隐、减少动态效果 0.3 秒、后台暂停和最终自动揭晓继续保留。新工具图片未就绪时保留当前层；就绪后仍等下一次用户操作，直接触土即可换层并开始清扫。键盘 Enter / 空格同样可直接开始。换层门槛会取消当前手势，持续按住不会穿透下一层。

新增 3 条 CosyVoice 3.5 Plus 引导明确说明可直接触摸土面；子集 `speech-unified-tools.json`，累计 47 段。原 WAV、成品签名和 ASR 在 `art/dino-unified-tools/`，DigVoice 接受 dd1_ / dd2_ / dd3_ / dd4_ ID。

当前验收使用 `tests/dino-handoff.cjs`，参数 DIG_BASE、DIG_ENGINE、DIG_EVIDENCE，分组 DIG_GROUPS=unified,main,layouts,network,rounds,audio,touch。unified 覆盖首次发光、直接触土、拖工具、按下隐藏/松手无光恢复、后续直接触土换工具和键盘。其余组验证中央门槛、真实像素渐隐、六视口、慢图、六恐龙全轮换、实际声音和真实触摸事件。旧 dig5 及更早的自动切层/阶段条测试不是当前流程验收入口。

发布与回退见服务器知识库 `projects/mini-web-game/docs/dino-unified-tools.md`。下方为历史实现说明。

---

## 2026-10-13 主动接工具与残土渐隐（dig6 历史）

当前版本 `20261013dig6`，取代下方 dig5 的自动换层方式。移除顶部阶段条；每层中央覆盖网格第 4～43 列、第 3～28 行的平均清理度达到 98% 后，右上角出现下一工具。它有缓慢呼吸光圈和星光，按钮本身不移动，便于点按。不会因播完语音或等待超时自行接过工具。

小铲 → 软刷 → 细毛刷。细毛刷复用原刷子美术、以较小尺寸显示，第三层保留较轻的清扫力度，不新增大图。点击接过，或从按钮拖出超过 5px 后接过；拖动保留指针捕获、显示跟随工具并在同一手势中清扫下一层。上一层保留的边缘残土按 smoothstep 在 0.95 秒内淡出，新层已经可操作；减少动态效果为 0.3 秒。最终层同样先淡出残土，再揭晓。后台暂停使用游戏时钟冻结淡出；重来取消旧淡出与工具交接。

状态为 loading / dig / toolReady / finishing / revealed / alive / departing，淡出是独立于 dig 的过渡记录。下一层图片未到时保留当前层、暂禁用新工具，自动恢复后发光并等用户接过，不自动换层。新工具的资源沿用原自动重试。

新增 4 段 CosyVoice 3.5 Plus 英语，文案源为 build-content.py，子集 speech-handoff.json；44 段历史累计资源保留，dd3_ 格式纳入 DigVoice 校验。新语音、成品签名、原 WAV 和 ASR 留在 art/dino-handoff/。

当前交互验收入口为 `tests/dino-handoff.cjs`：DIG_BASE、DIG_ENGINE、DIG_EVIDENCE，分组选项 DIG_GROUPS=main,layouts,network,rounds,audio,touch。覆盖中央 98% 门槛、保留残土、用户主动换工具、真实像素渐隐、拖动连续性、暂停/重来、六种视口、慢图等待、六恐龙全轮换、配音与 Chromium 真触摸事件。旧 dino-dig / dino-loading / dino-startup 脚本保留此前版本的阶段条和自动换层断言，不能直接用其旧交互预期验收 dig6。

发布与回退见服务器知识库 `projects/mini-web-game/docs/dino-tool-handoff.md`。

---

## 2026-10-13 全屏布局、软刷与轻量加载（dig5 历史）

当前版本 `20261013dig5`。松散表土用小铲，出现骨头后两层均用软刷；第二层名为 Sandy soil，第三层为 Fine dust。`dd2_first_glimpse`、`dd2_sand`、`dd2_sand_done` 为新增 CosyVoice 3.5 Plus 配音，转写 3/3 匹配。旧小镐文件与历史录音保留，但不再在玩法中请求。下方旧版本条目为历史说明。

画布使用 692×520 的裁剪视口，内部仍以原 720×600 逻辑坐标绘制；显示和输入坐标分别平移 (-14,-38)/(+14,+38)，保持化石长宽比例。ResizeObserver 按可用区域等比放大，顶部和底部控件压缩，横屏提示与工具放侧边。尺寸变化不重建擦除遮罩。

运行地层及营地引用 `-lite.webp` 变体，源 WebP 和原 PNG 保留。再生成命令：

```bash
uv run --with pillow --no-project python scripts/dino-dig/optimize-runtime-images.py
```

`runtime-images.json` 保存 22 张变体的来源、尺寸、字节和 SHA256；质量 66，营地最长边 1200，地层仍为 936×630。资源总体 5,914,590 → 3,074,438 字节，原图文件不覆盖。

第一层只等待表土、首次露骨图与铲子；背景低优先级独立加载，开挖后准备本物种后续层、刷子和活体。后续层缺图时保留当前成果并等待自动恢复，不越过缺图进入空白层；活体缺图时保留完整化石。原自动重试、取消旧轮次与后台暂停继续有效。首轮必需图片 1,516,786 → 326,954 字节，这不是外网加载时长承诺。

内容生成仍从 build-content.py 统一输出，新增录音文案子集为 speech-soft-tools.json，原始 WAV、指纹、成品清单与 ASR 在 art/dino-soft-tools/。DigVoice 接受 dd1_ 和 dd2_ 两组 ID，仍有格式校验及缓存上限。

新增 `tests/dino-startup.cjs` 注入后续图等待，验证提前开挖、下一层自动恢复、软刷匹配与无小镐请求；使用标准 DIG_BASE / DIG_ENGINE / DIG_EVIDENCE。`tests/dino-soft-audio.cjs` 验证 Chromium/WebKit 的新录音请求与播放，支持 DIG_BASE / DIG_EVIDENCE。既有 dino-dig.cjs 和 dino-loading.cjs 已适配裁剪坐标与首层必需图。

工具选择的游戏化参考：[NPS Agate Bonebed](https://www.nps.gov/agfo/learn/nature/agate-bonebed.htm) 关于骨头显露后使用软刷清理的说明；不是完整的现场发掘流程教学。发布、证据与回退以知识库 dino-space-tools.md 为准。

---

# 小恐龙考古队 / Dino Dig

2026-10-13 分层画面改版：当前资源版本 `20261013dig4`，当前流程与新素材见下方“逐层露骨画面”。同日首屏加载修复 `20261013dig3` 继续保留。正常进入自动开始；单张图片失败自动重试，成功后继续当前轮，不再要求孩子点“重新加载”。专项原因、证据与本次回退见服务器知识库 `projects/mini-web-game/docs/dino-loading.md`。

## 图片自动恢复

`image-loader.js` 负责当前轮图片的自动获取与恢复：保留成功图片，仅重试失败项；失败后依次等待 0.4 / 1.2 / 3 / 8 / 15 秒（之后上限 15 秒）。单次请求的停滞保护为 15 / 30 / 60 秒，正常慢图片在窗口内仍会被接受，不再在 6.5 秒后断开回调并永久等待人工操作。网络恢复、页面回到前台时主动唤醒；后台暂停新的重试，离开页面或重来时取消旧任务。

不能用 `navigator.onLine` 阻止图片请求：实际 WebKit 验证曾出现该字段为 false、HTTP 请求仍正常的情况。以实际请求结果为准，online 事件只用于提前唤醒。

营地背景完成后即显示，当前轮全部必需图片就绪后自动开场与语音引导。加载期从表土第 1 层显示，不能显示化石拼图或三层完成。工具按钮复用加载成功的地址，后续图片出错也自动修复，保留当前挖掘进度。旧手动重试入口隐藏；模块本身加载失败时仍保留页面引导与故障重试兜底，正常模块启动不显示重试按钮。

`tests/dino-loading.cjs` 覆盖单次失败、8.5 秒迟到图片、短暂断网/重连、后台暂停恢复、真正卡住请求的超时恢复、加载中重来、离开后的任务取消、工具图片自动恢复；观察实际页面与触摸结果，不写游戏内部状态。命令与 `dino-dig.cjs` 相同的 `DIG_BASE` / `DIG_ENGINE` / `DIG_EVIDENCE` 变量，子集用 `DIG_LOADING_GROUPS=initial,slow,outage,watchdog,lifecycle,tool`。既有 `resources` 验收也改为等待自动恢复，不再手动点按钮绕过。

2026-10-13 当前更新：体验优化版增加持续无进展时的剩余土块提示，保留三层与局部挖掘；当前配音 37 段，新增一条的文案/清单/ASR 在 `art/playtest-polish/20261013/dino-dig/`。设计与验证见 [三款体验优化](../latest-three-polish/README.md)。下文 36 段与原素材数量描述第一版资源库。

2026-10-13 首版上线，后续改版为 `20261013dig4`。运行目录 `frontend-game/games/dino_dig/`；首页第 6 张，年龄 3 岁起。服务端静态发布与回退以服务器知识库 `projects/mini-web-game/docs/dino-dig.md` 为准。

## 内容与操作

`build-content.py` 是六种恐龙、三层土、工具和当前 37 条英语文案的唯一内容源。运行 `python3 scripts/dino-dig/build-content.py` 生成 `content.js` 与 `speech-lines.json`。名称分别为三角龙、剑龙、霸王龙、腕龙、甲龙、副栉龙；霸王龙在配音中说完整的 Tyrannosaurus rex，短标签仍为 T. rex。三个营地为林地、峡谷、海岸。

第一轮固定三角龙，其余五种随机不重复；整袋用完重排，避免相邻重复。每轮按表土 / 泥层 / 细沙依次挖掘，自动提供铲子 / 小挖镐 / 软毛刷。点按、按住、划动及从工具按钮拖入均可；每层下面直接显露下一张完整画面：完整泥土 → 少量骨尖 → 大部分骨架 → 完整化石。最后不再拼图或额外点选；完整化石停留至少 1.8 秒，当前反馈说完后自动想象恐龙活着的样子，认识名字与特征，再换下一轮。键盘方向键移动挖掘位置、空格挖当前位置、回车挖提示处；没有计时挑战或失败结算。

`soil.js` 为每层保留独立的 720×600 遮罩画布和 48×32 覆盖网格。笔刷只擦除实际经过的位置，半径 76，中心半径 44；三层强度 .78 / .55 / .42。覆盖率达到 .86 后自动清掉零碎边角，防止儿童反复找残渣。层间取消旧手势并等待反馈，不让一次持续按住贯穿下一层。网格只用于进度与提示，画面直接来自局部透明擦除。空闲 4 秒显示剩余土块提示，语音提醒另有限频。

原版四个竖向图块的拼图按用户后续反馈移除；`piece-layouts.js` 与旧分块图保留为历史资源，运行时不再导入或请求。骨骼、土层和活体均为学习游戏的简化插画；地层顺序服务于操作节奏，不是特定地质剖面。认识恐龙时明确说“Let us imagine our dinosaur alive!”。

发现记录保存在 `xiaoxiaoDinoDiscoveries`；仅记已发现物种，不存当前挖掘。重来重新挖当前化石。后台停止声音、指针及流程计时，回来保留进度。减少动态效果时停用粒子和摆动；声音、图片与存储故障有降级或重试。

## 逐层露骨画面

内置 `image_gen.imagegen` 制作 20 幅新源图：两张共同地层材质（表土与深层土参考），六种恐龙分别三张（少量露骨 / 大部分显露 / 完整化石）。原图和逐图提示词、引用关系在 `art/dino-depth/20261013/source/` 与 `prompts.json`，输出签名、尺寸、字节数在 `asset-manifest.json`。运行时只使用 19 幅，深层空土仅供生成参考。

先用既有化石设计与共同土质生成各物种半露图，再围绕同一画面覆盖更多泥土或清除泥土，保持头身尾朝向和位置；三角龙先测试两种露出程度，再延续半露图制作完整图。绘画是游戏化插画，非精确骨骼图谱。

```bash
uv run --with pillow --no-project python scripts/dino-dig/build-depth-assets.py
```

只进行全画幅缩放和 WebP 编码，不拼贴或程序绘制替代生成图；输出均为 936×630、质量 86。`--partial` 只用于美术进行中的局部检查，发布必须确认 manifest 的 `complete` 为 true。`assets/depth/` 保存新图。`soil.js` 擦除三个独立的完整地层图，底图为本物种完整化石，全部按相同 SURFACE 矩形对齐，最后淡出沙坑并显现活体。

每轮必需图片 9 张：当前营地、活体、三件工具、表土、本物种三张露出图。失败/慢加载仍由既有 `image-loader.js` 自动恢复。第一层完成的语音改为既有 `dd1_first_glimpse`；第二、三层继续使用 `dd1_earth_done`、`dd1_dust_done`，随后接想象、名称与特征。保留 37 段原语音源，旧拼图语音不再请求，无需重复录音。

## 美术维护（首版历史资源）

22 张独立原图由内置 `image_gen` 工具生成，无 CLI 回退。源 PNG、单张来源记录与完整提示词在 `art/dino-dig/20261013/`；`prompts.json` 保存后续 21 张提示词，首张林地的提示词保存在 `site-forest.source.json`。原件位于 `source/*.png`。6 张化石、6 张活体、3 个场景、3 层纹理、3 件工具和 1 张封面。

使用带 Pillow 的环境运行：

```bash
python scripts/dino-dig/build-assets.py
```

输出 46 张 WebP（含 24 块化石拼图与首页封面），共 2,897,114 字节；透明主体沿用生成的 alpha。`asset-manifest.json` 记录源图与成品 SHA256、尺寸及裁剪，`contact-sheet.jpg` 供复核。分块裁剪坐标作用于已整理后的化石画布，完整处理算法以脚本为准。运行图在 `frontend-game/games/dino_dig/assets/`，封面在 `frontend-game/assets/thumbnails/dino-dig-v1.webp`。

## 配音维护

统一用 CosyVoice 3.5 Plus 与已有 guide / teddy 音色，不使用浏览器朗读。只在隔离工作副本生成，不把凭证写入产物。

```bash
python3 scripts/english-learning/generate-speech.py \
  --env-file /srv/data/chatgpt-work/config/app.env \
  --lines scripts/dino-dig/speech-lines.json \
  --out frontend-game/games/dino_dig/audio \
  --raw-dir art/dino-dig/20261013/voice-raw
python3 scripts/game-voices/verify-speech.py \
  --env-file /srv/data/chatgpt-work/config/app.env \
  --lines scripts/dino-dig/speech-lines.json \
  --audio frontend-game/games/dino_dig/audio \
  --out art/dino-dig/20261013/asr \
  --reviews scripts/dino-dig/reviewed-clips.json --workers 2
```

完整清单移至 `art/dino-dig/20261013/voice-manifest.json`，运行 audio 仅保留 MP3。第一版 36 段合计 949,584 字节，全部逐条 ASR 严格匹配，无人工放行项；ASR 不代替真人听审。新声音或资源变更须同步独立模块和引用版本以避开长缓存。

只加载当前轮所需图像与当前要播放的声音，解码声音缓存最多 32 段。首页进入复用外层已解锁的 AudioContext，外层将 dino_dig 纳入英语模式并暂停 BGM；静音、重听与后台取消沿用共用播放逻辑。

## 浏览器验收

`tests/dino-dig.cjs` 通过真实点按 / 鼠标划动 / 拖动 / 键盘推进，不修改游戏状态。默认覆盖空间擦除、全部六种恐龙、五种视口、生命周期、缺图/缺音恢复、存储受限，以及首页进入自动声音。

```bash
DIG_BASE=http://127.0.0.1:18848 \
  DIG_EVIDENCE=/path/to/evidence/chromium node tests/dino-dig.cjs
DIG_ENGINE=webkit DIG_BASE=http://127.0.0.1:18848 \
  DIG_EVIDENCE=/path/to/evidence/webkit node tests/dino-dig.cjs
```

可用 `DIG_GROUPS=spatial,allDinosaurs,layouts,lifecycle,resources,audio` 选择组；`PLAYWRIGHT_MODULE` 可指定安装路径。当前脚本中浏览器可执行路径按服务器已有版本配置。生产测试拦截统计接口，避免写入自动试玩事件。

## 参考边界

玩法循环参考 Yateland 的 [Dinosaur Park 官方介绍](https://yateland.com/apps/dinosaur-park/)：发现化石、组装并认识恐龙。本站的三层空间擦除与单工具为低龄适配；本次改为逐层露骨并自动揭晓，素材均独立制作，没有复用商业原作图片或声音。物种特征参考自然历史博物馆等基础资料；不作为精确古生物骨骼图谱。
