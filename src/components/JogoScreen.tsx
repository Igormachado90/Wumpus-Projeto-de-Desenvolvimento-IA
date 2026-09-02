import { useEffect, useState } from 'react';
import type { JogoStore } from '../game/jogoStore';
import { useWindowWidth } from '../hooks/useWindowWidth';
import { Header } from './Header';
import { MapaWidget } from './MapaWidget';
import { MapaImagem } from './MapaImagem';
import { StatusWidget } from './StatusWidget';
import { PainelControle } from './PainelControle';
import { LogWidget } from './LogWidget';
import { AgenteWidget } from './AgenteWidget';
import './JogoScreen.css';

const TECLAS: Record<string, string> = {
  w: 'norte',
  s: 'sul',
  d: 'leste',
  a: 'oeste',
  g: 'pegar',
  t: 'atirar',
};

interface JogoScreenProps {
  jogo: JogoStore;
  aoVoltar: () => void;
}

export function JogoScreen({ jogo, aoVoltar }: JogoScreenProps) {
  const width = useWindowWidth();
  const isDesktop = width > 900;
  const [direcaoAtual, setDirecaoAtual] = useState<'norte' | 'sul' | 'leste' | 'oeste'>('norte');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const acao = TECLAS[e.key.toLowerCase()];
      if (acao) {
        e.preventDefault();
        jogo.executarAcaoUsuario(acao);
        // Atualizar direção se for uma ação de movimento
        if (['norte', 'sul', 'leste', 'oeste'].includes(acao)) {
          setDirecaoAtual(acao as 'norte' | 'sul' | 'leste' | 'oeste');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [jogo]);

  const handleDirecaoChange = (direcao: 'norte' | 'sul' | 'leste' | 'oeste') => {
    setDirecaoAtual(direcao);
  };

  return (
    <div className="jogo-screen">
      <div className="jogo-screen-inner">
        {isDesktop ? (
          <DesktopLayout jogo={jogo} direcaoAtual={direcaoAtual} onDirecaoChange={handleDirecaoChange} aoVoltar={aoVoltar} />
        ) : (
          <MobileLayout jogo={jogo} direcaoAtual={direcaoAtual} onDirecaoChange={handleDirecaoChange} aoVoltar={aoVoltar} />
        )}
      </div>
    </div>
  );
}

function DesktopLayout({
  jogo,
  direcaoAtual,
  onDirecaoChange,
  aoVoltar,
}: {
  jogo: JogoStore;
  direcaoAtual: 'norte' | 'sul' | 'leste' | 'oeste';
  onDirecaoChange: (direcao: 'norte' | 'sul' | 'leste' | 'oeste') => void;
  aoVoltar: () => void;
}) {
  return (
    <div className="desktop-layout">
      <Header aoVoltar={aoVoltar} jogo={jogo} />

      <div className="desktop">
        <div className='desktop-left'>
          <div className='desktop-top'>
            <div className="desktop-top-left">
              <div className="desktop-agente">
                <AgenteWidget jogo={jogo} />
              </div>
            </div>
            <MapaWidget jogo={jogo} direcaoAtual={direcaoAtual} />
          </div>

          <div className="desktop-mapa-imagem-botton">
            <LogWidget jogo={jogo} />
            <MapaImagem jogo={jogo} />
          </div>
        </div>

        {/* <div className='desktop-right'> */}
        <div className="desktop-side">
          <StatusWidget jogo={jogo} />

          <div className="desktop-painel">
            <PainelControle jogo={jogo} onDirecaoChange={onDirecaoChange} />
          </div>
        </div>
        {/* </div> */}
      </div>
    </div>
  );
}

function MobileLayout({
  jogo,
  direcaoAtual,
  onDirecaoChange,
  aoVoltar,
}: {
  jogo: JogoStore;
  direcaoAtual: 'norte' | 'sul' | 'leste' | 'oeste';
  onDirecaoChange: (direcao: 'norte' | 'sul' | 'leste' | 'oeste') => void;
  aoVoltar: () => void;
}) {
  return (
    <div className="mobile-layout">
      <Header aoVoltar={aoVoltar} jogo={jogo} />
      <MapaWidget jogo={jogo} direcaoAtual={direcaoAtual} />
      <StatusWidget jogo={jogo} />
      <PainelControle jogo={jogo} onDirecaoChange={onDirecaoChange} />
      <div className="mobile-log">
        <LogWidget jogo={jogo} />
      </div>
      <AgenteWidget jogo={jogo} />
    </div>
  );
}
