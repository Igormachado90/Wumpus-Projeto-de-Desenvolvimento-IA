import type { Casa } from "./casa";

export interface Percepcao {
  brisa: boolean;      // Próximo a poço
  fedor: boolean;      // Próximo a Wumpus
  brilho: boolean;     // Casa tem ouro
  grito: boolean;      // Wumpus foi morto (ouvido em toda caverna)
  impacto: boolean;    // Tentou se mover para fora do grid
}

// Criar uma percepção vazia (padrão)
export const PERCEPCAO_VAZIA: Percepcao = {
  brisa: false,
  fedor: false,
  brilho: false,
  grito: false,
  impacto: false,
};

// Helper para criar percepção a partir de uma casa
export function criarPercepcao(casa: Casa): Percepcao {
  return {
    brisa: casa.brisa,
    fedor: casa.fedor,
    brilho: casa.brilho,
    grito: casa.grito || false,
    impacto: false,
  };
}

// Verifica se há alguma percepção ativa
export function hasPercepcao(percepcao: Percepcao): boolean {
  return percepcao.brisa || percepcao.fedor || percepcao.brilho || percepcao.grito || percepcao.impacto;
}

// Converte percepção para string (para debug)
export function percepcaoToString(percepcao: Percepcao): string {
  const partes: string[] = [];
  if (percepcao.brisa) partes.push('Brisa');
  if (percepcao.fedor) partes.push('Fedor');
  if (percepcao.brilho) partes.push('Brilho');
  if (percepcao.grito) partes.push('Grito');
  if (percepcao.impacto) partes.push('Impacto');
  return partes.length > 0 ? partes.join(', ') : 'Nenhuma';
}