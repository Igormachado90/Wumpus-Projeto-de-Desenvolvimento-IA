# Wumpus Exterminador — React + TypeScript

Porte completo do projeto Flutter/Dart original (Wumpus Exterminador do
Futuro) para **React + TypeScript**, usando Vite.

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

### O que não foi portado
O `validador.dart` (≈885 linhas) era uma ferramenta de linha de
comando para gerar relatórios de benchmark (CSV, Markdown, gráficos em
texto, scripts Python) comparando os agentes em vários tamanhos de
ambiente, salvando arquivos em disco. Por não ter relação com o app
interativo/gráfico, essa parte não foi portada. Posso portá-la também
se for necessário (por exemplo, como um botão que gera e baixa um
relatório CSV/Markdown no navegador).

## Estrutura

```
src/
  game/            # lógica pura do jogo (sem dependência de UI)
  hooks/           # hooks utilitários (ex.: largura da janela)
  components/      # componentes React + CSS
public/images/     # logo e imagens dos agentes
```
