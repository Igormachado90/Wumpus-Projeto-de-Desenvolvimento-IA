import type { JogoStore } from '../game/jogoStore';
import './StatusWidget.css';

interface Props {
  jogo: JogoStore;
}

function StatusItem({ label, value, cor }: { label: string; value: string; cor: string }) {
  return (
    <div className="status-item">
      <span className="status-value" style={{ color: cor }}>
        {value}
      </span>
      <span className="status-label">{label}</span>
    </div>
  );
}

export function StatusWidget({ jogo }: Props) {
  return (
    <div className="status-widget">
      <span className="status-title">📡 STATUS DO AGENTE</span>
      <div className="status-grid">
        <StatusItem
          label="Posição"
          value={jogo.vivo ? `(${jogo.linha},${jogo.coluna})` : '💀'}
          cor={jogo.vivo ? 'var(--cyan)' : 'var(--danger)'}
        />
        <StatusItem label="Pontos" value={jogo.pontuacao.toString()} cor="var(--success)" />
        <StatusItem label="Ouro" value={jogo.temOuro ? '✅' : '❌'} cor="var(--gold)" />
        <StatusItem label="Flecha" value={jogo.temFlecha ? '🏹' : '❌'} cor="var(--cyan)" />
        <StatusItem
          label="Wumpus"
          value={jogo.matouWumpus ? '💀 Morto' : '👹 Vivo'}
          cor={jogo.matouWumpus ? 'var(--danger)' : 'var(--success)'}
        />
        <StatusItem label="Passos" value={jogo.passos.toString()} cor="var(--muted)" />
      </div>
    </div>
  );
}
