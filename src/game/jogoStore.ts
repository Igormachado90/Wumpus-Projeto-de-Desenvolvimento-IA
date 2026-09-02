// src/game/jogoStore.ts (correções)

import { Ambiente } from './ambiente';
import { Casa } from './casa';
import { Gerador } from './gerador';
import type { Percepcao } from './percepcao';
import type { Direcao } from './movimento';
import { DELTA, DIRECOES } from './movimento';
import { AgenteReativoV1 } from './agentes/agenteReativoV1';
import { AgenteReativoV2 } from './agentes/agenteReativoV2';
import { AgenteAprendizagemV3 } from './agentes/agenteAprendizagemV3';
import type { ResultadoSimulacao } from './agentes/agenteReativoV1';

export type TipoAgente = 'v1' | 'v2' | 'v3';

type Listener = () => void;

/**
 * Gerenciador de estado do jogo
 */
export class JogoStore {
  ambiente!: Ambiente;
  tamanho = 6;
  linha = 0;
  coluna = 0;
  pontuacao = 0;
  passos = 0;
  temOuro = false;
  temFlecha = true;
  vivo = true;
  venceu = false;
  matouWumpus = false;
  agenteSelecionado: TipoAgente = 'v2';
  log: string[] = [];
  executando = false;
  autoMode = false;
  vitorias = 0;
  partidas = 0;

  // ✅ Cache do último resultado do agente
  private ultimoResultado: ResultadoSimulacao | null = null;

  private listeners = new Set<Listener>();
  private autoTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.gerarAmbiente();
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  // ============================================================
  // GERAÇÃO DE AMBIENTE
  // ============================================================

  gerarAmbiente(): void {
    this.ambiente = new Ambiente(this.tamanho);
    const gerador = new Gerador();

    const pocos = Math.min(
      Math.max(Math.trunc(this.tamanho * this.tamanho * 0.15), 1),
      this.tamanho * this.tamanho - 3
    );
    
    // ✅ Usa a nova API do gerador
    gerador.gerar(this.ambiente, {
      pocos: pocos,
      wumpus: 1,
      ouro: 1,
    });

    // Reset estado
    this.linha = 0;
    this.coluna = 0;
    this.pontuacao = 0;
    this.passos = 0;
    this.temOuro = false;
    this.temFlecha = true;
    this.vivo = true;
    this.venceu = false;
    this.matouWumpus = false;
    this.ultimoResultado = null;
    this.log = [];
    this.autoMode = false;
    
    if (this.autoTimeout) {
      clearTimeout(this.autoTimeout);
      this.autoTimeout = null;
    }

    // Marca posição inicial
    this.ambiente.getCasa(0, 0).agente = true;
    this.ambiente.getCasa(0, 0).visitada = true;
    this.ambiente.getCasa(0, 0).seguro = true;

    this.adicionarLog('🔄 Novo ambiente gerado! (' + this.tamanho + 'x' + this.tamanho + ')');
    this.adicionarLog('📍 Agente em (0,0)');

    this.notify();
  }

  // ============================================================
  // PERCEPÇÕES
  // ============================================================

  getPercepcoes(): Percepcao[] {
    if (!this.ambiente.dentro(this.linha, this.coluna)) return [];
    const casa = this.ambiente.getCasa(this.linha, this.coluna);
    const lista: Percepcao[] = [];
    if (casa.brisa) lista.push({ brisa: true, fedor: false, brilho: false, grito: false, impacto: false });
    if (casa.fedor) lista.push({ brisa: false, fedor: true, brilho: false, grito: false, impacto: false });
    if (casa.brilho && !this.temOuro) lista.push({ brisa: false, fedor: false, brilho: true, grito: false, impacto: false });
    return lista;
  }

  getPercepcoesString(): string[] {
    return this.getPercepcoes()
      .map((p) => {
        if (p.brisa) return 'brisa';
        if (p.fedor) return 'fedor';
        if (p.brilho) return 'brilho';
        return '';
      })
      .filter((s) => s !== '');
  }

  // ============================================================
  // AÇÕES DO USUÁRIO
  // ============================================================

  executarAcaoUsuario(acao: string): void {
    if (!this.vivo || this.venceu || this.executando) return;

    switch (acao) {
      case 'norte':
        this.mover('norte');
        break;
      case 'sul':
        this.mover('sul');
        break;
      case 'leste':
        this.mover('leste');
        break;
      case 'oeste':
        this.mover('oeste');
        break;
      case 'pegar':
        this.pegarOuro();
        break;
      case 'atirar':
        this.atirar();
        break;
    }
    this.notify();
  }

  private mover(direcao: Direcao): void {
    const [dl, dc] = DELTA[direcao];
    const novaLinha = this.linha + dl;
    const novaColuna = this.coluna + dc;

    if (!this.ambiente.dentro(novaLinha, novaColuna)) {
      this.adicionarLog(`💥 Impacto! Parede ${direcao}`);
      return;
    }

    // Remove agente da posição antiga
    this.ambiente.getCasa(this.linha, this.coluna).agente = false;

    // Move
    this.linha = novaLinha;
    this.coluna = novaColuna;
    this.passos++;
    this.pontuacao -= 1;

    // Coloca agente na nova posição
    const casa = this.ambiente.getCasa(this.linha, this.coluna);
    casa.agente = true;
    casa.visitada = true;

    this.adicionarLog(`🚶 Moveu para (${this.linha}, ${this.coluna})`);

    // Verifica morte
    if (casa.poco) {
      this.vivo = false;
      this.pontuacao -= 1000;
      this.partidas++;
      this.adicionarLog('💀 CAIU EM UM POÇO! -1000 pontos');
      this.notify();
      return;
    }
    if (casa.wumpus && !this.matouWumpus) {
      this.vivo = false;
      this.pontuacao -= 1000;
      this.partidas++;
      this.adicionarLog('💀 DEVORADO PELO WUMPUS! -1000 pontos');
      this.notify();
      return;
    }

    // Verifica ouro
    if (casa.ouro && !this.temOuro) {
      this.adicionarLog('💎 Brilho detectado! Use "Pegar Ouro"');
    }

    this.verificarVitoria();
    this.notify();
  }

  private pegarOuro(): void {
    const casa = this.ambiente.getCasa(this.linha, this.coluna);
    if (casa.ouro && !this.temOuro) {
      casa.ouro = false;
      casa.brilho = false;
      this.temOuro = true;
      this.pontuacao += 1000;
      this.adicionarLog('✨ OURO PEGO! +1000 pontos');
      this.verificarVitoria();
      this.notify();
    } else {
      this.adicionarLog('⚠️ Não há ouro aqui!');
    }
  }

  private atirar(): void {
    if (!this.temFlecha) {
      this.adicionarLog('⚠️ Sem flechas!');
      return;
    }
    if (this.matouWumpus) {
      this.adicionarLog('⚠️ Wumpus já está morto!');
      return;
    }

    this.temFlecha = false;
    this.pontuacao -= 10;
    this.adicionarLog('🏹 Atirando flecha...');

    // ✅ Atira na direção que o agente está olhando
    // Por simplicidade, atira na direção do movimento atual
    // Na implementação real, o agente escolhe a direção
    
    let encontrou = false;
    // Verifica todas as direções
    for (const dir of DIRECOES) {
      const [dl, dc] = DELTA[dir];
      const la = this.linha + dl;
      const ca = this.coluna + dc;
      
      if (this.ambiente.dentro(la, ca)) {
        const casa = this.ambiente.getCasa(la, ca);
        if (casa.wumpus) {
          casa.wumpus = false;
          casa.fedor = false;
          this.matouWumpus = true;
          this.pontuacao += 1000;
          encontrou = true;
          this.adicionarLog('💀 WUMPUS MORTO! +1000 pontos');
          this.removerFedor();
          break;
        }
      }
    }

    if (!encontrou) {
      this.adicionarLog('🏹 Flecha perdida!');
    }
    this.notify();
  }

  private removerFedor(): void {
    for (let i = 0; i < this.ambiente.tamanho; i++) {
      for (let j = 0; j < this.ambiente.tamanho; j++) {
        this.ambiente.getCasa(i, j).fedor = false;
      }
    }
  }

  private verificarVitoria(): void {
    if (this.temOuro && this.linha === 0 && this.coluna === 0) {
      this.venceu = true;
      this.pontuacao -= 1; // Ação de sair
      this.pontuacao += 1000; // Bônus por sair com ouro
      this.vitorias++;
      this.partidas++;
      this.adicionarLog('🚀 VITÓRIA! Saiu com o ouro! +1000 pontos');
      this.notify();
    }
  }

  // ============================================================
  // EXECUÇÃO INTELIGENTE (AGENTES) - USANDO AS CLASSES REAIS
  // ============================================================

  executarPassoInteligente(): void {
    if (this.executando || !this.vivo || this.venceu) return;
    this.executando = true;

    try {
      // ✅ Cria um clone do ambiente para o agente
      const ambienteClone = this.ambiente.clone();
      
      // ✅ Atualiza a posição do agente no clone
      ambienteClone.agentPosition = [this.linha, this.coluna];
      ambienteClone.getCasa(this.linha, this.coluna).agente = true;
      
      let resultado: ResultadoSimulacao | null = null;

      switch (this.agenteSelecionado) {
        case 'v1': {
          const agente = new AgenteReativoV1();
          // Sincroniza estado do agente com o store
          agente.linha = this.linha;
          agente.coluna = this.coluna;
          agente.temOuro = this.temOuro;
          agente.temFlecha = this.temFlecha;
          agente.vivo = this.vivo;
          agente.venceu = this.venceu;
          agente.pontuacao = this.pontuacao;
          agente.passos = this.passos;
          
          resultado = agente.agir(ambienteClone);
          break;
        }
        case 'v2': {
          const agente = new AgenteReativoV2();
          resultado = agente.agir(ambienteClone);
          break;
        }
        case 'v3': {
          const agente = new AgenteAprendizagemV3();
          // ✅ Configura o AG com os parâmetros corretos
          agente.tamanhoPopulacao = 50;
          agente.numeroGeracoes = 1000;
          agente.taxaCruzamento = 0.85;
          agente.taxaMutacao = 0.05;
          
          const resultadoV3 = agente.agir(ambienteClone);
          resultado = resultadoV3;
          break;
        }
      }

      if (resultado) {
        this.ultimoResultado = resultado;
        
        // ✅ Atualiza o estado do store com o resultado
        this.linha = ambienteClone.agentPosition[0];
        this.coluna = ambienteClone.agentPosition[1];
        this.pontuacao = resultado.pontuacao;
        this.passos = resultado.passos;
        this.vivo = resultado.vivo;
        this.venceu = resultado.venceu;
        
        // ✅ Copia o ambiente atualizado
        this.ambiente = ambienteClone;
        
        // ✅ Atualiza flags
        this.temOuro = this.ambiente.getCasa(this.linha, this.coluna).ouro || this.temOuro;
        
        // Adiciona logs do agente
        if (resultado.log) {
          for (const log of resultado.log) {
            this.adicionarLog(log);
          }
        }
      }
    } catch (error) {
      this.adicionarLog(`❌ Erro no agente: ${error}`);
    }

    this.executando = false;
    this.notify();
  }

  // ============================================================
  // MODO AUTOMÁTICO
  // ============================================================

  toggleAuto(): void {
    this.autoMode = !this.autoMode;
    if (this.autoMode) {
      this.adicionarLog('⚡ Modo automático ATIVADO');
      this.executarAuto();
    } else {
      this.adicionarLog('⏹️ Modo automático DESATIVADO');
      if (this.autoTimeout) {
        clearTimeout(this.autoTimeout);
        this.autoTimeout = null;
      }
    }
    this.notify();
  }

  private executarAuto(): void {
    if (!this.autoMode || !this.vivo || this.venceu) {
      this.autoMode = false;
      this.notify();
      return;
    }

    this.executarPassoInteligente();

    this.autoTimeout = setTimeout(() => {
      if (this.autoMode) this.executarAuto();
    }, 300);
  }

  // ============================================================
  // UTILITÁRIOS
  // ============================================================

  adicionarLog(msg: string): void {
    const time = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
    this.log.push(`[${timeStr}] ${msg}`);
    if (this.log.length > 200) this.log.shift();
  }

  mudarAgente(tipo: TipoAgente): void {
    this.agenteSelecionado = tipo;
    this.adicionarLog(`🧠 Agente ${tipo.toUpperCase()} selecionado`);
    this.notify();
  }

  // ✅ Getter para o último resultado
  getUltimoResultado(): ResultadoSimulacao | null {
    return this.ultimoResultado;
  }

  // ✅ Reseta o jogo mantendo o mesmo ambiente
  resetarPosicao(): void {
    this.linha = 0;
    this.coluna = 0;
    this.pontuacao = 0;
    this.passos = 0;
    this.temOuro = false;
    this.temFlecha = true;
    this.vivo = true;
    this.venceu = false;
    this.matouWumpus = false;
    this.ultimoResultado = null;
    
    // Limpa agente antigo
    for (let i = 0; i < this.ambiente.tamanho; i++) {
      for (let j = 0; j < this.ambiente.tamanho; j++) {
        this.ambiente.getCasa(i, j).agente = false;
      }
    }
    
    this.ambiente.getCasa(0, 0).agente = true;
    this.ambiente.getCasa(0, 0).visitada = true;
    
    this.adicionarLog('🔄 Posição resetada para (0,0)');
    this.notify();
  }
}

export type { Casa };