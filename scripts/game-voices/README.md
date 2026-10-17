# 旧款游戏的英语配音维护

当前两库保留 1,679 段 CosyVoice 3.5 Plus 语言录音（本库 880、三款共用库 799，含历史录音；音乐与音效不计入）。共享目录保留原 26 款的映射，引用 690 个音频 ID、覆盖 899 个事件／内容组合。Teddy 与 Peekaboo 为百词库版；小鱼喂喂喂当前使用独立库、22 种伙伴／132 帧动画，旧映射保留为历史，详见[喂鱼维护](../feed-fish/README.md)。未来继续使用阿里云 `cosyvoice-v3.5-plus`，按场景选择已确认的儿童角色。

2026-09-30 听力优先版 `20260930lf1` 首次发布时：全站 29 款游戏以英语语音引导，文字仅作辅助；两库保留 1,275 段（本库 826、三款共用库 449）。该次新增 556 段场景短句，旧 719 段字节保留。当时目录实际引用 663 个音频 ID、覆盖 845 个事件／内容组合。下文有明确版本的数量保留为历史记录。

## 内容和音色

用户要求“语音第一、文字辅助”。新增或改造游戏时，必须能靠声音与图片理解操作：入口说清楚玩法，点到物品用自然短句介绍（例如 “This is a panda.”）；切水果与戳气球按用户最新要求只说简短名称（例如 “Apple!”、“Star balloon!”），任务型游戏说当前可操作的要求，选错后给英文提示，成功后鼓励并接下一步。不要把熊猫读作 bear，喂鱼图片里的橙白条纹小丑鱼应读 clownfish；以现场图片与数据为准。自由调色、涂鸦和装扮保留自由探索，不强加答题限制。

`listening-design.json` 记录 29 款的场景设计；实际文案以两套 lines 清单为准，事件以 coverage 和代码为准。旧句子保留在生成清单中供回滚，构建脚本只把正在引用的片段送到浏览器。

- `lines.json` 是本批合成文案、重读词、情绪指令、语速、seed 与音色角色的权威来源。英文教学名词清楚完整，语气有变化；不要用吞音或含糊的奶音表达童声。
- `coverage.json` 管理游戏事件、实际数据 ID 与音频 ID 的映射。每个随机动物、物品、颜色、工具都应有对应项；新文案的冗余展示字段由构建脚本从 `lines.json` 更新，不单独编辑。
- 使用已确认的 Sunny (`guide`)、Pip (`pip`)、Teddy (`teddy`)；音色 ID、设计及合成接口维护见 [既有配音说明](../english-learning/README.md)。Sunny 用于清晰的名词、步骤和场景说明；Pip 用于色彩、动作、乐器与活泼反馈；Teddy 用于喂食、收拾、洗澡及温和鼓励。
- `frontend-game/games/shared/voice-catalog.js` 是生成结果；不要手改。新音频在 `shared/voice/audio/`，复用音频仍在 `english_shared/audio/`，避免复制同一份录音。
- 原始 WAV、生成指纹、每段 MP3 的 SHA 和独立识别记录保存在 `art/game-voices/cosyvoice-20260930/`。重录只影响变更片段；不要整库无条件再收费合成。

## 生成与核对

在工程根执行。密钥只从服务器安全位置 `/srv/data/chatgpt-work/config/app.env` 的 `DASHSCOPE_API_KEY` 读取，不复制到工程、日志或浏览器。

```bash
python3 scripts/english-learning/generate-speech.py \
  --env-file /srv/data/chatgpt-work/config/app.env \
  --lines scripts/game-voices/lines.json \
  --profiles scripts/english-learning/voice-profiles.json \
  --out frontend-game/games/shared/voice/audio \
  --raw-dir art/game-voices/cosyvoice-20260930 \
  --workers 3

python3 scripts/game-voices/verify-speech.py \
  --env-file /srv/data/chatgpt-work/config/app.env \
  --audio frontend-game/games/shared/voice/audio \
  --out art/game-voices/cosyvoice-20260930/asr --workers 4

python3 scripts/game-voices/build-catalog.py
python3 scripts/game-voices/build-catalog.py --check
node tests/game-voice-coverage.cjs
```

成品为单声道 24 kHz、80 kbps MP3，响度目标 -18 LUFS，峰值目标 -2 dBTP。原始音高和节奏保留。当前本库 880 段成品合计 23,222,960 字节。生成脚本按完整请求指纹和输出 SHA 续跑，修改文本、指令、音色或 seed 会重新生成对应片段；`--only` 适合修复单段，完成后全量缓存续跑以重建完整清单。

质检使用独立 `qwen3-asr-flash`，逐段提交 MP3，不给预期文本或词表。它只负责识别检查，合成模型仍为 CosyVoice。依据：[阿里云 ASR 官方 API](https://help.aliyun.com/zh/model-studio/qwen-asr-api-reference)。新一轮修复后须再次识别对应 SHA。未解决的转写差异或失败会让脚本非零退出；生成过程中可用 `--available` 暂跳过尚未生成的文件，不能作为最终验收。

听力优先版的本库 825 段独立转写归一后对应，1 段为既有 bee／B 同音复核；喂鱼版另增 24 段，独立 ASR 全部对应，记录在 `asr-feed-fish-reef2/`。听力优先版三款新增 133 段中 131 段对应，pear／pair、sun／son 两段为完全同音词转写。复核均记录在 `reviewed-clips.json`，绑定 SHA 和预期／实际文本。复核只对指定 SHA、原文和转写同时匹配时有效；重新生成即自动失效。不要以更改期望文本掩盖错误发音。自动识别不能替代真人听感评价。

## 切水果与戳气球简短命名（20261001short1）

2026-10-01 用户要求去除命中时的 This is／It is 等介绍前缀。18 种水果改说完整名称（如 Banana、Strawberry、Green apple；成串葡萄及成对樱桃用 Grapes、Cherries），4 种形状与 8 种颜色气球改说 Star balloon、Heart balloon、Red balloon 等。气球命中标签也去除 A，水果标签的 Grapes／Cherries 与声音一致。开场与连击庆祝、计分、动画、音量、队列策略保持。

新增 30 段使用原 Sunny／Pip 音色和 CosyVoice 3.5 Plus。权威文案是本目录 `lines.json` 中的 `arcade1_*`，对应 `coverage.json` 的 fruit_slice/fruit、balloon_pop/shape、balloon_pop/color。旧 850 段字节与元数据保留，其他游戏事件映射不变；不修改或覆盖可能被其他游戏复用的旧完整句。

新增原始 WAV、生成指纹及逐段独立 ASR 位于 `art/game-voices/arcade-short-20261001/`。需要重录时，从权威 lines 选择受影响的新 ID，传 `--only` 给共用合成脚本，原件目录用该版本的 `voice-raw/`；将 partial manifest 按 ID 合并入原正式 manifest，保留其他条目，再构建和校验 catalog。不要使用空的新原件目录整库重录。

30 段录音保持完整单词、原始音高和时序，只去掉语句前缀，发音修正可单独调整指令与语速。ASR 输入只有声音，不给预期文本；WAV 在保存时校验真实长度和格式，不对未经校验的流式 WAV 直接做预分配音频分析。

仅两页的游戏脚本和 catalog 引用升级为 `20261001short1`，共享播放器及其他页面的版本保留。新增 MP3 使用全新 ID，不会命中旧录音缓存；共享 catalog 的资源版本仍为 `20260930lf1`，避免其他游戏无故更换媒体 URL。

`tests/arcade-short-words.cjs` 逐一通过实际触屏命中播放 18 种水果和 12 种气球，检查短名称与标签、解码缓存、快速连击、单声源、静音、首页自动开场和声音失败后仍能玩；可用 `ENGINE=chromium` 或 `ENGINE=webkit`，并传 `BASE_URL`、`ARTIFACT_DIR`。现有 `tests/arcade-combos.cjs` 继续验证连击和原触屏／鼠标行为。

## 切水果原音效（20261001sfx1）

切水果重新接入一直保留的 `games/fruit_slice/slice.mp3`（9,866 字节，解码约 0.576 秒），文件字节不变。此前代码只创建未播放的 HTML Audio，实际命中用合成音效，播报时总增益为 0.12。现在首次游戏手势后按需下载并只解码一次，后续命中水果或碎片直接播放原录音；下载中或失败时立即使用原有噪声／液体音合成，不排队补播过期命中。下载限时 4 秒，失败后至少间隔 10 秒才重试，不影响计分。

划动继续使用合成风声，适配短距离、中等速度的划动。切割音效主增益为 0.85，英语说话时为 0.6，独立于英文静音开关；英语仍只读简短水果名称，增益 1.2，连击庆祝保持。音效总线上轻度压缩峰值，命中声音最短间隔 70 ms、原录音最多同时 3 个，避免一次划到多个碎片产生过大的声音。重开或离开前台停止并清理全部旧音效；回到前台后下一次新操作才再响。

仅水果入口／脚本版本更新为 `20261001sfx1`，语音播放器、catalog、MP3 和气球保持原状。手机宽度不超过 600 px 时，本游戏语音按钮移到距顶部 82 px，避开合集外层音乐按钮。`tests/fruit-slice-sfx.cjs` 支持 `ENGINE=chromium|webkit`、`BASE_URL`、`ARTIFACT_DIR`，覆盖首页真实点击、原音效解码与实际波形、播音混合、碎片、连续切割、风声、按钮隔离、前后台及慢载／失败／无音频能力；保留原 `tests/arcade-combos.cjs` 的鼠标与触屏连击回归。

## 切水果与戳气球连击（20260930combo1）

两款游戏通过 `shared/arcade-feedback.js`／`.css` 共用英文连击 HUD、命中词标签和爆炸文字。成功间隔不超过 3.2 秒时累积 `COMBO ×n`，它表示连续命中数，原分数规则不变；空点不加数，水果碎片不再算新水果。3／5／10／20／30／40／50 次分别为 Great／Amazing／Perfect／Fantastic／Brilliant／Incredible／Superstar，之后每 10 次为 Awesome。每款分别用 Sunny／Pip 生成 8 段录音；10–50 档同时清楚读出连续数量。

`coverage.json` 的 `combo` 事件优先级为 3，最高只保留一个待播反馈，普通名词不能挤掉庆祝。16 个新 ID 从 `gv_fruit_slice_combo_*` 和 `gv_balloon_pop_combo_*` 开始，全部经过独立 ASR；新文件无旧媒体缓存，MP3 查询仍为 `20260930gv1`。只有这两页的游戏／反馈 JS、反馈 CSS 和 catalog 引用更新到 `20260930combo1`，共用播放器仍为 `20260930mix1`；其余 24 页原 catalog 引用向后兼容，不必重下全库。403 段包含以上新增 16 段，原 703 个 MP3 字节保持不变。

气球用同一组归一化轮廓绘制和命中判断，离屏缓存渐变、高光、阴影与动物表情，主体轻微伸缩，绳结随曲线飘动；最多 14 个气球、48 张缓存，手机／桌面粒子上限 180／260。两款切后台暂停动画、重置连击并取消语音；重新开始前取消原计时器与动画帧，避免叠加。气球操作音效主增益为 0.32，英语播音时降至 0.12；水果的当前音效混合见上方原音效说明。语音 1.2 与背景音乐 0.04 不变。输入只在画布内响应，返回和语音按钮不产生命中。

专项验证：`BASE_URL=http://127.0.0.1:18775 ARTIFACT_DIR=/path/to/results node tests/arcade-combos.cjs`，覆盖真实滑动、鼠标／触屏连续 60 次、碎片计数、3.2 秒续击／中断、英文文字、真实解码语音、静音、后台恢复、音频失败、四种尺寸和减少动态效果偏好。

### 两款自动开场（20260930start1）

2026-09-30 排查到两个可复现的启动问题：旧入口把整库语音目录与播放器放在游戏脚本之前，挂起 `voice-catalog.js` 时画布只有背景、游戏变量尚未初始化；水果按动画帧数等首批生成，WebKit 测试环境约 10 fps 时数秒仍无水果，气球初始也在屏幕外。照片仅能确认空场，不能据此判定用户 iPad 的确切网络或帧率。

- 两页先运行连击与玩法，再用 `defer` 加载翻译、语音目录／播放器与统计。语音继续按需下载，首页手势解锁后自动播入场英语；玩法不等待音频权限、下载或播放完成。只有这两页的 `game.js` 查询版本升为 `20260930start1`，共用播放器、语音目录及 MP3 不修改。
- 首次同步绘制一个已在可操作区域内的水果／气球；水果的生成与运动、气球的运动按实际帧间隔推进，单帧最多补 100 ms，后台恢复清零计时，避免低帧率漫长空场或回来突然补出一堆物体。原连击、积分和音量保留。
- 气球命中标签从本地颜色／形状取得，语音目录未就绪也能正常戳破、计分；连击脚本下载失败时仍可基础游玩。旧 `Tap anywhere to play` 移除，加载提示仅对应玩法脚本；加载成功即隐藏，失败显示 `Try again`，声音仍通过喇叭单独重试。
- 新专项：`BASE_URL=http://127.0.0.1:18779 ARTIFACT_DIR=/path/to/results node tests/arcade-startup.cjs`；加 `ENGINE=webkit` 使用 WebKit（可由 `WEBKIT_PATH` 指定可执行文件）。覆盖首页／直链无额外手势开场、真实自然生成目标的触摸得分、挂起及失败的语音脚本／MP3、翻译慢载、无 Web Audio、10 fps、后台及重复恢复、玩法加载状态和下载失败重试。原 `tests/arcade-combos.cjs` 同时回归，避免只测试人工注入目标而漏掉自然生成。

隔离环境验收：Chromium、WebKit 各 113 项启动检查通过；Chromium 原连击 120 项、语音覆盖 701 项通过。浏览器验证使用桌面与触屏模拟，不等同于 iPad Safari 真机验收。

## 浏览器行为

`shared/game-voice.js` 是 26 款的统一播放器，`game-voice.css` 放置重听／静音按钮，各游戏自己的 JS 在真实交互成功、选错、步骤或换场景处调用 `GameVoice`。

- `begin(event, variant)` 清除上一场景的语音和任务；`cue()` 播放发现或反馈；`guide(event, variant, {announce:true})` 设置当前任务，等待反馈结束自动播出。选择其他物品时可用 `{announce:false}` 更新重听对象；`clearGuide()` 清除已完成任务；`stop()` 取消当前和待播声音。旧 `prompt()` 仅为兼容保留，三个曾经只有文字的下一步已改接 `guide()`。
- 从首页点卡片时，宿主提前解锁并保存 `gameSpeechContext(gameId)`，全部游戏借用它进入播音；离开时关闭。独立直链按浏览器自动播放权限尝试，受限时首次手势／喇叭解锁。小火车在进站时先介绍玩法，停稳且货物出现后再读具体要求。默认英语配音开启；`xiaoxiaoEnglishVoiceEnabled` 保存这 26 款的开关。重听会恢复已关闭的语音并播放当前提示。没有浏览器系统朗读回退。
- 只保留一个正在说话的声源和一个可替换的等待提示；连续快速操作不会累积长队列。冷却时间按事件设置，反馈优先级避免被低优先级点击淹没。普通玩法不等待语音；小火车发车动画结束后等待有界语音完成再自动换列。
- `pagehide`／切后台停止声音并取消旧回调；回来后要新手势才播音。图片拖放和答题仍可继续。慢下载完成也不能复活旧场景音频。
- 7 秒音频请求超时、14 秒整段序列上限；失败标示在重听按钮上，可点重试，不阻塞游戏。不在浏览器暴露任何合成凭据。
- 默认背景音乐为 0.04（原 0.1）；所有 29 款的语音播放增益为 1.2（原 1.0）。两套播放器分别由 `shared/game-voice.js` 与 `english_shared/core.js` 的 `SPEECH_GAIN` 维护，后续调整须保持一致。配音原件和 MP3 不重录、不改变音高或时长。
- 同源外层 BGM 及已登记的原生音效在说话时降至原音量的 20%，结束后恢复；当前 BGM 因此从 0.04 暂降到 0.008，且不会覆盖家长中途手动更改的音量。
- MP3 懒加载，最多保留 60 个解码缓存。当前播放器、catalog 与游戏入口 JS 为 `20260930lf1`，旧 26 款 MP3 查询版本跟随 coverage 的 `20260930lf1`，未修改的语音样式仍为 `20260930gv1`。原库 MP3 仍用 `20260930cv1`；本次原库新增 ID 不会命中旧缓存。只改播放音量时更新播放器和入口查询版本即可，不改 MP3 缓存版本。更新音频时同步改 `coverage.json` 的版本、构建结果和 26 页相应脚本／样式引用，避免媒体 30 天缓存。最新三款仍使用原播放器和自己的版本规则。

## 回归

用指向工作区的短 `TMPDIR` 路径启动 Chromium，避免 Unix socket 路径过长。`BASE_URL` 指向隔离静态服务器或正式站点，`ARTIFACT_DIR` 保存结果。Playwright／Chromium 可通过环境变量覆盖；默认使用服务器现有版本，不自动安装依赖。

```bash
BASE_URL=http://127.0.0.1:18776 ARTIFACT_DIR=/path/to/results node tests/listening-first.cjs
BASE_URL=http://127.0.0.1:18772 ARTIFACT_DIR=/path/to/results node tests/game-voices.cjs
BASE_URL=http://127.0.0.1:18772 ARTIFACT_DIR=/path/to/results node tests/game-voice-layout.cjs
BASE_URL=http://127.0.0.1:18772 ARTIFACT_DIR=/path/to/results node tests/game-voice-lifecycle.cjs
```

`listening-first.cjs` 还覆盖 29 款从首页鼠标／触屏／键盘进入自动播音、10 款隐藏提示文字后的两步实际操作、下一步真实解码、重听当前任务，以及调色排队／清空／换形状的语音。

覆盖所有游戏的真实输入、实际 MP3 解码、错选／成功、重听、静音、单声源、故障恢复、手机触屏拖动、慢响应取消和小火车等待配音；布局检查覆盖 320×568、390×844、844×390、768×1024。随机内容覆盖测试直接解析游戏数据，不能拿生成时的临时库存代替当前源码。发布还应复核首页 29 个入口、最新三款、健康接口及公网文件 SHA。浏览器验收使用 Chromium，未代表 Safari 真机或儿童试玩结论。
