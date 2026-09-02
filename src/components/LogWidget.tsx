import type { JogoStore } from '../game/jogoStore';
import './LogWidget.css';

interface Props {
  jogo: JogoStore;
}

function corLog(entry: string): string {
  if (
    entry.includes('💀') ||
    entry.includes('⚠️') ||
    entry.includes('❌') ||
    entry.includes('⛔')
  ) {
    return 'var(--danger)';
  }
  if (
    entry.includes('✅') ||
    entry.includes('✨') ||
    entry.includes('🚀') ||
    entry.includes('🎉')
  ) {
    return 'var(--success)';
  }
  if (entry.includes('🎯') || entry.includes('🧠')) {
    return 'var(--cyan)';
  }
  if (entry.includes('💎') || entry.includes('💰') || entry.includes('🏆')) {
    return 'var(--gold)';
  }
  return 'var(--muted)';
}

function pesoLog(entry: string): number {
  return entry.includes('🎯') || entry.includes('🧠') ? 600 : 400;
}

export function LogWidget({ jogo }: Props) {
  const entradas = [...jogo.log].reverse();

  return (
    <div className="log-widget">
      <span className="log-title">📋 LOG DE OPERAÇÕES</span>
      <div className="log-scroll">
        {entradas.map((entry, idx) => (
          <p
            key={idx}
            className="log-entry"
            style={{ color: corLog(entry), fontWeight: pesoLog(entry) }}
          >
            {entry}
          </p>
        ))}
      </div>
    </div>
  );
}
