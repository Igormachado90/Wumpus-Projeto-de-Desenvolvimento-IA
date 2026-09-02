// src/game/agentes/agenteAprendizagemV3.ts

import { Ambiente } from '../ambiente';
import type { Percepcao } from '../percepcao';
import { DELTA, type Direcao, Movimento } from '../movimento';
import { Memoria } from '../memoria';
import { AlgoritmoGenetico } from '../genetico/algoritmoGenetico';
import type { ResultadoSimulacao } from './agenteReativoV1';

/**
 * Estatísticas do Algoritmo Genético
 */
export interface EstatisticasAG {
  melhor: number[];
  pior: number[];
  media: number[];
}

/**
 * Resultado estendido com estatísticas do AG
 */
export interface ResultadoSimulacaoV3 extends ResultadoSimulacao {
  estatisticasAG: EstatisticasAG | null;
  caminhoEncontrado: number;
  fitnessMelhor: number;
  fitnessMedia: number;
}

/**
 * Agente de Aprendizagem V3 - usa Algoritmo Genético para encontrar o melhor caminho.
 * 
 * Etapa 4 do projeto: Agente com Aprendizagem via Algoritmos Genéticos
 * 
 * Características:
 * - População: 50 indivíduos
 * - Gerações: 1000 (conforme especificação)
 * - Cruzamento: 85%
 * - Mutação: 5%
 * - Fitness: versão 2 (normalizada)
 */
export class AgenteAprendizagemV3 {
  // Estado do agente
  linha = 0;
  coluna = 0;
  temOuro = false;
  vivo = true;
  venceu = false;
  pontuacao = 0;
  passos = 0;

  // Memória e caminho
  private memoria!: Memoria;
  private melhorCaminho: (Direcao | 'pegar_ouro')[] = [];
  private log: string[] = [];

  // Configurações do AG (conforme especificação)
  tamanhoPopulacao = 50;
  numeroGeracoes = 1000;
  taxaCruzamento = 0.85;
  taxaMutacao = 0.05;

  // Estatísticas do AG
  private estatisticasAG: EstatisticasAG | null = null;
  private fitnessMelhorFinal = 0;
  private fitnessMediaFinal = 0;

  // Controles
  private tentativasPegarOuro = 0;
  private readonly MAX_TENTATIVAS = 3;

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Executa o agente no ambiente
   */
  agir(ambiente: Ambiente): ResultadoSimulacaoV3 {
    this.inicializar(ambiente);
    this.log = [];
    this.estatisticasAG = null;

    this.print('='.repeat(40));
    this.print('🧬 Iniciando Agente de Aprendizagem V3');
    this.print(`📐 Ambiente: ${ambiente.tamanho}x${ambiente.tamanho}`);
    this.print('='.repeat(40));
    this.print(`📊 População: ${this.tamanhoPopulacao}`);
    this.print(`🔄 Gerações: ${this.numeroGeracoes}`);
    this.print(`🔀 Cruzamento: ${this.taxaCruzamento * 100}%`);
    this.print(`🧬 Mutação: ${this.taxaMutacao * 100}%`);
    this.print('');

    // Fase 1: Treinamento com AG
    this.treinar(ambiente);

    // Fase 2: Execução do melhor caminho
    this.executarMelhorCaminho(ambiente);

    // Fase 3: Exibição do resultado
    this.exibirResultado();

    return {
      venceu: this.venceu,
      vivo: this.vivo,
      pontuacao: this.pontuacao,
      passos: this.passos,
      log: this.log,
      estatisticasAG: this.estatisticasAG,
      caminhoEncontrado: this.melhorCaminho?.length || 0,
      fitnessMelhor: this.fitnessMelhorFinal,
      fitnessMedia: this.fitnessMediaFinal,
    };
  }

  /**
   * Reseta o agente para o estado inicial
   */
  reset(): void {
    this.linha = 0;
    this.coluna = 0;
    this.temOuro = false;
    this.vivo = true;
    this.venceu = false;
    this.pontuacao = 0;
    this.passos = 0;
    this.melhorCaminho = [];
    this.estatisticasAG = null;
    this.tentativasPegarOuro = 0;
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Inicializa o estado do agente
   */
  private inicializar(ambiente: Ambiente): void {
    this.reset();

    this.memoria = new Memoria(ambiente.tamanho);
    this.memoria.marcarSeguro(0, 0);
    this.memoria.marcarVisitado(0, 0);

    // Posiciona agente em (0,0)
    ambiente.getCasa(0, 0).agente = true;
    ambiente.getCasa(0, 0).visitada = true;
    ambiente.getCasa(0, 0).seguro = true;
  }

  /**
   * Registra uma mensagem no log
   */
  private print(msg: string): void {
    this.log.push(msg);
  }

  /**
   * Fase 1: Treinamento com Algoritmo Genético
   */
  private treinar(ambiente: Ambiente): void {
    this.print('🔬 Treinando com Algoritmo Genético...');
    this.print('');

    try {
      const ag = new AlgoritmoGenetico({
        tamanhoAmbiente: ambiente.tamanho,
        tamanhoPopulacao: this.tamanhoPopulacao,
        numeroGeracoes: this.numeroGeracoes,
        taxaCruzamento: this.taxaCruzamento,
        taxaMutacao: this.taxaMutacao,
        tipoFitness: 'versao2',
        usarPMX: false,
        onLog: (msg) => this.print(msg),
        onEstatisticas: (estats) => {
          this.estatisticasAG = {
            melhor: estats.melhor,
            pior: estats.pior,
            media: estats.media,
          };
        },
      });

      const resultado = ag.evoluir(ambiente);
      this.melhorCaminho = resultado ?? [];

      // Captura fitness final
      if (this.estatisticasAG) {
        const { melhor, media } = this.estatisticasAG;
        this.fitnessMelhorFinal = melhor[melhor.length - 1] || 0;
        this.fitnessMediaFinal = media[media.length - 1] || 0;
      }

      this.print('');
      this.print(`✅ Melhor caminho encontrado: ${this.melhorCaminho.length} passos`);
      this.print(`📈 Melhor Fitness: ${this.fitnessMelhorFinal.toFixed(4)}`);
      this.print(`📈 Média Fitness: ${this.fitnessMediaFinal.toFixed(4)}`);
    } catch (e) {
      this.print(`❌ Erro no treinamento: ${e}`);
      this.gerarCaminhoAlternativo(ambiente);
    }
  }

  /**
   * Gera um caminho alternativo quando o AG falha
   */
  private gerarCaminhoAlternativo(ambiente: Ambiente): void {
    this.print('🔄 Gerando caminho alternativo (heurística)...');

    const tamanho = ambiente.tamanho;
    const caminho: Direcao[] = [];

    // 1. Encontra o ouro
    let ouroLinha = -1;
    let ouroColuna = -1;

    for (let i = 0; i < tamanho; i++) {
      for (let j = 0; j < tamanho; j++) {
        if (ambiente.getCasa(i, j).ouro) {
          ouroLinha = i;
          ouroColuna = j;
          break;
        }
      }
      if (ouroLinha >= 0) break;
    }

    if (ouroLinha >= 0 && ouroLinha < tamanho && ouroColuna < tamanho) {
      // 2. Vai até o ouro (priorizando norte/oeste para evitar poços)
      let atualLinha = 0;
      let atualColuna = 0;
      let seguranca = 0;

      while ((atualLinha !== ouroLinha || atualColuna !== ouroColuna) && seguranca < 100) {
        seguranca++;

        // Prioriza norte (subir) e oeste (esquerda) - mais seguro
        if (atualLinha > ouroLinha) {
          const dir: Direcao = 'norte';
          if (this.isMovimentoSeguro(atualLinha, atualColuna, dir, ambiente)) {
            caminho.push(dir);
            const [dl] = DELTA[dir];
            atualLinha += dl;
            continue;
          }
        }
        if (atualColuna > ouroColuna) {
          const dir: Direcao = 'oeste';
          if (this.isMovimentoSeguro(atualLinha, atualColuna, dir, ambiente)) {
            caminho.push(dir);
            const [, dc] = DELTA[dir];
            atualColuna += dc;
            continue;
          }
        }
        if (atualLinha < ouroLinha) {
          const dir: Direcao = 'sul';
          if (this.isMovimentoSeguro(atualLinha, atualColuna, dir, ambiente)) {
            caminho.push(dir);
            const [dl] = DELTA[dir];
            atualLinha += dl;
            continue;
          }
        }
        if (atualColuna < ouroColuna) {
          const dir: Direcao = 'leste';
          if (this.isMovimentoSeguro(atualLinha, atualColuna, dir, ambiente)) {
            caminho.push(dir);
            const [, dc] = DELTA[dir];
            atualColuna += dc;
            continue;
          }
        }

        // Se não conseguiu mover, tenta qualquer direção
        const dirs = Movimento.todas();
        let moveu = false;
        for (const dir of dirs) {
          if (this.isMovimentoSeguro(atualLinha, atualColuna, dir, ambiente)) {
            const [dl, dc] = DELTA[dir];
            const nl = atualLinha + dl;
            const nc = atualColuna + dc;
            if (nl >= 0 && nl < tamanho && nc >= 0 && nc < tamanho) {
              caminho.push(dir);
              atualLinha = nl;
              atualColuna = nc;
              moveu = true;
              break;
            }
          }
        }
        if (!moveu) break;
      }

      // 3. Pega o ouro (sinalizado como ação especial)
      if (atualLinha === ouroLinha && atualColuna === ouroColuna) {
        // A ação de pegar ouro será tratada na execução
        caminho.push('pegar_ouro' as Direcao);
      }

      // 4. Volta para a origem (priorizando norte/oeste)
      while ((atualLinha > 0 || atualColuna > 0) && seguranca < 200) {
        seguranca++;

        if (atualLinha > 0) {
          const dir: Direcao = 'norte';
          if (this.isMovimentoSeguro(atualLinha, atualColuna, dir, ambiente)) {
            caminho.push(dir);
            const [dl] = DELTA[dir];
            atualLinha += dl;
            continue;
          }
        }
        if (atualColuna > 0) {
          const dir: Direcao = 'oeste';
          if (this.isMovimentoSeguro(atualLinha, atualColuna, dir, ambiente)) {
            caminho.push(dir);
            const [, dc] = DELTA[dir];
            atualColuna += dc;
            continue;
          }
        }

        // Se não conseguiu, tenta qualquer direção
        const dirs = Movimento.todas();
        let moveu = false;
        for (const dir of dirs) {
          if (this.isMovimentoSeguro(atualLinha, atualColuna, dir, ambiente)) {
            const [dl, dc] = DELTA[dir];
            const nl = atualLinha + dl;
            const nc = atualColuna + dc;
            if (nl >= 0 && nl < tamanho && nc >= 0 && nc < tamanho) {
              caminho.push(dir);
              atualLinha = nl;
              atualColuna = nc;
              moveu = true;
              break;
            }
          }
        }
        if (!moveu) break;
      }
    }

    // Se não encontrou caminho, gera aleatório
    if (caminho.length === 0) {
      this.print('⚠️ Gerando caminho aleatório...');
      for (let i = 0; i < 50; i++) {
        const dir = Movimento.aleatoria();
        caminho.push(dir);
      }
    }

    this.melhorCaminho = caminho;
    this.print(`🔄 Caminho alternativo: ${caminho.length} passos`);
  }

  /**
   * Verifica se um movimento é seguro
   */
  private isMovimentoSeguro(
    linha: number,
    coluna: number,
    dir: Direcao,
    ambiente: Ambiente
  ): boolean {
    const [dl, dc] = DELTA[dir];
    const nl = linha + dl;
    const nc = coluna + dc;

    if (!ambiente.dentro(nl, nc)) return false;

    const casa = ambiente.getCasa(nl, nc);
    return !casa.poco && !casa.wumpus;
  }

  /**
   * Fase 2: Executa o melhor caminho encontrado
   */
  private executarMelhorCaminho(ambiente: Ambiente): void {
    this.print('');
    this.print('🚀 Executando melhor caminho...');
    this.print('');

    if (!this.melhorCaminho || this.melhorCaminho.length === 0) {
      this.print('❌ Sem caminho para executar');
      return;
    }

    // Reseta posição
    this.resetar(ambiente);

    let iteracoes = 0;
    const maxIteracoes = this.melhorCaminho.length + 100;

    for (const acao of this.melhorCaminho) {
      iteracoes++;
      if (iteracoes > maxIteracoes) break;
      if (!this.vivo || this.venceu) break;
      if (this.passos > 500) break;

      // Verifica se é ação de pegar ouro
      if (acao === 'pegar_ouro' || (typeof acao === 'string' && acao.includes('pegar'))) {
        if (ambiente.getCasa(this.linha, this.coluna).ouro && !this.temOuro) {
          this.pegarOuro(ambiente);
        }
        continue;
      }

      this.passos++;

      // Lê percepção
      const percepcao = this.lerPercepcao(ambiente);

      // Se tem brilho e não pegou, pega
      if (percepcao.brilho && !this.temOuro) {
        this.pegarOuro(ambiente);
        if (this.temOuro) continue;
      }

      // Move na direção
      const direcao = acao as Direcao;
      this.mover(direcao, ambiente);

      // Atualiza memória
      this.memoria.marcarVisitado(this.linha, this.coluna);

      // Verifica morte
      this.verificarMorte(ambiente);
      if (!this.vivo) break;

      // Verifica se chegou na origem com ouro
      if (this.temOuro && this.linha === 0 && this.coluna === 0) {
        this.sair();
        break;
      }
    }

    this.print('');
    this.print(`📊 Executou ${this.passos} passos`);
  }

  /**
   * Reseta o agente no ambiente
   */
  private resetar(ambiente: Ambiente): void {
    if (ambiente.dentro(this.linha, this.coluna)) {
      ambiente.getCasa(this.linha, this.coluna).agente = false;
    }

    this.linha = 0;
    this.coluna = 0;
    this.temOuro = false;
    this.vivo = true;
    this.venceu = false;
    this.pontuacao = 0;
    this.passos = 0;

    this.memoria = new Memoria(ambiente.tamanho);
    this.memoria.marcarSeguro(0, 0);
    this.memoria.marcarVisitado(0, 0);

    ambiente.getCasa(0, 0).agente = true;
    ambiente.getCasa(0, 0).visitada = true;
  }

  /**
   * Lê percepção do ambiente
   */
  private lerPercepcao(ambiente: Ambiente): Percepcao {
    if (!ambiente.dentro(this.linha, this.coluna)) {
      return {
        brisa: false,
        fedor: false,
        brilho: false,
        grito: false,
        impacto: false
      };
    }

    const casa = ambiente.getCasa(this.linha, this.coluna);
    return {
      brisa: casa.brisa,
      fedor: casa.fedor,
      brilho: casa.brilho,
      grito: casa.grito || !ambiente.wumpusAlive,
      impacto: false,
    };
  }

  /**
   * Move o agente em uma direção
   */
  private mover(direcao: Direcao, ambiente: Ambiente): void {
    const [dl, dc] = DELTA[direcao];
    const novaLinha = this.linha + dl;
    const novaColuna = this.coluna + dc;

    if (ambiente.dentro(novaLinha, novaColuna)) {
      ambiente.getCasa(this.linha, this.coluna).agente = false;
      this.linha = novaLinha;
      this.coluna = novaColuna;
      ambiente.getCasa(this.linha, this.coluna).agente = true;
      ambiente.getCasa(this.linha, this.coluna).visitada = true;
      this.pontuacao -= 1;
    } else {
      this.pontuacao -= 5;
    }
  }

  /**
   * Pega o ouro
   */
  private pegarOuro(ambiente: Ambiente): void {
    const casa = ambiente.getCasa(this.linha, this.coluna);

    if (casa.ouro) {
      casa.ouro = false;
      casa.brilho = false;
      this.temOuro = true;
      this.pontuacao += 1000;
      this.tentativasPegarOuro = 0;
      this.print('✨ Ouro pego! +1000 pontos');
    } else {
      this.tentativasPegarOuro++;
      if (this.tentativasPegarOuro > this.MAX_TENTATIVAS) {
        this.print('⚠️ Muitas tentativas de pegar ouro');
        this.tentativasPegarOuro = 0;
      }
    }
  }

  /**
   * Verifica se o agente morreu
   */
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

  /**
   * Sai do ambiente com ouro
   */
  private sair(): void {
    this.venceu = true;
    this.pontuacao -= 1;
    if (this.temOuro) {
      this.pontuacao += 1000;
      this.print('🚪 Saiu com o ouro! +1000 pontos');
    } else {
      this.print('🚪 Saiu sem o ouro!');
    }
  }

  /**
   * Fase 3: Exibe o resultado final
   */
  private exibirResultado(): void {
    this.print('');
    this.print('='.repeat(50));
    this.print('📊 RESULTADO FINAL DO AGENTE DE APRENDIZAGEM V3');
    this.print('='.repeat(50));

    if (this.venceu) {
      this.print('🎉 VITÓRIA! Agente saiu com ouro!');
      this.print(`📊 Caminho encontrado: ${this.melhorCaminho?.length || 0} passos`);
    } else if (!this.vivo) {
      this.print('💀 AGENTE MORREU!');
    } else {
      this.print('⏹️ Agente parou sem vencer.');
    }

    this.print(`🏆 Pontuação final: ${this.pontuacao}`);
    this.print(`💰 Ouro: ${this.temOuro ? '✅ Pegou' : '❌ Não pegou'}`);
    this.print(`👣 Passos executados: ${this.passos}`);

    // Estatísticas do AG
    if (this.estatisticasAG) {
      const { melhor, pior, media } = this.estatisticasAG;
      this.print('');
      this.print('📈 Estatísticas do Algoritmo Genético:');
      this.print(`   Melhor Fitness Final: ${melhor[melhor.length - 1]?.toFixed(4) || 0}`);
      this.print(`   Pior Fitness Final: ${pior[pior.length - 1]?.toFixed(4) || 0}`);
      this.print(`   Média Fitness Final: ${media[media.length - 1]?.toFixed(4) || 0}`);
      this.print(`   Total de Gerações: ${melhor.length}`);
    }

    this.print('='.repeat(50));
  }
}

/**
 * Função de conveniência para executar o agente
 */
export function executarAgenteAprendizagemV3(ambiente: Ambiente): ResultadoSimulacaoV3 {
  const agente = new AgenteAprendizagemV3();
  return agente.agir(ambiente);
}