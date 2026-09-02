interface CelulaMemoria {
  visitado: boolean;
  possivel_poco: boolean;
  possivel_wumpus: boolean;
  possivel_ouro: boolean;
  /** Confirmado (por inferência) que esta casa NÃO tem poço. */
  semPocoConfirmado: boolean;
  /** Confirmado (por inferência, ou porque o Wumpus já morreu) que esta
   * casa NÃO tem Wumpus vivo. */
  semWumpusConfirmado: boolean;
  /** Segurança forçada manualmente (ex.: posição inicial (0,0)). */
  seguroForcado: boolean;
  /** Número de vezes que a casa foi visitada (para rastreamento) */
  visitas: number;
  /** Última percepção registrada na casa */
  ultimaPercepcao: string;
}

export class Memoria {
  tamanho: number;
  dados: CelulaMemoria[][];

  constructor(tamanho: number) {
    this.tamanho = tamanho;
    this.dados = [];
    this.limpo();
  }

  limpo(): void {
    this.dados = Array.from({ length: this.tamanho }, () =>
      Array.from({ length: this.tamanho }, () => ({
        visitado: false,
        possivel_poco: false,
        possivel_wumpus: false,
        possivel_ouro: false,
        semPocoConfirmado: false,
        semWumpusConfirmado: false,
        seguroForcado: false,
        visitas: 0,
        ultimaPercepcao: '',
      }))
    );
  }

  marcarVisitado(linha: number, coluna: number): void {
    if (this.dentro(linha, coluna)) {
      this.dados[linha][coluna].visitado = true;
      this.dados[linha][coluna].visitas++;
    }
  }

  /**
   * Marca a casa como segura de forma definitiva e explícita (ex.: a
   * posição inicial (0,0), que por regra do jogo nunca tem objetos).
   */
  marcarSeguro(linha: number, coluna: number): void {
    if (this.dentro(linha, coluna)) {
      const c = this.dados[linha][coluna];
      c.seguroForcado = true;
      c.possivel_poco = false;
      c.possivel_wumpus = false;
      c.possivel_ouro = false;
      c.semPocoConfirmado = true;
      c.semWumpusConfirmado = true;
    }
  }

  /**
   * Confirma, por inferência (percepção sem brisa em uma casa adjacente),
   * que esta casa NÃO tem poço. Isso é diferente de "nunca foi suspeita" —
   * uma casa nunca avaliada não pode ser tratada como segura.
   */
  sinalizarSemPoco(linha: number, coluna: number): void {
    if (!this.dentro(linha, coluna)) return;
    const c = this.dados[linha][coluna];
    c.semPocoConfirmado = true;
    c.possivel_poco = false;
  }

  /**
   * Confirma que esta casa NÃO tem Wumpus (vivo) — seja por inferência
   * (percepção sem fedor) ou porque o Wumpus já foi morto (ground truth
   * válida para o grid inteiro nesse caso).
   */
  sinalizarSemWumpus(linha: number, coluna: number): void {
    if (!this.dentro(linha, coluna)) return;
    const c = this.dados[linha][coluna];
    c.semWumpusConfirmado = true;
    c.possivel_wumpus = false;
  }

  /** Descarta a suspeita de POÇO (inferência completa: confirma + já reflete em isSeguro). */
  limparSuspeitaPoco(linha: number, coluna: number): void {
    this.sinalizarSemPoco(linha, coluna);
  }

  /** Descarta a suspeita de WUMPUS (inferência completa). */
  limparSuspeitaWumpus(linha: number, coluna: number): void {
    this.sinalizarSemWumpus(linha, coluna);
  }

  /**
   * Mantido por compatibilidade: 'seguro' agora é sempre calculado sob
   * demanda em isSeguro(), então não há nada para recalcular explicitamente.
   */
  recalcularSeguro(_linha: number, _coluna: number): void {
    // no-op: isSeguro() é derivado dinamicamente.
  }

  marcarPossivelPoco(linha: number, coluna: number): void {
    if (this.dentro(linha, coluna) && !this.isSeguro(linha, coluna)) {
      this.dados[linha][coluna].possivel_poco = true;
    }
  }

  marcarPossivelWumpus(linha: number, coluna: number): void {
    if (this.dentro(linha, coluna) && !this.isSeguro(linha, coluna)) {
      this.dados[linha][coluna].possivel_wumpus = true;
    }
  }

  marcarPossivelOuro(linha: number, coluna: number): void {
    if (this.dentro(linha, coluna) && !this.isSeguro(linha, coluna)) {
      this.dados[linha][coluna].possivel_ouro = true;
    }
  }

  registrarPercepcao(linha: number, coluna: number, percepcao: string): void {
    if (this.dentro(linha, coluna)) {
      this.dados[linha][coluna].ultimaPercepcao = percepcao;
    }
  }

  /**
   * Uma casa é segura se: já foi visitada (prova viva de que não há perigo
   * ali), OU foi forçada manualmente como segura, OU já temos confirmação
   * (por inferência) de que não há poço E não há Wumpus. "Nunca ter sido
   * suspeita" NÃO é o mesmo que "confirmada segura" — uma casa nunca
   * avaliada permanece desconhecida (não segura).
   */
  isSeguro(linha: number, coluna: number): boolean {
    if (!this.dentro(linha, coluna)) return false;
    const c = this.dados[linha][coluna];
    return c.visitado || c.seguroForcado || (c.semPocoConfirmado && c.semWumpusConfirmado);
  }

  isVisitado(linha: number, coluna: number): boolean {
    return this.dentro(linha, coluna) && this.dados[linha][coluna].visitado === true;
  }

  isPerigoso(linha: number, coluna: number): boolean {
    return this.dentro(linha, coluna) &&
      (this.dados[linha][coluna].possivel_poco === true ||
        this.dados[linha][coluna].possivel_wumpus === true);
  }

  isPossivelOuro(linha: number, coluna: number): boolean {
    return this.dentro(linha, coluna) && this.dados[linha][coluna].possivel_ouro === true;
  }

  isPossivelWumpus(linha: number, coluna: number): boolean {
    return this.dentro(linha, coluna) && this.dados[linha][coluna].possivel_wumpus === true;
  }

  /**
   * ✅ Obtém vizinhos seguros não visitados
   */
  getVizinhosSeguros(linha: number, coluna: number): [number, number][] {
    const vizinhos: [number, number][] = [];
    const direcoes: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dl, dc] of direcoes) {
      const nl = linha + dl;
      const nc = coluna + dc;
      if (this.dentro(nl, nc) && this.isSeguro(nl, nc) && !this.isVisitado(nl, nc)) {
        vizinhos.push([nl, nc]);
      }
    }
    
    return vizinhos;
  }

  /**
   * ✅ Obtém todos os vizinhos de uma posição
   */
  getVizinhos(linha: number, coluna: number): [number, number][] {
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

  /**
   * ✅ Conta quantos vizinhos perigosos uma casa tem
   */
  contarVizinhosPerigosos(linha: number, coluna: number): number {
    let count = 0;
    for (const [nl, nc] of this.getVizinhos(linha, coluna)) {
      if (this.isPerigoso(nl, nc)) count++;
    }
    return count;
  }

  /**
   * ✅ Verifica se há Wumpus confirmado em algum vizinho
   */
  temWumpusConfirmado(linha: number, coluna: number): boolean {
    for (const [nl, nc] of this.getVizinhos(linha, coluna)) {
      if (!this.isSeguro(nl, nc) && this.isPossivelWumpus(nl, nc)) {
        return true;
      }
    }
    return false;
  }

  dentro(linha: number, coluna: number): boolean {
    return linha >= 0 && linha < this.tamanho && coluna >= 0 && coluna < this.tamanho;
  }
}
