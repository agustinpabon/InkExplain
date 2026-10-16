<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain: идеи, ставшие наглядными. Клубок каракулей проходит через воронку с рукояткой и выходит из неё чётким наброском лампочки." width="100%">
</p>

# InkExplain

*Идеи, ставшие наглядными.*

С помощью ИИ превращайте сложные идеи в красивые иллюстрации в едином стиле, словно нарисованные от руки.

<!-- inkexplain:languages:start -->
[English](../README.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Deutsch](./README.de.md) | [Français](./README.fr.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-Hant.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [العربية](./README.ar.md) | **Русский** | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)
<!-- inkexplain:languages:end -->

InkExplain — это навык (skill) визуального мышления для ИИ-агентов. Дайте ему статью, документ или всего одну идею: он выделит идеи, которые стоит нарисовать, превратит каждую в физическое действие, которое выполняет персонаж, и напишет промпты, благодаря которым вся серия будет выдержана в едином стиле. Если у вашего агента есть инструмент генерации изображений, InkExplain также сгенерирует изображения, проверит их и сохранит.

## Возможности

- **Планирует** список кадров: где разместить каждое изображение, какую идею оно передаёт и какая физическая метафора её показывает.
- **Режиссирует героя**: на каждом изображении идею разыгрывает один персонаж, рука или механизм, пойманный в решающий момент действия.
- **Пишет промпты**, которые связывают серию воедино: один архетип, один стиль, свежая метафора для каждого изображения.
- **Генерирует и проверяет** изображения с помощью инструмента генерации, который есть у вашего агента, а затем сохраняет их под предсказуемыми именами.
- **Дорабатывает** иллюстрации: убирает лишние заголовки, исправляет подписи, упрощает перегруженные сцены, восстанавливает облик персонажа.

InkExplain подходит для технических статей, объяснений продуктов и архитектуры, рабочих процессов, сравнений, причинно-следственных связей, учебных материалов и лонгридов, которым нужен единый визуальный язык.

## Как это работает

1. **Выбор архетипа**: персонаж, его манера движения и визуальный стиль. Если вы ничего не указали, InkExplain использует собственный фирменный стиль — InkExplain Sketch.
2. **Выделение концепции**: главный тезис и когнитивные якоря — точки сбоя, моменты передачи работы, компромиссы, циклы, изменения «до и после».
3. **Планирование**: одно изображение на идею, и у каждого — тип структуры, место в композиционной сетке и бытовая метафора, которую разыгрывает герой.
4. **Сборка промпта**: агент собирает промпт из шаблона архетипа в фиксированном порядке и генерирует по одному изображению за каждый вызов инструмента.
5. **Проверка**: каждое изображение сверяется с общим чек-листом QA и собственными критериями архетипа, а затем при необходимости исправляется или генерируется заново.
6. **Сохранение и отчёт**: изображения сохраняются в `assets/<article-slug>-…/` в вашей рабочей области, а агент отчитывается о результате.

Планирование и генерация разделены намеренно. В InkExplain нет собственной модели для изображений: он использует инструмент генерации, который предоставляет ваш агент. Если такого инструмента нет, InkExplain переключается в **режим промптов** и выдаёт вам полные промпты, готовые к запуску. Он никогда не заявляет, что сгенерировал изображение, которое на самом деле не создавал.

## Установка

```bash
npx skills add agustinpabon/InkExplain --skill inkexplain
```

Для этого используется открытый [skills CLI](https://skills.sh) (нужен Node.js 22.20 или новее). Он определяет вашего агента, например Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode или Windsurf, и копирует навык в папку, которую этот агент читает. Добавьте `-g`, чтобы установить его для всех ваших проектов, или `-a <agent>`, чтобы выбрать агента. По умолчанию CLI отправляет анонимную телеметрию использования; задайте `DISABLE_TELEMETRY=1`, чтобы отключить её. Сам InkExplain ничего не собирает.

Без Node.js скопируйте папку `skills/inkexplain/` в папку навыков вашего агента самостоятельно; список папок приведён в разделе «Поддерживаемые среды».

## Использование

В Codex вызывайте навык как `$inkexplain`. В Claude Code и других средах упомяните InkExplain в запросе или просто опишите задачу: агент загрузит навык, если запрос соответствует его описанию.

```text
$inkexplain Спланируй иллюстрации к этой статье. Пока ничего не генерируй.

<вставьте статью>
```

```text
$inkexplain Проиллюстрируй этот пост четырьмя изображениями и сохрани их в проекте.
```

```text
$inkexplain Используй Ferris. Одно изображение на тему: «владение — это ровно один владелец в каждый момент времени».
```

```text
$inkexplain Режим промптов: напиши для трёх изображений промпты, которые я вставлю в свой генератор изображений.
```

Больше примеров, в том числе для каждого архетипа и для смешанных запросов, — в [examples/prompts.md](../examples/prompts.md).

## Архетипы

Архетип определяет, кто разыгрывает идею, как он двигается и как нарисована сцена. По умолчанию используется InkExplain Sketch; любой другой архетип выбирается по названию. Архетипы никогда не смешиваются в одном изображении.

<!-- inkexplain:archetypes:start -->
| Архетип | Категория | Описание стиля | Правовой статус |
|---|---|---|---|
| InkExplain Sketch (`ink`, по умолчанию) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Stickman (`stickman`) | `house-style` | InkExplain's own recurring stick figure: a bold black marker line, a round head with two dot eyes, and bendy limbs that act out the idea on a pure white page, with at most one vermilion accent. | `experimental` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on a pure white page that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tolva |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 (the design); CC BY 3.0 (the bundled reference drawing) · Renee French |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **Категории**: `house-style` — собственный стиль InkExplain; `mascot` — талисман проекта или сообщества, который используется с указанием авторства; `tribute-character` — персонаж, созданный третьей стороной и изображаемый в пределах его правовых рамок; `animation-preset` зарезервирован для оригинальных пресетов движения и постановки.
- **Статусы**: архетипы со статусом `active` готовы к использованию; архетипы `experimental` выбираются только по названию и помечаются в каждом результате; архетипы `gated-authorized` используются, только если их назвали явно, только в рамках имеющихся у вас прав и никогда не публикуются без задокументированного разрешения.

Альтернативные названия, ДНК движения, стилевые листы, указания авторства и ограничения для каждого архетипа описаны в [routing.md](../skills/inkexplain/references/routing.md); этот файл генерируется из реестра архетипов [registry.json](../skills/inkexplain/registry.json).

## Галерея примеров

Примеры изображений Xiaohei без изменений. Примеры остальных персонажей будут опубликованы после проверки.

| Одна рыба — много применений | Сортировка по назначению | Пресс идей |
|---|---|---|
| ![Одна рыба, много применений: Xiaohei разрезает рыбу-материал на несколько частей](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) | ![Сортировка по назначению: Xiaohei ставит штамп на сырые карточки с идеями и раскладывает их по трём лоткам](../examples/gallery/en/xiaohei/02-sort-by-purpose.png) | ![Пресс идей: Xiaohei вращает рукоять и прессует россыпь идей в одну ясную идею](../examples/gallery/en/xiaohei/06-idea-press.png) |

<!-- inkexplain:gallery-credits:start -->
Xiaohei — персонаж Ian из Ian Xiaohei Illustrations (MIT). Изображения с английскими подписями — копии изображений, опубликованных в Visual IP Illustrations (MIT), с китайскими — копии собственных изображений Ian; все без изменений лежат в [examples/gallery](../examples/gallery) ([откуда взято каждое](../docs/provenance.md)). Примеры остальных персонажей скрыты до проверки.
<!-- inkexplain:gallery-credits:end -->

## Добавление новых персонажей и стилей анимации

Архетипы — это данные и Markdown. Чтобы добавить новый, не нужно писать код валидатора.

1. **Зарегистрируйте архетип.** Добавьте запись в `archetypes` в [`skills/inkexplain/registry.json`](../skills/inkexplain/registry.json): id, название, категорию, статус, краткое описание, альтернативные названия, суффикс вывода, `motionDna`, `styleSheet`, `legalNotice`, `sampleGates`, а также маркеры идентичности и изоляции в `contract`. Для сторонних персонажей нужны правообладатель, лицензия и условия указания авторства; защищённые персонажи начинают со статуса `gated-authorized`.
2. **Напишите пакет.** Создайте `skills/inkexplain/references/archetypes/<id>/` с пятью файлами пакета: `rights.md`, `identity.md`, `style.md`, `motion-and-acting.md` и `prompts.md`. Скопируйте структуру существующего пакета; общая методика в `references/workflow/` уже покрывает всё остальное.
3. **Сгенерируйте и проверьте.** Добавьте указание авторства в [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) и пример в [examples/prompts.md](../examples/prompts.md), затем выполните `npm run build:docs` и `npm run check`. Таблица архетипов выше, `routing.md` и все переводы обновятся сами.

Полное пошаговое руководство с законченной записью реестра и вопросами о правах, на которые нужно ответить в первую очередь, — в [docs/adding-an-archetype.md](../docs/adding-an-archetype.md).

## Правила сохранения результатов

- Каждый архетип сохраняет файлы в отдельную папку внутри вашей рабочей области: `assets/<article-slug>-illustrations/` для архетипа по умолчанию и `assets/<article-slug>-<id>/` для остальных.
- Имена файлов — пронумерованные английские слаги: `01-two-breakpoints.png`, `02-handoff-path.png`.
- Существующие файлы никогда не перезаписываются: новые версии получают следующий номер или суффикс `-v2`.
- В режиме промптов внутри проекта промпты сохраняются в файл `prompts.md` в той же папке.
- Результаты всегда сопровождаются кратким отчётом: архетип, изображения и их назначение, пути, самые удачные и необязательные изображения, открытые вопросы, а для сторонних архетипов — примечание о правах.

## Поддерживаемые среды

| Агент | Папка навыка в проекте |
|---|---|
| Claude Code | `.claude/skills/inkexplain` |
| Codex | `.agents/skills/inkexplain` |
| Cursor | `.agents/skills/inkexplain`; Cursor также читает `.claude/skills/` и `.codex/skills/` |
| Gemini CLI, GitHub Copilot, OpenCode | `.agents/skills/inkexplain` |
| Windsurf | `.windsurf/skills/inkexplain` |
| Другие агенты, читающие пакеты `SKILL.md` | их папка навыков |

С флагом `-g` CLI устанавливает навык в личную папку агента (например, `~/.claude/skills/` для Claude Code и `~/.agents/skills/` для Codex).

Что проверено: skills CLI правильно размещает навык для каждого агента из таблицы, а Claude Code показывает его в списке. Новые сессии агентов Claude Code, которым указали установленный навык, правильно следовали ему в 15 запросах, без инструмента для изображений, в режиме промптов ([оценка](../docs/evaluation.md)). Не проверено: подхватывает ли среда навык по простому запросу, запуск навыка внутри Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode или Windsurf и генерация изображений любым инструментом.

## Настройка

- **В каждом запросе**: обычными словами укажите архетип, количество изображений, соотношение сторон, язык подписей или слаг статьи.
- **Фирменный стиль**: InkExplain Sketch находится в `skills/inkexplain/references/archetypes/ink/`. Меняйте `style.md` и `prompts.md` вместе и синхронно обновляйте палитру в `registry.json`.
- **Новые архетипы**: см. [Добавление новых персонажей и стилей анимации](../docs/adding-an-archetype.md).

## Требования

- Агент с поддержкой пакетов навыков `SKILL.md`.
- Для генерации изображений: инструмент генерации изображений, доступный этому агенту.
- Для разработки: Node.js 22 или новее. Устанавливать зависимости не нужно.

## Ограничения

- InkExplain не включает собственную модель генерации изображений; качество изображений зависит от инструмента, который использует ваш агент.
- Модели генерации изображений ошибаются в написании подписей; хуже всего им даётся нелатинская письменность. Делайте подписи короткими и проверяйте их.
- Для InkExplain Sketch пока нет проверенных примеров изображений.
- На сторонние архетипы распространяются ограничения их владельцев. Архетипы с ограниченным доступом предназначены для использования в рамках имеющихся у вас прав, и InkExplain не публикует для них примеров.
- Переводы README выполнены с помощью ИИ и не проверялись профессиональными переводчиками. Сгенерированные таблицы содержат данные реестра на английском языке.

## Разработка

```bash
npm test               # модульные тесты, тесты проверок, CLI и репозитория (встроенное средство запуска тестов Node)
npm run validate       # проверка репозитория и пакета навыка
npm run build:docs     # повторная генерация routing.md, таблиц архетипов и переключателей языков в README
npm run check          # всё, что запускает CI
```

Архитектура, модель постепенного раскрытия информации (progressive disclosure), каталог проверок и процесс выпуска описаны в [docs/architecture.md](../docs/architecture.md) и [docs/release-checklist.md](../docs/release-checklist.md). Рекомендации для участников проекта и агентов — в [AGENTS.md](../AGENTS.md).

## Авторство и лицензия

<!-- inkexplain:credits:start -->
InkExplain опирается на три более ранних проекта под лицензией MIT: [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations) автора yangchuansheng, [Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) автора Ian и [5km Littlebox Illustrations](https://github.com/okooo5km/5km-littlebox-illustrations) автора okooo5km. Изображения в галерее — неизмененные копии из первых двух проектов. Сторонние персонажи и товарные знаки остаются собственностью их владельцев. Источники, уведомления по каждому персонажу и лицензии указаны в [ATTRIBUTIONS.md](../ATTRIBUTIONS.md).
<!-- inkexplain:credits:end -->

InkExplain распространяется на условиях [лицензии MIT](../LICENSE).
