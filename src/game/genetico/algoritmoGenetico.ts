import { Populacao } from './populacao';
import { avaliar, type TipoFitness } from './fitness';
import { Ambiente } from '../ambiente';
import type { Direcao } from '../movimento';

// 🔧 CORREÇÃO: Exportar tipo para uso externo
export type AcaoCaminho = Direcao | 'pegar_ouro';

export interface RegistroFitness {
  geracao: number;
  versao: string;
  melhor: number;
  media: number;
  diversidade: number;
}

interface AGOpcoes {
  tamanhoAmbiente: number;
  tamanhoPopulacao?: number;
  numeroGeracoes?: number;
  taxaCruzamento?: number;
  taxaMutacao?: number;
  tipoFitness?: TipoFitness;
  usarPMX?: boolean;
  onLog?: (msg: string) => void;
  onEstatisticas?: (estats: { melhor: number[]; pior: number[]; media: number[] }) => void;
  // 🔧 NOVO: Parâmetros opcionais
  elitismo?: number;
  tamanhoCromossomo?: number;
}

function nomeFitness(tipo: TipoFitness): string {
  switch (tipo) {
    case 'versao1':
      return 'v1 (Acertos - Erros)';
    case 'versao2':
      return 'v2 (Normalizada)';
    case 'versao3':
      return 'v3 (Recompensa + Penalidade)';
    case 'versao4':
      return 'v4 (Híbrida)';
    default:
      return 'v2 (Normalizada)';
  }
}

export class AlgoritmoGenetico {
  tamanhoAmbiente: number;
  tamanhoPopulacao: number;
  numeroGeracoes: number;
  taxaCruzamento: number;
  taxaMutacao: number;
  tipoFitness: TipoFitness;
  usarPMX: boolean;
  elitismo: number;

  populacao!: Populacao;
  melhorFitness = 0.0;

  historicoMelhor: number[] = [];
  historicoPior: number[] = [];
  historicoMedia: number[] = [];
  historicoDiversidade: number[] = [];
  historicoFitness: RegistroFitness[] = [];

  tamanhoCromossomo: number;

  private log: (msg: string) => void;
  private onEstatisticas?: (estats: { melhor: number[]; pior: number[]; media: number[] }) => void;

  constructor(opcoes: AGOpcoes) {
    this.tamanhoAmbiente = opcoes.tamanhoAmbiente;
    this.tamanhoPopulacao = opcoes.tamanhoPopulacao ?? 50;
    this.numeroGeracoes = opcoes.numeroGeracoes ?? 1000;
    this.taxaCruzamento = opcoes.taxaCruzamento ?? 0.85;
    this.taxaMutacao = opcoes.taxaMutacao ?? 0.05;
    this.tipoFitness = opcoes.tipoFitness ?? 'versao2';
    this.usarPMX = opcoes.usarPMX ?? false;
    this.elitismo = opcoes.elitismo ?? 2;
    this.log = opcoes.onLog ?? (() => {});
    this.onEstatisticas = opcoes.onEstatisticas;

    // 🔧 CORREÇÃO: Tamanho do cromossomo DINÂMICO com mínimo
    // Para n=4: 32 (mínimo 100), n=5: 50 (mínimo 100), n=10: 200, n=15: 450, n=20: 800
    const calculado = this.tamanhoAmbiente * this.tamanhoAmbiente * 2;
    this.tamanhoCromossomo = Math.max(100, calculado);

    // 🔧 CORREÇÃO: Limita para não ficar muito grande (mantém performance)
    if (this.tamanhoCromossomo > 800) {
      this.tamanhoCromossomo = 800;
    }
    if (this.tamanhoCromossomo < 20) {
      this.tamanhoCromossomo = 20;
    }

    this.log(`📏 Tamanho do cromossomo: ${this.tamanhoCromossomo} genes`);
    this.log(`📊 Tipo de Fitness: ${nomeFitness(this.tipoFitness)}`);
    this.log(`🔄 Tipo de Cruzamento: ${this.usarPMX ? 'PMX' : 'Ponto Único'}`);
    this.log(`🏆 Elitismo: ${this.elitismo} melhores`);
  }

  // ===== MÉTODO PRINCIPAL =====

  /**
   * 🔧 CORREÇÃO: Retorna AcaoCaminho[] (inclui 'pegar_ouro')
   */
  evoluir(ambiente: Ambiente): AcaoCaminho[] {
    this.historicoMelhor = [];
    this.historicoPior = [];
    this.historicoMedia = [];
    this.historicoDiversidade = [];
    this.historicoFitness = [];

    this.populacao = new Populacao(
      this.tamanhoPopulacao,
      this.tamanhoCromossomo
    );

    this.log('🔄 Evolução iniciada...');
    this.log(`📊 População: ${this.tamanhoPopulacao} | Gerações: ${this.numeroGeracoes}`);

    this.avaliarPopulacao(ambiente);
    this.registrarEstatisticas();
    this.registrarVersaoFitness(0);

    // let convergiu = false;
    let geracoesSemMelhora = 0;
    let ultimoMelhor = this.populacao.melhor?.fitness ?? -Infinity;
    // 🐛 PROBLEMA ENCONTRADO NOS GRÁFICOS DE FITNESS: em mapas pequenos
    // (4×4, 5×5, 10×10) o "melhor fitness" converge e fica 100% RETO por
    // 700-950 das 1000 gerações configuradas — ou seja, ~90-95% do tempo
    // de execução é gasto sem nenhum ganho, porque não existia nenhuma
    // condição de parada: o loop sempre rodava as 1000 gerações inteiras,
    // e "reforçar mutação" (a cada 50 gerações estagnadas) rodava pra
    // sempre sem nunca encerrar o treino mais cedo. Correção: dá algumas
    // chances (reforços de mutação) para escapar de um ótimo local, mas
    // se mesmo assim não houver melhora, encerra antecipadamente — sem
    // perder qualidade (o resultado já estava estagnado de qualquer jeito)
    // e cortando bastante tempo de execução, principalmente em mapas
    // menores e em bateladas de validação com muitas execuções.
    let tentativasReforcoSemMelhora = 0;
    const MAX_TENTATIVAS_REFORCO = 3;

    for (let geracao = 0; geracao < this.numeroGeracoes; geracao++) {
      // Evolui a população
      this.populacao = this.populacao.evoluir(
        this.taxaCruzamento,
        this.taxaMutacao,
        this.usarPMX
      );

      this.avaliarPopulacao(ambiente);
      this.registrarEstatisticas();

      // 🔧 NOVO: Verifica convergência prematura
      const melhorAtual = this.populacao.melhor?.fitness ?? -Infinity;
      if (melhorAtual > ultimoMelhor) {
        ultimoMelhor = melhorAtual;
        geracoesSemMelhora = 0;
        tentativasReforcoSemMelhora = 0;
      } else {
        geracoesSemMelhora++;
      }

      // 🔧 NOVO: Reforça mutação se estagnado
      if (geracoesSemMelhora > 50) {
        this.log(`⚠️ Estagnação detectada na geração ${geracao + 1}. Reforçando mutação...`);
        this.aplicarMutacaoReforcada();
        geracoesSemMelhora = 0;
        tentativasReforcoSemMelhora++;

        if (tentativasReforcoSemMelhora >= MAX_TENTATIVAS_REFORCO) {
          this.log(
            `🛑 Convergência estável na geração ${geracao + 1} ` +
              `(sem melhora mesmo após ${MAX_TENTATIVAS_REFORCO} reforços de mutação). ` +
              `Parando antecipadamente para não desperdiçar gerações.`
          );
          break;
        }
      }

      // Callback para estatísticas a cada 10 gerações
      if ((geracao + 1) % 10 === 0 && this.onEstatisticas) {
        this.onEstatisticas({
          melhor: this.historicoMelhor,
          pior: this.historicoPior,
          media: this.historicoMedia,
        });
      }

      // Log a cada 50 gerações
      if ((geracao + 1) % 50 === 0 || geracao === 0) {
        const estats = this.populacao.getEstatisticas();
        this.log(
          `📊 G${geracao + 1}: Melhor=${estats.melhor.toFixed(2)}, ` +
            `Média=${estats.media.toFixed(2)}, Diversidade=${estats.diversidade.toFixed(3)}`
        );
      }
    }

    // 🔧 CORREÇÃO: Verifica se população existe
    if (!this.populacao || !this.populacao.melhor) {
      this.log('❌ ERRO: População vazia ou sem melhor indivíduo!');
      return [];
    }

    this.melhorFitness = this.populacao.melhor.fitness;
    this.registrarVersaoFitness(this.numeroGeracoes);

    if (this.onEstatisticas) {
      this.onEstatisticas({
        melhor: this.historicoMelhor,
        pior: this.historicoPior,
        media: this.historicoMedia,
      });
    }

    this.log(`✅ Evolução concluída! Melhor Fitness: ${this.melhorFitness.toFixed(2)}`);

    // 🔧 CORREÇÃO: Retorna o caminho do melhor indivíduo
    return this.populacao.melhor.genes;
  }

  // ===== MÉTODO DE MUTAÇÃO REFORÇADA =====

  /**
   * 🔧 NOVO: Aplica mutação reforçada em parte da população
   * (implementado diretamente na classe)
   */
  private aplicarMutacaoReforcada(): void {
    const direcoes = ['norte', 'sul', 'leste', 'oeste'] as Direcao[];
    const taxaExtra = 0.15;

    // Aplica mutação em 30% da população (exceto os melhores)
    const quantidade = Math.floor(this.populacao.individuos.length * 0.3);
    const inicio = this.elitismo; // Preserva os melhores

    for (let i = inicio; i < Math.min(inicio + quantidade, this.populacao.individuos.length); i++) {
      const individuo = this.populacao.individuos[i];
      const genes = individuo.genes;

      for (let j = 0; j < genes.length; j++) {
        if (Math.random() < taxaExtra) {
          // 10% de chance de ser 'pegar_ouro'
          if (Math.random() < 0.1) {
            genes[j] = 'pegar_ouro' as any;
          } else {
            genes[j] = direcoes[Math.floor(Math.random() * direcoes.length)];
          }
        }
      }
    }
  }

  // ===== MÉTODOS DE AVALIAÇÃO =====

  private avaliarPopulacao(ambiente: Ambiente): void {
    for (const cromossomo of this.populacao.individuos) {
      cromossomo.fitness = avaliar(cromossomo, ambiente, this.tipoFitness);
    }
    this.populacao.ordenar();
  }

  private registrarEstatisticas(): void {
    const estats = this.populacao.getEstatisticas();
    this.historicoMelhor.push(estats.melhor);
    this.historicoPior.push(estats.pior);
    this.historicoMedia.push(estats.media);
    this.historicoDiversidade.push(estats.diversidade);
  }

  calcularMediaFitness(): number {
    if (!this.populacao || this.populacao.individuos.length === 0) return 0;
    let soma = 0;
    for (const c of this.populacao.individuos) soma += c.fitness;
    return soma / this.populacao.individuos.length;
  }

  private registrarVersaoFitness(geracao: number): void {
    if (!this.populacao || !this.populacao.melhor) return;
    this.historicoFitness.push({
      geracao,
      versao: nomeFitness(this.tipoFitness),
      melhor: this.populacao.melhor.fitness,
      media: this.calcularMediaFitness(),
      diversidade: this.populacao.calcularDiversidade(),
    });
  }

  // ===== MÉTODOS DE ESTATÍSTICAS =====

  getEstatisticas(): {
    melhor: number[];
    pior: number[];
    media: number[];
    diversidade: number[];
    fitness: RegistroFitness[];
  } {
    return {
      melhor: this.historicoMelhor,
      pior: this.historicoPior,
      media: this.historicoMedia,
      diversidade: this.historicoDiversidade,
      fitness: this.historicoFitness,
    };
  }

  imprimirEstatisticas(): void {
    this.log('='.repeat(60));
    this.log('📊 RELATÓRIO DO ALGORITMO GENÉTICO');
    this.log('='.repeat(60));

    this.log('📌 PARÂMETROS:');
    this.log(`  Ambiente: ${this.tamanhoAmbiente}x${this.tamanhoAmbiente}`);
    this.log(`  População: ${this.tamanhoPopulacao}`);
    this.log(`  Gerações: ${this.numeroGeracoes}`);
    this.log(`  Taxa Cruzamento: ${this.taxaCruzamento * 100}%`);
    this.log(`  Taxa Mutação: ${this.taxaMutacao * 100}%`);
    this.log(`  Fitness: ${nomeFitness(this.tipoFitness)}`);
    this.log(`  Cruzamento: ${this.usarPMX ? 'PMX' : 'Ponto Único'}`);
    this.log(`  Elitismo: ${this.elitismo} melhores`);

    if (!this.populacao || !this.populacao.melhor) {
      this.log('❌ ERRO: População não inicializada');
      return;
    }

    this.log('📌 RESULTADOS:');
    this.log(`  Melhor Fitness: ${this.populacao.melhor.fitness.toFixed(2)}`);

    // 🔧 CORREÇÃO: Verifica se pior existe
    const piorFitness = this.populacao.pior?.fitness ?? 0;
    this.log(`  Pior Fitness: ${piorFitness.toFixed(2)}`);

    this.log(`  Média Fitness: ${this.calcularMediaFitness().toFixed(2)}`);
    this.log(`  Tamanho do Cromossomo: ${this.populacao.melhor.genes.length}`);
    this.log(`  Diversidade Final: ${this.populacao.calcularDiversidade().toFixed(3)}`);

    if (this.historicoMelhor.length > 1) {
      const primeiro = this.historicoMelhor[0] || 1;
      const ultimo = this.historicoMelhor[this.historicoMelhor.length - 1];
      const evolucao = ((ultimo - primeiro) / (Math.abs(primeiro) + 1)) * 100;
      this.log(`  Evolução: ${evolucao.toFixed(2)}%`);
    }

    this.log('='.repeat(60));
  }
}

// ===== FUNÇÃO DE CONVENIÊNCIA =====

/**
 * 🔧 CORREÇÃO: Função para executar o AG com configuração simplificada
 */
export function executarAG(
  ambiente: Ambiente,
  config?: Partial<AGOpcoes>
): AcaoCaminho[] {
  const ag = new AlgoritmoGenetico({
    tamanhoAmbiente: ambiente.tamanho,
    ...config,
  });

  return ag.evoluir(ambiente);
}