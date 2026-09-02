import { useEffect, useState } from 'react';
import type { JogoStore } from '../game/jogoStore';
import { JogoScreen } from './JogoScreen';
import { Validacao } from './Validacao';
import './TelaInicial.css';

type Tela = 'menu' | 'configuracoes' | 'transicao' | 'jogo' | 'validacao';
type Modo = 'humilde' | 'ia';

interface Props {
  jogo: JogoStore;
  onNavegar?: (tela: 'inicial' | 'jogo' | 'validacao') => void;
}

export function TelaInicial({ jogo }: Props) {
  const [tela, setTela] = useState<Tela>('menu');
  const [modo, setModo] = useState<Modo>('humilde');

  useEffect(() => {
    if (tela !== 'transicao') return;

    const timer = window.setTimeout(() => setTela('jogo'), 1900);
    return () => window.clearTimeout(timer);
  }, [tela]);

  function iniciar(novoModo: Modo) {
    setModo(novoModo);
    jogo.agenteSelecionado = novoModo === 'ia' ? 'v2' : 'v1';
    jogo.gerarAmbiente();
    setTela('transicao');
  }

  function alterarTamanho(tamanho: number) {
    jogo.tamanho = tamanho;
    jogo.gerarAmbiente();
  }

  if (tela === 'validacao') {
    return <Validacao aoVoltar={() => setTela('menu')} />;
  }

  if (tela === 'jogo') {
    return <JogoScreen jogo={jogo} aoVoltar={() => setTela('menu')} />;
  }

  if (tela === 'transicao') {
    return (
      <main className="tela-inicial tela-transicao">
        <div className="transicao-orbita" />
        <img className="tela-logo tela-logo-transicao" src="/images/logo.png" alt="Wumpus Exterminador" />
        <p className="transicao-kicker">INICIALIZANDO EXPEDIÇÃO</p>
        <h1>{modo === 'ia' ? 'Modo IA' : 'Modo Humilde'}</h1>
        <div className="transicao-loader" aria-label="Carregando" />
      </main>
    );
  }

  if (tela === 'configuracoes') {
    return (
      <main className="tela-inicial tela-configuracoes">
        <img className="tela-logo tela-logo-pequeno" src="/images/logo.png" alt="Wumpus Exterminador" />
        <section className="painel-inicial">
          <p className="eyebrow">PREPARAÇÃO DA EXPEDIÇÃO</p>
          <h1>Configurações</h1>
          <label className="config-label" htmlFor="tamanho-ambiente">Tamanho do ambiente</label>
          <div className="tamanho-opcoes" id="tamanho-ambiente">
            {[4, 5, 6, 7, 8, 10].map((tamanho) => (
              <button
                key={tamanho}
                className={`tamanho-btn${jogo.tamanho === tamanho ? ' selecionado' : ''}`}
                onClick={() => alterarTamanho(tamanho)}
              >
                {tamanho} x {tamanho}
              </button>
            ))}
          </div>
          <button className="botao-inicial botao-principal" onClick={() => setTela('menu')}>Concluir</button>
          <button className="botao-link" onClick={() => setTela('menu')}>Voltar ao menu</button>
        </section>
      </main>
    );
  }

  return (
    <main className="tela-inicial tela-menu">
      <div className="menu-brilho" />
      <img className="tela-logo" src="/images/logo.png" alt="Wumpus Exterminador do Futuro" />
      <section className="menu-acoes" aria-label="Menu principal">
        <p className="eyebrow">ESCOLHA SUA EXPEDIÇÃO</p>
        <button className="botao-inicial botao-principal" onClick={() => iniciar('humilde')}>Modo Humilde</button>
        <button className="botao-inicial botao-secundario" onClick={() => iniciar('ia')}>Modo IA</button>
        <button className="botao-link" onClick={() => setTela('configuracoes')}>Configurações</button>
        <button className="botao-link" onClick={() => setTela('validacao')}>Etapa 5 · Validação e Resultados</button>
      </section>
      <span className="menu-versao">SISTEMA 01.04 // SETOR W-06</span>
    </main>
  );
}
