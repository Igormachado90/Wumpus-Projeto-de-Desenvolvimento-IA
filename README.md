# Wumpus Exterminador — React + TypeScript

> "No escuro, algo se move entre cavernas. Ele não vê. Não ouve. Mas
> sente o cheiro de ouro e o barulho de passos." 🕹️

## 🕳️ O Mundo de Wumpus

O **Mundo de Wumpus** é um dos problemas mais clássicos da Inteligência
Artificial, apresentado por Russell & Norvig como exercício definitivo
de agentes racionais atuando sob incerteza. A premissa é simples e
brutal: um agente entra em uma caverna organizada em grade. Em algum
lugar dessa grade há **ouro** — o objetivo. Em outros, **poços sem
fundo**, que matam instantaneamente quem cai neles. E, escondido em
algum canto, o **Wumpus**: uma fera que devora qualquer um que entre em
sua casa.

O agente não enxerga nada além da própria casa. Não existe mapa, não
existe visão de longo alcance — só **percepções locais**: uma brisa
(*brisa*) indica um poço em uma casa vizinha; um fedor (*fedor*)
denuncia o Wumpus por perto; um brilho (*brilho*) significa que o ouro
está bem ali. A partir dessas pistas fragmentadas, o agente precisa
decidir, um passo de cada vez, entre avançar, recuar, atirar sua única
flecha ou arriscar um chute — sabendo que um erro pode ser o último.

É esse cenário — decisão sob incerteza, com informação parcial e risco
real de morte a cada passo — que dá nome ao projeto: **Wumpus
Exterminador**, um trocadilho com *O Exterminador do Futuro* (The
Terminator). Assim como o T-800, os agentes aqui não enxergam o quadro
completo; agem por sensores limitados, avaliam ameaças com a lógica que
têm disponível e aprendem (ou não) a sobreviver. O projeto foi
desenvolvido em 5 etapas, cada uma construindo em cima da anterior:

- **Etapa 1 — Modelagem do ambiente**: a caverna em si. A grade, as
  casas, os poços, o Wumpus, o ouro e as percepções (brisa, fedor,
  brilho) que cada casa pode emitir — a base sobre a qual todo o resto
  é construído.
- **Etapa 2 — V1, Agente Reativo simples**: reage apenas ao que sente
  na casa atual, sem memória alguma. O equivalente a andar de olhos
  vendados.
- **Etapa 3 — V2, Reativo com memória e lógica**: constrói um mapa
  mental da caverna, marca casas seguras e perigosas, e usa eliminação
  lógica para deduzir onde os perigos realmente estão.
- **Etapa 4 — V3, Algoritmo Genético**: não raciocina passo a passo —
  evolui uma população de estratégias ao longo de gerações,
  selecionando e cruzando os caminhos que mais se aproximam de vencer.
- **Etapa 5 — Validação e Resultados**: roda os três agentes em lote
  (múltiplas execuções, múltiplos tamanhos de ambiente) e gera as
  métricas comparativas — taxa de vitória, pontuação média, passos
  médios e evolução do fitness do algoritmo genético.

Este repositório é o porte completo do projeto original em Flutter/Dart
(**Wumpus Exterminador do Futuro**) para **React + TypeScript**, usando
Vite.

## Como rodar

```bash
npm install
npm run dev       # ambiente de desenvolvimento (http://localhost:5173)
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção localmente
```

## O que foi portado

### Jogo interativo (jogável na tela)
Toda a lógica e a interface do jogo original em Flutter foram recriadas:

- `src/game/casa.ts`, `ambiente.ts`, `movimento.ts`, `gerador.ts`,
  `percepcao.ts` — modelo de dados do ambiente (grade, poços, Wumpus,
  ouro, percepções).
- `src/game/jogoStore.ts` — equivalente ao `JogoProvider` (Provider/
  ChangeNotifier do Flutter). Controla posição do agente, pontuação,
  flecha, ouro, log de operações e a execução automática dos agentes
  V1/V2/V3 simplificados usados pela UI.
- `src/game/useJogo.ts` — hook que conecta o store ao React via
  `useSyncExternalStore`.
- `src/components/*` — todos os widgets (`Header`, `MapaWidget`,
  `StatusWidget`, `PainelControle`, `LogWidget`, `AgenteWidget`,
  `JogoScreen`), reproduzindo fielmente cores, tipografia (Orbitron +
  Rajdhani), layout responsivo (desktop/mobile) e emojis do app
  original. Atalhos de teclado W/A/S/D/G/T também foram adicionados.

### Laboratório de simulação (lógica original completa)
O projeto Dart também tinha classes standalone (rodadas via `print()`
no console, não ligadas à UI) com a lógica **completa** de cada agente
e do Algoritmo Genético. Elas foram portadas integralmente:

- `src/game/memoria.ts`, `regras.ts`
- `src/game/agentes/agenteReativoV1.ts`, `agenteReativoV2.ts`,
  `agenteAprendizagemV3.ts`
- `src/game/genetico/cromossomo.ts`, `fitness.ts`, `populacao.ts`,
  `algoritmoGenetico.ts`

Essas classes agora alimentam o painel **"🔬 Laboratório de
Simulação"** (`src/components/Simulacao.tsx`), acessível dentro do
card "AGENTE" da tela principal — permitindo rodar a simulação
completa e independente de cada versão do agente e ver o log gerado.

### Validação e resultados
A validação foi adaptada para TypeScript e pode ser executada com:

```bash
npm run test:validacao
```

O comando executa `src/test/run_validacao.ts` e compara os agentes em
execuções controladas. O teste de fitness do algoritmo genético também
pode ser executado separadamente:

```bash
npm test
```

Os dados e gráficos de análises anteriores ficam em `scripts/dados/` e
`graficos/`. O comando `npm run test:validacao` salva o resultado do lote em
`scripts/dados/validacao.csv`. No navegador, o painel **Validação e
Resultados** também permite exportar os resultados e o fitness do V3 em CSV.

## Estrutura

```
src/
  game/            # lógica pura do jogo (sem dependência de UI)
  hooks/           # hooks utilitários (ex.: largura da janela)
  components/      # componentes React + CSS
public/imagnes/    # logo e imagens dos agentes
```