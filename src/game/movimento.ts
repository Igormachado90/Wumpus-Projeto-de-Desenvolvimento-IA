export type Direcao = 'norte' | 'sul' | 'leste' | 'oeste';

// Versão resumida para facilitar (usada no AG)
export type DirecaoCurta = 'N' | 'S' | 'L' | 'O';

export const DIRECOES: Direcao[] = ['norte', 'sul', 'leste', 'oeste'];
export const DIRECOES_CURTAS: DirecaoCurta[] = ['N', 'S', 'L', 'O'];

export const DELTA: Record<Direcao, [number, number]> = {
  norte: [-1, 0],
  sul: [1, 0],
  leste: [0, 1],
  oeste: [0, -1],
};

export const NOME: Record<Direcao, string> = {
  norte: 'Norte',
  sul: 'Sul',
  leste: 'Leste',
  oeste: 'Oeste',
};

// Mapeamento entre direção curta e completa
export const DIRECAO_MAP: Record<DirecaoCurta, Direcao> = {
  'N': 'norte',
  'S': 'sul',
  'L': 'leste',
  'O': 'oeste',
};

export const DIRECAO_REVERSE_MAP: Record<Direcao, DirecaoCurta> = {
  norte: 'N',
  sul: 'S',
  leste: 'L',
  oeste: 'O',
};

export function oposta(dir: Direcao): Direcao {
  const mapa: Record<Direcao, Direcao> = {
    norte: 'sul',
    sul: 'norte',
    leste: 'oeste',
    oeste: 'leste',
  };
  return mapa[dir];
}

// Converter direção curta para completa
export function curtaParaCompleta(curta: DirecaoCurta): Direcao {
  return DIRECAO_MAP[curta];
}

// Converter direção completa para curta
export function completaParaCurta(completa: Direcao): DirecaoCurta {
  return DIRECAO_REVERSE_MAP[completa];
}

export function direcaoAleatoria(): Direcao {
  return DIRECOES[Math.floor(Math.random() * DIRECOES.length)];
}

export function direcaoAleatoriaCurta(): DirecaoCurta {
  return DIRECOES_CURTAS[Math.floor(Math.random() * DIRECOES_CURTAS.length)];
}

export function embaralhar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Nova função: move uma posição em uma direção
export function moverPosicao(pos: [number, number], dir: Direcao): [number, number] {
  const [linha, coluna] = pos;
  const [dl, dc] = DELTA[dir];
  return [linha + dl, coluna + dc];
}

// Nova função: verifica se posição é válida
export function posicaoValida(pos: [number, number], tamanho: number): boolean {
  const [linha, coluna] = pos;
  return linha >= 0 && linha < tamanho && coluna >= 0 && coluna < tamanho;
}

// Classe Movimento para compatibilidade com código existente
export class Movimento {
  static readonly delta: Record<Direcao, [number, number]> = DELTA;
  static readonly nome: Record<Direcao, string> = NOME;
  static readonly direcoes: Direcao[] = DIRECOES;
  static readonly direcoesCurtas: DirecaoCurta[] = DIRECOES_CURTAS;

  static oposta(dir: Direcao): Direcao {
    return oposta(dir);
  }

  static todas(): Direcao[] {
    return [...DIRECOES];
  }

  static aleatoria(): Direcao {
    return direcaoAleatoria();
  }

  static aleatoriaCurta(): DirecaoCurta {
    return direcaoAleatoriaCurta();
  }

  static embaralhar<T>(arr: T[]): T[] {
    return embaralhar(arr);
  }

  static paraCurta(dir: Direcao): DirecaoCurta {
    return completaParaCurta(dir);
  }

  static paraCompleta(curta: DirecaoCurta): Direcao {
    return curtaParaCompleta(curta);
  }

  static mover(pos: [number, number], dir: Direcao): [number, number] {
    return moverPosicao(pos, dir);
  }

  static valida(pos: [number, number], tamanho: number): boolean {
    return posicaoValida(pos, tamanho);
  }
}