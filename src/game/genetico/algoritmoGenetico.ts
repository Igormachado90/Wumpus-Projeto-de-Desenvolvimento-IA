import { Populacao } from './populacao';
import { Fitness, avaliar, type TipoFitness } from './fitness';
import { Ambiente } from '../ambiente';
import type { Direcao } from '../movimento';

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
    this.log = opcoes.onLog ?? (() => { });
    this.onEstatisticas = opcoes.onEstatisticas;

    // Tamanho do cromossomo: 2x o número de casas (ida e volta)
    // Para n=4: 32, n=5: 50, n=10: 200, n=15: 450, n=20: 800
    this.tamanhoCromossomo = this.tamanhoAmbiente * this.tamanhoAmbiente * 2;

    // Limita para não ficar muito grande
    if (this.tamanhoCromossomo > 800) {
      this.tamanhoCromossomo = 800;
    }
    if (this.tamanhoCromossomo < 20) {
      this.tamanhoCromossomo = 20;
    }

    this.log(`📏 Tamanho do cromossomo: ${this.tamanhoCromossomo} genes`);
    this.log(`📊 Tipo de Fitness: ${nomeFitness(this.tipoFitness)}`);
    this.log(`🔄 Tipo de Cruzamento: ${this.usarPMX ? 'PMX' : 'Ponto Único'}`);
  }

  evoluir(ambiente: Ambiente): Direcao[] {
    this.populacao = new Populacao(this.tamanhoPopulacao, this.tamanhoCromossomo);

    this.log('🔄 Evolução iniciada...');
    this.log(`📊 População: ${this.tamanhoPopulacao} | Gerações: ${this.numeroGeracoes}`);

    this.avaliarPopulacao(ambiente);
    this.registrarEstatisticas();
    this.registrarVersaoFitness(0);

    for (let geracao = 0; geracao < this.numeroGeracoes; geracao++) {
      this.populacao = this.populacao.evoluir(this.taxaCruzamento, this.taxaMutacao, this.usarPMX);

      this.avaliarPopulacao(ambiente);
      this.registrarEstatisticas();

      // Callback para estatísticas a cada 10 gerações
      if ((geracao + 1) % 10 === 0 && this.onEstatisticas) {
        this.onEstatisticas({
          melhor: this.historicoMelhor,
          pior: this.historicoPior,
          media: this.historicoMedia,
        });
      }

      if (this.populacao.melhor.fitness >= Fitness.FITNESS_MAXIMO * 0.95) {
        this.log(`🎯 Convergiu na geração ${geracao + 1}!`);
        break;
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

    this.melhorFitness = this.populacao.melhor.fitness;
    this.registrarVersaoFitness(this.numeroGeracoes);

    if (this.onEstatisticas) {
      this.onEstatisticas({
        melhor: this.historicoMelhor,
        pior: this.historicoPior,
        media: this.historicoMedia,
      });
    }

    return this.populacao.melhor.genes;
  }

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
    let soma = 0;
    for (const c of this.populacao.individuos) soma += c.fitness;
    return soma / this.populacao.individuos.length;
  }

  private registrarVersaoFitness(geracao: number): void {
    this.historicoFitness.push({
      geracao,
      versao: nomeFitness(this.tipoFitness),
      melhor: this.populacao.melhor.fitness,
      media: this.calcularMediaFitness(),
      diversidade: this.populacao.calcularDiversidade(),
    });
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

    this.log('📌 RESULTADOS:');
    this.log(`  Melhor Fitness: ${this.populacao.melhor.fitness.toFixed(2)}`);
    this.log(`  Pior Fitness: ${this.populacao.pior.fitness.toFixed(2)}`);
    this.log(`  Média Fitness: ${this.calcularMediaFitness().toFixed(2)}`);
    this.log(`  Tamanho do Cromossomo: ${this.populacao.melhor.genes.length}`);
    this.log(`  Diversidade Final: ${this.populacao.calcularDiversidade().toFixed(3)}`);

    if (this.historicoMelhor.length > 1) {
      const primeiro = this.historicoMelhor[0] || 1;
      const ultimo = this.historicoMelhor[this.historicoMelhor.length - 1];
      const evolucao = ((ultimo - primeiro) / (Math.abs(primeiro) + 1)) * 100;
      this.log(`  Evolução: ${evolucao.toFixed(2)}%`);
    }
  }
}
