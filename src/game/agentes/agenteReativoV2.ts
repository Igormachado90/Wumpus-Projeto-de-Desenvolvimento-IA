import { Ambiente } from '../ambiente';
import { type Percepcao } from '../percepcao';
import { type Direcao, Movimento, embaralhar } from '../movimento';
import { Memoria } from '../memoria';

export interface ResultadoSimulacao {
  matouWumpus: boolean;
  venceu: boolean;
  vivo: boolean;
  pontuacao: number;
  passos: number;
  log: string[];
}

const MAX_ITERACOES = 2000;
const MAX_TENTATIVAS_PEGAR_OURO = 200;
const MAX_PASSOS_COM_OURO = 50; // 🔧 NOVO: Limite de passos com ouro

export class AgenteReativoV2 {
  linha: number = 0;
  coluna: number = 0;
  pontuacao: number = 0;
  passos: number = 0;

  temFlecha: boolean = true;
  temOuro: boolean = false;
  vivo: boolean = true;
  venceu: boolean = false;
  matouWumpus: boolean = false;
  flechaDisparada: boolean = false;

  private memoria!: Memoria;
  private log: string[] = [];
  private movimentosRealizados: string[] = [];
  private tentativasPegarOuro: number = 0;

  // 🔧 NOVO: Controle para evitar loops infinitos
  private passosComOuro: number = 0;
  private ultimoMovimento: Direcao | null = null;
  private movimentosRepetidos: number = 0;
  // private posicoesVisitadas: Set<string> = new Set();

  private print(msg: string): void {
    this.log.push(msg);
    console.log(msg);
  }

  agir(ambiente: Ambiente): ResultadoSimulacao {
    this.inicializar(ambiente);
    this.print('🧠 Iniciando Agente Reativo V2 (com memória)...');
    this.print(`📐 Ambiente: ${ambiente.tamanho}x${ambiente.tamanho}`);
    this.print('');

    while (this.vivo && !this.venceu) {
      this.passos++;

      if (this.passos > MAX_ITERACOES) {
        this.print(`⏱️ Limite de iterações atingido (${MAX_ITERACOES}). Encerrando.`);
        break;
      }

      // 🔧 PREVENÇÃO DE LOOP: Se está com ouro e passou do limite, força volta
      if (this.temOuro && this.passosComOuro > MAX_PASSOS_COM_OURO) {
        this.print(`⚠️ Muitos passos com ouro (${this.passosComOuro}). Forçando volta...`);
        this.voltarParaOrigemForcado(ambiente);
        if (this.linha === 0 && this.coluna === 0) {
          this.sair();
          break;
        }
        continue;
      }

      // 1. LER PERCEPÇÃO
      const percepcao = this.lerPercepcao(ambiente);
      this.print(`📍 Posição: (${this.linha}, ${this.coluna})`);
      this.print(`👀 Percepção: ${this.percepcaoToString(percepcao)}`);
      this.print(`💰 Ouro: ${this.temOuro ? '✅ Sim' : '❌ Não'}`);
      this.print(`🏹 Flecha: ${this.temFlecha ? '✅ Disponível' : '❌ Usada'}`);
      this.print(`🎯 Pontuação: ${this.pontuacao}`);

      // 2. ATUALIZAR MEMÓRIA
      this.atualizarMemoria(percepcao, ambiente);

      // 3. APLICAR INFERÊNCIA
      this.aplicarInferencia(ambiente, percepcao);

      // 🔧 PRIORIDADE MÁXIMA: Se tem ouro, VOLTE IMEDIATAMENTE
      if (this.temOuro && (this.linha !== 0 || this.coluna !== 0)) {
        this.print('💰 Tem ouro! Voltando para a origem...');
        this.passosComOuro++;
        this.voltarParaOrigem(ambiente);
        continue;
      }

      // 4. VERIFICAR VITÓRIA
      if (this.temOuro && this.linha === 0 && this.coluna === 0) {
        this.sair();
        break;
      }

      // . PRIORIDADE: Voltar com ouro
      if (this.temOuro && (this.linha !== 0 || this.coluna !== 0)) {
        this.print('💰 Tem ouro! Voltando para a origem...');
        this.passosComOuro++;
        if (this.voltarParaOrigem(ambiente)) {
          continue;
        }
      }

      // 5. PEGAR OURO
      if (percepcao.brilho && !this.temOuro) {
        this.pegarOuro(ambiente);
        this.passosComOuro = 0;
        continue;
      }

      // 6. ATIRAR FLECHA (apenas com certeza)
      if (percepcao.fedor && this.temFlecha && !this.flechaDisparada) {
        const direcaoWumpus = this.encontrarWumpus(ambiente);
        if (direcaoWumpus !== null) {
          this.atirarNaDirecao(direcaoWumpus, ambiente);
          this.flechaDisparada = true;
          if (this.matouWumpus) {
            this.removerFedor(ambiente);
          }
          continue;
        }
        // 🔧 Se não tem certeza, NÃO ATIRA (preserva a flecha)
        this.print('Fedor detectado, mas sem certeza da direção. Preservando flecha.');
      }

      // 7. DECIDIR PRÓXIMO MOVIMENTO
      const proximo = this.decidirProximoMovimento(ambiente);

      if (proximo !== null) {
        this.mover(proximo, ambiente);
        this.memoria.marcarVisitado(this.linha, this.coluna);
        this.movimentosRealizados.push(Movimento.nome[proximo]);
        this.flechaDisparada = false;

        // 🔧 Detecta loops
        if (this.ultimoMovimento === proximo) {
          this.movimentosRepetidos++;
          if (this.movimentosRepetidos > 10) {
            this.print('⚠️ Detectado loop! Forçando movimento aleatório...');
            this.movimentosRepetidos = 0;
            const aleatorio = Movimento.aleatoria();
            this.mover(aleatorio, ambiente);
            this.memoria.marcarVisitado(this.linha, this.coluna);
            this.movimentosRealizados.push(Movimento.nome[aleatorio]);
          }
        } else {
          this.movimentosRepetidos = 0;
        }
        this.ultimoMovimento = proximo;
      } else {
        this.print('😵 Agente sem opções. Tentando voltar...');
        if (!this.voltarParaOrigemForcado(ambiente)) {
          this.print('😵 Agente não conseguiu se mover. Parando.');
          break;
        }
        continue;
      }

      // 8. VERIFICAR MORTE
      this.verificarMorte(ambiente);
      this.flechaDisparada = false;
    }

    this.exibirResultado();

    return {
      venceu: this.venceu,
      vivo: this.vivo,
      pontuacao: this.pontuacao,
      passos: this.passos,
      log: this.log,
      matouWumpus: this.matouWumpus
    };
  }

  private inicializar(ambiente: Ambiente): void {
    this.linha = 0;
    this.coluna = 0;
    this.pontuacao = 0;
    this.passos = 0;
    this.temFlecha = true;
    this.temOuro = false;
    this.vivo = true;
    this.venceu = false;
    this.matouWumpus = false;
    this.flechaDisparada = false;
    this.movimentosRealizados = [];
    this.log = [];
    this.tentativasPegarOuro = 0;
    this.passosComOuro = 0;
    this.ultimoMovimento = null;
    this.movimentosRepetidos = 0;
    // this.posicoesVisitadas = new Set();

    this.memoria = new Memoria(ambiente.tamanho);
    this.memoria.marcarSeguro(0, 0);
    this.memoria.marcarVisitado(0, 0);

    ambiente.getCasa(0, 0).seguro = true;
    ambiente.getCasa(0, 0).visitada = true;
    ambiente.getCasa(0, 0).agente = true;
  }

  private percepcaoToString(p: Percepcao): string {
    const s: string[] = [];
    if (p.brisa) s.push('Brisa');
    if (p.fedor) s.push('Fedor');
    if (p.brilho) s.push('✨ Brilho');
    return s.length === 0 ? 'Vazio' : s.join(', ');
  }

  private lerPercepcao(ambiente: Ambiente): Percepcao {
    const casa = ambiente.getCasa(this.linha, this.coluna);
    return {
      brisa: casa.brisa,
      fedor: casa.fedor,
      brilho: casa.brilho,
      grito: !ambiente.wumpusAlive, // Wumpus morto = grito ouvido
      impacto: false,
    };
  }

  // 3. Melhorar atualização de memória com grito
private atualizarMemoria(percepcao: Percepcao, ambiente: Ambiente): void {
  this.memoria.marcarVisitado(this.linha, this.coluna);
  
  if (!percepcao.brisa) {
    this.memoria.sinalizarSemPoco(this.linha, this.coluna);
  }
  
  // Se o Wumpus está morto (grito), remove todas as suspeitas
  if (percepcao.grito || this.matouWumpus) {
    this.removerFedor(ambiente);
  }
  
  if (!percepcao.fedor && !this.matouWumpus) {
    this.memoria.sinalizarSemWumpus(this.linha, this.coluna);
  }
  
  if (percepcao.brilho) {
    this.memoria.marcarPossivelOuro(this.linha, this.coluna);
  }
}

  private vizinhos(): [number, number][] {
    return [
      [this.linha - 1, this.coluna],
      [this.linha + 1, this.coluna],
      [this.linha, this.coluna - 1],
      [this.linha, this.coluna + 1],
    ];
  }

  /**
   * 🔧 CORRIGIDO: Aplica inferência para todos os vizinhos de uma vez
   */
  private aplicarInferencia(ambiente: Ambiente, percepcao: Percepcao): void {
    const vizinhos = this.vizinhos();

    for (const [l, c] of vizinhos) {
      if (!ambiente.dentro(l, c)) continue;

      // Regra 1: Brisa indica poço nas adjacências
      if (!percepcao.brisa) {
        // Se não tem brisa, o vizinho NÃO tem poço
        this.memoria.sinalizarSemPoco(l, c);
      } else if (!this.memoria.isVisitado(l, c)) {
        // Se tem brisa, o vizinho não visitado PODE ter poço
        this.memoria.marcarPossivelPoco(l, c);
        ambiente.getCasa(l, c).perigoso = true;
      }

      // Regra 2: Fedor indica Wumpus nas adjacências
      if (!percepcao.fedor || this.matouWumpus) {
        // Se não tem fedor (ou Wumpus já morreu), o vizinho NÃO tem Wumpus
        this.memoria.sinalizarSemWumpus(l, c);
      } else if (!this.memoria.isVisitado(l, c)) {
        // Se tem fedor, o vizinho PODE ter Wumpus
        this.memoria.marcarPossivelWumpus(l, c);
        ambiente.getCasa(l, c).perigoso = true;
      }

      // 🔧 Marca como seguro no ambiente se a memória confirmar
      if (this.memoria.isSeguro(l, c)) {
        ambiente.getCasa(l, c).seguro = true;
      }
    }
  }

  /**
   * 🔧 NOVO: Busca caminho seguro para uma casa não visitada
   */
  private buscarCaminhoParaFronteira(ambiente: Ambiente): Direcao | null {
    const direcoes: Direcao[] = ['norte', 'sul', 'leste', 'oeste'];
    const visitadosBFS = new Set<string>([`${this.linha},${this.coluna}`]);
    const fila: { linha: number; coluna: number; primeiraDirecao: Direcao }[] = [];

    for (const dir of direcoes) {
      const [dl, dc] = Movimento.delta[dir];
      const nl = this.linha + dl;
      const nc = this.coluna + dc;
      if (ambiente.dentro(nl, nc) && this.memoria.isSeguro(nl, nc)) {
        const chave = `${nl},${nc}`;
        if (!visitadosBFS.has(chave)) {
          visitadosBFS.add(chave);
          fila.push({ linha: nl, coluna: nc, primeiraDirecao: dir });
        }
      }
    }

    let indice = 0;
    while (indice < fila.length) {
      const atual = fila[indice++];
      if (!this.memoria.isVisitado(atual.linha, atual.coluna)) {
        return atual.primeiraDirecao;
      }
      for (const dir of direcoes) {
        const [dl, dc] = Movimento.delta[dir];
        const nl = atual.linha + dl;
        const nc = atual.coluna + dc;
        if (ambiente.dentro(nl, nc) && this.memoria.isSeguro(nl, nc)) {
          const chave = `${nl},${nc}`;
          if (!visitadosBFS.has(chave)) {
            visitadosBFS.add(chave);
            fila.push({ linha: nl, coluna: nc, primeiraDirecao: atual.primeiraDirecao });
          }
        }
      }
    }

    return null;
  }

  /**
   * 🔧 CORRIGIDO: Decisão de movimento com BFS para evitar ficar preso
   */
  private decidirProximoMovimento(ambiente: Ambiente): Direcao | null {
    const direcoes: Direcao[] = ['norte', 'sul', 'leste', 'oeste'];
    const shuffled: Direcao[] = embaralhar(direcoes);

    // 🔧 PRIORIDADE 1: Buscar caminho seguro para fronteira (BFS)
    const passoFronteira = this.buscarCaminhoParaFronteira(ambiente);
    if (passoFronteira !== null) {
      return passoFronteira;
    }

    // 🔧 PRIORIDADE 2: Casas não perigosas não visitadas (com cautela)
    for (const dir of shuffled) {
      const [dl, dc] = Movimento.delta[dir];
      const nl = this.linha + dl;
      const nc = this.coluna + dc;
      if (ambiente.dentro(nl, nc) &&
        !this.memoria.isVisitado(nl, nc) &&
        !this.memoria.isPerigoso(nl, nc)) {
        // 🔧 Verifica se não tem muitos vizinhos perigosos
        const perigosVizinhos = this.contarVizinhosPerigosos(nl, nc, ambiente);
        if (perigosVizinhos <= 1) {
          return dir;
        }
      }
    }

    // 🔧 PRIORIDADE 3: Qualquer casa não visitada (arrisca entrar em território
    // desconhecido/perigoso apenas quando não há alternativa segura acima —
    // isto é preferível a ficar balançando para sempre entre casas seguras já
    // visitadas sem nunca progredir).
    for (const dir of shuffled) {
      const [dl, dc] = Movimento.delta[dir];
      const nl = this.linha + dl;
      const nc = this.coluna + dc;
      if (ambiente.dentro(nl, nc) && !this.memoria.isVisitado(nl, nc)) {
        return dir;
      }
    }

    // 🔧 PRIORIDADE 4 (ÚLTIMO RECURSO): Casas seguras já visitadas (voltar).
    // Só chega aqui quando TODOS os vizinhos imediatos já foram visitados
    // (não há absolutamente nada novo para explorar a partir daqui).
    for (const dir of shuffled) {
      const [dl, dc] = Movimento.delta[dir];
      const nl = this.linha + dl;
      const nc = this.coluna + dc;
      if (ambiente.dentro(nl, nc) &&
        this.memoria.isSeguro(nl, nc) &&
        this.memoria.isVisitado(nl, nc)) {
        return dir;
      }
    }

    return null;
  }

  /**
   * 🔧 NOVO: Conta quantos vizinhos são perigosos
   */
  private contarVizinhosPerigosos(linha: number, coluna: number, ambiente: Ambiente): number {
    let count = 0;
    const vizinhos: [number, number][] = [
      [linha - 1, coluna],
      [linha + 1, coluna],
      [linha, coluna - 1],
      [linha, coluna + 1],
    ];
    for (const [l, c] of vizinhos) {
      if (ambiente.dentro(l, c) && this.memoria.isPerigoso(l, c)) {
        count++;
      }
    }
    return count;
  }

  /**
   * 🔧 NOVO: Encontra direção com Wumpus (confirmado ou suspeita forte)
   */
  private encontrarWumpus(ambiente: Ambiente): Direcao | null {
    const direcoes: Direcao[] = ['norte', 'sul', 'leste', 'oeste'];
    const shuffled = embaralhar(direcoes);

    // Prioridade 1: Wumpus confirmado
    for (const dir of shuffled) {
      const [dl, dc] = Movimento.delta[dir];
      const la = this.linha + dl;
      const ca = this.coluna + dc;
      if (!ambiente.dentro(la, ca)) continue;
      if (ambiente.getCasa(la, ca).wumpus) {
        return dir;
      }
    }

    // Prioridade 2: Suspeita forte (possível Wumpus)
    for (const dir of shuffled) {
      const [dl, dc] = Movimento.delta[dir];
      const la = this.linha + dl;
      const ca = this.coluna + dc;
      if (!ambiente.dentro(la, ca)) continue;
      if (this.memoria.isPossivelWumpus(la, ca)) {
        return dir;
      }
    }

    return null;
  }

  /**
   * 🔧 NOVO: Atira em uma direção específica
   */
  private atirarNaDirecao(dir: Direcao, ambiente: Ambiente): void {
    if (!this.temFlecha) {
      this.print('⚠️ Sem flechas!');
      return;
    }

    if (this.matouWumpus) {
      this.print('⚠️ Wumpus já está morto!');
      return;
    }

    const [dl, dc] = Movimento.delta[dir];
    const la = this.linha + dl;
    const ca = this.coluna + dc;

    if (!ambiente.dentro(la, ca)) {
      this.print('⚠️ Direção inválida para atirar!');
      return;
    }

    this.temFlecha = false;
    this.pontuacao -= 10;
    this.print(`🏹 Atirando para ${Movimento.nome[dir]}! -10 pontos`);

    const casaAlvo = ambiente.getCasa(la, ca);
    if (casaAlvo.wumpus) {
      casaAlvo.wumpus = false;
      casaAlvo.fedor = false;
      this.matouWumpus = true;
      this.pontuacao += 1000;
      this.print('💀 Wumpus morto! +1000 pontos');
    } else {
      this.print('❌ Tiro errado! O Wumpus não está lá.');
    }
  }

  private mover(direcao: Direcao, ambiente: Ambiente): void {
    const [dl, dc] = Movimento.delta[direcao];
    const novaLinha = this.linha + dl;
    const novaColuna = this.coluna + dc;

    if (ambiente.dentro(novaLinha, novaColuna)) {
      ambiente.getCasa(this.linha, this.coluna).agente = false;
      this.linha = novaLinha;
      this.coluna = novaColuna;
      ambiente.getCasa(this.linha, this.coluna).agente = true;
      ambiente.getCasa(this.linha, this.coluna).visitada = true;
      this.pontuacao -= 1;
      this.print(`🚶 Moveu para ${Movimento.nome[direcao]} -> (${this.linha}, ${this.coluna})`);
    } else {
      this.print(`💥 Impacto! Tentou mover para ${Movimento.nome[direcao]} fora do ambiente!`);
      this.pontuacao -= 1;
    }
  }

  private pegarOuro(ambiente: Ambiente): void {
    const casa = ambiente.getCasa(this.linha, this.coluna);
    if (casa.ouro) {
      casa.ouro = false;
      casa.brilho = false;
      this.temOuro = true;
      this.pontuacao += 1000;
      this.tentativasPegarOuro = 0;
      this.passosComOuro = 0;
      this.print('✨ Ouro pego! +1000 pontos');
    } else {
      this.tentativasPegarOuro++;
      this.print(`⚠️ Tentou pegar ouro sem sucesso (tentativa ${this.tentativasPegarOuro})`);

      if (this.tentativasPegarOuro >= MAX_TENTATIVAS_PEGAR_OURO) {
        this.print('🚨 Muitas tentativas! Forçando saída...');
        this.memoria.marcarSeguro(this.linha, this.coluna);
        this.tentativasPegarOuro = 0;
      }
    }
  }

  private removerFedor(ambiente: Ambiente): void {
    for (let i = 0; i < ambiente.tamanho; i++) {
      for (let j = 0; j < ambiente.tamanho; j++) {
        ambiente.getCasa(i, j).fedor = false;
        ambiente.getCasa(i, j).perigoso = false;
        if (this.memoria.dentro(i, j)) {
          this.memoria.sinalizarSemWumpus(i, j);
        }
      }
    }
    this.print('🧹 Fedor removido do ambiente!');
  }

  private voltarParaOrigem(ambiente: Ambiente): boolean {
    const preferencia: Direcao[] = ['norte', 'oeste', 'sul', 'leste'];

    // Tenta voltar por caminho seguro
    for (const dir of preferencia) {
      const [dl, dc] = Movimento.delta[dir];
      const nl = this.linha + dl;
      const nc = this.coluna + dc;
      if (ambiente.dentro(nl, nc) && this.memoria.isSeguro(nl, nc)) {
        this.mover(dir, ambiente);
        this.memoria.marcarVisitado(this.linha, this.coluna);
        return true;
      }
    }

    // Força movimento em direção à origem
    return this.voltarParaOrigemForcado(ambiente);
  }

  /**
   * 🔧 NOVO: Força volta para origem (último recurso)
   */
  private voltarParaOrigemForcado(ambiente: Ambiente): boolean {
  // Prioriza movimento em direção à origem
  const movimentos: Direcao[] = [];
  if (this.linha > 0) movimentos.push('norte');
  if (this.coluna > 0) movimentos.push('oeste');
  if (this.linha < ambiente.tamanho - 1) movimentos.push('sul');
  if (this.coluna < ambiente.tamanho - 1) movimentos.push('leste');

  for (const dir of movimentos) {
    const [dl, dc] = Movimento.delta[dir];
    const nl = this.linha + dl;
    const nc = this.coluna + dc;
    if (ambiente.dentro(nl, nc) && this.memoria.isSeguro(nl, nc)) {
      this.mover(dir, ambiente);
      this.memoria.marcarVisitado(this.linha, this.coluna);
      return true;
    }
  }

  // Último recurso: qualquer movimento válido
  for (const dir of Movimento.todas()) {
    const [dl, dc] = Movimento.delta[dir];
    const nl = this.linha + dl;
    const nc = this.coluna + dc;
    if (ambiente.dentro(nl, nc)) {
      this.mover(dir, ambiente);
      this.memoria.marcarVisitado(this.linha, this.coluna);
      return true;
    }
  }

  return false;
}

  private verificarMorte(ambiente: Ambiente): void {
    const casa = ambiente.getCasa(this.linha, this.coluna);
    if (casa.poco && !casa.wumpus) {
      this.vivo = false;
      this.pontuacao -= 1000;
      this.print('💀 Caiu em um poço! -1000 pontos');
    } else if (casa.wumpus && !this.matouWumpus) {
      this.vivo = false;
      this.pontuacao -= 1000;
      this.print('💀 Devorado pelo Wumpus! -1000 pontos');
    }
  }

  private sair(): void {
    this.venceu = true;
    this.pontuacao -= 1;

    if (this.matouWumpus) {
      this.pontuacao += 1000;
      this.print('🚪 Saiu com o ouro e o Wumpus morto! +1000 pontos');
    } else {
      this.print('🚪 Saiu com o ouro, mas sem matar o Wumpus.');
    }
  }

  private exibirResultado(): void {
    this.print('');
    this.print('='.repeat(50));
    this.print('📊 RESULTADO FINAL DO AGENTE REATIVO V2');
    this.print('='.repeat(50));

    if (this.venceu) {
      this.print('🎉 VITÓRIA! Agente saiu com ouro!');
      this.print(`📊 Total de movimentos: ${this.movimentosRealizados.length}`);
    } else if (!this.vivo) {
      this.print('💀 AGENTE MORREU!');
    } else {
      this.print('⏹️ Agente parou sem vencer.');
    }

    this.print(`🏆 Pontuação final: ${this.pontuacao}`);
    this.print(`💰 Ouro: ${this.temOuro ? '✅ Sim' : '❌ Não'}`);
    this.print(`🏹 Flecha: ${this.temFlecha ? '✅ Disponível' : '❌ Usada'}`);
    this.print(`💀 Wumpus: ${this.matouWumpus ? '✅ Morto' : '❌ Vivo'}`);
    this.print(`👣 Total de passos: ${this.passos}`);
    this.print('='.repeat(50));

    // // Exibe memória para debug
    // this.memoria.exibir();
  }
}