#!/usr/bin/env python3
"""Gera gráficos a partir do CSV exportado pela validação do Mundo de Wumpus.

Uso:
    python gerar_graficos.py dados/validacao.csv --saida ../graficos
"""

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


# Cores para fundo branco
CORES_VERSAO = {"v1": "#6c757d", "v2": "#0d6efd", "v3": "#ffc107"}
NOMES_VERSAO = {"v1": "V1", "v2": "V2", "v3": "V3"}
ORDEM_VERSAO = ["v1", "v2", "v3"]

# Cores para os gráficos com fundo branco
CORES_GRAFICOS = {
    "v1": "#6c757d",      # Cinza
    "v2": "#0d6efd",      # Azul
    "v3": "#ffc107",      # Amarelo
    "vitoria": "#198754", # Verde
    "morte": "#dc3545",   # Vermelho
}


def carregar_resultado(caminho: Path) -> pd.DataFrame:
    """Carrega o CSV exportado pela validação."""
    
    if not caminho.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")
    
    # Tenta ler com diferentes separadores
    try:
        df = pd.read_csv(caminho, sep=',', encoding='utf-8')
    except:
        try:
            df = pd.read_csv(caminho, sep=';', encoding='utf-8')
        except:
            df = pd.read_csv(caminho, sep='\t', encoding='utf-8')
    
    print(f"Colunas encontradas: {list(df.columns)}")
    
    # Verifica colunas obrigatórias
    colunas_obrigatorias = {"tamanho", "versao", "execucao", "resultado", "pegou_ouro", "pontuacao", "passos"}
    ausentes = colunas_obrigatorias - set(df.columns)
    if ausentes:
        nomes = ", ".join(sorted(ausentes))
        raise ValueError(f'Campos ausentes no CSV: {nomes}')
    
    # Converte tipos
    df["tamanho"] = pd.to_numeric(df["tamanho"], errors="raise")
    df["execucao"] = pd.to_numeric(df["execucao"], errors="raise")
    df["pontuacao"] = pd.to_numeric(df["pontuacao"], errors="raise")
    df["passos"] = pd.to_numeric(df["passos"], errors="raise")
    df["pegou_ouro"] = df["pegou_ouro"].astype(bool)
    
    # Cria colunas derivadas
    df["venceu"] = df["resultado"] == "venceu"
    df["vivo"] = df["resultado"] != "morreu"
    df["pegouOuro"] = df["pegou_ouro"]
    df["versao"] = df["versao"].astype(str).str.lower()
    
    # Filtra apenas versões válidas
    df = df[df["versao"].isin(ORDEM_VERSAO)].copy()
    
    if df.empty:
        raise ValueError('Nenhuma execução com as versões: "v1", "v2" ou "v3".')
    
    return df


def preparar_estilo() -> None:
    """Configura estilo para fundo branco."""
    plt.rcParams.update({
        "figure.dpi": 120,
        "savefig.bbox": "tight",
        "savefig.facecolor": "white",
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "axes.edgecolor": "#cccccc",
        "axes.labelcolor": "#333333",
        "text.color": "#333333",
        "xtick.color": "#666666",
        "ytick.color": "#666666",
        "grid.color": "#eeeeee",
        "grid.linestyle": "--",
        "grid.alpha": 0.7,
        "font.size": 10,
        "legend.frameon": True,
        "legend.facecolor": "white",
        "legend.edgecolor": "#dddddd",
        "legend.framealpha": 1,
    })
    sns.set_style("whitegrid", {
        "grid.color": "#eeeeee",
        "grid.linestyle": "--",
        "grid.alpha": 0.7,
    })


def salvar(figura: plt.Figure, pasta: Path, nome: str) -> None:
    figura.savefig(pasta / nome, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close(figura)


def grafico_boxplot(dados: pd.DataFrame, pasta: Path) -> None:
    """Gráfico 1: Boxplot de pontuação."""
    
    figura, eixo = plt.subplots(figsize=(12, 6))
    
    sns.boxplot(
        data=dados,
        x="tamanho",
        y="pontuacao",
        hue="versao",
        hue_order=ORDEM_VERSAO,
        palette=CORES_VERSAO,
        order=sorted(dados["tamanho"].unique()),
        ax=eixo,
    )
    
    eixo.set_title("📊 Pontuação por versão e tamanho do ambiente", fontsize=14, fontweight="bold")
    eixo.set_xlabel("Tamanho do mundo (n)", fontsize=12)
    eixo.set_ylabel("Pontuação", fontsize=12)
    eixo.legend(title="Versão", loc="upper left")
    eixo.grid(axis='y', alpha=0.3)
    
    salvar(figura, pasta, "01_boxplot_pontuacao.png")


def grafico_linhas(dados: pd.DataFrame, pasta: Path) -> None:
    """Gráfico 2: Linhas de métricas."""
    
    resumo = (
        dados.groupby(["tamanho", "versao"], as_index=False)
        .agg({
            "pontuacao": "mean",
            "venceu": "mean",
            "pegouOuro": "mean"
        })
        .rename(columns={
            "pontuacao": "pontuacao_media",
            "venceu": "taxa_vitoria",
            "pegouOuro": "taxa_ouro"
        })
    )
    resumo = resumo.sort_values("tamanho")
    
    figura, eixos = plt.subplots(3, 1, figsize=(11, 12), sharex=True)
    
    metricas = [
        ("pontuacao_media", "⭐ Pontuação média", "Pontuação"),
        ("taxa_vitoria", "🏆 Taxa de vitória", "Percentual (%)"),
        ("taxa_ouro", "💰 Taxa de ouro pego", "Percentual (%)"),
    ]
    
    for eixo, (coluna, titulo, ylabel) in zip(eixos, metricas):
        for versao in ORDEM_VERSAO:
            serie = resumo[resumo["versao"] == versao]
            valores = serie[coluna] * 100 if coluna != "pontuacao_media" else serie[coluna]
            eixo.plot(
                serie["tamanho"],
                valores,
                marker="o",
                markersize=8,
                linewidth=2.5,
                label=NOMES_VERSAO[versao],
                color=CORES_VERSAO[versao]
            )
        
        eixo.set_title(titulo, fontsize=12, fontweight="bold")
        eixo.set_ylabel(ylabel, fontsize=11)
        
        if coluna != "pontuacao_media":
            eixo.set_ylim(0, 105)
            eixo.set_yticks(np.arange(0, 101, 20))
            eixo.set_yticklabels([f"{int(x)}%" for x in np.arange(0, 101, 20)])
        
        eixo.legend(loc="lower right")
        eixo.grid(alpha=0.3)
    
    eixos[-1].set_xlabel("Tamanho do mundo (n)", fontsize=12)
    figura.suptitle("📈 Métricas médias por tamanho do ambiente", y=1.01, fontsize=14, fontweight="bold")
    figura.tight_layout()
    
    salvar(figura, pasta, "02_linhas_metricas.png")


def grafico_heatmap(dados: pd.DataFrame, pasta: Path) -> None:
    """Gráfico 3: Heatmap de pontuação."""
    
    tabela = dados.pivot_table(
        index="tamanho",
        columns="versao",
        values="pontuacao",
        aggfunc="mean"
    )
    tabela = tabela.reindex(columns=ORDEM_VERSAO).rename(columns=NOMES_VERSAO)
    
    figura, eixo = plt.subplots(figsize=(10, 6))
    
    sns.heatmap(
        tabela,
        annot=True,
        fmt=".1f",
        cmap="YlGnBu",
        linewidths=0.5,
        ax=eixo,
        cbar_kws={'label': 'Pontuação Média'},
        square=True,
    )
    
    eixo.set_title("📊 Pontuação média por tamanho e versão", fontsize=14, fontweight="bold")
    eixo.set_xlabel("Versão do Agente", fontsize=12)
    eixo.set_ylabel("Tamanho do ambiente (n)", fontsize=12)
    
    salvar(figura, pasta, "03_heatmap_pontuacao.png")


def grafico_barras(dados: pd.DataFrame, pasta: Path) -> None:
    """Gráfico 4: Barras de vitórias vs mortes."""
    
    resumo = dados.groupby("versao").agg({
        "venceu": "mean",
        "vivo": lambda x: 1 - x.mean()
    })
    resumo = resumo.reindex(ORDEM_VERSAO) * 100
    resumo.columns = ["Vitórias", "Mortes"]
    
    figura, eixo = plt.subplots(figsize=(9, 6))
    
    resumo.plot.bar(
        ax=eixo,
        color={"Vitórias": CORES_GRAFICOS["vitoria"], "Mortes": CORES_GRAFICOS["morte"]},
        edgecolor="white",
        linewidth=1.5,
        width=0.6,
    )
    
    eixo.set_title("🏆 Vitórias vs 💀 Mortes por versão", fontsize=14, fontweight="bold")
    eixo.set_xlabel("Versão do Agente", fontsize=12)
    eixo.set_ylabel("Percentual (%)", fontsize=12)
    eixo.set_xticklabels([NOMES_VERSAO[v] for v in ORDEM_VERSAO], rotation=0)
    eixo.set_ylim(0, 100)
    eixo.legend(title="Resultado", loc="upper right")
    eixo.grid(axis='y', alpha=0.3)
    
    for container in eixo.containers:
        eixo.bar_label(container, fmt='%.0f%%', fontsize=11, fontweight="bold")
    
    salvar(figura, pasta, "04_barras_vitorias_mortes.png")


def grafico_barras_agrupadas(dados: pd.DataFrame, pasta: Path) -> None:
    """Gráfico 6: Barras agrupadas por tamanho."""
    
    resumo = (
        dados.groupby(["tamanho", "versao"], as_index=False)
        .agg({
            "pontuacao": "mean",
            "venceu": "mean"
        })
        .rename(columns={"pontuacao": "pontuacao_media", "venceu": "taxa_vitoria"})
    )
    
    tamanhos = sorted(resumo["tamanho"].unique())
    x = np.arange(len(tamanhos))
    width = 0.25
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    # Gráfico 1: Pontuação média
    for i, versao in enumerate(ORDEM_VERSAO):
        dados_v = resumo[resumo["versao"] == versao].sort_values("tamanho")
        offset = (i - 1) * width
        ax1.bar(x + offset, dados_v["pontuacao_media"], width, 
                label=NOMES_VERSAO[versao], color=CORES_VERSAO[versao])
    
    ax1.set_title("⭐ Pontuação Média", fontsize=12, fontweight="bold")
    ax1.set_xlabel("Tamanho (n)", fontsize=11)
    ax1.set_ylabel("Pontuação", fontsize=11)
    ax1.set_xticks(x)
    ax1.set_xticklabels(tamanhos)
    ax1.legend()
    ax1.grid(axis='y', alpha=0.3)
    
    # Gráfico 2: Taxa de vitória
    for i, versao in enumerate(ORDEM_VERSAO):
        dados_v = resumo[resumo["versao"] == versao].sort_values("tamanho")
        offset = (i - 1) * width
        ax2.bar(x + offset, dados_v["taxa_vitoria"] * 100, width, 
                label=NOMES_VERSAO[versao], color=CORES_VERSAO[versao])
    
    ax2.set_title("🏆 Taxa de Vitória", fontsize=12, fontweight="bold")
    ax2.set_xlabel("Tamanho (n)", fontsize=11)
    ax2.set_ylabel("Percentual (%)", fontsize=11)
    ax2.set_xticks(x)
    ax2.set_xticklabels(tamanhos)
    ax2.legend()
    ax2.set_ylim(0, 105)
    ax2.grid(axis='y', alpha=0.3)
    
    fig.suptitle("📊 Comparação de Desempenho por Tamanho e Versão", fontsize=14, fontweight="bold", y=1.02)
    fig.tight_layout()
    
    salvar(fig, pasta, "05_barras_agrupadas.png")


def gerar_graficos(entrada: Path, saida: Path) -> None:
    """Gera todos os gráficos a partir do CSV."""
    
    print(f"📂 Carregando dados de: {entrada}")
    dados = carregar_resultado(entrada)
    
    print(f"📊 Dados carregados: {len(dados)} execuções")
    print(f"   Tamanhos: {sorted(dados['tamanho'].unique())}")
    print(f"   Versões: {dados['versao'].unique()}")
    
    saida.mkdir(parents=True, exist_ok=True)
    preparar_estilo()
    
    print("\n🎨 Gerando gráficos...")
    
    grafico_boxplot(dados, saida)
    print("  ✅ Boxplot")
    
    grafico_linhas(dados, saida)
    print("  ✅ Linhas de métricas")
    
    grafico_heatmap(dados, saida)
    print("  ✅ Heatmap")
    
    grafico_barras(dados, saida)
    print("  ✅ Barras de vitórias/mortes")

    grafico_barras_agrupadas(dados, saida)
    print("  ✅ Barras agrupadas")
    
    print(f"\n✅ Todos os gráficos salvos em: {saida.resolve()}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("entrada", type=Path, help="Arquivo CSV exportado pela validação")
    parser.add_argument("--saida", type=Path, default=Path("graficos"), help="Pasta de saída (padrão: graficos)")
    
    argumentos = parser.parse_args()
    
    if not argumentos.entrada.is_file():
        parser.error(f"Arquivo não encontrado: {argumentos.entrada}")
    
    try:
        gerar_graficos(argumentos.entrada, argumentos.saida)
    except (OSError, TypeError, ValueError, KeyError) as erro:
        parser.error(str(erro))


if __name__ == "__main__":
    main()