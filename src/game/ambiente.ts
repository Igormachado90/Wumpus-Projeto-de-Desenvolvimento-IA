import { Casa } from './casa';
import { type Direcao, posicaoValida, moverPosicao } from './movimento';
import type { Percepcao } from './percepcao';

export class Ambiente {
  tamanho: number;
  matriz: Casa[][];
  agentPosition: [number, number] = [0, 0];
  goldPosition: [number, number] | null = null;
  wumpusPosition: [number, number] | null = null;
  wumpusAlive: boolean = true;
  hasArrow: boolean = true;
  hasGold: boolean = false;
  isGameOver: boolean = false;
  totalActions: number = 0;
  score: number = 0;

  constructor(tamanho: number) {
    this.tamanho = tamanho;
    this.matriz = Array.from({ length: tamanho }, () =>
      Array.from({ length: tamanho }, () => new Casa())
    );
  }

  dentro(linha: number, coluna: number): boolean {
    return posicaoValida([linha, coluna], this.tamanho);
  }

  getCasa(linha: number, coluna: number): Casa {
    return this.matriz[linha][coluna];
  }

  // Nova: obtém casa por posição
  getCasaPorPosicao(pos: [number, number]): Casa {
    return this.getCasa(pos[0], pos[1]);
  }

  // Nova: obtém percepções de uma posição
  getPercepcoes(pos: [number, number]): Percepcao {
    const casa = this.getCasaPorPosicao(pos);
    return {
      brisa: casa.brisa,
      fedor: casa.fedor,
      brilho: casa.brilho,
      grito: !this.wumpusAlive,  // Se Wumpus morto, gritou
      impacto: false,
    };
  }

  // Nova: verifica se posição é segura (sem perigos conhecidos)
  isSegura(pos: [number, number]): boolean {
    const casa = this.getCasaPorPosicao(pos);
    return !casa.poco && !casa.wumpus;
  }

  // Nova: verifica se posição tem ouro
  hasOuro(pos: [number, number]): boolean {
    return this.getCasaPorPosicao(pos).ouro;
  }

  // Nova: atualiza posição do agente
  moverAgente(pos: [number, number]): void {
    const [antigaL, antigaC] = this.agentPosition;
    const [novaL, novaC] = pos;
    
    // Remove agente da posição antiga
    this.getCasa(antigaL, antigaC).agente = false;
    
    // Adiciona agente na nova posição
    this.getCasa(novaL, novaC).agente = true;
    this.getCasa(novaL, novaC).visitada = true;
    
    // Atualiza posição do agente
    this.agentPosition = pos;
    this.totalActions++;
    this.score -= 1; // Cada ação custa -1 ponto
  }

  // Nova: verifica se o agente pode se mover para uma direção
  podeMover(dir: Direcao): boolean {
    const [linha, coluna] = moverPosicao(this.agentPosition, dir);
    return this.dentro(linha, coluna);
  }

  // Nova: valida se encontrou ouro ou morreu
  verificarEstado(): void {
    const casa = this.getCasaPorPosicao(this.agentPosition);
    
    // Verifica se pegou ouro
    if (casa.ouro && !this.hasGold) {
      // O agente precisa da ação GRAB para pegar
      // Isso será verificado nas ações
    }
    
    // Verifica se caiu em poço
    if (casa.poco) {
      this.isGameOver = true;
      this.score -= 1000;
    }
    
    // Verifica se foi comido pelo Wumpus
    if (casa.wumpus && this.wumpusAlive) {
      this.isGameOver = true;
      this.score -= 1000;
    }
  }

  // Nova: obtém vizinhos de uma posição
  getVizinhos(pos: [number, number]): [number, number][] {
    const [linha, coluna] = pos;
    const vizinhos: [number, number][] = [];
    const direcoes: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dl, dc] of direcoes) {
      const nl = linha + dl;
      const nc = coluna + dc;
      if (this.dentro(nl, nc)) {
        vizinhos.push([nl, nc]);
      }
    }
    
    return vizinhos;
  }

  clone(): Ambiente {
    const novo = new Ambiente(this.tamanho);
    
    // Clona a matriz
    for (let i = 0; i < this.tamanho; i++) {
      for (let j = 0; j < this.tamanho; j++) {
        novo.matriz[i][j] = this.matriz[i][j].clone();
      }
    }
    
    // Copia o estado
    novo.agentPosition = [...this.agentPosition];
    novo.goldPosition = this.goldPosition ? [...this.goldPosition] : null;
    novo.wumpusPosition = this.wumpusPosition ? [...this.wumpusPosition] : null;
    novo.wumpusAlive = this.wumpusAlive;
    novo.hasArrow = this.hasArrow;
    novo.hasGold = this.hasGold;
    novo.isGameOver = this.isGameOver;
    novo.totalActions = this.totalActions;
    novo.score = this.score;
    
    return novo;
  }
}