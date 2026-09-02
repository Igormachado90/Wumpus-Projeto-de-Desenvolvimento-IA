import { Ambiente } from '../ambiente';
import { Casa } from '../casa';
import type { Percepcao } from '../percepcao';
import { DIRECOES, DELTA, NOME, type Direcao } from '../movimento';
import { Regras } from '../regras';

export interface ResultadoSimulacao {
  venceu: boolean;
  vivo: boolean;
  pontuacao: number;
  passos: number;
  log: string[];
}

/** Agente Reativo V1 - decide por regras simples, sem memória. */
export class AgenteReativoV1 {
  linha = 0;
  coluna = 0;
  temOuro = false;
  vivo = true;
  venceu = false;
  pontuacao = 0;
  temFlecha = true;
  passos = 0;

  private regras = new Regras();
  private log: string[] = [];

  private print(msg: string) {
    this.log.push(msg);
  }

  agir(ambiente: Ambiente): ResultadoSimulacao {
    this.passos = 0;
    this.log = [];
    this.print('🎯 Iniciando Agente Reativo V1...');
    this.print(`📐 Ambiente: ${ambiente.tamanho}x${ambiente.tamanho}`);

    let guarda = 0;
    while (this.vivo && !this.venceu) {
      guarda++;
      if (guarda > 2000) {
        this.print('⏱️ Limite de iterações de segurança atingido.');
        break;
      }

      const percepcao = this.lerPercepcao(ambiente);

      this.print(`📍 Posição: (${this.linha}, ${this.coluna})`);
      this.print(`👀 Percepção: ${this.percepcaoToString(percepcao)}`);

      if (this.temOuro && this.linha === 0 && this.coluna === 0) {
        this.sair();
        break;
      }

      if (this.temOuro && (this.linha !== 0 || this.coluna !== 0)) {
        this.retornarParaOrigem(ambiente);
        continue;
      }

      const acoesPossiveis = this.regras.getAcaesAplicaveis(percepcao);

      if (!this.temFlecha) {
        const i = acoesPossiveis.indexOf('ATIRAR');
        if (i >= 0) acoesPossiveis.splice(i, 1);
      }
      if (this.temOuro) {
        const i = acoesPossiveis.indexOf('PEGAR_OURO');
        if (i >= 0) acoesPossiveis.splice(i, 1);
      }

      let acaoEscolhida =
        acoesPossiveis.length > 0
          ? acoesPossiveis[Math.floor(Math.random() * acoesPossiveis.length)]
          : 'MOVER_ALEATORIO';

      this.print(`🎯 Ação escolhida: ${acaoEscolhida}`);
      this.executarAcao(acaoEscolhida, ambiente);
      this.verificarMorte(ambiente);
    }

    this.exibirResultado();
    return {
      venceu: this.venceu,
      vivo: this.vivo,
      pontuacao: this.pontuacao,
      passos: this.passos,
      log: this.log,
    };
  }

  private percepcaoToString(p: Percepcao): string {
    const s: string[] = [];
    if (p.brisa) s.push('Brisa');
    if (p.fedor) s.push('Fedor');
    if (p.brilho) s.push('Brilho');
    return s.length === 0 ? 'Vazio' : s.join(', ');
  }

  private lerPercepcao(ambiente: Ambiente): Percepcao {
    const casa = ambiente.getCasa(this.linha, this.coluna);
    return {
      brisa: casa.brisa,
      fedor: casa.fedor,
      brilho: casa.brilho,
      grito: false,
      impacto: false
    };
  }

  private executarAcao(acao: string, ambiente: Ambiente): void {
    switch (acao) {
      case 'MOVER_FRENTE':
      case 'MOVER_ALEATORIO':
        this.moverAleatorio(ambiente);
        break;
      case 'PEGAR_OURO':
        this.pegarOuro(ambiente);
        break;
      case 'ATIRAR':
        this.atirarFlecha(ambiente);
        break;
      default:
        this.moverAleatorio(ambiente);
    }
  }

  private moverAleatorio(ambiente: Ambiente): void {
    const direcao = DIRECOES[Math.floor(Math.random() * DIRECOES.length)];
    this.mover(direcao, ambiente);
  }

  private mover(direcao: Direcao, ambiente: Ambiente): void {
    const [dl, dc] = DELTA[direcao];
    const novaLinha = this.linha + dl;
    const novaColuna = this.coluna + dc;

    if (ambiente.dentro(novaLinha, novaColuna)) {
      // Move normalmento
      ambiente.getCasa(this.linha, this.coluna).agente = false;
      this.linha = novaLinha;
      this.coluna = novaColuna;
      ambiente.getCasa(this.linha, this.coluna).agente = true;
      ambiente.getCasa(this.linha, this.coluna).visitada = true;
      this.pontuacao -= 1;
      this.passos++;
      this.print(`Mover para ${NOME[direcao]} -> (${this.linha}, ${this.coluna})`);
    } else {
      this.print(`💥 Impacto! Tentou mover para ${NOME[direcao]}! (-1 ponto)`);
      this.pontuacao -= 1;
      this.passos++;
    }
  }

  private pegarOuro(ambiente: Ambiente): void {
    const casa = ambiente.getCasa(this.linha, this.coluna);
    if (casa.ouro) {
      casa.ouro = false;
      casa.brilho = false;
      this.temOuro = true;
      this.pontuacao += 1000;
      this.print('✨ Ouro pego! +1000 pontos');
    } else {
      casa.brilho = false;
      this.print('⚠️ Tentou pegar ouro, mas não havia nenhum aqui!');
      this.moverAleatorio(ambiente);
    }
  }

  private retornarParaOrigem(ambiente: Ambiente): void {
    // Tenta primeiro voltar para (0,0) de forma simples
    if (this.linha > 0) {
      this.mover('norte', ambiente);
      return;
    }
    if (this.coluna > 0) {
      this.mover('oeste', ambiente);
    }
    // Se já está na origem mas não saiu
    if (this.linha === 0 && this.coluna === 0) {
      this.sair();
    }
  }

  private atirarFlecha(ambiente: Ambiente): void {
    if (!this.temFlecha) {
      this.print('⚠️ Sem flechas! Tentou atirar em vão');
      return;
    }

    this.temFlecha = false;
    this.pontuacao -= 10;
    this.print('🏹 Flecha atirada! -10 pontos');

    const direcoesValidas = DIRECOES.filter((dir) => {
      const [dl, dc] = DELTA[dir];
      return ambiente.dentro(this.linha + dl, this.coluna + dc);
    });

    if (direcoesValidas.length === 0) {
      this.print('⚠️ Não há direção válida para atirar.');
      return;
    }

    const direcaoAlvo = direcoesValidas[Math.floor(Math.random() * direcoesValidas.length)];
    const [dl, dc] = DELTA[direcaoAlvo];
    const linhaAlvo = this.linha + dl;
    const colunaAlvo = this.coluna + dc;

    const casaAlvo: Casa = ambiente.getCasa(linhaAlvo, colunaAlvo);
    if (casaAlvo.wumpus) {
      casaAlvo.wumpus = false;
      this.pontuacao += 1000;
      this.print('💀 Wumpus morto! +1000 pontos');
      this.removerFedor(ambiente);
    } else {
      this.print('❌ A flecha não acertou o Wumpus.');
    }
  }

  private removerFedor(ambiente: Ambiente): void {
    for (let i = 0; i < ambiente.tamanho; i++) {
      for (let j = 0; j < ambiente.tamanho; j++) {
        ambiente.getCasa(i, j).fedor = false;
      }
    }
  }

  private verificarMorte(ambiente: Ambiente): void {
    const casa = ambiente.getCasa(this.linha, this.coluna);
    if (casa.poco) {
      this.vivo = false;
      this.pontuacao -= 1000;
      this.print('💀 Caiu em um poço! -1000 pontos');
    } else if (casa.wumpus) {
      this.vivo = false;
      this.pontuacao -= 1000;
      this.print('💀 Devorado pelo Wumpus! -1000 pontos');
    }
  }

  private sair(): void {
    this.venceu = true;
    this.pontuacao -= 1; // Ação de sair custa -1 (conforme especificação)
    if (this.temOuro) {
      this.pontuacao += 1000; // +1000 por sair com ouro
    }
    this.print('🚪 Saiu com o ouro! +1000 pontos');
  }

  private exibirResultado(): void {
    this.print('='.repeat(40));
    if (this.venceu) {
      this.print('🏅 VITÓRIA! Agente saiu com ouro!');
    } else if (!this.vivo) {
      this.print('💀 AGENTE MORREU!');
    } else {
      this.print('⏹️ Agente parou sem vencer.');
    }
    this.print(`🏆 Pontuação final: ${this.pontuacao}`);
    this.print(`👣 Total de passos: ${this.passos}`);
    this.print('='.repeat(40));
  }
}
