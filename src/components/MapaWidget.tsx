import type { JogoStore } from '../game/jogoStore';
import type { Casa } from '../game/casa';
import { useEffect, useState } from 'react';
import { obterUrlImagem, obterUrlSensacao } from '../game/mapasIsometricos';
// import type { Direcao, Perspectiva } from '../game/mapasIsometricos';
import './MapaWidget.css';

interface Props {
  jogo: JogoStore;
  direcaoAtual?: 'norte' | 'sul' | 'leste' | 'oeste';
}

function obterRotacaoAgente(direcao?: string) {
  switch (direcao) {
    case 'norte': return 'rotate(0deg)';
    case 'leste': return 'rotate(90deg)';
    case 'sul': return 'rotate(180deg)';
    case 'oeste': return 'rotate(270deg)';
    default: return 'rotate(0deg)';
  }
}

function celulaInfo(jogo: JogoStore, casa: Casa, linha: number, coluna: number) {
  const isAgente = jogo.linha === linha && jogo.coluna === coluna && jogo.vivo;

  let emoji = ' ';
  let borda: string | null = null;
  let fundo: string | null = null;

  if (isAgente) emoji = '🤖';
  else if (casa.wumpus) emoji = '👹';
  else if (casa.ouro && !jogo.temOuro) emoji = '✨';
  else if (casa.poco) emoji = '🕳️';
  else if (casa.visitada) emoji = '•';

  if (casa.visitada) fundo = 'rgba(0, 212, 255, 0.1)';
  if (casa.seguro) borda = 'rgba(0, 255, 65, 0.2)';
  if (casa.perigoso) borda = 'rgba(255, 0, 64, 0.3)';
  
  return { emoji, borda, fundo, isAgente };
}

export function MapaWidget({ jogo, direcaoAtual = 'norte' }: Props) {
  const n = jogo.ambiente.tamanho;
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [urlImagem, setUrlImagem] = useState('');

  // Atualizar a imagem quando a direção mudar
  useEffect(() => {
    const novaUrl = obterUrlImagem(jogo.linha, jogo.coluna, n);
    setUrlImagem(novaUrl);
    setErroCarregamento(false);
  }, [jogo.linha, jogo.coluna, n]);

  const casaAtual = jogo.ambiente.getCasa(jogo.linha, jogo.coluna);

  // Verifica se na sala atual tem Ouro ou Poço
  const temOuro = casaAtual.ouro && !jogo.temOuro;
  const temPoco = casaAtual.poco;
  const temWumpus = casaAtual.wumpus;

  const temBrisa = casaAtual.brisa && casaAtual.visitada;
  const temFedor = casaAtual.fedor && casaAtual.visitada;
  const urlImagemAgente = new URL(
    `../assets/mapas-isometricos/agente/agente${jogo.agenteSelecionado === 'v1' ? 'V1' : 'V2'}-T800.png`,
    import.meta.url
  ).href;

  // PERCEPÇÕES: 
  // No mundo do Wumpus, você SENTE a brisa/fedor quando está ADJACENTE ao perigo.
  // Vamos verificar as casas vizinhas para mostrar a "sensação".
  const sentirBrisa = verificarSentido(jogo, 'brisa');
  const sentirFedor = verificarSentido(jogo, 'fedor');

  // Função auxiliar para verificar vizinhos
  function verificarSentido(jogo: JogoStore, tipo: 'brisa' | 'fedor' | 'brilho') {
    const { linha, coluna } = jogo;
    const vizinhos = [
      { l: linha - 1, c: coluna }, { l: linha + 1, c: coluna },
      { l: linha, c: coluna - 1 }, { l: linha, c: coluna + 1 }
    ];

    return vizinhos.some(({ l, c }) => {
      if (l < 0 || l >= n || c < 0 || c >= n) return false;
      const casa = jogo.ambiente.getCasa(l, c);
      if (tipo === 'brisa') return casa.poco;
      if (tipo === 'fedor') return casa.wumpus;
      if (tipo === 'brilho') return casa.ouro;
      return false;
    });
  }

  return (
    <div className="mapa-widget">
      <div className="mapa-header">
        <span className="mapa-title">🗺️ SETOR DE CAÇA</span>
        <div className="mapa-actions">
          <button className="mapa-btn" onClick={() => jogo.gerarAmbiente()}>🔄 Novo</button>
          <button className="mapa-btn" onClick={() => jogo.executarPassoInteligente()}>▶ Executar</button>
          <button className="mapa-btn mapa-btn-primary" onClick={() => jogo.toggleAuto()}>
            {jogo.autoMode ? '⏹ Parar' : '⚡ Auto'}
          </button>
        </div>
      </div>

      <div className="mapa-imagem-container">
        {!erroCarregamento && urlImagem ? (
          <div className="mapa-cena">
            {/* 1. Imagem do Chão/Parede (Fundo) */}
            <img
              src={urlImagem}
              alt={`Mapa Isométrico`}
              className="mapa-chao"
              onError={() => setErroCarregamento(true)}
            />

            {/* 2. Imagem do OURO (Sobreposição) */}
            {temOuro && (
              <img
                className="mapa-objeto mapa-ouro"
                src={new URL('../assets/mapas-isometricos/ouro/ouro.png', import.meta.url).href}
                alt="Ouro"
              />
            )}

            {/* 3. Imagem do POÇO (Sobreposição) */}
            {temPoco && (
              <img
                className="mapa-objeto mapa-poco"
                src={new URL('../assets/mapas-isometricos/poco/poco.png', import.meta.url).href}
                alt="Poço"
              />
            )}

            {/* 4. Imagem do WUMPUS */}
            {temWumpus && (
              <img
                className="mapa-objeto mapa-wumpus"
                src={new URL('../assets/mapas-isometricos/wumpus/wumpus.png', import.meta.url).href}
                alt="Wumpus"
              />
            )}

            {/* 5. Imagem da BRISA (Sobreposição) */}
            {sentirBrisa && (
              <img
                className={`mapa-objeto mapa-brisa ${temFedor ? 'mapa-metade' : ''}`}
                src={obterUrlSensacao('brisa')}
                alt="Brisa"
              />
            )}

            {/* 6. Imagem do FEDOR (Sobreposição) */}
            {sentirFedor && (
              <img
                className={`mapa-objeto mapa-fedor ${temBrisa ? 'mapa-metade' : ''}`}
                src={obterUrlSensacao('fedor')}
                alt="Fedor"
              />
            )}

            {/* 5. Imagem do AGENTE (Jogador) */}
            {jogo.vivo && (
              <img
                src={urlImagemAgente}
                alt="Agente"
                className="mapa-objeto mapa-agente"
                style={{
                  transform:`translate(-50%, -80%) ${obterRotacaoAgente(direcaoAtual)}`
                }}
              />
            )}

          </div>
        ) : (
          <div className="mapa-grid-wrap">
            <div className="mapa-grid" style={{ gridTemplateColumns: `repeat(${n}, 25px)` }}>
              
              {Array.from({ length: n }, (_, i) =>
                Array.from({ length: n }, (_, j) => {
                  const casa = jogo.ambiente.getCasa(i, j);
                  const { emoji, borda, fundo, isAgente } = celulaInfo(jogo, casa, i, j);
                  return (
                    <div
                      key={`${i}-${j}`}
                      className={`mapa-cell${isAgente ? ' mapa-cell-agente' : ''}`}
                      style={{
                        backgroundColor: fundo ?? '#1a1a2e',
                        borderColor: borda ?? 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <span style={{ fontSize: emoji === '•' ? 20 : 14 }}>{emoji}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
