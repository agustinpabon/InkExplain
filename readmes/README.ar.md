<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain: أفكارٌ تتحوّل إلى صور. كتلة من الخربشات المتشابكة تمرّ عبر قمع يُدار بمقبض يدوي، فتخرج رسمًا واضحًا لمصباح كهربائي." width="100%">
</p>

# InkExplain

*أفكارٌ تتحوّل إلى صور.*

حوِّل الأفكار المعقّدة إلى رسوم توضيحية جميلة ومتّسقة مرسومة باليد بمساعدة الذكاء الاصطناعي.

<!-- inkexplain:languages:start -->
[English](../README.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Deutsch](./README.de.md) | [Français](./README.fr.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-Hant.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | **العربية** | [Русский](./README.ru.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)
<!-- inkexplain:languages:end -->

يُعدّ InkExplain مهارةً (skill) للاستدلال البصري مخصّصةً لوكلاء الذكاء الاصطناعي. قدّم له مقالًا أو مستندًا أو فكرة واحدة، فيستخلص الأفكار الجديرة بالرسم، ويحوّل كلًّا منها إلى فعل ملموس تؤدّيه شخصية، ويكتب موجّهات (prompts) تحافظ على اتساق السلسلة بأكملها. وإذا توفّرت لدى وكيلك أداة لتوليد الصور، فإنه يتولّى أيضًا توليد الصور ومراجعتها وحفظها.

## ما الذي يفعله

- **يخطّط** قائمة اللقطات: موضع كل صورة، والفكرة التي تحملها، والاستعارة الملموسة التي تجسّدها.
- **يوجّه بطل المشهد**: في كل صورة شخصية واحدة أو يد واحدة أو آلة واحدة تؤدّي الفكرة، في وضعية تلتقط لحظتها الحاسمة.
- **يكتب موجّهات** تحافظ على تماسك السلسلة: نموذج واحد، وأسلوب واحد، واستعارة جديدة لكل صورة.
- **يولّد الصور ويراجعها** بأداة الصور لدى وكيلك، ثم يحفظها بأسماء يسهل توقّعها.
- **يُصلح** الرسوم التوضيحية: يزيل العناوين الدخيلة، ويصحّح التسميات، ويبسّط المشاهد المزدحمة، ويعيد الشخصية إلى هيئتها الصحيحة.

يناسب InkExplain المقالات التقنية، وشروح المنتجات والبنى المعمارية، وسير العمل، والمقارنات، وعلاقات السبب والنتيجة، والمواد التعليمية، والكتابات المطوّلة التي تحتاج إلى هوية بصرية متّسقة.

## كيف يعمل

1. **اختيار النموذج**: شخصية، وطريقة حركتها، وأسلوبها البصري. وإن لم تطلب نموذجًا بعينه، يستخدم InkExplain أسلوبه الخاص: InkExplain Sketch.
2. **استخلاص المفهوم**: الأطروحة الجوهرية والمرتكزات الإدراكية، مثل نقاط التعثّر، وعمليات التسليم، والمفاضلات، والحلقات التكرارية، والتحوّلات بين ما قبل وما بعد.
3. **التخطيط** لصورة واحدة لكل فكرة، لكلٍّ منها نوع بنية، وموضع على شبكة التكوين، واستعارة من الحياة اليومية يؤدّيها بطل المشهد.
4. **تجميع الموجّه** من قالب النموذج وفق ترتيب ثابت، ثم توليد صورة واحدة في كل استدعاء للأداة.
5. **المراجعة**: فحص كل صورة وفق قائمة فحص الجودة المشتركة والفحوصات الخاصة بالنموذج، ثم إصلاحها أو إعادة توليدها.
6. **الحفظ وإعداد التقرير** في `assets/<article-slug>-…/`&lrm; ضمن مساحة عملك.

الفصل بين التخطيط والتوليد مقصود: لا يتضمّن InkExplain نموذجًا للصور، بل يستخدم أداة توليد الصور التي يوفّرها وكيلك. وإن لم تتوفّر هذه الأداة، ينتقل إلى **وضع الموجّهات** (prompt mode) ويسلّمك موجّهات كاملة جاهزة للتشغيل. ولا يدّعي أبدًا أنه ولّد صورة لم يولّدها.

## التثبيت

المهارة هي المجلد `skills/inkexplain/`&lrm;. انسخه إلى المكان الذي يبحث فيه وكيلك عن المهارات.

انطلاقًا من نسخة محلية من هذا المستودع:

```bash
# Codex
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R skills/inkexplain "${CODEX_HOME:-$HOME/.codex}/skills/"

# Claude Code (personal skills; use .claude/skills/ inside a project to scope it)
mkdir -p ~/.claude/skills
cp -R skills/inkexplain ~/.claude/skills/

# Cursor (personal skills; use .cursor/skills/ inside a project to scope it)
mkdir -p ~/.cursor/skills
cp -R skills/inkexplain ~/.cursor/skills/
```

العنوان العام المخطّط لهذا المستودع هو `agustinpabon/inkexplain`. لم يُنشر بعد؛ وبعد نشره، يُفترض أن تتمكّن [أداة سطر الأوامر skills](https://skills.sh) من تثبيت المهارة بالأمر التالي:

```bash
npx skills add agustinpabon/inkexplain --skill inkexplain
```

## الاستخدام

في Codex، استدعِ المهارة بكتابة &lrm;`$inkexplain`. أما في Claude Code والبيئات المضيفة الأخرى، فاطلب InkExplain باسمه أو صِف المهمة، إذ يحمّل الوكيل المهارة عندما يتطابق الطلب مع وصفها.

```text
$inkexplain خطّط رسومًا توضيحية لهذا المقال. لا تولّد أي صور بعد

<الصق المقال هنا>
```

```text
$inkexplain أضف إلى هذا المنشور أربع صور توضيحية واحفظها في المشروع
```

```text
$inkexplain استخدم Ferris. صورة واحدة للفكرة التالية: الملكية تعني وجود مالك واحد بالضبط في أي لحظة
```

```text
$inkexplain وضع الموجّهات: اكتب موجّهات لثلاث صور يمكنني لصقها في أداة الصور لديّ
```

تجد مزيدًا من الأمثلة، بما فيها أمثلة لكل نموذج ولطلبات مختلطة، في [examples/prompts.md](../examples/prompts.md).

## النماذج

يحدّد النموذج مَن يؤدّي الفكرة، وكيف يتحرّك، وكيف يُرسم المشهد. النموذج الافتراضي هو InkExplain Sketch، أما بقية النماذج فتُختار بالاسم. ولا تختلط النماذج أبدًا داخل صورة واحدة.

<!-- inkexplain:archetypes:start -->
| النموذج | الفئة | ملخص الأسلوب | الوضع القانوني |
|---|---|---|---|
| InkExplain Sketch (`ink`, الافتراضي) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Stickman (`stickman`) | `house-style` | InkExplain's own recurring stick figure: a bold black marker line, a round head with two dot eyes, and bendy limbs that act out the idea on a pure white page, with at most one vermilion accent. | `experimental` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on a pure white page that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tolva |
| Seal (`seal`) | `mascot` | A product-neutral white seal in a plain navy cap and deep-blue hoodie, always logo-free, performing the idea in sparse article sketches. | `active` · No separate character license recorded; the pack text is MIT as part of InkExplain · Sealos (original mascot image) |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 · Renee French |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP when asked · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **الفئات**: `house-style` أسلوب أصيل خاص بـ InkExplain؛ و`mascot` تميمة لمشروع أو مجتمع تُستخدم مع الإسناد؛ و`tribute-character` شخصية أنشأها طرف ثالث وتُرسم ضمن حدود حقوقها؛ أما `animation-preset` فمحجوزة لإعدادات مسبقة أصيلة للحركة والإخراج المشهدي.
- **الحالات**: النماذج ذات الحالة `active` جاهزة للاستخدام؛ والنماذج ذات الحالة `experimental` لا تُختار إلا بالاسم، ويُنبَّه إليها في كل تسليم؛ أما النماذج ذات الحالة `gated-authorized` فلا تُستخدم إلا عند تسميتها صراحةً، وفي حدود التفويض الممنوح لك فقط، ولا يُنشر ما تنتجه أبدًا دون تفويض موثّق.

تجد الأسماء البديلة، والبصمة الحركية (motion DNA)، وأوراق الأسلوب، والإسنادات، والقيود الخاصة بكل نموذج في [routing.md](../skills/inkexplain/references/routing.md)، وهو ملف مولَّد من سجلّ النماذج [registry.json](../skills/inkexplain/registry.json).

## معرض الأمثلة

صورٌ معروضة مع النموذج الذي ينتمي إليه كلٌّ منها. وستُضاف صور InkExplain Sketch بعد مراجعتها.

| Littlebox | Ferris | Seal |
|---|---|---|
| ![طريق التسليم: ينقل Littlebox بطاقة مختومة من مرحلة الإدخال إلى مرحلة الجاهزية](../examples/gallery/en/littlebox/04-handoff-path.png) | ![الفرز حسب الغرض: يفرز Ferris المواد بمخالبه](../examples/gallery/en/ferris/02-sort-by-purpose.png) | ![بئر المعلومات: تستخرج الفقمة الأفكار من بئر](../examples/gallery/en/seal/05-information-well.png) |
| **OpenClaw** | **Go Gopher** | **Xiaohei** |
| ![مكبس الأفكار: تميمة OpenClaw تشغّل مكبسًا](../examples/gallery/en/openclaw/06-idea-press.png) | ![جسر الثقة: يمدّ الغوفر ألواحًا فوق هوّة](../examples/gallery/en/gopher/08-trust-bridge.png) | ![سمكة واحدة واستخدامات كثيرة: Xiaohei يقطّع سمكة المادة إلى عدة قطع](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) |

<!-- inkexplain:gallery-credits:start -->
شخصية Littlebox مقتبسة من مشروع 5km Littlebox Illustrations الذي أنشأه okooo5km (MIT). وشخصية Ferris من تصميم Karen Rustad Tolva (CC0)، وشخصية Go gopher من تصميم Renee French (CC BY 4.0)، أما تميمة OpenClaw فمصدرها مشروع OpenClaw (MIT). وشخصية Xiaohei من ابتكار Ian في مشروع Ian Xiaohei Illustrations (MIT). وتجد جميع الصور في [examples/gallery](../examples/gallery): بتسميات إنجليزية لستة نماذج، وبتسميات صينية لأربعة منها.
<!-- inkexplain:gallery-credits:end -->

## إضافة شخصيات وأساليب تحريك جديدة

النماذج عبارة عن بيانات وملفات Markdown، ولا تتطلّب إضافة نموذج جديد كتابة أي شيفرة في أداة التحقّق.

1. **سجِّله.** أضف إدخالًا إلى `archetypes` في [`skills/inkexplain/registry.json`](../skills/inkexplain/registry.json): المعرّف، والاسم، والفئة، والحالة، والملخّص، والأسماء البديلة، ولاحقة الإخراج، و`motionDna`، و`styleSheet`، و`legalNotice`، و`sampleGates`، وعلامات الهوية والعزل في `contract`. تحتاج شخصيات الأطراف الثالثة إلى بيانات صاحب الحقوق والترخيص وشروط الإسناد؛ أما الشخصيات المحمية فتبدأ بالحالة `gated-authorized`.
2. **اكتب الحزمة.** أنشئ المجلد `skills/inkexplain/references/archetypes/<id>/`&lrm; وفيه ملفات الحزمة الخمسة: `rights.md`، و`identity.md`، و`style.md`، و`motion-and-acting.md`، و`prompts.md`. انسخ بنية حزمة موجودة؛ فالمنهجية المشتركة في `references/workflow/`&lrm; تغطّي كل ما عدا ذلك.
3. **ولِّد وتحقّق.** أضف الإسناد إلى [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) ومثالًا إلى [examples/prompts.md](../examples/prompts.md)، ثم شغّل `npm run build:docs` و`npm run check`. وسيُحدَّث جدول النماذج أعلاه، و`routing.md`، وكل الترجمات تلقائيًا.

تجد الشرح الكامل، مع مثال لإدخال كامل في السجلّ وأسئلة الحقوق التي ينبغي الإجابة عنها أولًا، في [docs/adding-an-archetype.md](../docs/adding-an-archetype.md).

## اصطلاحات المخرجات

- يكتب كل نموذج مخرجاته في مجلد خاص به ضمن مساحة عملك: `assets/<article-slug>-illustrations/`&lrm; للنموذج الافتراضي، و`assets/<article-slug>-<id>/`&lrm; لبقية النماذج.
- تُسمّى الملفات بأسماء إنجليزية مختصرة ومرقّمة: &lrm;`01-two-breakpoints.png` و&lrm;`02-handoff-path.png`.
- لا يُكتب فوق أي ملف موجود أبدًا؛ بل تأخذ النسخ الجديدة الرقم التالي أو اللاحقة &lrm;`-v2`.
- في وضع الموجّهات داخل مشروع، تُحفظ الموجّهات في الملف `prompts.md` داخل المجلد نفسه.
- ينتهي كل تسليم بتقرير قصير: النموذج، والصور والغرض من كلٍّ منها، ومواقع الملفات، وأقوى الصور والصور الاختيارية، والمسائل العالقة، وملاحظة الحقوق في حالة نماذج الأطراف الثالثة.

## البيئات المدعومة

<div dir="rtl">

| البيئة المضيفة | مكان المهارة | الصور |
|---|---|---|
| Codex | &lrm;`${CODEX_HOME:-$HOME/.codex}/skills/inkexplain` | يستخدم أداة توليد الصور في البيئة المضيفة عند توفّرها؛ وتضمّ الحزمة أيضًا بيانات Codex الوصفية في `agents/openai.yaml`. |
| Claude Code | &lrm;`~/.claude/skills/inkexplain` أو &lrm;`.claude/skills/inkexplain` | لا يتضمّن Claude Code مولّدًا مدمجًا للصور، لذا يعمل InkExplain في وضع الموجّهات ما لم توصِل أداةً لتوليد الصور، عبر خادم MCP مثلًا. |
| الوكلاء الآخرون الذين يحمّلون حزم `SKILL.md` | مجلد المهارات في البيئة المضيفة | القاعدة نفسها: يولّد الصور عند توفّر أداة لها، وإلا يعمل في وضع الموجّهات. |

</div>

## التخصيص

- **لكل طلب**: اختر بكلمات بسيطة النموذج، أو عدد الصور، أو نسبة العرض إلى الارتفاع، أو لغة التسميات، أو الاسم المختصر للمقال (slug).
- **الأسلوب الخاص**: يقع InkExplain Sketch في `skills/inkexplain/references/archetypes/ink/`&lrm;. عدِّل `style.md` و`prompts.md` معًا، وأبقِ لوحة الألوان في `registry.json` متوافقة معهما.
- **نماذج جديدة**: راجع [إضافة شخصيات وأساليب تحريك جديدة](../docs/adding-an-archetype.md).

## المتطلبات

- وكيل يدعم حزم المهارات بصيغة `SKILL.md`.
- لتوليد الصور: أداة لتوليد الصور متاحة لذلك الوكيل.
- للتطوير: Node.js 22 أو أحدث. لا توجد اعتماديات تحتاج إلى تثبيت.

## القيود

- لا يأتي InkExplain مزوّدًا بأي نموذج للصور؛ فجودة الصور تعتمد على الأداة التي يستخدمها وكيلك.
- تُخطئ نماذج الصور في كتابة التسميات، ولا سيما بالخطوط غير اللاتينية. لذا اجعل التسميات قصيرة وراجعها.
- لا تتوفّر بعدُ عيّنات مراجَعة من صور InkExplain Sketch.
- تخضع نماذج الأطراف الثالثة لقيود أصحابها. أما النماذج المقيّدة فمخصّصة للاستخدام في حدود التفويض الممنوح لك، ولا ينشر InkExplain عيّنات منها.
- أُعدّت ترجمات ملف README بمساعدة الذكاء الاصطناعي، ولم يراجعها مترجمون محترفون. وتُبقي الجداول المولَّدة بيانات السجلّ باللغة الإنجليزية.

## التطوير

```bash
npm test               # unit, check, CLI, and repository tests (Node's built-in runner)
npm run validate       # validate the repository and skill package
npm run build:docs     # regenerate routing.md, the README archetype tables, and language selectors
npm run check          # everything CI runs
```

البنية المعمارية، ومبدأ الإفصاح التدريجي (progressive disclosure)، وفهرس الفحوصات، وعملية الإصدار موثّقة في [docs/architecture.md](../docs/architecture.md) و[docs/release-checklist.md](../docs/release-checklist.md). وتجد إرشادات المساهمين والوكلاء في [AGENTS.md](../AGENTS.md).

## الإسناد والترخيص

<!-- inkexplain:credits:start -->
يستند InkExplain إلى ثلاثة مشاريع سابقة مرخّصة بموجب MIT: [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations) لصاحبه yangchuansheng، و[Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) لصاحبه Ian، و[5km Littlebox Illustrations](https://github.com/okooo5km/5km-littlebox-illustrations) لصاحبه okooo5km. صور المعرض نسخ غير معدّلة من أول مشروعين. تظل شخصيات وعلامات الأطراف الثالثة ملكًا لأصحابها. راجع [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) لمعرفة الأصول وإشعارات كل شخصية وتراخيصها.
<!-- inkexplain:credits:end -->

يُتاح InkExplain بموجب [ترخيص MIT](../LICENSE).
