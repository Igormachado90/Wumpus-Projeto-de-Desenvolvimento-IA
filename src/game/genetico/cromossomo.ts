// src/game/genetico/cromossomo.ts (correções)

import type { Direcao } from '../movimento';
import { DIRECOES, NOME, type DirecaoCurta } from '../movimento';

function direcaoAleatoriaRaw(): Direcao {
  return DIRECOES[Math.floor(Math.random() * 4)];
}

export class Cromossomo {
  genes: Direcao[];
  fitness = 0.0;
  id?: string; // Para identificação

  constructor(genes: Direcao[]) {
    this.genes = genes;
    this.id = this.gerarId();
  }

  // Gera ID único para rastreamento
  private gerarId(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  static aleatorio(tamanho: number): Cromossomo {
    const genes: Direcao[] = [];
    for (let i = 0; i < tamanho; i++) {
      genes.push(direcaoAleatoriaRaw());
    }
    return new Cromossomo(genes);
  }

  // Novo: gera cromossomo com distribuição balanceada
  static aleatorioBalanceado(tamanho: number): Cromossomo {
    const genes: Direcao[] = [];
    const direcoes = [...DIRECOES];
    
    // Distribui direções uniformemente
    for (let i = 0; i < tamanho; i++) {
      const dir = direcoes[i % 4];
      genes.push(dir);
    }
    
    // Embaralha para evitar padrões
    for (let i = genes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [genes[i], genes[j]] = [genes[j], genes[i]];
    }
    
    return new Cromossomo(genes);
  }

  /** Cruzamento por Ponto Único */
  static cruzar(pai1: Cromossomo, pai2: Cromossomo): Cromossomo {
    const ponto = Math.floor(Math.random() * pai1.genes.length);
    const genes: Direcao[] = [];
    for (let i = 0; i < pai1.genes.length; i++) {
      genes.push(i < ponto ? pai1.genes[i] : pai2.genes[i]);
    }
    return new Cromossomo(genes);
  }

  /** Cruzamento de 2 pontos */
  static cruzarDoisPontos(pai1: Cromossomo, pai2: Cromossomo): Cromossomo {
    const tamanho = pai1.genes.length;
    let ponto1 = Math.floor(Math.random() * tamanho);
    let ponto2 = Math.floor(Math.random() * tamanho);
    
    if (ponto1 > ponto2) {
      [ponto1, ponto2] = [ponto2, ponto1];
    }
    
    const genes: Direcao[] = [];
    for (let i = 0; i < tamanho; i++) {
      if (i >= ponto1 && i <= ponto2) {
        genes.push(pai2.genes[i]);
      } else {
        genes.push(pai1.genes[i]);
      }
    }
    return new Cromossomo(genes);
  }

  /** Cruzamento PMX (Partially Mapped Crossover) - CORRIGIDO */
  static cruzarPMX(pai1: Cromossomo, pai2: Cromossomo): Cromossomo {
    const tamanho = pai1.genes.length;
    let ponto1 = Math.floor(Math.random() * tamanho);
    let ponto2 = Math.floor(Math.random() * tamanho);

    if (ponto1 > ponto2) {
      [ponto1, ponto2] = [ponto2, ponto1];
    }

    // Inicializa filho com genes do pai1
    const filho: Direcao[] = [...pai1.genes];
    
    // Mapeamento: gene do pai1 -> gene do pai2
    const mapeamento = new Map<string, string>();
    for (let i = ponto1; i <= ponto2; i++) {
      const chave = pai1.genes[i];
      const valor = pai2.genes[i];
      if (chave !== valor) {
        mapeamento.set(chave, valor);
      }
    }

    // Troca os genes na seção de mapeamento
    for (let i = ponto1; i <= ponto2; i++) {
      filho[i] = pai2.genes[i];
    }

    // Corrige genes fora da seção que podem ter conflito
    for (let i = 0; i < tamanho; i++) {
      if (i >= ponto1 && i <= ponto2) continue;
      
      let gene = pai1.genes[i];
      let conflito = true;
      let seguranca = 0;
      
      while (conflito && seguranca < 100) {
        seguranca++;
        conflito = false;
        
        // Verifica se gene aparece na seção de mapeamento
        for (let j = ponto1; j <= ponto2; j++) {
          if (filho[j] === gene) {
            // Encontra o mapeamento
            let mapeado = mapeamento.get(gene);
            if (mapeado) {
              gene = mapeado as Direcao;
              conflito = true;
              break;
            }
          }
        }
      }
      
      filho[i] = gene;
    }

    return new Cromossomo(filho);
  }

  mutar(taxa: number): void {
    for (let i = 0; i < this.genes.length; i++) {
      if (Math.random() < taxa) {
        this.genes[i] = direcaoAleatoriaRaw();
      }
    }
  }

  /** Mutação por Inversão */
  mutarInversao(taxa: number): void {
    if (Math.random() < taxa) {
      let ponto1 = Math.floor(Math.random() * this.genes.length);
      let ponto2 = Math.floor(Math.random() * this.genes.length);

      if (ponto1 > ponto2) {
        [ponto1, ponto2] = [ponto2, ponto1];
      }

      const subLista = this.genes.slice(ponto1, ponto2 + 1).reverse();
      for (let i = 0; i < subLista.length; i++) {
        this.genes[ponto1 + i] = subLista[i];
      }
    }
  }

  /** Novo: Mutação por troca de dois genes */
  mutarTroca(taxa: number): void {
    if (Math.random() < taxa) {
      const i = Math.floor(Math.random() * this.genes.length);
      let j = Math.floor(Math.random() * this.genes.length);
      while (j === i) {
        j = Math.floor(Math.random() * this.genes.length);
      }
      [this.genes[i], this.genes[j]] = [this.genes[j], this.genes[i]];
    }
  }

  clone(): Cromossomo {
    const c = new Cromossomo([...this.genes]);
    c.fitness = this.fitness;
    c.id = this.id;
    return c;
  }

  /** Retorna genes como array de direções curtas (para compatibilidade) */
  getGenesCurtos(): DirecaoCurta[] {
    return this.genes.map(g => {
      const map: Record<Direcao, DirecaoCurta> = {
        norte: 'N',
        sul: 'S',
        leste: 'L',
        oeste: 'O'
      };
      return map[g];
    });
  }

  toString(): string {
    return this.genes.map((d) => NOME[d][0]).join(' → ');
  }
}