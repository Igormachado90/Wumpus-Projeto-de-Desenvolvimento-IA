// src/game/validacao.ts

import { Ambiente } from './ambiente';
import { Gerador } from './gerador';
import { AgenteReativoV1 } from './agentes/agenteReativoV1';
import { AgenteReativoV2 } from './agentes/agenteReativoV2';
import { AgenteAprendizagemV3 } from './agentes/agenteAprendizagemV3';
// import type { Direcao } from './movimento';
// import { DELTA } from './movimento';

export type VersaoAgente = 'v1' | 'v2' | 'v3';

export interface ConfigValidacao {
  tamanhos: number[];
  execucoes: number;
  populacaoAG: number;
  geracoesAG: number;
  taxaCruzamentoAG: number;
  taxaMutacaoAG: number;
}

// Configuração oficial do projeto (Etapa 5)
export const CONFIG_OFICIAL: ConfigValidacao = {
  tamanhos: [4, 5, 10, 15, 20],
  execucoes: 30,
  populacaoAG: 50,
  geracoesAG: 1000,
  taxaCruzamentoAG: 0.85,
  taxaMutacaoAG: 0.05,
};

// Configuração rápida para testes
export const CONFIG_RAPIDA: ConfigValidacao = {
  tamanhos: [4, 5, 10],
  execucoes: 20,
  populacaoAG: 30,
  geracoesAG: 150,
  taxaCruzamentoAG: 0.85,
  taxaMutacaoAG: 0.05,
};

export interface ExecucaoResultado {
  tamanho: number;
  versao: VersaoAgente;
  execucao: number;
  venceu: boolean;
  vivo: boolean;
  pontuacao: number;
  pegouOuro: boolean;
  passos: number;
  fitnessMelhorFinal?: number;
  fitnessMedioFinal?: number;
  semente?: number;
}

export interface CurvaGeracao {
  tamanho: number;
  execucao: number;
  historicoMelhor: number[];
  historicoPior: number[];
  historicoMedia: number[];
}

export interface ResultadoValidacao {
  config: ConfigValidacao;
  execucoes: ExecucaoResultado[];
  curvasV3: CurvaGeracao[];
  iniciadoEm: string;
  finalizadoEm: string;
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * 🐛 CORREÇÃO: a fórmula antiga usava 15% da ÁREA fixo para qualquer
 * tamanho (n² × 0.15). Como o caminho necessário para alcançar o ouro e
 * voltar também cresce com n, o risco ACUMULADO ao longo do percurso
 * cresce de forma aproximadamente exponencial com o tamanho do tabuleiro
 * — por isso 10×10 pra cima ficava praticamente impossível de vencer para
 * qualquer agente, por mais inteligente que fosse.
 *
 * Nova fórmula: calibra a densidade por casa (p) para que a probabilidade
 * de sobreviver a um percurso de ida-e-volta de tamanho mínimo (~2×tamanho
 * passos) permaneça igual (~35%) não importa o tamanho do tabuleiro. Isso
 * mantém a dificuldade comparável entre 4×4 e 20×20, em vez de explodir.
 */
function pocosParaTamanho(tamanho: number): number {
  const SOBREVIVENCIA_ALVO = 0.35;
  const distanciaMinima = Math.max(2 * tamanho, 1);
  const densidadePorCasa = 1 - Math.pow(SOBREVIVENCIA_ALVO, 1 / distanciaMinima);
  const pocos = Math.round(tamanho * tamanho * densidadePorCasa);
  return Math.min(Math.max(pocos, 1), tamanho * tamanho - 3);
}

/** Gerador de números pseudo-aleatórios determinístico (LCG), usado para
 * ambientes reproduzíveis via semente. Importante: NUNCA chame Math.random()
 * de dentro desta função — isso causaria recursão infinita se esta função
 * estiver instalada como substituta do próprio Math.random. */
function criarGeradorComSemente(semente: number): () => number {
  let estado = Math.trunc(semente) % 2147483647;
  if (estado <= 0) estado += 2147483646;
  return () => {
    estado = (estado * 16807) % 2147483647;
    return (estado - 1) / 2147483646;
  };
}

export function gerarAmbienteFixo(tamanho: number, semente?: number): Ambiente {
  // Usa semente se fornecida para resultados reproduzíveis
  if (semente !== undefined) {
    const oldRandom = Math.random;
    Math.random = criarGeradorComSemente(semente);
    try {
      const ambiente = new Ambiente(tamanho);
      const gerador = new Gerador();
      gerador.gerar(ambiente, {
        pocos: pocosParaTamanho(tamanho),
        wumpus: 1,
        ouro: 1,
      });
      return ambiente;
    } finally {
      // 'finally' garante que o Math.random original volta mesmo se
      // gerador.gerar() lançar um erro no meio do caminho.
      Math.random = oldRandom;
    }
  }
  
  const ambiente = new Ambiente(tamanho);
  const gerador = new Gerador();
  gerador.gerar(ambiente, {
    pocos: pocosParaTamanho(tamanho),
    wumpus: 1,
    ouro: 1,
  });
  return ambiente;
}

// ============================================================
// EXECUÇÃO DOS AGENTES
// ============================================================

function rodarV1(ambienteBase: Ambiente): { 
  venceu: boolean; 
  vivo: boolean; 
  pegouOuro: boolean; 
  pontuacao: number; 
  passos: number;
  log: string[];
} {
  const agente = new AgenteReativoV1();
  const clone = ambienteBase.clone();
  clone.agentPosition = [0, 0];
  const r = agente.agir(clone);
  return { 
    venceu: r.venceu, 
    vivo: r.vivo, 
    pegouOuro: agente.temOuro, 
    pontuacao: r.pontuacao, 
    passos: r.passos,
    log: r.log || [],
  };
}

function rodarV2(ambienteBase: Ambiente): { 
  venceu: boolean; 
  vivo: boolean; 
  pegouOuro: boolean; 
  pontuacao: number; 
  passos: number;
  log: string[];
} {
  const agente = new AgenteReativoV2();
  const clone = ambienteBase.clone();
  clone.agentPosition = [0, 0];
  const r = agente.agir(clone);
  return { 
    venceu: r.venceu, 
    vivo: r.vivo, 
    pegouOuro: agente.temOuro, 
    pontuacao: r.pontuacao, 
    passos: r.passos,
    log: r.log || [],
  };
}

interface ResultadoV3 {
  venceu: boolean;
  vivo: boolean;
  pegouOuro: boolean;
  pontuacao: number;
  passos: number;
  historicoMelhor: number[];
  historicoPior: number[];
  historicoMedia: number[];
  log: string[];
}

function rodarV3(ambienteBase: Ambiente, config: ConfigValidacao): ResultadoV3 {
  const agente = new AgenteAprendizagemV3();
  
  // Configura o AG com os parâmetros da validação
  agente.tamanhoPopulacao = config.populacaoAG;
  agente.numeroGeracoes = config.geracoesAG;
  agente.taxaCruzamento = config.taxaCruzamentoAG;
  agente.taxaMutacao = config.taxaMutacaoAG;
  
  const clone = ambienteBase.clone();
  clone.agentPosition = [0, 0];
  
  const resultado = agente.agir(clone);
  
  // ✅ Corrigido: usa venceu e pontuacao para inferir pegouOuro
  // O agente V3 pega ouro se venceu (pois precisa de ouro para vencer)
  // Ou se a pontuação indica que pegou ouro (+1000)
  const pegouOuro = resultado.venceu || 
                    (resultado.pontuacao > 1000) || 
                    (resultado as any).temOuro === true;
  
  return {
    venceu: resultado.venceu,
    vivo: resultado.vivo,
    pegouOuro: pegouOuro,
    pontuacao: resultado.pontuacao,
    passos: resultado.passos,
    historicoMelhor: resultado.estatisticasAG?.melhor || [],
    historicoPior: resultado.estatisticasAG?.pior || [],
    historicoMedia: resultado.estatisticasAG?.media || [],
    log: resultado.log || [],
  };
}

// ============================================================
// VALIDAÇÃO PRINCIPAL
// ============================================================

export async function rodarValidacao(
  config: ConfigValidacao,
  onProgresso?: (feito: number, total: number, rotulo: string) => void,
  sinalCancelado?: () => boolean
): Promise<ResultadoValidacao> {
  const execucoes: ExecucaoResultado[] = [];
  const curvasV3: CurvaGeracao[] = [];

  const total = config.tamanhos.length * config.execucoes * 3;
  let feito = 0;
  const iniciadoEm = new Date().toISOString();

  const ceder = () => new Promise((resolve) => setTimeout(resolve, 0));

  for (const tamanho of config.tamanhos) {
    for (let execucao = 1; execucao <= config.execucoes; execucao++) {
      // 🐛 CORREÇÃO: antes, um ÚNICO mapa fixo (semente = tamanho) era
      // reaproveitado nas 30 execuções inteiras. Isso significa que a
      // "taxa de vitória" de cada tamanho refletia o resultado em UM ÚNICO
      // mapa (com sorte/azar próprios daquele layout), não uma média
      // estatística sobre mapas diferentes. Agora cada execução gera um
      // mapa novo (semente = tamanho*100000 + execucao), mas os 3 agentes
      // (V1/V2/V3) ainda enfrentam o MESMO mapa dentro da mesma execução,
      // preservando a comparação justa entre eles.
      const ambienteFixo = gerarAmbienteFixo(tamanho, tamanho * 100000 + execucao);

      if (sinalCancelado?.()) {
        return { 
          config, 
          execucoes, 
          curvasV3, 
          iniciadoEm, 
          finalizadoEm: new Date().toISOString() 
        };
      }

      // V1
      const r1 = rodarV1(ambienteFixo);
      execucoes.push({ 
        tamanho, 
        versao: 'v1', 
        execucao, 
        venceu: r1.venceu, 
        vivo: r1.vivo, 
        pegouOuro: r1.pegouOuro, 
        pontuacao: r1.pontuacao, 
        passos: r1.passos 
      });
      feito++;
      onProgresso?.(feito, total, `n=${tamanho} · V1 · execução ${execucao}/${config.execucoes}`);
      await ceder();

      if (sinalCancelado?.()) break;
      
      // V2
      const r2 = rodarV2(ambienteFixo);
      execucoes.push({ 
        tamanho, 
        versao: 'v2', 
        execucao, 
        venceu: r2.venceu, 
        vivo: r2.vivo, 
        pegouOuro: r2.pegouOuro, 
        pontuacao: r2.pontuacao, 
        passos: r2.passos 
      });
      feito++;
      onProgresso?.(feito, total, `n=${tamanho} · V2 · execução ${execucao}/${config.execucoes}`);
      await ceder();

      if (sinalCancelado?.()) break;
      
      // V3 (mais lento, executa por último)
      const r3 = rodarV3(ambienteFixo, config);
      execucoes.push({
        tamanho,
        versao: 'v3',
        execucao,
        venceu: r3.venceu,
        vivo: r3.vivo,
        pegouOuro: r3.pegouOuro,
        pontuacao: r3.pontuacao,
        passos: r3.passos,
        fitnessMelhorFinal: r3.historicoMelhor.at(-1),
        fitnessMedioFinal: r3.historicoMedia.at(-1),
      });
      
      curvasV3.push({
        tamanho,
        execucao,
        historicoMelhor: r3.historicoMelhor,
        historicoPior: r3.historicoPior,
        historicoMedia: r3.historicoMedia,
      });
      
      feito++;
      onProgresso?.(feito, total, `n=${tamanho} · V3 · execução ${execucao}/${config.execucoes}`);
      await ceder();
    }
  }

  return { 
    config, 
    execucoes, 
    curvasV3, 
    iniciadoEm, 
    finalizadoEm: new Date().toISOString() 
  };
}

// ============================================================
// ANÁLISE DE RESULTADOS
// ============================================================

export interface ResumoVersaoTamanho {
  tamanho: number;
  versao: VersaoAgente;
  execucoes: number;
  vitorias: number;
  mortes: number;
  parou: number;
  taxaVitoria: number;
  taxaOuro: number;
  pontuacaoMedia: number;
  pontuacaoDesvio: number;
  pontuacaoMin: number;
  pontuacaoMax: number;
  passosMedio: number;
  passosMin: number;
  passosMax: number;
}

export function resumirPorVersaoETamanho(execucoes: ExecucaoResultado[]): ResumoVersaoTamanho[] {
  const chaves = new Map<string, ExecucaoResultado[]>();
  
  for (const e of execucoes) {
    const chave = `${e.tamanho}|${e.versao}`;
    if (!chaves.has(chave)) chaves.set(chave, []);
    chaves.get(chave)!.push(e);
  }

  const resumo: ResumoVersaoTamanho[] = [];
  
  for (const [chave, lista] of chaves) {
    const [tamanhoStr, versao] = chave.split('|');
    const tamanho = Number(tamanhoStr);
    const vitorias = lista.filter((e) => e.venceu).length;
    const mortes = lista.filter((e) => !e.vivo).length;
    const pegaramOuro = lista.filter((e) => e.pegouOuro).length;
    const parou = lista.length - vitorias - mortes;
    
    const pontuacoes = lista.map((e) => e.pontuacao);
    const passos = lista.map((e) => e.passos);
    const media = pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length;
    const variancia = pontuacoes.reduce((a, b) => a + (b - media) ** 2, 0) / pontuacoes.length;

    resumo.push({
      tamanho,
      versao: versao as VersaoAgente,
      execucoes: lista.length,
      vitorias,
      mortes,
      parou,
      taxaVitoria: vitorias / lista.length,
      taxaOuro: pegaramOuro / lista.length,
      pontuacaoMedia: media,
      pontuacaoDesvio: Math.sqrt(variancia),
      pontuacaoMin: Math.min(...pontuacoes),
      pontuacaoMax: Math.max(...pontuacoes),
      passosMedio: passos.reduce((a, b) => a + b, 0) / passos.length,
      passosMin: Math.min(...passos),
      passosMax: Math.max(...passos),
    });
  }

  resumo.sort((a, b) => a.tamanho - b.tamanho || a.versao.localeCompare(b.versao));
  return resumo;
}

export function curvaMediaV3PorTamanho(
  curvas: CurvaGeracao[],
  tamanho: number
): { geracao: number; melhor: number; pior: number; media: number }[] {
  const doTamanho = curvas.filter((c) => c.tamanho === tamanho);
  if (doTamanho.length === 0) return [];

  const numGeracoes = Math.max(...doTamanho.map((c) => c.historicoMelhor.length));
  const resultado: { geracao: number; melhor: number; pior: number; media: number }[] = [];

  // 🐛 CORREÇÃO: antes, quando uma execução já tinha PARADO (array mais
  // curto que outra — o que agora é normal, já que o AG para
  // antecipadamente ao convergir), ela era simplesmente EXCLUÍDA da média
  // dali em diante em vez de continuar contribuindo com seu último valor
  // (já convergido). Isso fazia a média cair em degraus conforme as
  // execuções que convergiram rápido (boas) iam "saindo" da conta,
  // sobrando cada vez mais só as execuções lentas/ruins — dando a
  // impressão de que o fitness piorava com o tempo, quando na verdade
  // cada execução individual nunca piora (o elitismo garante isso).
  // Agora, cada execução repete (forward-fill) seu último valor conhecido
  // depois de ter convergido, então ela continua representada
  // corretamente até o fim do gráfico.
  for (let g = 0; g < numGeracoes; g++) {
    let somaMelhor = 0;
    let somaPior = 0;
    let somaMedia = 0;
    let n = 0;
    
    for (const c of doTamanho) {
      if (c.historicoMelhor.length === 0) continue;
      const idx = Math.min(g, c.historicoMelhor.length - 1);
        somaMelhor += c.historicoMelhor[idx] || 0;
        somaPior += c.historicoPior[idx] || 0;
        somaMedia += c.historicoMedia[idx] || 0;
        n++;
    }
    
    if (n > 0) {
      resultado.push({ 
        geracao: g, 
        melhor: somaMelhor / n, 
        pior: somaPior / n, 
        media: somaMedia / n 
      });
    }
  }

  return resultado;
}

export function exportarCSV(execucoes: ExecucaoResultado[]): string {
  const linhas = ['tamanho,versao,execucao,resultado,pegou_ouro,pontuacao,passos,fitness_melhor_final,fitness_medio_final'];
  
  for (const e of execucoes) {
    const resultado = e.venceu ? 'venceu' : !e.vivo ? 'morreu' : 'parou';
    linhas.push(
      `${e.tamanho},${e.versao},${e.execucao},${resultado},${e.pegouOuro ? 1 : 0},${e.pontuacao},${e.passos},${e.fitnessMelhorFinal ?? ''},${e.fitnessMedioFinal ?? ''}`
    );
  }
  
  return linhas.join('\n');
}

export function exportarCSVFitness(curvas: CurvaGeracao[]): string {
  const tamanhos = Array.from(new Set(curvas.map((curva) => curva.tamanho))).sort((a, b) => a - b);
  const linhas = ['tamanho,geracao,melhor,media,pior'];

  for (const tamanho of tamanhos) {
    const curvaMedia = curvaMediaV3PorTamanho(curvas, tamanho);
    for (const ponto of curvaMedia) {
      linhas.push(`${tamanho},${ponto.geracao},${ponto.melhor},${ponto.media},${ponto.pior}`);
    }
  }

  return linhas.join('\n');
}

export function exportarJSON(resultado: ResultadoValidacao): string {
  return JSON.stringify(resultado, null, 2);
}