import { Cromossomo } from './cromossomo';

export type TipoCruzamento = 'pontoUnico' | 'pmx' | 'doisPontos';

export class Populacao {
  individuos: Cromossomo[];
  geracao: number = 0;

  constructor(tamanho: number, tamanhoCromossomo: number) {
    this.individuos = [];
    for (let i = 0; i < tamanho; i++) {
      this.individuos.push(Cromossomo.aleatorioBalanceado(tamanhoCromossomo));
    }
  }

  static fromList(individuos: Cromossomo[]): Populacao {
    const p = Object.create(Populacao.prototype) as Populacao;
    p.individuos = individuos;
    p.geracao = 0;
    return p;
  }

  get melhor(): Cromossomo {
    this.ordenar();
    return this.individuos[0];
  }

  get pior(): Cromossomo {
    this.ordenar();
    return this.individuos[this.individuos.length - 1];
  }

  ordenar(): void {
    this.individuos.sort((a, b) => b.fitness - a.fitness);
  }

  calcularDiversidade(): number {
    if (this.individuos.length < 2) return 0.0;

    let somaDistancias = 0.0;
    let pares = 0;

    for (let i = 0; i < this.individuos.length - 1; i++) {
      for (let j = i + 1; j < this.individuos.length; j++) {
        let diferencas = 0;
        for (let k = 0; k < this.individuos[i].genes.length; k++) {
          if (this.individuos[i].genes[k] !== this.individuos[j].genes[k]) {
            diferencas++;
          }
        }
        somaDistancias += diferencas / this.individuos[i].genes.length;
        pares++;
      }
    }

    return pares > 0 ? somaDistancias / pares : 0.0;
  }

  manterDiversidade(limiar: number): void {
    const diversidade = this.calcularDiversidade();

    if (diversidade < limiar) {
      let reiniciar = Math.trunc(this.individuos.length * 0.15);
      if (reiniciar < 2) reiniciar = 2;

      for (let i = this.individuos.length - reiniciar; i < this.individuos.length; i++) {
        this.individuos[i] = Cromossomo.aleatorio(this.individuos[i].genes.length);
        this.individuos[i].fitness = 0.0;
      }
    }
  }

  evoluir(taxaCruzamento: number, taxaMutacao: number, usarPMX = false): Populacao {
    this.geracao++;
    const novaGeracao: Cromossomo[] = [];

    // Elitismo: mantém os 2 melhores
    novaGeracao.push(this.melhor.clone());
    novaGeracao.push(this.individuos[1].clone() || this.melhor.clone());

    while (novaGeracao.length < this.individuos.length) {
      const pai1 = this.selecaoTorneio();
      const pai2 = this.selecaoTorneio();

      let filho1: Cromossomo;
      let filho2: Cromossomo | null = null;

      if (Math.random() < taxaCruzamento) {
        // Cruzamento gera dois filhos
        if (usarPMX) {
          filho1 = Cromossomo.cruzarPMX(pai1, pai2);
          filho2 = Cromossomo.cruzarPMX(pai2, pai1);
        } else {
          filho1 = Cromossomo.cruzar(pai1, pai2);
          filho2 = Cromossomo.cruzar(pai2, pai1);
        }
      } else {
        filho1 = pai1.clone();
      }

      // Mutação
      filho1.mutar(taxaMutacao);
      if (filho2) {
        filho2.mutar(taxaMutacao);
      }

      novaGeracao.push(filho1);
      if (filho2 && novaGeracao.length < this.individuos.length) {
        novaGeracao.push(filho2);
      }
    }

    const novaPop = Populacao.fromList(novaGeracao);
    novaPop.geracao = this.geracao;
    novaPop.manterDiversidade(0.25); // ✅ Limiar ajustado
    return novaPop;
  }

  selecaoTorneio(tamanho: number = 3): Cromossomo {
    const participantes: Cromossomo[] = [];

    for (let i = 0; i < tamanho; i++) {
      const index = Math.floor(Math.random() * this.individuos.length);
      participantes.push(this.individuos[index]);
    }

    participantes.sort((a, b) => b.fitness - a.fitness);
    return participantes[0].clone();
  }

  getEstatisticas(): { melhor: number; pior: number; media: number; diversidade: number } {
    let soma = 0;
    for (const c of this.individuos) {
      soma += c.fitness;
    }
    return {
      melhor: this.melhor.fitness,
      pior: this.pior.fitness,
      media: soma / this.individuos.length,
      diversidade: this.calcularDiversidade(),
    };
  }
}
