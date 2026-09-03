import type { JogoStore } from '../game/jogoStore';
import './Header.css';

interface Props {
  jogo: JogoStore;
  aoVoltar: () => void;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="header-stat">
      <span className="header-stat-value">{value}</span>
      <span className="header-stat-label">{label}</span>
    </div>
  );
}

export function Header({ aoVoltar, jogo }: Props) {
  
  return (
    <div className="header-bar">
      <div className="header-logo">
        <img src="./images/logoNome.png" alt="Wumpus Exterminador" />
      </div>
      <div className="header-spacer" >
        <button className="botao-link" onClick={aoVoltar}>Voltar ao menu</button>
      </div>
      <div className="header-stats">
        <Stat value={jogo.pontuacao.toString()} label="Pontos" />
        <Stat value={jogo.venceu ? '1' : '0'} label="Vitórias" />
        <Stat value="1" label="Partidas" />
      </div>
    </div>
  );
}
