import type { JogoStore } from '../game/jogoStore';
import { Simulacao } from './Simulacao';
import './AgenteWidget.css';
// import { LogWidget } from './LogWidget';

interface Props {
  jogo: JogoStore;
}

// No projeto Flutter original este painel era apenas um placeholder
// (título + grade vazia). Aqui aproveitamos o espaço para expor o
// Laboratório de Simulação, que roda a lógica completa e independente
// dos agentes originais (V1/V2/V3 + Algoritmo Genético) portada do Dart.
export function AgenteWidget({ jogo }: Props) {
  return (
    <>
      {/* <span className="agente-widget-title">AGENTE</span> */}
      {/* <div className="agente-widget-grid"> */}
        <Simulacao tamanho={jogo.tamanho} />
        {/* <LogWidget jogo={jogo} /> */}
      {/* </div> */}
    </>
  );
}
