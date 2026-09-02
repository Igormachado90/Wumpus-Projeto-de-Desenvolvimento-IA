// src/App.tsx
import { useState } from 'react';
import { useJogo } from './game/useJogo';
import { TelaInicial } from './components/TelaInicial';
import { Validacao } from './components/Validacao';

type Tela = 'inicial' | 'jogo' | 'validacao';

function App() {
  const jogo = useJogo();
  const [tela, setTela] = useState<Tela>('inicial');

  if (tela === 'validacao') {
    return <Validacao aoVoltar={() => setTela('inicial')} />;
  }

  // Passa a função de navegação para a TelaInicial
  return (
    <TelaInicial 
      jogo={jogo} 
      onNavegar={setTela}
    />
  );
}

export default App;