# 小游戏配音维护

本工程现有和后续新增的语言配音统一使用阿里云百炼 **CosyVoice 3.5 Plus**，模型 ID 为 `cosyvoice-v3.5-plus`（2026-09-30 用户指定）。不要退回旧 Qwen TTS、浏览器系统语音或默认成人朗读。背景音乐、动物叫声和操作音效各按原素材用途维护。

本页维护共用合成工具、三种音色和最新三款英语游戏的 799 段共用库（316 段原录音＋133 段听力场景短句＋350 段百词库配音）。其余 26 款游戏的 826 段英语语音、交互映射及独立播放器见 [全合集配音接入](../game-voices/README.md)；两套清单使用同一个模型与音色配置。

后续默认“语音第一、文字辅助”：简短英语说出当前要求、介绍刚点的真实物品，并回应选错／成功。Peekaboo 保留关帘后提问；答错介绍实际揭开的动物，答对说 “Yes! It is a…” 后庆祝。Teddy 答对说出礼物再感谢。Jelly 进入、加颜料、擦除、换形状都有英语，快速点击只保留当前与最新一次；混合色不虚构固定颜色名，重听介绍实际原料。全站任务播放器与设计准则见[全合集配音接入](../game-voices/README.md)。

## 角色和表演

`voice-profiles.json` 保存三种文字设计的卡通儿童音色及设计稿：

| Profile | 场景 | 表演方向 |
| --- | --- | --- |
| `guide` / Sunny | 动物、物品、找朋友 | 清亮好奇的小女孩；名词清晰、突出，发现新东西时有惊喜 |
| `pip` / Pip | 颜色、大小、动作 | 活泼的小企鹅男孩；明亮有节奏，颜色与动作重音明显 |
| `teddy` / Teddy | 请求、感谢、纠错 | 柔软温暖的小熊男孩；请求带期待，感谢开心，纠错轻松鼓励 |

使用清楚自然的美式英语，不用含糊奶音或故意读错音。每段在 `speech-lines.json` 单独维护 `voice_profile`、`scene`、`focus`、`instruction`、`rate` 和必要的 `seed`。关键名词可加强重音、音高变化和自然拉长；保持正常单词发音，不在文本中拼写夸张拉长的单词。`Great!`、`Thank you!` 的情绪明显，但不用提高总音量制造“兴奋”。

`instruction` 是单数参数，最多 100 个加权字符（ASCII 计 1、中文计 2）。大段音色描述放在 `voice_prompt`，不能塞进这 100 字符。可用中文表演指令指导英文输出；难词可给出押韵或音素提示，明确不添加词语或动物叫声。一般语速 0.92–1.0；不对成品强行升调或再机械减速。

## 生成

服务器端使用 `DASHSCOPE_API_KEY`；现有安全位置为 `/srv/data/chatgpt-work/config/app.env`。不要把密钥放入前端、源码、日志或清单。

```bash
python3 scripts/english-learning/generate-speech.py \
  --env-file /srv/data/chatgpt-work/config/app.env \
  --out /path/to/staging/frontend-game/games/english_shared/audio \
  --raw-dir /path/to/staging/art/english-learning/audio-cosyvoice-v35-20260930
```

先用 `--only tree,strawberry,bear,tiger,t_ask_strawberry,t_thank_you,great` 生成关键样音。全量运行默认 3 并发，可断点续跑；只有模型、音色、文本、指令、语速、seed、处理参数以及文件哈希全部匹配才会复用。原始 WAV 和每段生成记录保存在 `--raw-dir`；发布 MP3 为单声道 24kHz、80kbps、-18 LUFS、峰值 -2dBTP。全部完成后生成 `manifest.json`，局部生成只写 `manifest.partial.json`，正式发布不要带局部清单。

已有音色直接复用，无需重复创建。确需新增/重设计角色时，先修改 profile 的设计描述，并为该角色移除旧 `voice_id` / `target_model`，再执行：

```bash
python3 scripts/english-learning/design-voices.py \
  --env-file /srv/data/chatgpt-work/config/app.env \
  --preview-dir /path/to/staging/art/english-learning/voice-design
```

新音色 ID 会立即写回配置以便恢复，重新生成受影响语音时指纹会自动失效。设计音色属于同一个百炼账号与目标模型，换账号或换模型时不能直接沿用 ID。

默认语音播放增益为 1.2，由 `english_shared/core.js` 的 `SPEECH_GAIN` 设置，与旧 26 款播放器保持一致；全站背景音乐默认 0.04，保留这三款内暂停 BGM 的行为。当前音量调整版模块为 `20260930mix1`，MP3 内容及 `20260930cv1` 查询版本不变。调整播放增益无需重新合成。

## 发布前验证

检查每段解码、时长、非静音、峰值和哈希；每段分别做独立 ASR 复核，对异常单独重生成/重核；串联转写会借助前后文纠正或猜测短词，不能代替逐条检查。转写通过不能代替真人对童声与情绪的主观听审。浏览器要验证请求、连续纠错、成功鼓励、点按重听、页面后台取消以及音频失败时仍可继续玩。

更新这三款的原库时，受影响页面模块、共享 `core.js` / `library.js` 和 `audio/*.mp3` 查询版本同步更新；若该音频也被旧游戏复用，还须更新旧游戏 catalog 中对应的查询版本，避免长缓存继续播放旧声线。三款的成功动画保持最短展示时间，配音尚未结束可延长；等待最多 8 秒以免音频故障卡住游戏。仅更新 `shared/voice/audio/` 新库时，按全合集接入说明维护其独立版本。

官方接口说明：[CosyVoice HTTP 合成](https://help.aliyun.com/zh/model-studio/cosyvoice-tts-http-api)、[音色设计 API](https://help.aliyun.com/zh/model-studio/voice-design-api-references)。工程当前实现、发布和回滚以服务器知识库 `projects/mini-web-game/docs/english-learning.md` 为准。

## 100 种动物与 100 件物品（20260930v100）

Peekaboo House 与 Hello, Teddy! 各扩到 100 个不同内容，Jelly Colors 保持原 30 种模具。原始 30 项继续由 `english_shared/catalog.js` 维护；新增 70 项分别由 `vocabulary-expansion.json` 的 animals / objects 维护，不复制原词表。`build-vocabulary-expansion.py` 构建 `english_shared/vocabulary-100.js` 及 350 段对应的 `vocabulary-speech-lines.json`，并合并到完整 `speech-lines.json`。音色、模型、提示与反馈玩法沿用本页规则。需换用更清楚的完整短句时，在对应物品维护 `requestText` / `thanksText`，构建后请求文字与音频同步。发音修复写入同一源文件的 `speech_overrides`，只改表演指令、语速或 seed，再构建与重录。

新增词条不要用不同颜色、姿势或幼崽版本充当不同动物。多词名称的 `id` 使用下划线，`word` 使用空格；请求文案依 `word` 选择冠词，corn / broccoli 用 Some。两款各用完整 100 项随机袋，一轮用完才重排，跨轮不连续重复。

全部 140 张新增图片用内置 image_gen 单独生成。原图、提示词、来源及 SHA 在 `art/english-learning/vocabulary-100-v1/`；`prompts.json` 是完整图片提示词集。运行 WebP 位于 `hello_teddy/assets/objects/{id}-v1.webp`（256×256）及 `peekaboo_house/assets/animals/{id}-v1.webp`（512×512），均保留真实透明通道。缩略图由 `build-vocabulary-thumbnails.py` 在 Pillow 环境生成，原图保留；不把整张图集切片代替独立生成。分批续做前核对已保存原图与哈希，只补缺失或确有质量问题的条目，保留已验收成果。

```bash
python3 scripts/english-learning/build-vocabulary-expansion.py --check
# 在含 Pillow 的离线素材处理环境运行：
python scripts/english-learning/build-vocabulary-thumbnails.py --complete --check
# 转写检查仅用音频，不提供预期文案：
python3 scripts/game-voices/verify-speech.py \
  --env-file /srv/data/chatgpt-work/config/app.env \
  --lines scripts/english-learning/vocabulary-speech-lines.json \
  --audio frontend-game/games/english_shared/audio \
  --out art/english-learning/audio-cosyvoice-v35-20260930/asr-vocabulary-100 --workers 2
```

新图片和新音频按当前题目加载，不预下载整个词库：Teddy 每题只请求六张物品缩略图，Peekaboo 每题只请求两张动物图；问题、纠错与成功录音到实际播放时分别加载，重听复用已解码声音。词表只有轻量文字与资源路径；生成原图、WAV、素材清单不进入游戏加载链。共用 SpeechBank 最多保留 64 个已解码声音，最近使用的优先保留，淘汰后可按需重新加载。原 MP3 查询版本保持不变，新文件使用全新 ID；百词库模块及两款入口查询版本为 `20260930v100`。

首页 `frontend-game/sw.js` 的 `mini-games-cache-v3` 安装阶段只缓存四个页面壳文件，不提前下载背景音乐、旧 PNG 卡片或任何游戏整套资源。媒体仍按实际使用缓存；后续扩题也不能把图片／配音全表加入 `PRECACHE_URLS`、`config.audio` 或批量预取。旧标签页遵循浏览器正常 Service Worker 更新生命周期，不强制中途接管。

验证入口：`tests/vocabulary-100.cjs` 检查完整词库、500 条题目/反馈音频与图片对应关系和真实解码缓存；`teddy-listening.cjs` 与 `peekaboo-flow.cjs` 各连续作答 201 题，覆盖两轮完整 100 项及跨轮衔接。`vocabulary-loading.cjs` 使用全新浏览器上下文、实际启用的 Service Worker 与真实音频解码，检查首页、首题、重听、纠错和下一题的实际资源请求。另复核真实鼠标/触屏拖放、关帘后播音、首页自动播音、移动端布局与 Jelly 回归。发布须先完成全部图声及验证，不能把缺图、缺配音的词条放入随机池。

## WAV 长度校验（2026-10-01）

CosyVoice 下载的 WAV 可能保留约 2 GiB 的流式长度占位值，不能直接交给按帧数预分配的分析库。`generate-speech.py` 会在落盘和复用原始缓存前校验、修正长度；保留 PCM 字节及有效 MP3，更新原始文件哈希。下载上限 16 MiB，语音最长 30 秒，普通截断或非 24kHz/16-bit PCM 会拒绝。回归入口：`python3 scripts/english-learning/test-wav-normalization.py`。原始文件手动导入也须先校验，分析子进程建议设内存上限。
