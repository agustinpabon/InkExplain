<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain: أفكارٌ تتحوّل إلى صور. كتلة من الخربشات المتشابكة تمرّ عبر قمع يُدار بمقبض يدوي، فتخرج رسمًا واضحًا لمصباح كهربائي." width="100%">
</p>

# InkExplain

*أفكارٌ تتحوّل إلى صور.*

حوِّل الأفكار المعقّدة إلى رسوم توضيحية جميلة ومتّسقة مرسومة باليد بمساعدة الذكاء الاصطناعي.

<!-- inkexplain:languages:start -->
<details>
<summary>Languages</summary>

[English](../README.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [简体中文](./README.zh.md) · [繁體中文](./README.zh-Hant.md) · [한국어](./README.ko.md) · [日本語](./README.ja.md) · **العربية** · [Русский](./README.ru.md) · [Türkçe](./README.tr.md) · [Українська](./README.uk.md)

</details>
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

```bash
npx skills add agustinpabon/InkExplain --skill inkexplain
```

يستخدم هذا الأمر [skills CLI](https://skills.sh) المفتوحة (تتطلب Node.js 22.20 أو أحدث). تكتشف الأداة وكيلك، مثل Claude Code أو Codex أو Cursor أو Gemini CLI أو GitHub Copilot أو OpenCode أو Windsurf، وتنسخ المهارة إلى المجلد الذي يقرأه ذلك الوكيل. أضف `-g` للتثبيت لكل مشاريعك، أو `-a <agent>` لاختيار الوكيل. افتراضيًا ترسل الأداة قياسات استخدام مجهولة؛ اضبط `DISABLE_TELEMETRY=1` لإيقافها. أما InkExplain نفسه فلا يجمع أي بيانات.

بدون Node.js، انسخ المجلد `skills/inkexplain/` بنفسك إلى مجلد المهارات الخاص بوكيلك؛ ويسرد قسم «البيئات المدعومة» هذه المجلدات.

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
<table>
<tr>
<td width="25%" valign="top"><img src="../assets/examples/thumbs/ink.png" alt="InkExplain Sketch: a real render of the database-indexing request" width="100%"><br><b>InkExplain Sketch</b> · الافتراضي<br>Black ink line, one blue flow, one yellow swipe.<br><sub>MIT · InkExplain contributors</sub></td>
<td width="25%" valign="top"><img src="../assets/examples/thumbs/littlebox.png" alt="Littlebox: a real render of the database-indexing request" width="100%"><br><b>Littlebox</b><br>A closed paper box on a pure white page.<br><sub>MIT · okooo5km</sub></td>
<td width="25%" valign="top"><img src="../assets/examples/thumbs/stickman.png" alt="Stickman: a real render of the database-indexing request" width="100%"><br><b>Stickman</b> · <code>experimental</code><br>One bold marker figure that acts out the idea.<br><sub>MIT · InkExplain contributors</sub></td>
<td width="25%" valign="top"><img src="../assets/examples/thumbs/xiaohei.png" alt="Xiaohei: a real render of the database-indexing request" width="100%"><br><b>Xiaohei</b><br>A small black creature doing serious, absurd work.<br><sub>MIT · Ian</sub></td>
</tr>
<tr>
<td width="25%" valign="top"><b>Ferris</b><br>The Rust community crab.<br><sub>CC0 public-domain dedication · Karen Rustad Tölva</sub></td>
<td width="25%" valign="top"><b>Go Gopher</b><br>The Go gopher in sparse sketches.<br><sub>CC BY 4.0 (the design); CC BY 3.0 (the bundled reference drawing) · Renee French (design); Takuya Ueda (bundled drawing)</sub></td>
<td width="25%" valign="top"><b>Tux</b><br>Tux, the Linux penguin.<br><sub>Free to use and modify with credit to Larry Ewing and The GIMP · Larry Ewing</sub></td>
<td width="25%" valign="top"><b>OpenClaw</b><br>The red OpenClaw mascot with claw arms.<br><sub>MIT · OpenClaw Foundation</sub></td>
</tr>
</table>
<!-- inkexplain:archetypes:end -->

- **الفئات**: `house-style` أسلوب أصيل خاص بـ InkExplain؛ و`mascot` تميمة لمشروع أو مجتمع تُستخدم مع الإسناد؛ و`tribute-character` شخصية أنشأها طرف ثالث وتُرسم ضمن حدود حقوقها؛ أما `animation-preset` فمحجوزة لإعدادات مسبقة أصيلة للحركة والإخراج المشهدي.
- **الحالات**: النماذج ذات الحالة `active` جاهزة للاستخدام؛ والنماذج ذات الحالة `experimental` لا تُختار إلا بالاسم، ويُنبَّه إليها في كل تسليم؛ أما النماذج ذات الحالة `gated-authorized` فلا تُستخدم إلا عند تسميتها صراحةً، وفي حدود التفويض الممنوح لك فقط، ولا يُنشر ما تنتجه أبدًا دون تفويض موثّق.

تجد الأسماء البديلة، والبصمة الحركية (motion DNA)، وأوراق الأسلوب، والإسنادات، والقيود الخاصة بكل نموذج في [routing.md](../skills/inkexplain/references/routing.md)، وهو ملف مولَّد من سجلّ النماذج [registry.json](../skills/inkexplain/registry.json).

## معرض الأمثلة

صور نموذجية لشخصية Xiaohei دون أي تعديل. أما صور الشخصيات الأخرى فلن تُنشر إلا بعد مراجعتها.

| سمكة واحدة، استخدامات كثيرة | الفرز حسب الغرض | مكبس الأفكار |
|---|---|---|
| ![سمكة واحدة واستخدامات كثيرة: Xiaohei يقطّع سمكة المادة إلى عدة قطع](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) | ![الفرز حسب الغرض: يختم Xiaohei بطاقات أفكار خام ويوزعها على ثلاث صواني](../examples/gallery/en/xiaohei/02-sort-by-purpose.png) | ![مكبس الأفكار: يدير Xiaohei ذراعًا لضغط أفكار متناثرة في فكرة واحدة واضحة](../examples/gallery/en/xiaohei/06-idea-press.png) |

<!-- inkexplain:gallery-credits:start -->
شخصية Xiaohei من ابتكار Ian في مشروع Ian Xiaohei Illustrations (MIT). الصور ذات التسميات الإنجليزية نسخ من صور نشرها مشروع Visual IP Illustrations (MIT)، والصور ذات التسميات الصينية نسخ من صور Ian نفسه، وكلها دون تعديل في [examples/gallery](../examples/gallery) ([مصدر كل منها](../docs/provenance.md)). وتبقى صور الشخصيات الأخرى محجوبة إلى أن تُراجَع.
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

| الوكيل | مجلد المهارة داخل المشروع |
|---|---|
| Claude Code | `.claude/skills/inkexplain` |
| Codex | `.agents/skills/inkexplain` |
| Cursor | `.agents/skills/inkexplain`; ويقرأ Cursor أيضًا `.claude/skills/` و`.codex/skills/` |
| Gemini CLI, GitHub Copilot, OpenCode | `.agents/skills/inkexplain` |
| Windsurf | `.windsurf/skills/inkexplain` |
| وكلاء آخرون يقرؤون حزم `SKILL.md` | مجلد المهارات الخاص بهم |

مع `-g` تثبّت الأداة في المجلد الشخصي للوكيل بدلًا من ذلك (مثل `~/.claude/skills/` لـ Claude Code و`~/.agents/skills/` لـ Codex).

ما جرى اختباره: تضع skills CLI المهارة في المكان الصحيح لكل وكيل في الجدول أعلاه، ويعرضها Claude Code. وقد اتبعتها جلسات جديدة لوكلاء Claude Code، وُجِّهت إلى المهارة المثبّتة، اتباعًا صحيحًا في 15 طلبًا، بلا أداة صور وفي وضع المطالبات ([التقييم](../docs/evaluation.md)). وما لم يُختبر: هل تحمّل بيئةٌ المهارةَ من طلب بسيط، وتشغيل المهارة داخل Codex أو Cursor أو Gemini CLI أو GitHub Copilot أو OpenCode أو Windsurf، وتوليد الصور بأي أداة صور.

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
