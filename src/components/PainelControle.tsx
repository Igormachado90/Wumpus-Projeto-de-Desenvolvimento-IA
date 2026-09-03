import type { JogoStore, TipoAgente } from '../game/jogoStore';
import './PainelControle.css';

interface Props {
  jogo: JogoStore;
  onDirecaoChange?: (direcao: 'norte' | 'sul' | 'leste' | 'oeste') => void;
}

const AGENTES: { tipo: TipoAgente; nome: string; desc: string; img: string }[] = [
  { tipo: 'v1', nome: 'V1', desc: 'Reativo', img: 'src/images/v1.jpeg' },
  { tipo: 'v2', nome: 'V2', desc: 'Memória', img: 'src/images/v2.jpeg' },
  { tipo: 'v3', nome: 'V3', desc: 'AG', img: 'src/images/v3.jpeg' },
];

function corPercepcao(p: string): string {
  switch (p) {
    case 'brisa': return 'var(--cyan)';
    case 'fedor': return '#9b00ff';
    case 'brilho': return 'var(--gold)';
    default: return 'var(--muted)';
  }
}

export function PainelControle({ jogo, onDirecaoChange }: Props) {
  const percepcoes = jogo.getPercepcoesString();
  const desabilitado = !jogo.vivo || jogo.venceu || jogo.executando;

  // // Função wrapper para executar ação e notificar mudança de direção
  // const executarComDirecao = (acao: string, direcao?: 'norte' | 'sul' | 'leste' | 'oeste') => {
  //   jogo.executarAcaoUsuario(acao);
  //   if (direcao && onDirecaoChange) {
  //     onDirecaoChange(direcao);
  //   }
  // };

  return (
    <div className="painel-controle">
      {/* Seletor de agente */}
      <div className="agente-selector">
        {AGENTES.map((info) => {
          const isActive = jogo.agenteSelecionado === info.tipo;
          return (
            <button
              key={info.tipo}
              className={`agente-btn${isActive ? ' agente-btn-active' : ''}`}
              onClick={() => jogo.mudarAgente(info.tipo)}
            >
              <img
                src={info.img}
                alt={info.nome}
                className="agente-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="agente-nome" style={{ color: isActive ? 'var(--cyan)' : 'var(--muted)' }}>
                {info.nome}
              </span>
              <span className="agente-desc">{info.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Percepções */}
      <div className="percepcoes-box">
        <span className="secao-title">📡 PERCEPÇÕES</span>
        <div className="percepcoes-list">
          {percepcoes.length === 0 ? (
            <span className="percepcao-chip percepcao-vazia">📡 Nenhuma percepção</span>
          ) : (
            percepcoes.map((p) => {
              const cor = corPercepcao(p);
              return (
                <span
                  key={p}
                  className="percepcao-chip"
                  style={{
                    color: cor,
                    background: `color-mix(in srgb, ${cor} 20%, transparent)`,
                    borderColor: `color-mix(in srgb, ${cor} 30%, transparent)`,
                  }}
                >
                  {p.toUpperCase()}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="controles-box">
        <span className="secao-title">🎮 CONTROLES</span>
        <div className="controles-grid">
          <BotaoAcao
            icon="✨"
            label="Pegar"
            acao="pegar"
            shortcut="[G]"
            jogo={jogo}
            desabilitado={desabilitado}
            isSuccess
          />
          <BotaoAcao icon="⬆" label="Norte" acao="norte" shortcut="[W]" jogo={jogo} desabilitado={desabilitado} onDirecaoChange={onDirecaoChange} direcao="norte" />
          <BotaoAcao
            icon="🏹"
            label="Atirar"
            acao="atirar"
            shortcut="[T]"
            jogo={jogo}
            desabilitado={desabilitado}
            isPrimary
          />
          <BotaoAcao icon="⬅" label="Oeste" acao="oeste" shortcut="[A]" jogo={jogo} desabilitado={desabilitado} onDirecaoChange={onDirecaoChange} direcao="oeste" />
          <BotaoAcao icon="⬇" label="Sul" acao="sul" shortcut="[S]" jogo={jogo} desabilitado={desabilitado} onDirecaoChange={onDirecaoChange} direcao="sul" />
          <BotaoAcao icon="➡" label="Leste" acao="leste" shortcut="[D]" jogo={jogo} desabilitado={desabilitado} onDirecaoChange={onDirecaoChange} direcao="leste" />
        </div>
      </div>
    </div>
  );
}

function BotaoAcao({
  icon,
  label,
  acao,
  shortcut,
  jogo,
  desabilitado,
  isPrimary,
  isSuccess,
  onDirecaoChange,
  direcao,
}: any ) {
  const classe = [
    'botao-acao',
    isPrimary ? 'botao-primary' : '',
    isSuccess ? 'botao-success' : '',
    desabilitado ? 'botao-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    jogo.executarAcaoUsuario(acao);
    if (direcao && onDirecaoChange) {
      onDirecaoChange(direcao);
    }
  };

  return (
    <button
      className={classe}
      disabled={desabilitado}
      onClick={handleClick}
    >
      <span className="botao-icon">{icon}</span>
      <span className="botao-label">{label}</span>
      <span className="botao-shortcut">{shortcut}</span>
    </button>
  );
}
