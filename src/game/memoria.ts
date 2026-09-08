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
  /** Marcação explícita de perigo CONFIRMADO (por eliminação lógica) */
  perigoso: boolean;
  /** A casa foi visitada e tinha brisa (usado na inferência por eliminação) */
  teveBrisa: boolean;
  /** A casa foi visitada e tinha fedor (usado na inferência por eliminação) */
  teveFedor: boolean;
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
        perigoso: false,
        teveBrisa: false,
        teveFedor: false,
      }))
    );
  }

  dentro(linha: number, coluna: number): boolean {
    return linha >= 0 && linha < this.tamanho && coluna >= 0 && coluna < this.tamanho;
  }

  marcarVisitado(linha: number, coluna: number): void {
    if (this.dentro(linha, coluna)) {
      this.dados[linha][coluna].visitado = true;
      this.dados[linha][coluna].visitas++;
      // Quando visitado, se não há suspeitas, pode ser seguro
      const c = this.dados[linha][coluna];
      if (!c.possivel_poco && !c.possivel_wumpus) {
        c.perigoso = false;
      }
    }
  }

  isVisitado(linha: number, coluna: number): boolean {
    return this.dentro(linha, coluna) && this.dados[linha][coluna].visitado === true;
  }

  // ===== MÉTODOS DE SEGURANÇA =====

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
      c.perigoso = false;
    }
  }

  /**
   * Uma casa é segura se: já foi visitada (prova viva de que não há perigo
   * ali), OU foi forçada manualmente como segura, OU já temos confirmação
   * (por inferência) de que não há poço E não há Wumpus.
   */
  isSeguro(linha: number, coluna: number): boolean {
    if (!this.dentro(linha, coluna)) return false;
    const c = this.dados[linha][coluna];
    if (c.perigoso) return false;
    return c.visitado || c.seguroForcado || (c.semPocoConfirmado && c.semWumpusConfirmado);
  }

  // ===== MÉTODOS DE PERIGO =====

  /**
   *  Marca uma casa como perigosa e limpa suspeitas
   */
  marcarPerigoso(linha: number, coluna: number): void {
    if (!this.dentro(linha, coluna)) return;
    const c = this.dados[linha][coluna];
    c.perigoso = true;
    c.seguroForcado = false;
    // Não limpa possivel_poco/possivel_wumpus para manter rastro
  }

  /**
   * Marca perigo confirmado (poço OU Wumpus confirmado)
   */
  marcarPerigosoConfirmado(linha: number, coluna: number): void {
    if (!this.dentro(linha, coluna)) return;
    const c = this.dados[linha][coluna];
    c.perigoso = true;
    c.possivel_poco = false;
    c.possivel_wumpus = false;
    c.semPocoConfirmado = false;
    c.semWumpusConfirmado = false;
    c.seguroForcado = false;
  }

  /**
   * 🐛 CORREÇÃO: antes, isPerigoso() retornava true tanto para perigo
   * CONFIRMADO quanto para mera SUSPEITA (possivel_poco/possivel_wumpus).
   * Isso fazia com que, ao sentir brisa com 2 vizinhos desconhecidos, AMBOS
   * fossem tratados como "perigosos" (mesmo só um podendo ser o poço de
   * verdade), eliminando toda opção cautelosa e forçando o agente a um
   * chute cego (50/50) logo na primeira decisão. Agora isPerigoso() só
   * retorna true para perigo CONFIRMADO por eliminação lógica
   * (marcarPerigosoConfirmado). Suspeita não-confirmada usa isSuspeito().
   */
  isPerigoso(linha: number, coluna: number): boolean {
    if (!this.dentro(linha, coluna)) return false;
    return this.dados[linha][coluna].perigoso;
  }

  /**
   * Casa com suspeita (não confirmada) de poço ou Wumpus. Usada para
   * decisões de risco calculado (preferir casas sem suspeita, mas ainda
   * assim permitir explorar uma casa suspeita quando não há alternativa).
   */
  isSuspeito(linha: number, coluna: number): boolean {
    if (!this.dentro(linha, coluna)) return false;
    const c = this.dados[linha][coluna];
    return c.possivel_poco || c.possivel_wumpus;
  }

  /** Quantidade de sinais de suspeita (0, 1 ou 2) numa casa — usado como
   * pontuação de risco para desempate entre casas candidatas. */
  contarSuspeitas(linha: number, coluna: number): number {
    if (!this.dentro(linha, coluna)) return 0;
    const c = this.dados[linha][coluna];
    return (c.possivel_poco ? 1 : 0) + (c.possivel_wumpus ? 1 : 0);
  }

  /** Registra se a casa (já visitada) teve brisa/fedor, para permitir a
   * inferência por eliminação (ver aplicarEliminacaoLogica). */
  registrarPercepcaoCasa(linha: number, coluna: number, brisa: boolean, fedor: boolean): void {
    if (!this.dentro(linha, coluna)) return;
    const c = this.dados[linha][coluna];
    c.teveBrisa = brisa;
    c.teveFedor = fedor;
  }

  /**
   * Limpa todas as marcações de perigo (usado quando Wumpus morre)
   */
  limparPerigos(): void {
    for (let i = 0; i < this.tamanho; i++) {
      for (let j = 0; j < this.tamanho; j++) {
        const c = this.dados[i][j];
        c.perigoso = false;
        c.possivel_poco = false;
        c.possivel_wumpus = false;
        // Se já foi visitada, pode ser segura
        if (c.visitado) {
          c.semPocoConfirmado = true;
          c.semWumpusConfirmado = true;
        }
      }
    }
  }

  // ===== MÉTODOS DE POÇO =====

  marcarPossivelPoco(linha: number, coluna: number): void {
    if (this.dentro(linha, coluna) && !this.isSeguro(linha, coluna)) {
      // 🐛 CORREÇÃO: não marca mais `perigoso` aqui — isso é só uma
      // SUSPEITA (a casa pode não ser a real fonte da brisa). `perigoso`
      // (confirmado) só é setado pela eliminação lógica.
      this.dados[linha][coluna].possivel_poco = true;
    }
  }

  /**
   * Confirma que esta casa NÃO tem poço.
   */
  sinalizarSemPoco(linha: number, coluna: number): void {
    if (!this.dentro(linha, coluna)) return;
    const c = this.dados[linha][coluna];
    c.semPocoConfirmado = true;
    c.possivel_poco = false;
    if (!c.possivel_wumpus) {
      c.perigoso = false;
    }
  }

  // ===== MÉTODOS DE WUMPUS =====

  marcarPossivelWumpus(linha: number, coluna: number): void {
    if (this.dentro(linha, coluna) && !this.isSeguro(linha, coluna)) {
      // 🐛 CORREÇÃO: idem marcarPossivelPoco — apenas suspeita, não confirma.
      this.dados[linha][coluna].possivel_wumpus = true;
    }
  }

  /**
   * Confirma que esta casa NÃO tem Wumpus (vivo).
   */
  sinalizarSemWumpus(linha: number, coluna: number): void {
    if (!this.dentro(linha, coluna)) return;
    const c = this.dados[linha][coluna];
    c.semWumpusConfirmado = true;
    c.possivel_wumpus = false;
    // Se não tem Wumpus e não tem poço, remove perigo
    if (!c.possivel_poco) {
      c.perigoso = false;
    }
  }

  isPossivelWumpus(linha: number, coluna: number): boolean {
    return this.dentro(linha, coluna) && this.dados[linha][coluna].possivel_wumpus === true;
  }

  // ===== MÉTODOS DE OURO =====

  marcarPossivelOuro(linha: number, coluna: number): void {
    if (this.dentro(linha, coluna) && !this.isSeguro(linha, coluna)) {
      this.dados[linha][coluna].possivel_ouro = true;
    }
  }

  isPossivelOuro(linha: number, coluna: number): boolean {
    return this.dentro(linha, coluna) && this.dados[linha][coluna].possivel_ouro === true;
  }

  // ===== MÉTODOS DE PERCEPÇÃO =====

  registrarPercepcao(linha: number, coluna: number, percepcao: string): void {
    if (this.dentro(linha, coluna)) {
      this.dados[linha][coluna].ultimaPercepcao = percepcao;
    }
  }

  // ===== MÉTODOS AUXILIARES DE VIZINHANÇA =====

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

  getVizinhosSeguros(linha: number, coluna: number): [number, number][] {
    const vizinhos: [number, number][] = [];

    for (const [nl, nc] of this.getVizinhos(linha, coluna)) {
      if (this.isSeguro(nl, nc) && !this.isVisitado(nl, nc)) {
        vizinhos.push([nl, nc]);
      }
    }

    return vizinhos;
  }

  contarVizinhosPerigosos(linha: number, coluna: number): number {
    let count = 0;
    for (const [nl, nc] of this.getVizinhos(linha, coluna)) {
      if (this.isPerigoso(nl, nc)) count++;
    }
    return count;
  }

  temWumpusConfirmado(linha: number, coluna: number): boolean {
    for (const [nl, nc] of this.getVizinhos(linha, coluna)) {
      if (!this.isSeguro(nl, nc) && this.isPossivelWumpus(nl, nc)) {
        return true;
      }
    }
    return false;
  }

  // ===== MÉTODOS DE COMPATIBILIDADE =====

  /**
   * Mantido por compatibilidade - isSeguro() já é dinâmico
   */
  recalcularSeguro(_linha: number, _coluna: number): void {
    // no-op
  }

  limparSuspeitaPoco(linha: number, coluna: number): void {
    this.sinalizarSemPoco(linha, coluna);
  }

  limparSuspeitaWumpus(linha: number, coluna: number): void {
    this.sinalizarSemWumpus(linha, coluna);
  }
}
