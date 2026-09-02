export class Casa {
  // Objetos
  poco = false;
  wumpus = false;
  ouro = false;
  agente = false;

  // Percepções
  brisa = false;      // Próximo a poço
  fedor = false;      // Próximo a Wumpus
  brilho = false;     // Tem ouro
  grito = false;      // Wumpus morto (ouvido em toda caverna)

  // Estado do agente sobre a casa
  visitada = false;
  seguro = false;
  perigoso = false;
  desconhecido = true;  // Nova flag: inicialmente tudo é desconhecido

  clone(): Casa {
    const nova = new Casa();
    nova.poco = this.poco;
    nova.wumpus = this.wumpus;
    nova.ouro = this.ouro;
    nova.agente = this.agente;
    nova.brisa = this.brisa;
    nova.fedor = this.fedor;
    nova.brilho = this.brilho;
    nova.grito = this.grito;  // Adicionado
    nova.visitada = this.visitada;
    nova.seguro = this.seguro;
    nova.perigoso = this.perigoso;
    nova.desconhecido = this.desconhecido;  // Adicionado
    return nova;
  }

  // Método utilitário para resetar estado de percepção
  resetPercepcoes(): void {
    this.brisa = false;
    this.fedor = false;
    this.brilho = false;
    this.grito = false;
  }

  // Verifica se a casa tem algum objeto perigoso
  hasPerigo(): boolean {
    return this.poco || this.wumpus;
  }

  // Verifica se a casa tem algum objeto
  hasObjeto(): boolean {
    return this.poco || this.wumpus || this.ouro;
  }
}