import { Ambiente } from './ambiente';
// import { Casa } from './casa';

export interface GeradorConfig {
  pocos: number;
  wumpus: number;
  ouro: number;
}

export class Gerador {
  gerar(ambiente: Ambiente, config: GeradorConfig): void {
    // 1. Limpa o ambiente (reset)
    this.limparAmbiente(ambiente);
    // 2. Posiciona objetos
    const posicoes = this.gerarPosicoes(ambiente, config);
    // 3. Aplica objetos no grid
    this.aplicarObjetos(ambiente, posicoes);
    // 4. Gera percepções (brisa, fedor, brilho)
    this.gerarPercepcoes(ambiente);
    // 5. Posiciona agente em (0,0)
    ambiente.getCasa(0, 0).agente = true;
    ambiente.agentPosition = [0, 0];
    // 6. Registra posições importantes
    ambiente.goldPosition = posicoes.ouro.length > 0 ? posicoes.ouro[0] : null;
    ambiente.wumpusPosition = posicoes.wumpus.length > 0 ? posicoes.wumpus[0] : null;
  }

  private limparAmbiente(ambiente: Ambiente): void {
    const n = ambiente.tamanho;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const casa = ambiente.getCasa(i, j);
        casa.poco = false;
        casa.wumpus = false;
        casa.ouro = false;
        casa.agente = false;
        casa.brisa = false;
        casa.fedor = false;
        casa.brilho = false;
        casa.grito = false;
        casa.visitada = false;
        casa.seguro = false;
        casa.perigoso = false;
        casa.desconhecido = true;
      }
    }
  }

  private gerarPosicoes(ambiente: Ambiente, config: GeradorConfig): {
    pocos: [number, number][];
    wumpus: [number, number][];
    ouro: [number, number][];
  } {
    const n = ambiente.tamanho;
    const posicoesOcupadas = new Set<string>();
    
    // Sempre bloqueia (0,0)
    posicoesOcupadas.add('0,0');

    const posicoes = {
      pocos: this.gerarObjetos(n, config.pocos, posicoesOcupadas, 'poco'),
      wumpus: this.gerarObjetos(n, config.wumpus, posicoesOcupadas, 'wumpus'),
      ouro: this.gerarObjetos(n, config.ouro, posicoesOcupadas, 'ouro'),
    };

    return posicoes;
  }

  private gerarObjetos(
    tamanho: number,
    qtd: number,
    ocupadas: Set<string>,
    tipo: 'poco' | 'wumpus' | 'ouro'
  ): [number, number][] {
    const posicoes: [number, number][] = [];
    let maxTentativas = 10000;
    let tentativas = 0;

    while (posicoes.length < qtd && tentativas < maxTentativas) {
      tentativas++;
      
      const linha = Math.floor(Math.random() * tamanho);
      const coluna = Math.floor(Math.random() * tamanho);
      const chave = `${linha},${coluna}`;

      // Verifica se posição é válida
      if (!this.posicaoValida(linha, coluna, ocupadas)) {
        continue;
      }

      // Verifica se é (0,0) - já está bloqueado
      if (linha === 0 && coluna === 0) {
        continue;
      }

      // Posição válida, adiciona
      posicoes.push([linha, coluna]);
      ocupadas.add(chave);
    }

    if (posicoes.length < qtd) {
      console.warn(
        `⚠️ Não foi possível posicionar todos os ${tipo}. ` +
        `Posicionados: ${posicoes.length}/${qtd}`
      );
    }

    return posicoes;
  }

  /**
   * Verifica se uma posição é válida para colocar um objeto
   */
  private posicaoValida(linha: number, coluna: number, ocupadas: Set<string>): boolean {
    const chave = `${linha},${coluna}`;
    return !ocupadas.has(chave);
  }

  /**
   * Aplica os objetos no grid do ambiente
   */
  private aplicarObjetos(
    ambiente: Ambiente,
    posicoes: {
      pocos: [number, number][];
      wumpus: [number, number][];
      ouro: [number, number][];
    }
  ): void {
    // Aplica poços
    for (const [linha, coluna] of posicoes.pocos) {
      ambiente.getCasa(linha, coluna).poco = true;
    }

    // Aplica Wumpus
    for (const [linha, coluna] of posicoes.wumpus) {
      ambiente.getCasa(linha, coluna).wumpus = true;
    }

    // Aplica Ouro
    for (const [linha, coluna] of posicoes.ouro) {
      ambiente.getCasa(linha, coluna).ouro = true;
    }
  }

  /**
   * Gera percepções (brisa, fedor, brilho) baseado nos objetos
   */
  gerarPercepcoes(ambiente: Ambiente): void {
    const n = ambiente.tamanho;
    
    // Primeiro, limpa percepções antigas
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const casa = ambiente.getCasa(i, j);
        casa.brisa = false;
        casa.fedor = false;
        casa.brilho = false;
      }
    }

    // Depois, aplica percepções baseado nos objetos
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const casa = ambiente.getCasa(i, j);
        
        if (casa.poco) {
          this.aplicarBrisa(ambiente, i, j);
        }
        
        if (casa.wumpus) {
          this.aplicarFedor(ambiente, i, j);
        }
        
        if (casa.ouro) {
          casa.brilho = true;
        }
      }
    }
  }

  /**
   * Aplica brisa nas casas vizinhas a um poço
   */
  private aplicarBrisa(ambiente: Ambiente, linha: number, coluna: number): void {
    const vizinhos = this.getVizinhos(ambiente, linha, coluna);
    for (const [l, c] of vizinhos) {
      ambiente.getCasa(l, c).brisa = true;
    }
  }

  /**
   * Aplica fedor nas casas vizinhas ao Wumpus
   */
  private aplicarFedor(ambiente: Ambiente, linha: number, coluna: number): void {
    const vizinhos = this.getVizinhos(ambiente, linha, coluna);
    for (const [l, c] of vizinhos) {
      ambiente.getCasa(l, c).fedor = true;
    }
  }

  /**
   * Obtém vizinhos de uma posição (apenas ortogonais)
   */
  private getVizinhos(ambiente: Ambiente, linha: number, coluna: number): [number, number][] {
    const vizinhos: [number, number][] = [];
    const direcoes: [number, number][] = [
      [-1, 0], // Norte
      [1, 0],  // Sul
      [0, -1], // Oeste
      [0, 1],  // Leste
    ];

    for (const [dl, dc] of direcoes) {
      const nl = linha + dl;
      const nc = coluna + dc;
      if (ambiente.dentro(nl, nc)) {
        vizinhos.push([nl, nc]);
      }
    }

    return vizinhos;
  }

  // ===== MÉTODOS LEGADOS (mantidos para compatibilidade) =====
  // Mas agora usando a nova implementação

  colocarPocos(ambiente: Ambiente, qtd: number): void {
    const config: GeradorConfig = { pocos: qtd, wumpus: 0, ouro: 0 };
    const posicoes = this.gerarPosicoes(ambiente, config);
    this.aplicarObjetos(ambiente, {
      pocos: posicoes.pocos,
      wumpus: [],
      ouro: [],
    });
    this.gerarPercepcoes(ambiente);
  }

  colocarWumpus(ambiente: Ambiente, qtd: number): void {
    const config: GeradorConfig = { pocos: 0, wumpus: qtd, ouro: 0 };
    const posicoes = this.gerarPosicoes(ambiente, config);
    this.aplicarObjetos(ambiente, {
      pocos: [],
      wumpus: posicoes.wumpus,
      ouro: [],
    });
    this.gerarPercepcoes(ambiente);
  }

  colocarOuro(ambiente: Ambiente, qtd: number): void {
    const config: GeradorConfig = { pocos: 0, wumpus: 0, ouro: qtd };
    const posicoes = this.gerarPosicoes(ambiente, config);
    this.aplicarObjetos(ambiente, {
      pocos: [],
      wumpus: [],
      ouro: posicoes.ouro,
    });
    this.gerarPercepcoes(ambiente);
  }
}