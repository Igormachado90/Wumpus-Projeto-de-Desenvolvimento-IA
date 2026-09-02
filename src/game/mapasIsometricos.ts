export type Direcao = 'norte' | 'sul' | 'leste' | 'oeste';
export type TipoSensacao = 'brisa' | 'fedor';

/**
 * Gera a URL da imagem baseada estritamente na coordenada (linha, coluna) do jogador.
 * O sistema assume que o jogador está no centro de uma matriz 3x3 renderizada.
 */
export function obterUrlImagem(linha: number, coluna: number, tamanhoGrid: number): string {

    // Lógica para calcular o deslocamento do centro (1,1) para as bordas
    // Se estiver no centro do grid (ex: linha 3 de 6), ele é o centro da imagem.
    // Se estiver na borda (linha 0), ele trava no canto da imagem.

    // Calcula qual "linha da imagem 3x3" usar
    let linhaImagem: number;
    if (linha === 0) {
        linhaImagem = 0; // Está no topo (fundo da imagem)
    } else if (linha === tamanhoGrid - 1) {
        linhaImagem = 2; // Está no fim (frente da imagem)
    } else {
        linhaImagem = 1; // Está no meio
    }

    // Calcula qual "coluna da imagem 3x3" usar
    let colunaImagem: number;
    if (coluna === 0) {
        colunaImagem = 0; // Está na esquerda
    } else if (coluna === tamanhoGrid - 1) {
        colunaImagem = 2; // Está na direita
    } else {
        colunaImagem = 1; // Está no meio
    }

    let nomeArquivo = 'mapa_centro_(1,1).png'; // Fallback padrão

    // Mapeamento exato baseado na sua lista de arquivos
  if (linhaImagem === 0 && colunaImagem === 0) nomeArquivo = 'mapa_esquerda_frente_(0,0).png';
  else if (linhaImagem === 0 && colunaImagem === 1) nomeArquivo = 'mapa_frente_(0,1).png';
  else if (linhaImagem === 0 && colunaImagem === 2) nomeArquivo = 'mapa_frente_direita_(0,2).png';
  else if (linhaImagem === 1 && colunaImagem === 0) nomeArquivo = 'mapa_esquerda(1,0).png';
  else if (linhaImagem === 1 && colunaImagem === 1) nomeArquivo = 'mapa_centro_(1,1).png';
  else if (linhaImagem === 1 && colunaImagem === 2) nomeArquivo = 'mapa_direita_(1,2).png';
  else if (linhaImagem === 2 && colunaImagem === 0) nomeArquivo = 'mapa_esquerda_atras(2,0).png';
  else if (linhaImagem === 2 && colunaImagem === 1) nomeArquivo = 'mapa_atras(2,1).png';
  else if (linhaImagem === 2 && colunaImagem === 2) nomeArquivo = 'mapa_atras_direita(2,2).png';

    return new URL(`../assets/mapas-isometricos/${nomeArquivo}`, import.meta.url).href;
}

/**
 * Obtém URL da imagem de sensação (brisa ou fedor)
 */
export function obterUrlSensacao(tipo: TipoSensacao): string {
    if (tipo === 'brisa') {
        return new URL(`../assets/mapas-isometricos/brisa-fedor/${tipo}.png`, import.meta.url).href;
    }
    return new URL(`../assets/mapas-isometricos/brisa-fedor/${tipo}.png`, import.meta.url).href;
}