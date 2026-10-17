<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain：让想法看得见。一团纠缠的涂鸦穿过手摇漏斗，出来时变成了一幅清晰的灯泡草图。" width="100%">
</p>

# InkExplain

*让想法看得见。*

借助 AI，把复杂的想法变成美观、风格统一的手绘插图。

<!-- inkexplain:languages:start -->
[English](../README.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Deutsch](./README.de.md) | [Français](./README.fr.md) | **简体中文** | [繁體中文](./README.zh-Hant.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [العربية](./README.ar.md) | [Русский](./README.ru.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)
<!-- inkexplain:languages:end -->

InkExplain 是一个面向 AI 智能体的视觉推理技能（skill）。交给它一篇文章、一份文档，或者只是一个想法：它会提炼出值得画出来的想法，把每个想法转化为由角色完成的一个具体动作，并编写能让整个系列保持一致的提示词。如果你的智能体配有图像生成工具，它还会生成、检查并保存这些图片。

## 能做什么

- **规划**配图清单：每张图放在哪里、承载哪个想法，以及用哪个实物隐喻来呈现它。
- **指导演出**：每张图都由一个角色、一只手或一台机器来演绎想法，并定格在最关键的那一刻。
- **编写提示词**，让整个系列浑然一体：同一个原型、同一种风格，每张图换一个新鲜的隐喻。
- **生成并检查**图片：使用你的智能体提供的图像工具生成，再以可预期的文件名保存。
- **修复**插图：去掉多余的标题、修正标签、简化拥挤的画面、还原走样的角色。

它适用于技术文章、产品与架构讲解、工作流程、对比、因果关系、课程资料，以及需要统一视觉语言的长篇写作。

## 工作原理

1. **选择原型**：即一个角色、它的动作方式以及它的视觉风格。如果没有特别要求，InkExplain 会使用自己的自有风格 InkExplain Sketch。
2. **提炼概念**：找出核心论点和认知锚点，例如断点、交接、取舍、循环和前后变化。
3. **规划**：一个想法一张图，每张图各有一种结构类型、在构图网格中的一个位置，以及一个由主角演绎的日常隐喻。
4. **组装提示词**：按固定顺序，用该原型的模板组装提示词，然后每次工具调用只生成一张图。
5. **检查**：对照通用的 QA 检查清单和该原型自己的检查项审核每一张图；不合格就修复或重新生成。
6. **保存并汇报**：保存到你工作区中的 `assets/<article-slug>-…/`，并汇报结果。

规划与生成是有意分开的。InkExplain 本身不包含图像模型，而是使用你的智能体提供的图像生成工具。如果没有这样的工具，它会切换到**提示词模式**（prompt mode），交给你完整、拿来即用的提示词。它绝不会谎称生成了实际上并未生成的图片。

## 安装

```bash
npx skills add agustinpabon/InkExplain --skill inkexplain
```

这会使用开放的 [skills CLI](https://skills.sh)（需要 Node.js 22.20 或更高版本）。它会检测你的智能体，例如 Claude Code、Codex、Cursor、Gemini CLI、GitHub Copilot、OpenCode 或 Windsurf，并把这个 skill 复制到该智能体读取的文件夹中。加上 `-g` 可为你的所有项目安装，加上 `-a <agent>` 可指定智能体。默认情况下，该 CLI 会发送匿名使用遥测；设置 `DISABLE_TELEMETRY=1` 可将其关闭。InkExplain 本身不收集任何数据。

没有 Node.js 时，请自行把文件夹 `skills/inkexplain/` 复制到你的智能体的 skills 文件夹；“支持的环境”一节列出了这些文件夹。

## 使用方法

在 Codex 中，用 `$inkexplain` 调用该技能。在 Claude Code 和其他宿主环境中，可以直接点名 InkExplain，也可以只描述任务；当请求与技能的描述相符时，智能体就会加载它。

```text
$inkexplain 为这篇文章规划插图，先不要生成。

<粘贴文章>
```

```text
$inkexplain 给这篇博文配四张插图，并保存到项目中。
```

```text
$inkexplain 使用 Ferris。画一张图：“所有权意味着同一时刻有且只有一个所有者。”
```

```text
$inkexplain 提示词模式：为三张图写好提示词，方便我粘贴到自己的图像工具里。
```

更多示例（包括每一个原型，以及混用多个原型的请求）见 [examples/prompts.md](../examples/prompts.md)。

## 原型

原型决定了由谁来演绎想法、它如何动作，以及画面如何绘制。InkExplain Sketch 是默认原型；其他原型都需要点名才会使用。同一张图中绝不会混用多个原型。

<!-- inkexplain:archetypes:start -->
| 原型 | 类别 | 风格概要 | 法律状态 |
|---|---|---|---|
| InkExplain Sketch (`ink`, 默认) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on a pure white page that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Stickman (`stickman`) | `house-style` | InkExplain's own recurring stick figure: a bold black marker line, a round head with two dot eyes, and bendy limbs that act out the idea on a pure white page, with at most one vermilion accent. | `experimental` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tölva |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 (the design); CC BY 3.0 (the bundled reference drawing) · Renee French (design); Takuya Ueda (bundled drawing) |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **类别**：`house-style` 是 InkExplain 的原创风格；`mascot` 是注明出处后使用的项目或社区吉祥物；`tribute-character` 是由第三方创作、在其权利边界内绘制的角色；`animation-preset` 预留给原创的动作与场面调度预设。
- **状态**：`active` 原型可以直接使用；`experimental` 原型只能点名选用，并会在每次交付中加以标注；`gated-authorized` 原型仅在点名时使用，且仅限于你自己获得的授权范围内；没有记录在案的授权，绝不公开发布。

每个原型的别名、动作 DNA、风格表、署名和限制见 [routing.md](../skills/inkexplain/references/routing.md)，该文件由原型注册表 [registry.json](../skills/inkexplain/registry.json) 自动生成。

## 示例图集

以下是小黑（Xiaohei）的示例图，未作任何修改。其他角色的示例图将在审核后再发布。

| 一鱼多吃 | 信任桥 | 两个断点 |
|---|---|---|
| ![一鱼多吃：小黑把一条素材鱼切成几份，分批发出](../examples/gallery/zh/xiaohei/03-one-fish-many-uses.png) | ![信任桥：小黑沿着一条橙色线，把一张张小证据卡片铺过从“陌生”到“愿意聊”的断崖](../examples/gallery/zh/xiaohei/08-trust-bridge.png) | ![两个断点：小黑举着素材箱接上断开的传送带，另一头的内容落进了无人承接的洞里](../examples/gallery/zh/xiaohei/01-two-breakpoints.png) |

<!-- inkexplain:gallery-credits:start -->
小黑（Xiaohei）是 Ian 在 Ian Xiaohei Illustrations 中创作的角色（MIT）。英文标注的示例图是 Visual IP Illustrations（MIT）所发布图片的副本，中文标注的示例图是 Ian 自己图片的副本，均未作修改，存放在 [examples/gallery](../examples/gallery)（[各图的来源](../docs/provenance.md)）。其他角色的示例图在审核完成前暂不发布。
<!-- inkexplain:gallery-credits:end -->

## 添加新角色与动画风格

原型就是数据加上 Markdown。添加一个原型不需要编写任何校验器代码。

1. **注册原型。** 在 [`skills/inkexplain/registry.json`](../skills/inkexplain/registry.json) 的 `archetypes` 中添加一个条目：id、名称、类别、状态、概要、别名、输出后缀、`motionDna`、`styleSheet`、`legalNotice`、`sampleGates`，以及 `contract` 中的身份标记和隔离标记。第三方角色需要写明其权利人、许可证和署名条款；受保护的角色一律从 `gated-authorized` 起步。
2. **编写原型包。** 创建 `skills/inkexplain/references/archetypes/<id>/`，放入五个原型包文件：`rights.md`、`identity.md`、`style.md`、`motion-and-acting.md` 和 `prompts.md`。照着现有原型包的结构来写即可；其余部分都已由 `references/workflow/` 中的通用方法覆盖。
3. **生成并校验。** 在 [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) 中添加署名，在 [examples/prompts.md](../examples/prompts.md) 中添加一个示例，然后运行 `npm run build:docs` 和 `npm run check`。上方的原型表、`routing.md` 以及所有译本都会自动更新。

完整的操作指南（附有一个完整的注册表条目，以及需要先回答的权利问题）见 [docs/adding-an-archetype.md](../docs/adding-an-archetype.md)。

## 输出约定

- 每个原型都会写入工作区中各自的目录：默认原型写入 `assets/<article-slug>-illustrations/`，其他原型写入 `assets/<article-slug>-<id>/`。
- 文件名采用带编号的英文 slug，例如 `01-two-breakpoints.png`、`02-handoff-path.png`。
- 绝不覆盖已有文件；新版本会使用下一个编号，或加上 `-v2` 后缀。
- 在项目中使用提示词模式时，提示词会以 `prompts.md` 保存在同一目录下。
- 每次交付都以一份简短报告收尾：所用原型、各张图片及其用途、保存路径、效果最好的图片与可选图片、待解决的问题，以及第三方原型的权利说明。

## 支持的环境

| 智能体 | 项目中的 skill 文件夹 |
|---|---|
| Claude Code | `.claude/skills/inkexplain` |
| Codex | `.agents/skills/inkexplain` |
| Cursor | `.agents/skills/inkexplain`; Cursor 也会读取 `.claude/skills/` 和 `.codex/skills/` |
| Gemini CLI, GitHub Copilot, OpenCode | `.agents/skills/inkexplain` |
| Windsurf | `.windsurf/skills/inkexplain` |
| 其他读取 `SKILL.md` 包的智能体 | 它们的 skills 文件夹 |

使用 `-g` 时，CLI 会改为安装到该智能体的个人文件夹（例如 Claude Code 的 `~/.claude/skills/` 和 Codex 的 `~/.agents/skills/`）。

已测试的内容：skills CLI 会为上面每个智能体正确放置该 skill，Claude Code 会列出它。全新的 Claude Code 智能体会话在被指向已安装的 skill 后，对 15 个请求都正确地遵循了它（没有图像工具，使用提示词模式；见[评估](../docs/evaluation.md)）。未测试的内容：宿主是否会根据一句普通请求自行加载该 skill，在 Codex、Cursor、Gemini CLI、GitHub Copilot、OpenCode 或 Windsurf 中运行该 skill，以及使用任何图像工具生成图像。

## 自定义

- **按次指定**：在请求中用日常语言说明原型、图片数量、宽高比、标签语言或文章 slug 即可。
- **自有风格**：InkExplain Sketch 位于 `skills/inkexplain/references/archetypes/ink/`。修改时请同步更新 `style.md` 和 `prompts.md`，并让 `registry.json` 中的调色板与之保持一致。
- **新增原型**：参见[添加新角色与动画风格](../docs/adding-an-archetype.md)。

## 环境要求

- 支持 `SKILL.md` 技能包的智能体。
- 如需生成图片：该智能体可以使用的图像生成工具。
- 如需参与开发：Node.js 22 或更高版本。无需安装任何依赖。

## 局限性

- InkExplain 不附带图像模型；图片质量取决于你的智能体所用的工具。
- 图像模型经常写错标签文字，非拉丁文字尤其如此。请让标签保持简短，并仔细检查。
- InkExplain Sketch 目前还没有经过审核的示例图。
- 第三方原型须遵守其所有者设定的限制。受限原型只能在你自己的授权范围内使用，InkExplain 也不会为它们发布示例图。
- 本 README 的各语言译本借助 AI 翻译而成，尚未经过专业译者审校。自动生成的表格中，来自注册表的数据保持英文原样。

## 开发

```bash
npm test               # 单元、检查项、CLI 和仓库测试（使用 Node 内置的测试运行器）
npm run validate       # 校验仓库和技能包
npm run build:docs     # 重新生成 routing.md、README 中的原型表和语言选择栏
npm run check          # 运行 CI 执行的全部检查
```

架构、渐进式披露模型、检查项清单和发布流程的说明见 [docs/architecture.md](../docs/architecture.md) 和 [docs/release-checklist.md](../docs/release-checklist.md)。面向贡献者和智能体的指南见 [AGENTS.md](../AGENTS.md)。

## 致谢与许可证

<!-- inkexplain:credits:start -->
InkExplain 基于三个此前采用 MIT 许可的项目：yangchuansheng 的 [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations)、Ian 的 [Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) 和 okooo5km 的 [5km Littlebox Illustrations](https://github.com/okooo5km/5km-littlebox-illustrations)。图库中的图片是前两个项目中图片的未修改副本。第三方角色和商标归其各自所有者所有。有关项目来源、各角色的详细许可与说明，请参阅 [ATTRIBUTIONS.md](../ATTRIBUTIONS.md)。
<!-- inkexplain:credits:end -->

InkExplain 以 [MIT 许可证](../LICENSE) 发布。
