<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain: ideias em forma visual. Um emaranhado de rabiscos passa por um funil de manivela e sai como o esboço nítido de uma lâmpada." width="100%">
</p>

# InkExplain

*Ideias em forma visual.*

Transforme ideias complexas em ilustrações desenhadas à mão, bonitas e consistentes, com IA.

<!-- inkexplain:languages:start -->
<details>
<summary>Languages</summary>

[English](../README.md) · [Español](./README.es.md) · **Português** · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [简体中文](./README.zh.md) · [繁體中文](./README.zh-Hant.md) · [한국어](./README.ko.md) · [日本語](./README.ja.md) · [العربية](./README.ar.md) · [Русский](./README.ru.md) · [Türkçe](./README.tr.md) · [Українська](./README.uk.md)

</details>
<!-- inkexplain:languages:end -->

InkExplain é uma skill de raciocínio visual para agentes de IA. Dê a ela um artigo, um documento ou uma única ideia: ela extrai as ideias que merecem ser desenhadas, transforma cada uma em uma ação física executada por um personagem e escreve prompts que mantêm toda uma série consistente. Quando o seu agente tem uma ferramenta de geração de imagens, ela também gera, revisa e salva as imagens.

## O que faz

- **Planeja** a lista de imagens: onde cada uma entra, a ideia que ela transmite e a metáfora física que a representa.
- **Dirige o ator**: em cada imagem, um personagem, uma mão ou uma máquina encena a ideia, captado no seu momento decisivo.
- **Escreve prompts** que dão unidade à série: um só arquétipo, um só estilo e uma metáfora nova para cada imagem.
- **Gera e revisa** as imagens com a ferramenta de imagens do seu agente e depois as salva com nomes previsíveis.
- **Repara** ilustrações: remove títulos indesejados, corrige rótulos, simplifica cenas carregadas e restaura um personagem.

É ideal para artigos técnicos, explicações de produto e de arquitetura, fluxos de trabalho, comparações, relações de causa e efeito, material de cursos e textos longos que precisam de uma voz visual consistente.

## Como funciona

1. **Escolhe um arquétipo**: um personagem, o seu modo de se mover e o seu estilo visual. Se nada for pedido, InkExplain usa o próprio estilo, InkExplain Sketch.
2. **Extrai o conceito**: a tese central e as âncoras cognitivas, como pontos de ruptura, transferências, trade-offs, ciclos e mudanças de antes e depois.
3. **Planeja** uma imagem por ideia, cada uma com um tipo de estrutura, uma posição na grade de composição e uma metáfora do dia a dia encenada pelo ator.
4. **Monta o prompt** a partir do template do arquétipo, em uma ordem fixa, e gera uma imagem por chamada de ferramenta.
5. **Revisa** cada imagem com o checklist de qualidade comum e as verificações próprias do arquétipo; corrige ou gera de novo.
6. **Salva e relata**: grava as imagens em `assets/<article-slug>-…/`, no seu espaço de trabalho, e apresenta um relatório.

Planejamento e geração são separados de propósito. InkExplain não inclui um modelo de imagem; usa a ferramenta de geração de imagens que o seu agente oferece. Sem ela, passa para o **modo de prompts** e entrega prompts completos, prontos para usar. Nunca afirma ter gerado uma imagem que não gerou.

## Instalação

```bash
npx skills add agustinpabon/InkExplain --skill inkexplain
```

Usa a [CLI de skills](https://skills.sh) aberta (Node.js 22.20 ou superior). Ela detecta o seu agente, como Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode ou Windsurf, e copia a skill para a pasta que esse agente lê. Acrescente `-g` para instalá-la em todos os seus projetos, ou `-a <agente>` para escolher o agente. Por padrão, a CLI envia telemetria de uso anônima; defina `DISABLE_TELEMETRY=1` para desativá-la. O próprio InkExplain não coleta nada.

Sem Node.js, copie você mesmo a pasta `skills/inkexplain/` para a pasta de skills do seu agente; a seção “Ambientes compatíveis” lista as pastas.

## Uso

No Codex, invoque a skill com `$inkexplain`. No Claude Code e em outros ambientes, peça o InkExplain pelo nome ou descreva a tarefa; o agente carrega a skill quando o pedido corresponde à descrição dela.

```text
$inkexplain Planeje ilustrações para este artigo. Não gere nada ainda.

<cole o artigo>
```

```text
$inkexplain Ilustre este post com quatro imagens e salve-as no projeto.
```

```text
$inkexplain Use o Ferris. Uma imagem para: "ownership significa exatamente um dono por vez".
```

```text
$inkexplain Modo de prompts: escreva prompts para três imagens que eu possa colar na minha ferramenta de imagens.
```

Há mais exemplos, com todos os arquétipos e com pedidos que combinam vários, em [examples/prompts.md](../examples/prompts.md).

## Arquétipos

Um arquétipo define quem encena a ideia, como se move e como a cena é desenhada. InkExplain Sketch é o arquétipo padrão; qualquer outro é escolhido pelo nome. Os arquétipos nunca se misturam dentro de uma mesma imagem.

<!-- inkexplain:archetypes:start -->
<table>
<tr>
<td width="25%" valign="top"><img src="../assets/examples/thumbs/ink.png" alt="InkExplain Sketch: a real render of the database-indexing request" width="100%"><br><b>InkExplain Sketch</b> · padrão<br>Black ink line, one blue flow, one yellow swipe.<br><sub>MIT · InkExplain contributors</sub></td>
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

- **Categorias**: `house-style` é original do InkExplain; `mascot` é o mascote de um projeto ou de uma comunidade, usado com os devidos créditos; `tribute-character` é um personagem criado por terceiros, desenhado dentro dos limites dos seus direitos; `animation-preset` fica reservada para presets originais de movimento e encenação.
- **Status**: arquétipos `active` estão prontos para uso; os `experimental` são escolhidos apenas pelo nome e sinalizados em toda entrega; os `gated-authorized` são usados apenas quando citados pelo nome, somente dentro dos limites da sua própria autorização, e nunca são publicados sem uma autorização registrada.

Os aliases, o DNA de movimento, as folhas de estilo, os créditos e as restrições de cada arquétipo estão em [routing.md](../skills/inkexplain/references/routing.md), gerado a partir do registro de arquétipos [registry.json](../skills/inkexplain/registry.json).

## Galeria de exemplos

Imagens de exemplo do Xiaohei, sem alterações. As imagens dos outros personagens só serão publicadas depois de revisadas.

| Um peixe, muitos usos | Separar por finalidade | Prensa de ideias |
|---|---|---|
| ![Um peixe, muitos usos: Xiaohei corta um peixe de material em vários pedaços](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) | ![Separar por finalidade: Xiaohei carimba cartões de ideias soltas e os distribui em três bandejas](../examples/gallery/en/xiaohei/02-sort-by-purpose.png) | ![Prensa de ideias: Xiaohei gira uma manivela para prensar ideias soltas em uma ideia clara](../examples/gallery/en/xiaohei/06-idea-press.png) |

<!-- inkexplain:gallery-credits:start -->
Xiaohei é o personagem de Ian em Ian Xiaohei Illustrations (MIT). As imagens com rótulos em inglês são cópias das publicadas pelo Visual IP Illustrations (MIT) e as com rótulos em chinês são cópias das imagens do próprio Ian; todas estão sem alterações em [examples/gallery](../examples/gallery) ([de onde veio cada uma](../docs/provenance.md)). As imagens dos outros personagens ficam retidas até serem revisadas.
<!-- inkexplain:gallery-credits:end -->

## Como adicionar novos personagens e estilos de animação

Os arquétipos são dados mais Markdown. Adicionar um não exige escrever código no validador.

1. **Registre-o.** Adicione uma entrada em `archetypes` no [`skills/inkexplain/registry.json`](../skills/inkexplain/registry.json): id, nome, categoria, status, resumo, aliases, sufixo de saída, `motionDna`, `styleSheet`, `legalNotice`, `sampleGates` e os marcadores de identidade e de isolamento em `contract`. Personagens de terceiros precisam do titular dos direitos, da licença e dos termos de atribuição; os protegidos começam como `gated-authorized`.
2. **Escreva o pacote.** Crie `skills/inkexplain/references/archetypes/<id>/` com os cinco arquivos do pacote: `rights.md`, `identity.md`, `style.md`, `motion-and-acting.md` e `prompts.md`. Copie a estrutura de um pacote existente; o método comum em `references/workflow/` já cobre todo o resto.
3. **Gere e valide.** Adicione o crédito ao [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) e um exemplo ao [examples/prompts.md](../examples/prompts.md) e depois execute `npm run build:docs` e `npm run check`. A tabela de arquétipos acima, o `routing.md` e todas as traduções se atualizam sozinhos.

O passo a passo completo, com uma entrada de registro completa e as perguntas sobre direitos que devem ser respondidas primeiro, está em [docs/adding-an-archetype.md](../docs/adding-an-archetype.md).

## Convenções de saída

- Cada arquétipo grava os arquivos em sua própria pasta no seu espaço de trabalho: `assets/<article-slug>-illustrations/` para o padrão e `assets/<article-slug>-<id>/` para os demais.
- Os nomes dos arquivos são slugs numerados em inglês: `01-two-breakpoints.png`, `02-handoff-path.png`.
- Arquivos existentes nunca são sobrescritos; novas versões recebem o próximo número ou o sufixo `-v2`.
- No modo de prompts, dentro de um projeto, os prompts são salvos como `prompts.md` na mesma pasta.
- Toda entrega termina com um relatório curto: arquétipo, imagens e a finalidade de cada uma, caminhos dos arquivos, as imagens mais fortes e as opcionais, pendências e, nos arquétipos de terceiros, a nota sobre direitos.

## Ambientes compatíveis

| Agente | Pasta da skill em um projeto |
|---|---|
| Claude Code | `.claude/skills/inkexplain` |
| Codex | `.agents/skills/inkexplain` |
| Cursor | `.agents/skills/inkexplain`; o Cursor também lê `.claude/skills/` e `.codex/skills/` |
| Gemini CLI, GitHub Copilot, OpenCode | `.agents/skills/inkexplain` |
| Windsurf | `.windsurf/skills/inkexplain` |
| Outros agentes que leem pacotes `SKILL.md` | a pasta de skills deles |

Com `-g`, a CLI instala na pasta pessoal do agente (por exemplo `~/.claude/skills/` para o Claude Code e `~/.agents/skills/` para o Codex).

O que foi testado: a CLI de skills coloca a skill corretamente para cada agente da tabela, e o Claude Code a lista. Sessões novas de agentes do Claude Code, apontadas para a skill instalada, seguiram-na corretamente em 15 pedidos, sem ferramenta de imagem e em modo prompt ([avaliação](../docs/evaluation.md)). Não testado: se um ambiente carrega a skill a partir de um pedido simples, executá-la dentro do Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode ou Windsurf, nem gerar imagens com qualquer ferramenta de imagem.

## Personalização

- **Em cada pedido**: indique com suas próprias palavras o arquétipo, o número de imagens, a proporção, o idioma dos rótulos ou o slug do artigo.
- **Estilo próprio**: InkExplain Sketch fica em `skills/inkexplain/references/archetypes/ink/`. Altere `style.md` e `prompts.md` juntos e mantenha a paleta do `registry.json` em sintonia com eles.
- **Novos arquétipos**: veja [Como adicionar novos personagens e estilos de animação](../docs/adding-an-archetype.md).

## Requisitos

- Um agente compatível com pacotes de skills `SKILL.md`.
- Para gerar imagens: uma ferramenta de geração de imagens disponível para esse agente.
- Para desenvolvimento: Node.js 22 ou mais recente. Não há dependências para instalar.

## Limitações

- InkExplain não inclui nenhum modelo de imagem; a qualidade das imagens depende da ferramenta que o seu agente usa.
- Modelos de imagem erram a grafia dos rótulos, principalmente em sistemas de escrita não latinos. Use rótulos curtos e revise-os.
- InkExplain Sketch ainda não tem imagens de exemplo revisadas.
- Arquétipos de terceiros estão sujeitos às restrições de seus titulares. Arquétipos restritos são para uso apenas dentro dos limites da sua própria autorização, e InkExplain não publica exemplos deles.
- As traduções do README foram produzidas com auxílio de IA e não foram revisadas por tradutores profissionais. As tabelas geradas mantêm os dados do registro em inglês.

## Desenvolvimento

```bash
npm test               # testes unitários, de verificações, da CLI e do repositório (executor de testes nativo do Node)
npm run validate       # valida o repositório e o pacote da skill
npm run build:docs     # regenera o routing.md e as tabelas de arquétipos e seletores de idioma dos READMEs
npm run check          # tudo o que a CI executa
```

A arquitetura, o modelo de divulgação progressiva, o catálogo de verificações e o processo de lançamento estão documentados em [docs/architecture.md](../docs/architecture.md) e [docs/release-checklist.md](../docs/release-checklist.md). As diretrizes para colaboradores e agentes estão em [AGENTS.md](../AGENTS.md).

## Créditos e licença

<!-- inkexplain:credits:start -->
O InkExplain se baseia em três projetos anteriores sob licença MIT: [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations) de yangchuansheng, [Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) de Ian e [5km Littlebox Illustrations](https://github.com/okooo5km/5km-littlebox-illustrations) de okooo5km. As imagens da galeria são cópias sem modificação dos dois primeiros. Personagens e marcas de terceiros pertencem aos respectivos titulares. Veja [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) para as origens, os avisos e as licenças de cada personagem.
<!-- inkexplain:credits:end -->

InkExplain é distribuído sob a [Licença MIT](../LICENSE).
