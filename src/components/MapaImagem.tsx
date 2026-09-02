import type { JogoStore } from '../game/jogoStore';
import type { Casa } from '../game/casa';
import { obterUrlSensacao } from '../game/mapasIsometricos';
import './MapaImagem.css';

interface Props {
    jogo: JogoStore;
} 

function celulaInfo(jogo: JogoStore, casa: Casa, linha: number, coluna: number) {
    const isAgente = jogo.linha === linha && jogo.coluna === coluna && jogo.vivo;

    let emoji = ' ';
    let borda: string | null = null;
    let fundo: string | null = null;

    if (isAgente) {
        // emoji = '🤖';
        borda = 'var(--cyan)';
        fundo = 'rgba(0, 212, 255, 0.1)';
    } else if (casa.wumpus) {
        // emoji = '👹';
    } else if (casa.ouro && !jogo.temOuro) {
        emoji = '✨';
    } else if (casa.poco) {
        // emoji = '🕳️';
    } else if (casa.brisa && casa.visitada) {
        // emoji = '💨';
    } else if (casa.fedor && casa.visitada) {
        // emoji = '👃';
    } else if (casa.brilho && casa.visitada) {
        // emoji = '💎';
    } else if (casa.visitada) {
        emoji = '•';
    }

    if (casa.visitada) {
        fundo = 'rgba(0, 212, 255, 0.1)';
    }
    if (casa.seguro) {
        borda = 'rgba(0, 255, 65, 0.2)';
    }
    if (casa.perigoso) {
        borda = 'rgba(255, 0, 64, 0.3)';
    }

    return { emoji, borda, fundo, isAgente };
}

export function MapaImagem({ jogo }: Props) {
    const n = jogo.ambiente.tamanho;

    return (
        <div className="mapa-imagem">
            <div className="mapa-imagem-header">
                <span className="mapa-imagem-title">MAPA IMAGINÁRIO</span>
            </div>

            <div className="mapa-imagem-grid-wrap">
                <div className="mapa-imagem-grid" style={{ gridTemplateColumns: `repeat(${n}, 19px)` }}>
                    {Array.from({ length: n }, (_, i) =>
                        Array.from({ length: n }, (_, j) => {
                            const casa = jogo.ambiente.getCasa(i, j);
                            const { emoji, borda, fundo, isAgente } = celulaInfo(jogo, casa, i, j);
                            return (
                                <div
                                    key={`${i}-${j}`}
                                    className={`mapa-imagem-cell${isAgente ? ' mapa-imagem-cell-agente' : ''}`}
                                    style={{
                                        backgroundColor: fundo ?? '#1a1a2e',
                                        borderColor: borda ?? 'rgba(255,255,255,0.05)',
                                        position: 'relative',
                                    }}
                                >
                                    <span style={{ fontSize: emoji === '•' ? 20 : 14 }}>{emoji}</span>

                                    {/* Brisa */}
                                    {casa.brisa && casa.visitada && (
                                        <img
                                            src={obterUrlSensacao('brisa')}
                                            alt="Brisa"
                                            style={{
                                                position: 'absolute',
                                                width: '12px',
                                                height: '12px',
                                                top: '2px',
                                                right: '2px',
                                                opacity: 0.7,
                                            }}
                                        />
                                    )}

                                    {/* Fedor */}
                                    {casa.fedor && casa.visitada && (
                                        <img
                                            src={obterUrlSensacao('fedor')}
                                            alt="Fedor"
                                            style={{
                                                position: 'absolute',
                                                width: '12px',
                                                height: '12px',
                                                bottom: '2px',
                                                left: '2px',
                                                opacity: 0.7,
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
