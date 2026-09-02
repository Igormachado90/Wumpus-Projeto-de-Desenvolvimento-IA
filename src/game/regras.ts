import type { Percepcao } from './percepcao';
import { type Direcao } from './movimento';

/**
 * Representa uma regra do agente reativo
 */
export interface Regra {
  id: string;
  condicoes: string[];  // Lista de percepções necessárias
  acao: string;         // Ação a ser executada
  prioridade: number;   // Quanto maior, mais prioritária
  descricao: string;
}

export class Regras {
  private baseConhecimento: Regra[] = [];

  constructor() {
    this.inicializarRegras();
  }

  /**
   * Inicializa a base de conhecimento com regras
   */
  inicializarRegras(): void {
    // Regras de alta prioridade (10-9)
    this.baseConhecimento.push({
      id: 'R1',
      condicoes: ['Brilho'],
      acao: 'PEGAR_OURO',
      prioridade: 10,
      descricao: 'Se tem brilho, pegar ouro',
    });

    this.baseConhecimento.push({
      id: 'R2',
      condicoes: ['Fedor', 'Brilho'],
      acao: 'PEGAR_OURO',
      prioridade: 9,
      descricao: 'Se tem fedor e brilho, pegar ouro primeiro',
    });

    // Regras de média prioridade (8-5)
    this.baseConhecimento.push({
      id: 'R3',
      condicoes: ['Fedor'],
      acao: 'ATIRAR',
      prioridade: 8,
      descricao: 'Se tem fedor, atirar',
    });

    this.baseConhecimento.push({
      id: 'R4',
      condicoes: ['Fedor', 'Brisa'],
      acao: 'MOVER_ALEATORIO',
      prioridade: 7,
      descricao: 'Se tem fedor e brisa, mover aleatório',
    });

    this.baseConhecimento.push({
      id: 'R5',
      condicoes: ['Brisa'],
      acao: 'MOVER_ALEATORIO',
      prioridade: 6,
      descricao: 'Se tem brisa, mover aleatório (cuidado com poço)',
    });

    // Regras de baixa prioridade (4-1)
    this.baseConhecimento.push({
      id: 'R6',
      condicoes: [],
      acao: 'MOVER_FRENTE',
      prioridade: 1,
      descricao: 'Sem percepções, mover para frente',
    });

    this.baseConhecimento.push({
      id: 'R7',
      condicoes: [],
      acao: 'MOVER_ALEATORIO',
      prioridade: 1,
      descricao: 'Sem percepções, mover aleatório (fallback)',
    });
  }

  /**
   * Obtém ações aplicáveis com base na percepção
   */
  getAcoesAplicaveis(percepcao: Percepcao): string[] {
    const acoesAplicaveis: string[] = [];
    const percepcoesAtivas = this.percepcaoParaLista(percepcao);

    // Ordena regras por prioridade (maior primeiro)
    const regrasOrdenadas = [...this.baseConhecimento].sort((a, b) => b.prioridade - a.prioridade);

    for (const regra of regrasOrdenadas) {
      // Se a regra não tem condições, sempre aplicável
      if (regra.condicoes.length === 0) {
        acoesAplicaveis.push(regra.acao);
        continue;
      }

      // Verifica se todas as condições da regra são atendidas
      let todasAtendidas = true;
      for (const condicao of regra.condicoes) {
        if (!percepcoesAtivas.includes(condicao)) {
          todasAtendidas = false;
          break;
        }
      }

      if (todasAtendidas) {
        acoesAplicaveis.push(regra.acao);
      }
    }

    // Remove duplicatas mantendo ordem de prioridade
    return [...new Set(acoesAplicaveis)];
  }

  /**
   * Obtém a melhor ação baseada na percepção (usa prioridade)
   */
  getMelhorAcao(percepcao: Percepcao): string | null {
    const acoes = this.getAcoesAplicaveis(percepcao);
    if (acoes.length === 0) return null;
    
    // Retorna a primeira ação (maior prioridade)
    return acoes[0];
  }

  /**
   * Obtém ações com suas prioridades
   */
  getAcoesComPrioridade(percepcao: Percepcao): { acao: string; prioridade: number }[] {
    const resultado: { acao: string; prioridade: number }[] = [];
    const percepcoesAtivas = this.percepcaoParaLista(percepcao);

    for (const regra of this.baseConhecimento) {
      if (regra.condicoes.length === 0) {
        resultado.push({ acao: regra.acao, prioridade: regra.prioridade });
        continue;
      }

      let todasAtendidas = true;
      for (const condicao of regra.condicoes) {
        if (!percepcoesAtivas.includes(condicao)) {
          todasAtendidas = false;
          break;
        }
      }

      if (todasAtendidas) {
        resultado.push({ acao: regra.acao, prioridade: regra.prioridade });
      }
    }

    // Remove duplicatas mantendo a maior prioridade
    const mapa = new Map<string, number>();
    for (const item of resultado) {
      if (!mapa.has(item.acao) || mapa.get(item.acao)! < item.prioridade) {
        mapa.set(item.acao, item.prioridade);
      }
    }

    return Array.from(mapa.entries()).map(([acao, prioridade]) => ({ acao, prioridade }));
  }

  /**
   * Converte percepção para lista de strings
   */
  private percepcaoParaLista(percepcao: Percepcao): string[] {
    const lista: string[] = [];
    if (percepcao.fedor) lista.push('Fedor');
    if (percepcao.brisa) lista.push('Brisa');
    if (percepcao.brilho) lista.push('Brilho');
    return lista;
  }

  /**
   * Adiciona uma nova regra
   */
  adicionarRegra(condicoes: string[], acao: string, prioridade: number, descricao: string): void {
    this.baseConhecimento.push({
      id: `R${this.baseConhecimento.length + 1}`,
      condicoes,
      acao,
      prioridade,
      descricao,
    });
  }

  /**
   * Remove uma regra pelo ID
   */
  removerRegra(id: string): boolean {
    const index = this.baseConhecimento.findIndex(r => r.id === id);
    if (index >= 0) {
      this.baseConhecimento.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Obtém todas as regras
   */
  getRegras(): Regra[] {
    return [...this.baseConhecimento];
  }


  getAcaesAplicaveis(percepcao: Percepcao): string[] {
    return this.getAcoesAplicaveis(percepcao);
  }

  /**
   * ✅ Método de compatibilidade com código existente
   */
  get baseConhecimentoLegado(): Record<string, string> {
    const legado: Record<string, string> = {};
    for (const regra of this.baseConhecimento) {
      const chave = regra.condicoes.length > 0 ? regra.condicoes.join(',') : '';
      // Mantém apenas a ação de maior prioridade para cada combinação
      if (!legado[chave] || regra.prioridade > this.getPrioridadeLegado(chave)) {
        legado[chave] = regra.acao;
      }
    }
    return legado;
  }

  private getPrioridadeLegado(chave: string): number {
    for (const regra of this.baseConhecimento) {
      const chaveRegra = regra.condicoes.length > 0 ? regra.condicoes.join(',') : '';
      if (chaveRegra === chave) {
        return regra.prioridade;
      }
    }
    return 0;
  }
}

/**
 * ✅ Constantes de ações para facilitar o uso
 */
export const ACOES = {
  MOVER_NORTE: 'MOVER_NORTE',
  MOVER_SUL: 'MOVER_SUL',
  MOVER_LESTE: 'MOVER_LESTE',
  MOVER_OESTE: 'MOVER_OESTE',
  MOVER_FRENTE: 'MOVER_FRENTE',
  MOVER_ALEATORIO: 'MOVER_ALEATORIO',
  PEGAR_OURO: 'PEGAR_OURO',
  ATIRAR: 'ATIRAR',
} as const;

/**
 * ✅ Mapeamento de ações para direções
 */
export const ACAO_PARA_DIRECAO: Record<string, Direcao> = {
  MOVER_NORTE: 'norte',
  MOVER_SUL: 'sul',
  MOVER_LESTE: 'leste',
  MOVER_OESTE: 'oeste',
} as const;