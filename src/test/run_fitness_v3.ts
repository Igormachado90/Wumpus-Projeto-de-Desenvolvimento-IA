import { AgenteAprendizagemV3 } from '../../src/game/agentes/agenteAprendizagemV3';
import { gerarAmbienteFixo } from '../../src/game/validacao';
import * as fs from 'fs';

const TAMANHOS = [4, 5, 10, 15, 20];
const EXECUCOES_POR_TAMANHO = 5;
const GERACOES = 1000;
const POPULACAO = 50;

async function main() {
    const linhas: string[] = ['tamanho,execucao,geracao,melhor,media,pior'];

    for (const tamanho of TAMANHOS) {
        for (let execucao = 1; execucao <= EXECUCOES_POR_TAMANHO; execucao++) {
            const ambiente = gerarAmbienteFixo(tamanho, tamanho * 100000 + execucao);
            ambiente.agentPosition = [0, 0];

            const agente = new AgenteAprendizagemV3();
            agente.tamanhoPopulacao = POPULACAO;
            agente.numeroGeracoes = GERACOES;
            agente.taxaCruzamento = 0.85;
            agente.taxaMutacao = 0.05;

            const t0 = Date.now();
            const resultado = agente.agir(ambiente);
            const melhor = resultado.estatisticasAG?.melhor || [];
            const media = resultado.estatisticasAG?.media || [];
            const pior = resultado.estatisticasAG?.pior || [];

            for (let g = 0; g < melhor.length; g++) {
                linhas.push([tamanho, execucao, g + 1, melhor[g], media[g] ?? '', pior[g] ?? ''].join(','));
            }

            process.stderr.write(`n=${tamanho} exec=${execucao} geracoes_efetivas=${melhor.length} tempo=${Date.now() - t0}ms melhor_final=${melhor.at(-1)} venceu=${resultado.venceu}\n`);
        }
    }

    fs.writeFileSync(`scripts/dados/fitness_v3_1.csv`, linhas.join('\n'));
    console.error('Salvo em scripts/dados/fitness_v3_1.csv');
}

main();