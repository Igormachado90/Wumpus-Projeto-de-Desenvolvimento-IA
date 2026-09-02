import { useRef, useSyncExternalStore } from 'react';
import { JogoStore } from './jogoStore';


export function useJogo(): JogoStore {
  const storeRef = useRef<JogoStore | null>(null);
  
  if (!storeRef.current) {
    storeRef.current = new JogoStore();
  }
  
  const store = storeRef.current;

  const getSnapshot = () => {
    return JSON.stringify({
      log: store.log.length,
      linha: store.linha,
      coluna: store.coluna,
      pontuacao: store.pontuacao,
      vivo: store.vivo,
      venceu: store.venceu,
      executando: store.executando,
      autoMode: store.autoMode,
      agente: store.agenteSelecionado,
      temOuro: store.temOuro,
      temFlecha: store.temFlecha,
      matouWumpus: store.matouWumpus,
      passos: store.passos,
      vitorias: store.vitorias,
      partidas: store.partidas,
    });
  };

  useSyncExternalStore(store.subscribe, getSnapshot);

  return store;
}

export function useJogoStore(): JogoStore {
  const storeRef = useRef<JogoStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new JogoStore();
  }
  return storeRef.current;
}