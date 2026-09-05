import { useMemo, useRef, useState } from 'react';
import {
  CONFIG_OFICIAL,
  CONFIG_RAPIDA,
  curvaMediaV3PorTamanho,
  exportarCSV,
  exportarCSVFitness,
  resumirPorVersaoETamanho,
  rodarValidacao,
  type ConfigValidacao,
  type ResultadoValidacao,
  type VersaoAgente,
} from '../game/validacao';
import './Validacao.css';

interface Props {
  aoVoltar: () => void;
}

const CORES: Record<VersaoAgente, string> = {
  v1: '#8888aa',
  v2: '#00d4ff',
  v3: '#ffd700',
};

const NOMES: Record<VersaoAgente, string> = {
  v1: 'V1 · Reativo Simples',
  v2: 'V2 · Reativo com Memória',
  v3: 'V3 · Algoritmo Genético',
};

/** Estimativa grosseira de tempo (baseada em bench manual) só para orientar o usuário. */
function estimarSegundos(config: ConfigValidacao): number {
  const custoPorTamanho: Record<number, number> = { 4: 1.3, 5: 1.7, 10: 5.3, 15: 11.6, 20: 28.5 };
  let total = 0;
  for (const n of config.tamanhos) {
    const base = custoPorTamanho[n] ?? (n * n * 0.07);
    const fatorPop = config.populacaoAG / 50;
    const fatorGer = config.geracoesAG / 1000;
    total += base * fatorPop * fatorGer * config.execucoes;
  }
  return Math.round(total);
}

function formatarSegundos(s: number): string {
  if (s < 60) return `${s}s`;
  const min = Math.floor(s / 60);
  const seg = s % 60;
  return `${min}min ${seg}s`;
}

export function Validacao({ aoVoltar }: Props) {
  const [modo, setModo] = useState<'rapida' | 'oficial'>('rapida');
  const config = modo === 'rapida' ? CONFIG_RAPIDA : CONFIG_OFICIAL;

  const [rodando, setRodando] = useState(false);
  const [progresso, setProgresso] = useState({ feito: 0, total: 0, rotulo: '' });
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<number | null>(null);
  const canceladoRef = useRef(false);

  const resumo = useMemo(
    () => (resultado ? resumirPorVersaoETamanho(resultado.execucoes) : []),
    [resultado]
  );

  const tamanhos = resultado?.config.tamanhos ?? [];
  const tamanhoAtual = tamanhoSelecionado ?? tamanhos[0] ?? null;

  const curvaV3 = useMemo(
    () => (resultado && tamanhoAtual != null ? curvaMediaV3PorTamanho(resultado.curvasV3, tamanhoAtual) : []),
    [resultado, tamanhoAtual]
  );

  async function rodar() {
    setRodando(true);
    setResultado(null);
    canceladoRef.current = false;
    setProgresso({ feito: 0, total: config.tamanhos.length * config.execucoes * 3, rotulo: 'Iniciando...' });

    const res = await rodarValidacao(
      config,
      (feito, total, rotulo) => setProgresso({ feito, total, rotulo }),
      () => canceladoRef.current
    );

    setResultado(res);
    // setTamanhoSelecionado(res.config.tamanhos[0] ?? null);
    setRodando(false);
  }

  function cancelar() {
    canceladoRef.current = true;
  }

  function baixarCSV() {
    if (!resultado) return;
    const csv = exportarCSV(resultado.execucoes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validacao${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function baixarCSVFitness() {
    if (!resultado) return;
    const csv = exportarCSVFitness(resultado.curvasV3);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-medio${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="validacao-tela">
      <header className="validacao-header">
        <div>
          <p className="eyebrow">ETAPA 5</p>
          <h1>Validação e Resultados</h1>
        </div>
        <button className="botao-link" onClick={aoVoltar}> Voltar ao menu</button>
      </header>

      <section className="validacao-config painel">
        <h2>Configuração do experimento</h2>
        <div className="validacao-modos">
          <button
            className={`modo-btn${modo === 'rapida' ? ' ativo' : ''}`}
            onClick={() => setModo('rapida')}
            disabled={rodando}
          >
            Modo rápido (demo)
          </button>
          <button
            className={`modo-btn${modo === 'oficial' ? ' ativo' : ''}`}
            onClick={() => setModo('oficial')}
            disabled={rodando}
          >
            Parâmetros oficiais do enunciado
          </button>
        </div>

        <dl className="validacao-parametros">
          <div><dt>Tamanhos (n)</dt><dd>{config.tamanhos.join(', ')}</dd></div>
          <div><dt>Execuções por versão/tamanho</dt><dd>{config.execucoes}</dd></div>
          <div><dt>População (AG)</dt><dd>{config.populacaoAG}</dd></div>
          <div><dt>Gerações (AG)</dt><dd>{config.geracoesAG}</dd></div>
          <div><dt>Cruzamento / Mutação</dt><dd>{config.taxaCruzamentoAG * 100}% / {config.taxaMutacaoAG * 100}%</dd></div>
          <div><dt>Tempo estimado</dt><dd>~{formatarSegundos(estimarSegundos(config))}</dd></div>
        </dl>

        {modo === 'oficial' && (
          <p className="validacao-aviso">
            Os parâmetros oficiais (n até 20, 30 execuções, 1000 gerações) podem levar bastante tempo
            rodando no navegador — mantenha esta aba em primeiro plano durante a execução.
          </p>
        )}

        {!rodando ? (
          <button className="botao-inicial botao-principal" onClick={rodar}>
            Rodar validação
          </button>
        ) : (
          <div className="validacao-progresso">
            <div className="barra-progresso">
              <div
                className="barra-progresso-fill"
                style={{ width: `${progresso.total ? (100 * progresso.feito) / progresso.total : 0}%` }}
              />
            </div>
            <p className="validacao-progresso-texto">{progresso.rotulo} ({progresso.feito}/{progresso.total})</p>
            <button className="botao-link" onClick={cancelar}>Cancelar</button>
          </div>
        )}
      </section>

      {resultado && (
        <>
          <section className="validacao-resumo painel">
            <div className="validacao-resumo-header">
              <h2>Comportamento médio por versão e tamanho</h2>
              <button className="botao-link" onClick={baixarCSV}>Exportar CSV (todas as execuções)</button>
            </div>
            <div className="tabela-scroll">
              <table className="tabela-validacao">
                <thead>
                  <tr>
                    <th>n</th>
                    <th>Versão</th>
                    <th>Execuções</th>
                    <th>Vitórias</th>
                    <th>Mortes</th>
                    <th>Parou</th>
                    <th>Taxa de vitória</th>
                    <th>Pontuação média</th>
                    <th>Desvio padrão</th>
                    <th>Passos médios</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.map((r) => (
                    <tr key={`${r.tamanho}-${r.versao}`}>
                      <td>{r.tamanho}</td>
                      <td><span className="pill" style={{ borderColor: CORES[r.versao], color: CORES[r.versao] }}>{NOMES[r.versao]}</span></td>
                      <td>{r.execucoes}</td>
                      <td>{r.vitorias}</td>
                      <td>{r.mortes}</td>
                      <td>{r.parou}</td>
                      <td>{(r.taxaVitoria * 100).toFixed(0)}%</td>
                      <td>{r.pontuacaoMedia.toFixed(1)}</td>
                      <td>{r.pontuacaoDesvio.toFixed(1)}</td>
                      <td>{r.passosMedio.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="validacao-graficos painel">
            <h2>Pontuação por versão e tamanho (média ± desvio padrão)</h2>
            <p className="validacao-legenda-texto">
              A caixa mostra a faixa <strong>média ± desvio padrão</strong>; a linha central é a média.
              Os traços nas pontas marcam o mínimo e o máximo observados nas execuções.
            </p>
            <GraficoBoxplot resumo={resumo} />
          </section>

          <section className="validacao-graficos painel">
            <h2>Evolução por tamanho de ambiente (uma linha por versão)</h2>
            <div className="grade-linhas">
              <div>
                <h3 className="subtitulo-grafico">Pontuação média</h3>
                <GraficoLinhaMetrica resumo={resumo} acessor={(r) => r.pontuacaoMedia} formato={(v) => v.toFixed(0)} />
              </div>
              <div>
                <h3 className="subtitulo-grafico">Taxa de vitória</h3>
                <GraficoLinhaMetrica resumo={resumo} acessor={(r) => r.taxaVitoria * 100} formato={(v) => `${v.toFixed(0)}%`} sufixo="%" />
              </div>
              <div>
                <h3 className="subtitulo-grafico">Taxa de ouro pego</h3>
                <GraficoLinhaMetrica resumo={resumo} acessor={(r) => r.taxaOuro * 100} formato={(v) => `${v.toFixed(0)}%`} sufixo="%" />
              </div>
            </div>
          </section>

          <section className="validacao-graficos painel">
            <div className="validacao-resumo-header">
              <h2>V3 — Evolução do fitness por geração (médio das execuções)</h2>
              <button className="botao-link" onClick={baixarCSVFitness}>Exportar CSV (fitness médio das execuções)</button>
              <div className="tamanho-tabs">
                {tamanhos.map((t) => (
                  <button
                    key={t}
                    className={`tamanho-tab${t === tamanhoAtual ? ' ativo' : ''}`}
                    onClick={() => setTamanhoSelecionado(t)}
                  >
                    n={t}
                  </button>
                ))}
              </div>
            </div>
            <GraficoLinhaGeracoes dados={curvaV3} />
          </section>
        </>
      )}
    </main>
  );
}

function GraficoBoxplot({ resumo }: { resumo: ReturnType<typeof resumirPorVersaoETamanho> }) {
  const tamanhos = Array.from(new Set(resumo.map((r) => r.tamanho))).sort((a, b) => a - b);
  const versoes: VersaoAgente[] = ['v1', 'v2', 'v3'];
  const largura = 680;
  const altura = 300;
  const margemEsq = 56;
  const margemBaixo = 30;
  const larguraUtil = largura - margemEsq - 20;
  const alturaUtil = altura - margemBaixo - 20;
  const grupoLargura = larguraUtil / tamanhos.length;

  const todos = resumo.flatMap((r) => [r.pontuacaoMin, r.pontuacaoMax, r.pontuacaoMedia - r.pontuacaoDesvio, r.pontuacaoMedia + r.pontuacaoDesvio]);
  const minY = Math.min(...todos, 0);
  const maxY = Math.max(...todos, 0);
  const rangeY = maxY - minY || 1;
  const yEsc = (v: number) => 20 + alturaUtil * (1 - (v - minY) / rangeY);

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} className="grafico-svg" role="img" aria-label="Boxplot de pontuação por versão e tamanho">
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = 20 + alturaUtil * (1 - frac);
        const valor = minY + rangeY * frac;
        return (
          <g key={frac}>
            <line x1={margemEsq} x2={largura - 20} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
            <text x={margemEsq - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{valor.toFixed(0)}</text>
          </g>
        );
      })}
      <line x1={margemEsq} x2={largura - 20} y1={yEsc(0)} y2={yEsc(0)} stroke="rgba(255,255,255,0.2)" strokeDasharray="3,3" />

      {tamanhos.map((tamanho, i) => {
        const grupoX = margemEsq + i * grupoLargura;
        const boxLargura = (grupoLargura * 0.7) / versoes.length;
        return (
          <g key={tamanho}>
            {versoes.map((v, vi) => {
              const item = resumo.find((r) => r.tamanho === tamanho && r.versao === v);
              if (!item) return null;
              const x = grupoX + grupoLargura * 0.15 + vi * boxLargura;
              const cx = x + (boxLargura - 4) / 2;
              const yMin = yEsc(item.pontuacaoMin);
              const yMax = yEsc(item.pontuacaoMax);
              const yTopo = yEsc(item.pontuacaoMedia + item.pontuacaoDesvio);
              const yBase = yEsc(item.pontuacaoMedia - item.pontuacaoDesvio);
              const yMedia = yEsc(item.pontuacaoMedia);
              return (
                <g key={v}>
                  <line x1={cx} x2={cx} y1={yMin} y2={yMax} stroke={CORES[v]} strokeWidth={1} opacity={0.6} />
                  <line x1={x} x2={x + boxLargura - 4} y1={yMin} y2={yMin} stroke={CORES[v]} strokeWidth={1} opacity={0.6} />
                  <line x1={x} x2={x + boxLargura - 4} y1={yMax} y2={yMax} stroke={CORES[v]} strokeWidth={1} opacity={0.6} />
                  <rect x={x} y={Math.min(yTopo, yBase)} width={boxLargura - 4} height={Math.max(Math.abs(yBase - yTopo), 1)} fill={CORES[v]} opacity={0.28} stroke={CORES[v]} strokeWidth={1.2} />
                  <line x1={x} x2={x + boxLargura - 4} y1={yMedia} y2={yMedia} stroke={CORES[v]} strokeWidth={2} />
                  <title>{`${NOMES[v]} · n=${tamanho}: média ${item.pontuacaoMedia.toFixed(1)} ± ${item.pontuacaoDesvio.toFixed(1)} (min ${item.pontuacaoMin}, max ${item.pontuacaoMax})`}</title>
                </g>
              );
            })}
            <text x={grupoX + grupoLargura / 2} y={altura - 10} textAnchor="middle" fontSize="11" fill="var(--text)">n={tamanho}</text>
          </g>
        );
      })}
      <g transform={`translate(${margemEsq}, 6)`}>
        {versoes.map((v, i) => (
          <g key={v} transform={`translate(${i * 150}, 0)`}>
            <rect width="10" height="10" fill={CORES[v]} opacity={0.5} rx={2} />
            <text x="14" y="9" fontSize="10" fill="var(--text)">{NOMES[v]}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function GraficoLinhaMetrica({
  resumo,
  acessor,
  formato,
  sufixo,
}: {
  resumo: ReturnType<typeof resumirPorVersaoETamanho>;
  acessor: (r: ReturnType<typeof resumirPorVersaoETamanho>[number]) => number;
  formato: (v: number) => string;
  sufixo?: string;
}) {
  const tamanhos = Array.from(new Set(resumo.map((r) => r.tamanho))).sort((a, b) => a - b);
  const versoes: VersaoAgente[] = ['v1', 'v2', 'v3'];
  const largura = 640;
  const altura = 220;
  const margem = { top: 16, right: 16, bottom: 26, left: 44 };
  const margemEsq = 56;
  const larguraUtil = largura - margem.left - margem.right;
  const alturaUtil = altura - margem.top - margem.bottom;

  const valores = versoes.flatMap((v) =>
    tamanhos.map((t) => {
      const item = resumo.find((r) => r.tamanho === t && r.versao === v);
      return item ? acessor(item) : 0;
    })
  );
  const minY = sufixo === '%' ? 0 : Math.min(...valores, 0);
  const maxY = sufixo === '%' ? 100 : Math.max(...valores, 0);
  const rangeY = maxY - minY || 1;

  const xEsc = (i: number) => margem.left + (tamanhos.length > 1 ? (i / (tamanhos.length - 1)) * larguraUtil : larguraUtil / 2);
  const yEsc = (v: number) => margem.top + alturaUtil * (1 - (v - minY) / rangeY);

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} className="grafico-svg" role="img" aria-label="Gráfico de linha por versão">
      {/* Linhas de grade horizontais */}
      {[0, 0.5, 1].map((frac) => {
        const y = margem.top + alturaUtil * (1 - frac);
        const valor = minY + rangeY * frac;
        return (
          <g key={frac}>
            <line x1={margem.left} x2={largura - margem.right} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
            <text x={margem.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{formato(valor)}</text>
          </g>
        );
      })}

      {/* Linhas e pontos para cada versão */}
      {versoes.map((v) => {
        const pontos = tamanhos.map((t, idx) => {
          const item = resumo.find((r) => r.tamanho === t && r.versao === v);
          const valor = item ? acessor(item) : 0;
          return { x: xEsc(idx), y: yEsc(valor), valor };
        });

        const caminho = pontos.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
          <g key={v}>
            {/* Linha do gráfico */}
            <path d={caminho} fill="none" stroke={CORES[v]} strokeWidth={2} />

            {/* Pontos com tooltip */}
            {pontos.map((p, idx) => (
              <circle key={idx} cx={p.x} cy={p.y} r={4} fill={CORES[v]}>
                <title>{`${NOMES[v]} · n=${tamanhos[idx]}: ${formato(p.valor)}`}</title>
              </circle>
            ))}

            <g transform={`translate(${margemEsq}, 2)`}>
              {versoes.map((v, i) => (
                <g key={v} transform={`translate(${i * 150}, 0)`}>
                  <rect width="10" height="10" fill={CORES[v]} opacity={0.5} rx={2} />
                  <text x="14" y="9" fontSize="10" fill="var(--text)">{NOMES[v]}</text>
                </g>
              ))}
            </g>
          </g>
        );
      })}

      {/* Rótulos do eixo X (tamanhos dos ambientes) */}
      {tamanhos.map((t, i) => (
        <text key={t} x={xEsc(i)} y={altura - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">n={t}</text>
      ))}
    </svg>
  );
}

function GraficoLinhaGeracoes({ dados, compacto = false, }: {
  dados: { geracao: number; melhor: number; pior: number; media: number }[];
  compacto?: boolean;
}) {
  if (dados.length === 0) {
    return <p className="validacao-vazio">Sem dados para este tamanho.</p>;
  }

  const largura = 640;
  const altura = 280;
  const margem = compacto
    ? { top: 10, right: 10, bottom: 20, left: 36 }
    : { top: 20, right: 20, bottom: 30, left: 44 };
  const larguraUtil = largura - margem.left - margem.right;
  const alturaUtil = altura - margem.top - margem.bottom;

  const todosValores = dados.flatMap((d) => [d.melhor, d.pior, d.media]);
  const minY = Math.min(...todosValores);
  const maxY = Math.max(...todosValores);
  const rangeY = maxY - minY || 1;

  const xEsc = (g: number) => margem.left + (g / Math.max(dados.length - 1, 1)) * larguraUtil;
  const yEsc = (v: number) => margem.top + alturaUtil * (1 - (v - minY) / rangeY);

  function caminho(chave: 'melhor' | 'pior' | 'media') {
    return dados.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xEsc(d.geracao)} ${yEsc(d[chave])}`).join(' ');
  }

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} className="grafico-svg" role="img" aria-label="Evolução do fitness por geração">
      {[0, 0.5, 1].map((frac) => {
        const y = margem.top + alturaUtil * (1 - frac);
        const valor = minY + rangeY * frac;
        return (
          <g key={frac}>
            <line x1={margem.left} x2={largura - margem.right} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
            <text x={margem.left - 6} y={y + 3} textAnchor="end" fontSize={compacto ? 8 : 10} fill="var(--muted)">
              {valor.toFixed(compacto ? 1 : 2)}
            </text>
          </g>
        );
      })}
      <path d={caminho('pior')} fill="none" stroke="#ff0040" strokeWidth={compacto ? 1 : 1.5} opacity={0.7} />
      <path d={caminho('media')} fill="none" stroke="#00d4ff" strokeWidth={compacto ? 1 : 1.5} opacity={0.9} />
      <path d={caminho('melhor')} fill="none" stroke="#ffd700" strokeWidth={compacto ? 1.5 : 2} />
      {!compacto && (
        <>
          <text x={largura - margem.right} y={altura - 6} textAnchor="end" fontSize="10" fill="var(--muted)">
            geração →
          </text>
          <g transform={`translate(${margem.left}, 6)`}>
            <g><rect width="10" height="10" fill="#ffd700" rx={2} /><text x="14" y="9" fontSize="10" fill="var(--text)">Melhor</text></g>
            <g transform="translate(90,0)"><rect width="10" height="10" fill="#00d4ff" rx={2} /><text x="14" y="9" fontSize="10" fill="var(--text)">Média</text></g>
            <g transform="translate(170,0)"><rect width="10" height="10" fill="#ff0040" rx={2} /><text x="14" y="9" fontSize="10" fill="var(--text)">Pior</text></g>
          </g>
        </>
      )}
    </svg>
  );
}
