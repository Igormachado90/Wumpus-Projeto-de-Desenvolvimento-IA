import { rodarValidacao, CONFIG_OFICIAL } from '../game/validacao';
import * as fs from 'fs';

async function main() {
  const i = 1; // Número do arquivo de saída
  const inicio = Date.now();
  const resultado = await rodarValidacao(
    CONFIG_OFICIAL,
    (feito, total, rotulo) => {
      if (feito % 10 === 0 || feito === total) {
        process.stderr.write(`\r${feito}/${total} - ${rotulo}          `);
      }
    }
  );
  process.stderr.write('\n');
  console.error(`Tempo total: ${((Date.now() - inicio) / 1000).toFixed(1)}s`);

  const linhas = ['tamanho,versao,execucao,resultado,pegou_ouro,pontuacao,passos,fitness_melhor_final,fitness_medio_final'];
  for (const e of resultado.execucoes) {
    const resultadoStr = e.venceu ? 'venceu' : (e.vivo ? 'parou' : 'morreu');
    linhas.push([
      e.tamanho,
      e.versao,
      e.execucao,
      resultadoStr,
      e.pegouOuro ? 1 : 0,
      e.pontuacao,
      e.passos,
      e.fitnessMelhorFinal ?? '',
      e.fitnessMedioFinal ?? '',
    ].join(','));
  }
  fs.writeFileSync('scripts/dados/validacao.' + (i + 1) + '.csv', linhas.join('\n'));
  console.error('CSV salvo em scripts/dados/validacao.' + (i + 1) + '.csv');
}

main();