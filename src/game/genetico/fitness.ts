import { Cromossomo } from './cromossomo';
import { Ambiente } from '../ambiente';
import { Casa } from '../casa';
import { DELTA } from '../movimento';

export type TipoFitness = 'versao1' | 'versao2' | 'versao3' | 'versao4';

// const FITNESS_MAXIMO = 3000.0;
const FITNESS_MAXIMO = 100.0;
const FITNESS_MINIMO = -100.0;

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

// Versão 1: Pontuação Absoluta
function avaliarVersao1(cromossomo: Cromossomo, ambiente: Ambiente): number {
  const sim = ambiente.clone();
  let linha = 0;
  let coluna = 0;
  let temOuro = false;
  let vivo = true;
  let acertos = 0;
  let erros = 0;
  let completou = false;
  let passos = 0;

  for (const direcao of cromossomo.genes) {
    passos++;
    if (!vivo) break;
    if (temOuro && linha === 0 && coluna === 0) {
      completou = true;
      break;
    }
    if (passos > 500) break;

    const [dl, dc] = DELTA[direcao];
    const novaLinha = linha + dl;
    const novaColuna = coluna + dc;

    if (!sim.dentro(novaLinha, novaColuna)) {
      erros++;
      continue;
    }

    linha = novaLinha;
    coluna = novaColuna;
    acertos++;

    const casa: Casa = sim.getCasa(linha, coluna);
    if (casa.poco || casa.wumpus) {
      erros += 1000;
      vivo = false;
      break;
    }

    if (casa.ouro && !temOuro) {
      casa.ouro = false;
      temOuro = true;
      acertos += 10;
    }

    if (temOuro && linha === 0 && coluna === 0) {
      completou = true;
      acertos += 100;
      break;
    }
  }

  let fitness = acertos - erros;
  
  // Penalidades mais suaves
  if (!completou && temOuro) fitness -= 50;
  if (!vivo) fitness -= 100;
  if (passos > 300) fitness -= 10;

  return clamp(fitness, FITNESS_MINIMO, FITNESS_MAXIMO);
}

// Versão 2: Fitness Normalizado
function avaliarVersao2(cromossomo: Cromossomo, ambiente: Ambiente): number {
  const sim = ambiente.clone();
  let linha = 0;
  let coluna = 0;
  let temOuro = false;
  let vivo = true;
  let acertos = 0;
  let passosValidos = 0;
  let completou = false;
  let passos = 0;

  for (const direcao of cromossomo.genes) {
    passos++;
    if (!vivo) break;
    if (temOuro && linha === 0 && coluna === 0) {
      completou = true;
      break;
    }
    if (passos > 500) break;

    const [dl, dc] = DELTA[direcao];
    const novaLinha = linha + dl;
    const novaColuna = coluna + dc;

    if (!sim.dentro(novaLinha, novaColuna)) continue;

    linha = novaLinha;
    coluna = novaColuna;
    passosValidos++;
    acertos++;

    const casa = sim.getCasa(linha, coluna);
    if (casa.poco || casa.wumpus) {
      vivo = false;
      break;
    }

    if (casa.ouro && !temOuro) {
      casa.ouro = false;
      temOuro = true;
      acertos += 10;
    }

    if (temOuro && linha === 0 && coluna === 0) {
      completou = true;
      acertos += 100;
      break;
    }
  }

  if (passosValidos === 0) return 0.0;

  // Normalização melhorada
  let fitness = acertos / (passosValidos + 1);
  
  if (completou) {
    fitness += 2.0; // Bônus maior por completar
    fitness += Math.min(1.0, 50 / passos); // Bônus por eficiência
  }
  
  if (!vivo) {
    fitness -= 5.0;
  }
  
  // Penalidade por muitos passos
  if (passos > 300) {
    fitness -= (passos - 300) / 100;
  }

  return clamp(fitness, 0.0, FITNESS_MAXIMO);
}

// Versão 3: Recompensa por Exploração e Eficiência
function avaliarVersao3(cromossomo: Cromossomo, ambiente: Ambiente): number {
  const sim = ambiente.clone();
  let linha = 0;
  let coluna = 0;
  let temOuro = false;
  let vivo = true;
  let pontuacao = 0;
  let passos = 0;

  for (const direcao of cromossomo.genes) {
    if (!vivo) break;
    if (temOuro && linha === 0 && coluna === 0) break;
    if (passos >= 500) break;

    passos++;
    pontuacao -= 1;

    const [dl, dc] = DELTA[direcao];
    const novaLinha = linha + dl;
    const novaColuna = coluna + dc;

    if (!sim.dentro(novaLinha, novaColuna)) {
      pontuacao -= 5; // Penalidade por batida na parede
      continue;
    }

    linha = novaLinha;
    coluna = novaColuna;

    const casa = sim.getCasa(linha, coluna);

    if (casa.poco || casa.wumpus) {
      pontuacao -= 1000;
      vivo = false;
      break;
    }

    if (casa.ouro && !temOuro) {
      casa.ouro = false;
      temOuro = true;
      pontuacao += 1000;
    }

    if (temOuro && linha === 0 && coluna === 0) {
      pontuacao += 1000;
      break;
    }
  }

  // Normalização melhorada
  const maxPontuacao = 4000;
  let fitness = (pontuacao + 2000) / maxPontuacao;
  
  // Bônus por completar
  if (temOuro && linha === 0 && coluna === 0) {
    fitness += 0.5;
  }

  return clamp(fitness, 0.0, FITNESS_MAXIMO);
}

// Versão 4: Híbrida (v3 + eficiência + exploração)
function avaliarVersao4(cromossomo: Cromossomo, ambiente: Ambiente): number {
  const fitness3 = avaliarVersao3(cromossomo, ambiente);
  
  // Eficiência: menor caminho é melhor
  const eficiencia = Math.max(0, 1.0 - cromossomo.genes.length / 200.0);
  
  // Exploração: quantas casas diferentes visitou
  const posicoes = new Set<string>();
  let linha = 0;
  let coluna = 0;
  for (const direcao of cromossomo.genes) {
    const [dl, dc] = DELTA[direcao];
    const novaLinha = linha + dl;
    const novaColuna = coluna + dc;
    if (ambiente.dentro(novaLinha, novaColuna)) {
      linha = novaLinha;
      coluna = novaColuna;
      posicoes.add(`${linha},${coluna}`);
    }
  }
  const exploracao = Math.min(1, posicoes.size / (ambiente.tamanho * ambiente.tamanho));

  // Combinação ponderada
  return clamp(
    fitness3 * 0.5 + eficiencia * 0.3 + exploracao * 0.2,
    0.0,
    FITNESS_MAXIMO
  );
}

export function avaliar(
  cromossomo: Cromossomo,
  ambiente: Ambiente,
  tipo: TipoFitness = 'versao2'
): number {
  switch (tipo) {
    case 'versao1':
      return avaliarVersao1(cromossomo, ambiente);
    case 'versao2':
      return avaliarVersao2(cromossomo, ambiente);
    case 'versao3':
      return avaliarVersao3(cromossomo, ambiente);
    case 'versao4':
      return avaliarVersao4(cromossomo, ambiente);
  }
}

export const Fitness = {
  FITNESS_MAXIMO,
  FITNESS_MINIMO,
  avaliar,
  avaliarVersao1,
  avaliarVersao2,
  avaliarVersao3,
  avaliarVersao4,
};
