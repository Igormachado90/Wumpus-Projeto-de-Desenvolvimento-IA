import { useState } from 'react';
import { Ambiente } from '../game/ambiente';
import { Gerador } from '../game/gerador';
import { AgenteReativoV1 } from '../game/agentes/agenteReativoV1';
import { AgenteReativoV2 } from '../game/agentes/agenteReativoV2';
import { AgenteAprendizagemV3 } from '../game/agentes/agenteAprendizagemV3';
import type { ResultadoSimulacao } from '../game/agentes/agenteReativoV1';
import './Simulacao.css';

type Versao = 'v1' | 'v2' | 'v3';

interface Props {
  tamanho: number;
}

export function Simulacao({ tamanho }: Props) {
  const [versao, setVersao] = useState<Versao>('v2');
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);

  const rodar = () => {
    setRodando(true);
    // setTimeout permite que o spinner apareça antes do trabalho síncrono pesado.
    setTimeout(() => {
      const ambiente = new Ambiente(tamanho);
      const gerador = new Gerador();
      const pocos = Math.min(Math.max(Math.trunc(tamanho * tamanho * 0.15), 1), tamanho * tamanho - 3);
      gerador.gerar(ambiente, { pocos, wumpus: 1, ouro: 1 });

      let res: ResultadoSimulacao;
      if (versao === 'v1') {
        res = new AgenteReativoV1().agir(ambiente);
      } else if (versao === 'v2') {
        res = new AgenteReativoV2().agir(ambiente);
      } else {
        res = new AgenteAprendizagemV3().agir(ambiente);
      }

      setResultado(res);
      setRodando(false);
    }, 30);
  };

  return (
    <div className="simulacao">
      <div className="simulacao-header">
        <span className="simulacao-title">🔬 LABORATÓRIO DE SIMULAÇÃO</span>
        <p className="simulacao-desc">
          Executa a simulação completa e independente de cada agente (com toda a lógica original
          de memória, inferência e Algoritmo Genético), do início ao fim, e mostra o log gerado.
        </p>
      </div>

      <div className="simulacao-controls">
        <div className="simulacao-versoes">
          {(['v1', 'v2', 'v3'] as Versao[]).map((v) => (
            <button
              key={v}
              className={`simulacao-versao-btn${versao === v ? ' ativo' : ''}`}
              onClick={() => setVersao(v)}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="simulacao-run-btn" onClick={rodar} disabled={rodando}>
          {rodando ? '⏳ Executando...' : '▶ Rodar Simulação'}
        </button>
      </div>

      {resultado && (
        <div className="simulacao-resultado">
          <div className="simulacao-stats">
            <span>
              Resultado:{' '}
              <strong style={{ color: resultado.venceu ? 'var(--success)' : 'var(--danger)' }}>
                {resultado.venceu ? 'VITÓRIA' : resultado.vivo ? 'PAROU' : 'MORREU'}
              </strong>
            </span>
            <span>
              Pontuação: <strong>{resultado.pontuacao}</strong>
            </span>
            <span>
              Passos: <strong>{resultado.passos}</strong>
            </span>
          </div>
          <div className="simulacao-log">
            {resultado.log.map((linha, idx) => (
              <p key={idx}>{linha}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}