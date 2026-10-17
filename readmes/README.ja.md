<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain：アイデアを、目に見えるかたちに。もつれた落書きが手回しハンドル付きのじょうごを通り抜け、すっきりとした電球のスケッチになって出てくる。" width="100%">
</p>

# InkExplain

*アイデアを、目に見えるかたちに。*

AI を使って、複雑なアイデアを美しく統一感のある手描き風イラストに変えましょう。

<!-- inkexplain:languages:start -->
[English](../README.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Deutsch](./README.de.md) | [Français](./README.fr.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-Hant.md) | [한국어](./README.ko.md) | **日本語** | [العربية](./README.ar.md) | [Русский](./README.ru.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)
<!-- inkexplain:languages:end -->

InkExplain は AI エージェント向けのビジュアル推論スキルです。記事やドキュメント、あるいはひとつのアイデアを渡すと、絵にする価値のあるアイデアを抽出し、それぞれをキャラクターが演じる具体的な動作に置き換え、シリーズ全体の一貫性を保つプロンプトを書きます。エージェントに画像生成ツールがあれば、画像の生成、レビュー、保存まで行います。

## できること

- **計画**：ショットリストを作成します。各画像をどこに置くか、その画像が伝えるアイデア、そしてそれを見せる物理的なメタファーを決めます。
- **演技指導**：どの画像にも、アイデアを演じるキャラクター、手、または機械がひとつだけ登場し、決定的な瞬間のポーズで描かれます。
- **プロンプト作成**：シリーズ全体をまとめるプロンプトを書きます。アーキタイプはひとつ、スタイルもひとつ、メタファーは画像ごとに新しく。
- **生成とレビュー**：エージェントの画像ツールで画像を生成・レビューし、規則的なファイル名で保存します。
- **修正**：イラストを手直しします。紛れ込んだタイトルの削除、ラベルの修正、ごちゃごちゃした場面の簡素化、崩れたキャラクターの復元などを行います。

技術記事、プロダクトやアーキテクチャの解説、ワークフロー、比較、因果関係、講座の教材、そして一貫したビジュアル表現が求められる長文コンテンツに適しています。

## 仕組み

1. **アーキタイプを選ぶ**：キャラクター、その動き、そしてビジュアルスタイルの組み合わせを選びます。指定がなければ、InkExplain は独自のハウススタイルである InkExplain Sketch を使います。
2. **コンセプトを抽出する**：中心となる主張と、認知的アンカーを見つけます。つまずきポイント、引き継ぎ、トレードオフ、ループ、ビフォー・アフターの変化などです。
3. **計画する**：アイデアごとに画像を1枚計画します。それぞれに構成タイプ、構図グリッド上の位置、そして主役が演じる身近なメタファーを割り当てます。
4. **プロンプトを組み立てる**：アーキタイプのテンプレートをもとに、決まった順序でプロンプトを組み立て、ツール呼び出し1回につき画像を1枚生成します。
5. **レビューする**：すべての画像を、共通の QA チェックリストとアーキタイプ固有のチェック項目に照らして確認し、修正または再生成します。
6. **保存して報告する**：ワークスペースの `assets/<article-slug>-…/` に保存し、結果を報告します。

計画と生成は、あえて分けてあります。InkExplain は画像モデルを内蔵しておらず、エージェントが提供する画像生成ツールを使います。ツールがない場合は**プロンプトモード**に切り替わり、そのまま実行できる完全なプロンプトを渡します。実際には生成していない画像を、生成したと偽ることはありません。

## インストール

```bash
npx skills add agustinpabon/InkExplain --skill inkexplain
```

これはオープンな [skills CLI](https://skills.sh)（Node.js 22.20 以上）を使います。お使いのエージェント（Claude Code、Codex、Cursor、Gemini CLI、GitHub Copilot、OpenCode、Windsurf など）を検出し、そのエージェントが読み込むフォルダにスキルをコピーします。`-g` を付けるとすべてのプロジェクト向けに、`-a <agent>` を付けるとエージェントを指定してインストールします。既定では CLI は匿名の利用テレメトリを送信します。`DISABLE_TELEMETRY=1` を設定すると無効にできます。InkExplain 自体は何も収集しません。

Node.js がない場合は、フォルダ `skills/inkexplain/` をエージェントのスキルフォルダに自分でコピーしてください。フォルダの一覧は「対応環境」にあります。

## 使い方

Codex では、スキルを `$inkexplain` として呼び出します。Claude Code などのホストでは、InkExplain を名前で指定するか、やりたいことを説明してください。依頼内容がスキルの説明と一致すると、エージェントがスキルを読み込みます。

```text
$inkexplain この記事のイラストを計画してください。生成はまだしないでください。

<記事を貼り付け>
```

```text
$inkexplain この投稿に4枚のイラストを付けて、プロジェクト内に保存してください。
```

```text
$inkexplain Ferris を使って、次の内容を1枚の画像にしてください：「所有権とは、いかなる時も所有者がただ一つであること。」
```

```text
$inkexplain プロンプトモード：自分の画像ツールに貼り付けて使えるよう、画像3枚分のプロンプトを書いてください。
```

すべてのアーキタイプや、複数のアーキタイプを組み合わせた依頼を含むその他の例は、[examples/prompts.md](../examples/prompts.md) にあります。

## アーキタイプ

アーキタイプは、誰がアイデアを演じるのか、どのように動くのか、そして場面をどう描くのかを決めるものです。デフォルトは InkExplain Sketch で、それ以外のアーキタイプはすべて名前で指定します。1枚の画像の中で複数のアーキタイプが混ざることはありません。

<!-- inkexplain:archetypes:start -->
| アーキタイプ | カテゴリ | スタイルの概要 | 法的ステータス |
|---|---|---|---|
| InkExplain Sketch (`ink`, デフォルト) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on a pure white page that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Stickman (`stickman`) | `house-style` | InkExplain's own recurring stick figure: a bold black marker line, a round head with two dot eyes, and bendy limbs that act out the idea on a pure white page, with at most one vermilion accent. | `experimental` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tolva |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 (the design); CC BY 3.0 (the bundled reference drawing) · Renee French |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **カテゴリ**：`house-style` は InkExplain オリジナルのスタイルです。`mascot` は、クレジットを表記したうえで使うプロジェクトやコミュニティのマスコットです。`tribute-character` は第三者が生み出したキャラクターで、その権利の範囲内で描きます。`animation-preset` は、オリジナルの動きと演出のプリセット用に予約されています。
- **ステータス**：`active` のアーキタイプはすぐに使えます。`experimental` のものは名前で指定されたときにだけ選ばれ、成果物のたびにその旨が明記されます。`gated-authorized` のものは、名前で指定されたときに限り、自身の権限の範囲内でのみ使用されます。記録された許諾なしに公開されることはありません。

各アーキタイプのエイリアス、モーション DNA、スタイルシート、クレジット、利用制限は [routing.md](../skills/inkexplain/references/routing.md) にあります。このファイルは、アーキタイプのレジストリ [registry.json](../skills/inkexplain/registry.json) から生成されています。

## サンプルギャラリー

Xiaohei のサンプル画像を、加工せずに掲載しています。ほかのキャラクターのサンプルは、レビュー後に公開します。

| 一匹の魚、いくつもの使い道 | 目的別の仕分け | アイデアプレス |
|---|---|---|
| ![一匹の魚を何通りにも：素材の魚をいくつかに切り分ける Xiaohei](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) | ![目的別の仕分け：Xiaohei が生のアイデアカードにスタンプを押し、3つのトレイに振り分ける](../examples/gallery/en/xiaohei/02-sort-by-purpose.png) | ![アイデアプレス：Xiaohei がクランクを回し、散らばったアイデアをひとつの明確なアイデアに押し固める](../examples/gallery/en/xiaohei/06-idea-press.png) |

<!-- inkexplain:gallery-credits:start -->
Xiaohei は Ian Xiaohei Illustrations に登場する Ian のキャラクターです（MIT）。英語ラベルの画像は Visual IP Illustrations（MIT）が公開した画像のコピー、中国語ラベルの画像は Ian 自身の画像のコピーで、いずれも加工せずに [examples/gallery](../examples/gallery) に置いています（[それぞれの出どころ](../docs/provenance.md)）。ほかのキャラクターのサンプルは、レビューが済むまで掲載を見合わせています。
<!-- inkexplain:gallery-credits:end -->

## 新しいキャラクターとアニメーションスタイルの追加

アーキタイプは、データと Markdown だけでできています。追加するのに、検証用のコードを書く必要はありません。

1. **登録する。** [`skills/inkexplain/registry.json`](../skills/inkexplain/registry.json) の `archetypes` にエントリーを追加します。記述するのは、id、名前、カテゴリ、ステータス、概要、エイリアス、出力サフィックス、`motionDna`、`styleSheet`、`legalNotice`、`sampleGates`、そして `contract` 内のアイデンティティマーカーと分離マーカーです。サードパーティのキャラクターには、権利者、ライセンス、クレジット表記の条件が必要です。保護されたキャラクターは `gated-authorized` から始めます。
2. **パックを書く。** `skills/inkexplain/references/archetypes/<id>/` を作成し、5つのパックファイル `rights.md`、`identity.md`、`style.md`、`motion-and-acting.md`、`prompts.md` を置きます。構成は既存のパックをそのまま真似してください。それ以外のことは、`references/workflow/` にある共通の手法がすでにカバーしています。
3. **生成して検証する。** [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) にクレジットを、[examples/prompts.md](../examples/prompts.md) に例を追加してから、`npm run build:docs` と `npm run check` を実行します。上のアーキタイプ表、`routing.md`、そしてすべての翻訳は自動的に更新されます。

完全なレジストリエントリーの例と、最初に答えておくべき権利関係の質問を含む詳しい手順は、[docs/adding-an-archetype.md](../docs/adding-an-archetype.md) にあります。

## 出力規約

- 各アーキタイプは、ワークスペース内のそれぞれ専用のフォルダーに出力します。デフォルトは `assets/<article-slug>-illustrations/`、その他は `assets/<article-slug>-<id>/` です。
- ファイル名は番号付きの英語スラッグです（例：`01-two-breakpoints.png`、`02-handoff-path.png`）。
- 既存のファイルが上書きされることはありません。新しいバージョンには次の番号か `-v2` サフィックスが付きます。
- プロジェクト内でプロンプトモードを使った場合、プロンプトは同じフォルダーに `prompts.md` として保存されます。
- 成果物の最後には、必ず短いレポートが付きます。内容は、アーキタイプ、各画像とその目的、パス、特に効果的な画像と省略可能な画像、未解決の課題、そしてサードパーティのアーキタイプの場合は権利に関する注記です。

## 対応環境

| エージェント | プロジェクト内のスキルフォルダ |
|---|---|
| Claude Code | `.claude/skills/inkexplain` |
| Codex | `.agents/skills/inkexplain` |
| Cursor | `.agents/skills/inkexplain`; Cursor は `.claude/skills/` と `.codex/skills/` も読み込みます |
| Gemini CLI, GitHub Copilot, OpenCode | `.agents/skills/inkexplain` |
| Windsurf | `.windsurf/skills/inkexplain` |
| `SKILL.md` パッケージを読み込むその他のエージェント | そのエージェントのスキルフォルダ |

`-g` を付けると、CLI はエージェントの個人用フォルダにインストールします（例: Claude Code は `~/.claude/skills/`、Codex は `~/.agents/skills/`）。

テスト済み: skills CLI は上記の各エージェントにスキルを正しく配置し、Claude Code はそれを一覧に表示します。インストール済みのスキルを指し示した新しい Claude Code エージェントのセッションは、画像ツールなしのプロンプトモードで 15 件のリクエストにおいてスキルに正しく従いました（[評価](../docs/evaluation.md)）。未テスト: ホストが平易なリクエストだけでスキルを自動的に読み込むか、Codex、Cursor、Gemini CLI、GitHub Copilot、OpenCode、Windsurf の中でのスキルの実行、そしていずれかの画像ツールによる画像生成。

## カスタマイズ

- **依頼ごとに**：アーキタイプ、画像の枚数、アスペクト比、ラベルの言語、記事のスラッグを、ふだんの言葉で指定できます。
- **ハウススタイル**：InkExplain Sketch は `skills/inkexplain/references/archetypes/ink/` にあります。`style.md` と `prompts.md` は必ずセットで変更し、`registry.json` のパレットもそれに合わせてください。
- **新しいアーキタイプ**：[新しいキャラクターとアニメーションスタイルの追加](../docs/adding-an-archetype.md)を参照してください。

## 動作要件

- `SKILL.md` 形式のスキルパッケージに対応したエージェント。
- 画像を生成する場合：そのエージェントから使える画像生成ツール。
- 開発する場合：Node.js 22 以降。インストールが必要な依存パッケージはありません。

## 制限事項

- InkExplain は画像モデルを同梱していません。画像の品質は、エージェントが使うツールによって決まります。
- 画像モデルはラベルの文字をよく間違えます。ラテン文字以外では特にその傾向が強くなります。ラベルは短くし、必ず確認してください。
- InkExplain Sketch には、まだレビュー済みの作例がありません。
- サードパーティのアーキタイプには、権利者による制限が伴います。ゲート付きアーキタイプは自身の権限の範囲内で使うためのもので、InkExplain はこれらのアーキタイプのサンプルを公開していません。
- README の翻訳は AI の支援を受けて作成されたもので、プロの翻訳者によるレビューは受けていません。自動生成される表では、レジストリのデータを英語のまま掲載しています。

## 開発

```bash
npm test               # ユニット・チェック・CLI・リポジトリのテスト（Node 組み込みのテストランナー）
npm run validate       # リポジトリとスキルパッケージを検証
npm run build:docs     # routing.md、README のアーキタイプ表、言語セレクターを再生成
npm run check          # CI で実行されるすべてのチェック
```

アーキテクチャ、段階的開示モデル、チェックの一覧、リリース手順は [docs/architecture.md](../docs/architecture.md) と [docs/release-checklist.md](../docs/release-checklist.md) に記載されています。コントリビューターとエージェント向けのガイドラインは [AGENTS.md](../AGENTS.md) にあります。

## クレジットとライセンス

<!-- inkexplain:credits:start -->
InkExplain は、MIT ライセンスで公開されている 3 つの先行プロジェクトを土台にしています。yangchuansheng の [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations)、Ian の [Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations)、okooo5km の [5km Littlebox Illustrations](https://github.com/okooo5km/5km-littlebox-illustrations) です。ギャラリーの画像は、前の 2 つのプロジェクトから取り込んだ未加工のコピーです。第三者のキャラクターや商標は、それぞれの権利者に帰属します。成り立ちや各キャラクターの表示事項・ライセンスは [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) を参照してください。
<!-- inkexplain:credits:end -->

InkExplain は [MIT ライセンス](../LICENSE) のもとで公開されています。
