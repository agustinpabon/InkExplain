<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain: ідеї, які можна побачити. Клубок каракулів проходить крізь лійку з рукояткою і виходить із неї чітким начерком лампочки." width="100%">
</p>

# InkExplain

*Ідеї, які можна побачити.*

За допомогою ШІ перетворюйте складні ідеї на гарні ілюстрації в єдиному стилі, наче намальовані від руки.

<!-- inkexplain:languages:start -->
[English](../README.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Deutsch](./README.de.md) | [Français](./README.fr.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-Hant.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [العربية](./README.ar.md) | [Русский](./README.ru.md) | [Türkçe](./README.tr.md) | **Українська**
<!-- inkexplain:languages:end -->

InkExplain — це навичка (skill) візуального мислення для ШІ-агентів. Дайте їй статтю, документ або лише одну ідею: вона виокремить ідеї, які варто намалювати, перетворить кожну на фізичну дію, яку виконує персонаж, і напише промпти, завдяки яким уся серія буде витримана в єдиному стилі. Якщо ваш агент має інструмент для генерування зображень, InkExplain також згенерує зображення, перевірить і збереже їх.

## Можливості

- **Планує** список кадрів: де розмістити кожне зображення, яку ідею воно передає і яка фізична метафора її показує.
- **Режисує героя**: на кожному зображенні ідею розігрує один персонаж, рука чи механізм, схоплений у вирішальний момент дії.
- **Пише промпти**, що об’єднують серію в одне ціле: один архетип, один стиль, свіжа метафора для кожного зображення.
- **Генерує й перевіряє** зображення за допомогою інструмента генерування, який має ваш агент, а потім зберігає їх під передбачуваними назвами.
- **Доопрацьовує** ілюстрації: прибирає зайві заголовки, виправляє підписи, спрощує перевантажені сцени, відновлює вигляд персонажа.

InkExplain підходить для технічних статей, пояснень продуктів і архітектури, робочих процесів, порівнянь, причинно-наслідкових зв’язків, навчальних матеріалів і лонгрідів, яким потрібна єдина візуальна мова.

## Як це працює

1. **Вибір архетипу**: персонаж, його манера руху та візуальний стиль. Якщо ви нічого не вказали, InkExplain використовує власний фірмовий стиль — InkExplain Sketch.
2. **Виокремлення концепції**: головна теза й когнітивні якорі — точки збою, моменти передавання роботи, компроміси, цикли, зміни «до і після».
3. **Планування**: одне зображення на ідею, і для кожного — тип структури, місце в композиційній сітці та побутова метафора, яку розігрує герой.
4. **Складання промпту**: агент складає промпт із шаблону архетипу у фіксованому порядку й генерує по одному зображенню за кожен виклик інструмента.
5. **Перевірка**: кожне зображення звіряють зі спільним чек-листом QA та власними критеріями архетипу, а потім за потреби виправляють або генерують повторно.
6. **Збереження та звіт**: зображення зберігаються в `assets/<article-slug>-…/` у вашій робочій області, а агент звітує про результат.

Планування й генерування навмисно розділено. InkExplain не має власної моделі для зображень і використовує інструмент генерування, який надає ваш агент. Якщо такого інструмента немає, InkExplain перемикається в **режим промптів** і видає вам повні промпти, готові до запуску. Навичка ніколи не стверджує, що згенерувала зображення, якого насправді не створювала.

## Встановлення

Навичка — це тека `skills/inkexplain/`. Скопіюйте її туди, де ваш агент шукає навички.

З локальної копії цього репозиторію:

```bash
# Codex
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R skills/inkexplain "${CODEX_HOME:-$HOME/.codex}/skills/"

# Claude Code (особисті навички; щоб навичка працювала лише в одному проєкті, використовуйте .claude/skills/ усередині нього)
mkdir -p ~/.claude/skills
cp -R skills/inkexplain ~/.claude/skills/

# Cursor (особисті навички; щоб навичка працювала лише в одному проєкті, використовуйте .cursor/skills/ усередині нього)
mkdir -p ~/.cursor/skills
cp -R skills/inkexplain ~/.cursor/skills/
```

Запланована публічна адреса цього репозиторію — `agustinpabon/inkexplain`. Репозиторій ще не опубліковано; щойно це станеться, його, як очікується, можна буде встановити через [skills CLI](https://skills.sh) командою:

```bash
npx skills add agustinpabon/inkexplain --skill inkexplain
```

## Використання

У Codex викликайте навичку як `$inkexplain`. У Claude Code та інших середовищах згадайте InkExplain у запиті або просто опишіть завдання: агент завантажить навичку, якщо запит відповідає її опису.

```text
$inkexplain Сплануй ілюстрації до цієї статті. Поки що нічого не генеруй.

<вставте статтю>
```

```text
$inkexplain Проілюструй цей допис чотирма зображеннями та збережи їх у проєкті.
```

```text
$inkexplain Використай Ferris. Одне зображення на тему: «володіння — це лише один власник у кожен момент часу».
```

```text
$inkexplain Режим промптів: напиши для трьох зображень промпти, які я вставлю у свій генератор зображень.
```

Більше прикладів, зокрема для кожного архетипу та для змішаних запитів, — у [examples/prompts.md](../examples/prompts.md).

## Архетипи

Архетип визначає, хто розігрує ідею, як він рухається і як намальовано сцену. Типовий архетип — InkExplain Sketch; будь-який інший обирають за назвою. Архетипи ніколи не змішуються в одному зображенні.

<!-- inkexplain:archetypes:start -->
| Архетип | Категорія | Опис стилю | Правовий статус |
|---|---|---|---|
| InkExplain Sketch (`ink`, за замовчуванням) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on a pure white page that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tolva |
| Seal (`seal`) | `mascot` | A product-neutral white seal in a plain navy cap and deep-blue hoodie, always logo-free, performing the idea in sparse article sketches. | `active` · No separate character license recorded; the pack text is MIT as part of InkExplain · Sealos (original mascot image) |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 · Renee French |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP when asked · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **Категорії**: `house-style` — власний стиль InkExplain; `mascot` — талісман проєкту чи спільноти, який використовують із зазначенням авторства; `tribute-character` — персонаж, створений третьою стороною, якого зображують у межах його правових рамок; `animation-preset` зарезервовано для оригінальних пресетів руху та постановки.
- **Статуси**: архетипи зі статусом `active` готові до використання; архетипи `experimental` обирають лише за назвою й позначають у кожному результаті; архетипи `gated-authorized` використовують лише тоді, коли їх назвали явно, лише в межах наявних у вас прав і ніколи не публікують без задокументованого дозволу.

Альтернативні назви, ДНК руху, стильові аркуші, зазначення авторства та обмеження для кожного архетипу наведено в [routing.md](../skills/inkexplain/references/routing.md); цей файл генерується з реєстру архетипів [registry.json](../skills/inkexplain/registry.json).

## Галерея прикладів

Зображення із зазначенням архетипу. Зображення в стилі InkExplain Sketch з’являться після перевірки.

| Littlebox | Ferris | Seal |
|---|---|---|
| ![Шлях передавання: Littlebox передає запечатану картку від входу до готового результату](../examples/gallery/en/littlebox/04-handoff-path.png) | ![Сортування за призначенням: Ferris розкладає матеріали клешнями](../examples/gallery/en/ferris/02-sort-by-purpose.png) | ![Криниця інформації: тюлень черпає ідеї з глибини](../examples/gallery/en/seal/05-information-well.png) |
| **OpenClaw** | **Go Gopher** | **Xiaohei** |
| ![Прес ідей: талісман OpenClaw керує пресом](../examples/gallery/en/openclaw/06-idea-press.png) | ![Міст довіри: гофер кладе дошки через прірву](../examples/gallery/en/gopher/08-trust-bridge.png) | ![Одна риба, багато застосувань: Xiaohei розрізає рибу-матеріал на кілька частин](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) |

Littlebox — адаптація 5km Littlebox Illustrations авторства okooo5km (MIT). Авторка Ferris — Karen Rustad Tolva (CC0). Дизайн гофера Go створила Renee French (CC BY 4.0). Талісман OpenClaw походить із проєкту OpenClaw (MIT). Xiaohei — персонаж Ian з Ian Xiaohei Illustrations (MIT). Усі зображення — у [examples/gallery](../examples/gallery): з підписами англійською для шести архетипів і китайською для чотирьох.

## Додавання нових персонажів і стилів анімації

Архетипи — це дані та Markdown. Щоб додати новий, не потрібно писати код валідатора.

1. **Зареєструйте архетип.** Додайте запис до `archetypes` у [`skills/inkexplain/registry.json`](../skills/inkexplain/registry.json): id, назву, категорію, статус, короткий опис, альтернативні назви, суфікс виводу, `motionDna`, `styleSheet`, `legalNotice`, `sampleGates`, а також маркери ідентичності й ізоляції в `contract`. Для сторонніх персонажів потрібні правовласник, ліцензія та умови зазначення авторства; захищені персонажі починають зі статусу `gated-authorized`.
2. **Напишіть пакет.** Створіть `skills/inkexplain/references/archetypes/<id>/` із п’ятьма файлами пакета: `rights.md`, `identity.md`, `style.md`, `motion-and-acting.md` і `prompts.md`. Скопіюйте структуру наявного пакета; спільна методика в `references/workflow/` уже охоплює все інше.
3. **Згенеруйте та перевірте.** Додайте зазначення авторства до [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) і приклад до [examples/prompts.md](../examples/prompts.md), а потім виконайте `npm run build:docs` і `npm run check`. Таблиця архетипів вище, `routing.md` і всі переклади оновляться самі.

Повний покроковий посібник із готовим записом реєстру та питаннями щодо прав, на які слід відповісти насамперед, — у [docs/adding-an-archetype.md](../docs/adding-an-archetype.md).

## Правила збереження результатів

- Кожен архетип зберігає файли в окремій теці вашої робочої області: `assets/<article-slug>-illustrations/` для типового архетипу та `assets/<article-slug>-<id>/` для решти.
- Імена файлів — пронумеровані англійські слаги: `01-two-breakpoints.png`, `02-handoff-path.png`.
- Наявні файли ніколи не перезаписуються: нові версії отримують наступний номер або суфікс `-v2`.
- У режимі промптів усередині проєкту промпти зберігаються у файлі `prompts.md` у тій самій теці.
- Результати завжди супроводжує короткий звіт: архетип, зображення та їхнє призначення, шляхи, найвдаліші й необов’язкові зображення, відкриті питання, а для сторонніх архетипів — примітка щодо прав.

## Підтримувані середовища

| Середовище | Куди помістити навичку | Зображення |
|---|---|---|
| Codex | `${CODEX_HOME:-$HOME/.codex}/skills/inkexplain` | Використовує інструмент генерування зображень середовища, якщо він доступний; крім того, пакет містить метадані для Codex в `agents/openai.yaml`. |
| Claude Code | `~/.claude/skills/inkexplain` або `.claude/skills/inkexplain` | Claude Code не має вбудованого генератора зображень. InkExplain працює в режимі промптів, доки ви не підключите інструмент генерування зображень, наприклад через MCP-сервер. |
| Інші агенти, які завантажують пакети `SKILL.md` | тека навичок цього середовища | Те саме правило: генерування, якщо є інструмент для зображень, інакше — режим промптів. |

## Налаштування

- **У кожному запиті**: звичайними словами вкажіть архетип, кількість зображень, співвідношення сторін, мову підписів або слаг статті.
- **Фірмовий стиль**: InkExplain Sketch міститься в `skills/inkexplain/references/archetypes/ink/`. Змінюйте `style.md` і `prompts.md` разом і синхронно оновлюйте палітру в `registry.json`.
- **Нові архетипи**: див. [Додавання нових персонажів і стилів анімації](../docs/adding-an-archetype.md).

## Вимоги

- Агент, який підтримує пакети навичок `SKILL.md`.
- Для генерування зображень: доступний цьому агентові інструмент генерування зображень.
- Для розробки: Node.js 22 або новіша версія. Встановлювати залежності не потрібно.

## Обмеження

- InkExplain не містить власної моделі генерування зображень; якість зображень залежить від інструмента, яким користується ваш агент.
- Моделі генерування зображень помиляються в написанні підписів; найважче їм дається нелатинське письмо. Робіть підписи короткими та перевіряйте їх.
- Для InkExplain Sketch поки що немає перевірених прикладів зображень.
- На сторонні архетипи поширюються обмеження їхніх власників. Архетипи з обмеженим доступом призначені для використання в межах наявних у вас прав, і InkExplain не публікує для них прикладів.
- Переклади README виконано за допомогою ШІ, і їх не перевіряли професійні перекладачі. Згенеровані таблиці містять дані реєстру англійською мовою.

## Розробка

```bash
npm test               # модульні тести, тести перевірок, CLI та репозиторію (вбудований засіб запуску тестів Node)
npm run validate       # перевірка репозиторію та пакета навички
npm run build:docs     # повторне генерування routing.md, таблиць архетипів і перемикачів мов у README
npm run check          # усе, що запускає CI
```

Архітектуру, модель поступового розкриття інформації (progressive disclosure), каталог перевірок і процес випуску описано в [docs/architecture.md](../docs/architecture.md) та [docs/release-checklist.md](../docs/release-checklist.md). Настанови для учасників проєкту й агентів — в [AGENTS.md](../AGENTS.md).

## Авторство та ліцензія

<!-- inkexplain:credits:start -->
Сторонні персонажі та торговельні марки залишаються власністю їхніх власників. Повідомлення та ліцензії для кожного персонажа наведено в [ATTRIBUTIONS.md](../ATTRIBUTIONS.md).
<!-- inkexplain:credits:end -->

InkExplain поширюється на умовах [ліцензії MIT](../LICENSE).
