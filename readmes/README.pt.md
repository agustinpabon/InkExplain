<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain: ideias em forma visual. Um emaranhado de rabiscos passa por um funil de manivela e sai como o esboço nítido de uma lâmpada." width="100%">
</p>

# InkExplain

*Ideias em forma visual.*

Transforme ideias complexas em ilustrações desenhadas à mão, bonitas e consistentes, com IA.

<!-- inkexplain:languages:start -->
[English](../README.md) | [Español](./README.es.md) | **Português** | [Deutsch](./README.de.md) | [Français](./README.fr.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-Hant.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [العربية](./README.ar.md) | [Русский](./README.ru.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)
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

A skill é a pasta `skills/inkexplain/`. Copie-a para o local onde o seu agente procura skills.

A partir de uma cópia local deste repositório:

```bash
# Codex
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R skills/inkexplain "${CODEX_HOME:-$HOME/.codex}/skills/"

# Claude Code (skills pessoais; para restringi-la a um projeto, use .claude/skills/ dentro dele)
mkdir -p ~/.claude/skills
cp -R skills/inkexplain ~/.claude/skills/

# Cursor (skills pessoais; para restringi-la a um projeto, use .cursor/skills/ dentro dele)
mkdir -p ~/.cursor/skills
cp -R skills/inkexplain ~/.cursor/skills/
```

O endereço público previsto deste repositório é `agustinpabon/inkexplain`. Ele ainda não foi publicado; quando for, a [CLI de skills](https://skills.sh) deverá conseguir instalar a skill com:

```bash
npx skills add agustinpabon/inkexplain --skill inkexplain
```

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
| Arquétipo | Categoria | Resumo do estilo | Situação legal |
|---|---|---|---|
| InkExplain Sketch (`ink`, padrão) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on pale sky-blue or lavender backgrounds that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tolva |
| Seal (`seal`) | `mascot` | A product-neutral white seal in a plain navy cap and deep-blue hoodie, always logo-free, performing the idea in sparse article sketches. | `active` · No separate character license recorded; the pack text is MIT as part of InkExplain · Sealos (original mascot image) |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 · Renee French |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP when asked · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **Categorias**: `house-style` é original do InkExplain; `mascot` é o mascote de um projeto ou de uma comunidade, usado com os devidos créditos; `tribute-character` é um personagem criado por terceiros, desenhado dentro dos limites dos seus direitos; `animation-preset` fica reservada para presets originais de movimento e encenação.
- **Status**: arquétipos `active` estão prontos para uso; os `experimental` são escolhidos apenas pelo nome e sinalizados em toda entrega; os `gated-authorized` são usados apenas quando citados pelo nome, somente dentro dos limites da sua própria autorização, e nunca são publicados sem uma autorização registrada.

Os aliases, o DNA de movimento, as folhas de estilo, os créditos e as restrições de cada arquétipo estão em [routing.md](../skills/inkexplain/references/routing.md), gerado a partir do registro de arquétipos [registry.json](../skills/inkexplain/registry.json).

## Galeria de exemplos

Imagens de exemplo, cada uma com o seu arquétipo. As imagens do InkExplain Sketch serão adicionadas após revisão.

| Littlebox | Ferris | Seal |
|---|---|---|
| ![Caminho de transferência: Littlebox passa um cartão lacrado da entrada até o estado pronto](../examples/gallery/en/littlebox/04-handoff-path.png) | ![Separar por finalidade: Ferris separa materiais com as pinças](../examples/gallery/en/ferris/02-sort-by-purpose.png) | ![Poço de informação: a foca tira ideias de um poço](../examples/gallery/en/seal/05-information-well.png) |
| **OpenClaw** | **Go Gopher** | **Xiaohei** |
| ![Prensa de ideias: o mascote do OpenClaw opera uma prensa](../examples/gallery/en/openclaw/06-idea-press.png) | ![Ponte de confiança: o gopher coloca tábuas sobre um vão](../examples/gallery/en/gopher/08-trust-bridge.png) | ![Um peixe, muitos usos: Xiaohei corta um peixe de material em vários pedaços](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) |

Littlebox é uma adaptação de 5km Littlebox Illustrations, de okooo5km (MIT). Ferris é obra de Karen Rustad Tolva (CC0). O gopher do Go foi criado por Renee French (CC BY 4.0). O mascote do OpenClaw vem do projeto OpenClaw (MIT). Xiaohei é o personagem de Ian em Ian Xiaohei Illustrations (MIT). Todas as imagens estão em [examples/gallery](../examples/gallery): com rótulos em inglês para seis arquétipos e em chinês para quatro.

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

| Ambiente | Onde a skill fica | Imagens |
|---|---|---|
| Codex | `${CODEX_HOME:-$HOME/.codex}/skills/inkexplain` | Usa a ferramenta de geração de imagens do ambiente quando houver uma disponível; o pacote também inclui metadados do Codex em `agents/openai.yaml`. |
| Claude Code | `~/.claude/skills/inkexplain` ou `.claude/skills/inkexplain` | O Claude Code não tem um gerador de imagens embutido. InkExplain funciona no modo de prompts, a menos que você conecte uma ferramenta de geração de imagens, por exemplo por meio de um servidor MCP. |
| Outros agentes que carregam pacotes `SKILL.md` | a pasta de skills do ambiente | Mesma regra: gera imagens quando existe uma ferramenta de imagem; caso contrário, usa o modo de prompts. |

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
Personagens e marcas de terceiros permanecem propriedade de seus respectivos titulares. Consulte [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) para avisos e licenças de cada personagem.
<!-- inkexplain:credits:end -->

InkExplain é distribuído sob a [Licença MIT](../LICENSE).
