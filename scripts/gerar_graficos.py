#!/usr/bin/env python3
"""
Gera os gráficos da Etapa 5 - Validação e Resultados
do projeto Mundo de Wumpus.

Gráficos:
1. Taxa de vitória (%)
2. Pontuação média
3. Passos médios
4. Resultados das execuções
5. Evolução do Fitness do V3

Uso:
    python gerar_graficos.py dados/validacao.csv --saida ../graficos

Com fitness:
    python gerar_graficos.py dados/validacao.csv \
        --fitness dados/fitness_v3.csv \
        --saida ../graficos

Formato esperado de fitness_v3.csv:
    geracao,melhor,media,pior
    1,0.12,0.08,0.03
    2,0.15,0.10,0.04
    ...
"""

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


# =========================================================
# CONFIGURAÇÃO
# =========================================================

ORDEM_VERSAO = ["v1", "v2", "v3"]

NOMES_VERSAO = {
    "v1": "V1",
    "v2": "V2",
    "v3": "V3",
}

CORES_VERSAO = {
    "v1": "#0d6efd",  # azul
    "v2": "#fd7e14",  # laranja
    "v3": "#198754",  # verde
}

CORES_RESULTADO = {
    "Vitórias": "#198754",
    "Mortes": "#dc3545",
    "Interrompidas": "#adb5bd",
}

TAMANHOS_OFICIAIS = [4, 5, 10, 15, 20]


# =========================================================
# LEITURA DOS DADOS
# =========================================================

def converter_booleano(valor):
    """Converte diferentes representações para bool."""

    if isinstance(valor, bool):
        return valor

    texto = str(valor).strip().lower()

    return texto in {
        "true",
        "1",
        "sim",
        "yes",
        "y",
        "s",
        "verdadeiro",
    }


def carregar_resultado(caminho: Path) -> pd.DataFrame:
    """Carrega o CSV exportado pela validação."""

    if not caminho.exists():
        raise FileNotFoundError(
            f"Arquivo não encontrado: {caminho}"
        )

    # Detecta automaticamente vírgula, ponto e vírgula ou TAB
    df = pd.read_csv(
        caminho,
        sep=None,
        engine="python",
        encoding="utf-8",
    )

    # Remove espaços dos nomes das colunas
    df.columns = df.columns.str.strip()

    print("Colunas encontradas:")
    print(list(df.columns))

    colunas_obrigatorias = {
        "tamanho",
        "versao",
        "execucao",
        "resultado",
        "pegou_ouro",
        "pontuacao",
        "passos",
    }

    ausentes = colunas_obrigatorias - set(df.columns)

    if ausentes:
        raise ValueError(
            "Campos ausentes no CSV: "
            + ", ".join(sorted(ausentes))
        )

    # Conversão numérica
    df["tamanho"] = pd.to_numeric(
        df["tamanho"],
        errors="raise",
    )

    df["execucao"] = pd.to_numeric(
        df["execucao"],
        errors="raise",
    )

    df["pontuacao"] = pd.to_numeric(
        df["pontuacao"],
        errors="raise",
    )

    df["passos"] = pd.to_numeric(
        df["passos"],
        errors="raise",
    )

    # Padronização
    df["versao"] = (
        df["versao"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    df["resultado"] = (
        df["resultado"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    df["pegou_ouro"] = (
        df["pegou_ouro"]
        .apply(converter_booleano)
    )

    # Filtra versões válidas
    df = df[
        df["versao"].isin(ORDEM_VERSAO)
    ].copy()

    if df.empty:
        raise ValueError(
            'Nenhuma execução com "v1", "v2" ou "v3".'
        )

    # =====================================================
    # COLUNAS DERIVADAS
    # =====================================================

    df["venceu"] = df["resultado"].isin([
        "venceu",
        "vitoria",
        "vitória",
        "ganhou",
    ])

    df["morreu"] = df["resultado"].isin([
        "morreu",
        "morte",
        "poço",
        "poco",
        "wumpus",
    ])

    df["interrompida"] = ~(
        df["venceu"] | df["morreu"]
    )

    return df


def carregar_fitness(caminho: Path) -> pd.DataFrame:
    """Carrega histórico das gerações do V3."""

    if not caminho.exists():
        raise FileNotFoundError(
            f"Arquivo de fitness não encontrado: {caminho}"
        )

    df = pd.read_csv(
        caminho,
        sep=None,
        engine="python",
        encoding="utf-8",
    )

    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
    )

    # Permite alguns nomes alternativos
    renomear = {
        "generation": "geracao",
        "geração": "geracao",

        "best": "melhor",
        "best_fitness": "melhor",
        "fitness_melhor": "melhor",
        "fitness_melhor_medio": "melhor",

        "average": "media",
        "mean": "media",
        "média": "media",
        "fitness_medio": "media",
        "fitness_médio": "media",
        "fitness_medio_medio": "media",

        "worst": "pior",
        "worst_fitness": "pior",
        "fitness_pior": "pior",
        "fitness_pior_medio": "pior",
    }

    df = df.rename(columns=renomear)

    obrigatorias = {
        "geracao",
        "melhor",
        "media",
        "pior",
    }

    ausentes = obrigatorias - set(df.columns)

    if ausentes:
        raise ValueError(
            "CSV de fitness precisa das colunas: "
            "geracao, melhor, media, pior. "
            f"Ausentes: {', '.join(sorted(ausentes))}"
        )

    for coluna in obrigatorias:
        df[coluna] = pd.to_numeric(
            df[coluna],
            errors="raise",
        )

    return df.sort_values("geracao")


# =========================================================
# ESTILO
# =========================================================

def preparar_estilo() -> None:
    """Configura os gráficos para apresentação."""

    plt.rcParams.update({
        "figure.dpi": 120,
        "savefig.dpi": 200,

        "figure.facecolor": "white",
        "savefig.facecolor": "white",
        "axes.facecolor": "white",

        "axes.edgecolor": "#cccccc",
        "axes.labelcolor": "#222222",

        "text.color": "#222222",

        "xtick.color": "#444444",
        "ytick.color": "#444444",

        "grid.color": "#dddddd",
        "grid.linestyle": "--",
        "grid.alpha": 0.55,

        "font.size": 10,

        "legend.frameon": True,
        "legend.facecolor": "white",
        "legend.edgecolor": "#dddddd",
    })


def salvar(
    figura: plt.Figure,
    pasta: Path,
    nome: str,
) -> None:

    caminho = pasta / nome

    figura.savefig(
        caminho,
        dpi=200,
        bbox_inches="tight",
        facecolor="white",
    )

    plt.close(figura)

    print(f"  ✅ {nome}")


# =========================================================
# FUNÇÕES AUXILIARES
# =========================================================

def resumo_por_tamanho(
    dados: pd.DataFrame
) -> pd.DataFrame:

    resumo = (
        dados
        .groupby(
            ["tamanho", "versao"],
            as_index=False,
        )
        .agg(
            taxa_vitoria=("venceu", "mean"),
            pontuacao_media=("pontuacao", "mean"),
            pontuacao_dp=("pontuacao", "std"),
            passos_medios=("passos", "mean"),
            passos_dp=("passos", "std"),
        )
    )

    return resumo


def adicionar_rotulos_barras(
    eixo,
    formato="{:.0f}",
):
    """Adiciona valores acima das barras."""

    for container in eixo.containers:
        try:
            eixo.bar_label(
                container,
                fmt=formato,
                padding=3,
                fontsize=9,
            )
        except (AttributeError, ValueError):
            pass


# =========================================================
# GRÁFICO 1
# TAXA DE VITÓRIA
# =========================================================

def grafico_taxa_vitoria(
    dados: pd.DataFrame,
    pasta: Path,
) -> None:

    resumo = resumo_por_tamanho(dados)

    tamanhos = sorted(
        resumo["tamanho"].unique()
    )

    x = np.arange(len(tamanhos))

    largura = 0.24

    fig, ax = plt.subplots(
        figsize=(11, 6)
    )

    for i, versao in enumerate(ORDEM_VERSAO):

        serie = (
            resumo[
                resumo["versao"] == versao
            ]
            .set_index("tamanho")
            .reindex(tamanhos)
        )

        valores = (
            serie["taxa_vitoria"] * 100
        )

        deslocamento = (
            i - (len(ORDEM_VERSAO) - 1) / 2
        ) * largura

        barras = ax.bar(
            x + deslocamento,
            valores,
            largura,
            label=NOMES_VERSAO[versao],
            color=CORES_VERSAO[versao],
        )

        ax.bar_label(
            barras,
            fmt="%.1f%%",
            padding=3,
            fontsize=9,
        )

    ax.set_title(
        "Taxa de Vitória (%)",
        fontsize=16,
        fontweight="bold",
    )

    ax.set_xlabel(
        "Tamanho do ambiente",
        fontsize=11,
    )

    ax.set_ylabel(
        "Taxa de vitória (%)",
        fontsize=11,
    )

    ax.set_xticks(x)

    ax.set_xticklabels([
        f"{n}×{n}"
        for n in tamanhos
    ])

    ax.set_ylim(0, 105)

    ax.legend(
        title="Agente",
        ncol=3,
    )

    ax.grid(
        axis="y",
        alpha=0.4,
    )

    fig.tight_layout()

    salvar(
        fig,
        pasta,
        "01_taxa_vitoria.png",
    )


# =========================================================
# GRÁFICO 2
# PONTUAÇÃO MÉDIA
# =========================================================

def grafico_pontuacao_media(
    dados: pd.DataFrame,
    pasta: Path,
) -> None:

    resumo = resumo_por_tamanho(dados)

    tamanhos = sorted(
        resumo["tamanho"].unique()
    )

    fig, ax = plt.subplots(
        figsize=(11, 6)
    )

    for versao in ORDEM_VERSAO:

        serie = (
            resumo[
                resumo["versao"] == versao
            ]
            .set_index("tamanho")
            .reindex(tamanhos)
        )

        ax.plot(
            tamanhos,
            serie["pontuacao_media"],
            marker="o",
            markersize=8,
            linewidth=2.5,
            label=NOMES_VERSAO[versao],
            color=CORES_VERSAO[versao],
        )

        for tamanho, valor in zip(
            tamanhos,
            serie["pontuacao_media"],
        ):
            if pd.notna(valor):
                ax.annotate(
                    f"{valor:.1f}",
                    (tamanho, valor),
                    textcoords="offset points",
                    xytext=(0, 8),
                    ha="center",
                    fontsize=9,
                )

    ax.axhline(
        0,
        linewidth=1,
        color="#999999",
    )

    ax.set_title(
        "Pontuação Média",
        fontsize=16,
        fontweight="bold",
    )

    ax.set_xlabel(
        "Tamanho do ambiente",
        fontsize=11,
    )

    ax.set_ylabel(
        "Pontuação média",
        fontsize=11,
    )

    ax.set_xticks(tamanhos)

    ax.set_xticklabels([
        f"{n}×{n}"
        for n in tamanhos
    ])

    ax.legend(
        title="Agente",
        ncol=3,
    )

    ax.grid(
        axis="y",
        alpha=0.4,
    )

    fig.tight_layout()

    salvar(
        fig,
        pasta,
        "02_pontuacao_media.png",
    )


# =========================================================
# GRÁFICO 3
# PASSOS MÉDIOS
# =========================================================

def grafico_passos_medios(
    dados: pd.DataFrame,
    pasta: Path,
) -> None:

    resumo = resumo_por_tamanho(dados)

    tamanhos = sorted(
        resumo["tamanho"].unique()
    )

    fig, ax = plt.subplots(
        figsize=(11, 6)
    )

    for versao in ORDEM_VERSAO:

        serie = (
            resumo[
                resumo["versao"] == versao
            ]
            .set_index("tamanho")
            .reindex(tamanhos)
        )

        ax.plot(
            tamanhos,
            serie["passos_medios"],
            marker="o",
            markersize=8,
            linewidth=2.5,
            label=NOMES_VERSAO[versao],
            color=CORES_VERSAO[versao],
        )

        for tamanho, valor in zip(
            tamanhos,
            serie["passos_medios"],
        ):
            if pd.notna(valor):
                ax.annotate(
                    f"{valor:.1f}",
                    (tamanho, valor),
                    textcoords="offset points",
                    xytext=(0, 8),
                    ha="center",
                    fontsize=9,
                )

    ax.set_title(
        "Passos Médios",
        fontsize=16,
        fontweight="bold",
    )

    ax.set_xlabel(
        "Tamanho do ambiente",
        fontsize=11,
    )

    ax.set_ylabel(
        "Número médio de passos",
        fontsize=11,
    )

    ax.set_xticks(tamanhos)

    ax.set_xticklabels([
        f"{n}×{n}"
        for n in tamanhos
    ])

    ax.legend(
        title="Agente",
        ncol=3,
    )

    ax.grid(
        axis="y",
        alpha=0.4,
    )

    fig.tight_layout()

    salvar(
        fig,
        pasta,
        "03_passos_medios.png",
    )


# =========================================================
# GRÁFICO 4
# VITÓRIAS / MORTES / INTERROMPIDAS
# =========================================================

def grafico_resultados_execucoes(
    dados: pd.DataFrame,
    pasta: Path,
) -> None:

    registros = []

    tamanhos = sorted(
        dados["tamanho"].unique()
    )

    for tamanho in tamanhos:

        for versao in ORDEM_VERSAO:

            grupo = dados[
                (dados["tamanho"] == tamanho)
                & (dados["versao"] == versao)
            ]

            registros.append({
                "tamanho": tamanho,
                "versao": versao,
                "Vitórias": int(
                    grupo["venceu"].sum()
                ),
                "Mortes": int(
                    grupo["morreu"].sum()
                ),
                "Interrompidas": int(
                    grupo["interrompida"].sum()
                ),
            })

    resumo = pd.DataFrame(registros)

    labels = []
    vitorias = []
    mortes = []
    interrompidas = []

    for tamanho in tamanhos:

        for versao in ORDEM_VERSAO:

            linha = resumo[
                (resumo["tamanho"] == tamanho)
                & (resumo["versao"] == versao)
            ].iloc[0]

            labels.append(
                f"{NOMES_VERSAO[versao]}\n{tamanho}×{tamanho}"
            )

            vitorias.append(
                linha["Vitórias"]
            )

            mortes.append(
                linha["Mortes"]
            )

            interrompidas.append(
                linha["Interrompidas"]
            )

    x = np.arange(len(labels))

    fig, ax = plt.subplots(
        figsize=(15, 7)
    )

    b1 = ax.bar(
        x,
        vitorias,
        label="Vitórias",
        color=CORES_RESULTADO[
            "Vitórias"
        ],
    )

    b2 = ax.bar(
        x,
        mortes,
        bottom=vitorias,
        label="Mortes",
        color=CORES_RESULTADO[
            "Mortes"
        ],
    )

    base_interrompidas = (
        np.array(vitorias)
        + np.array(mortes)
    )

    b3 = ax.bar(
        x,
        interrompidas,
        bottom=base_interrompidas,
        label="Interrompidas",
        color=CORES_RESULTADO[
            "Interrompidas"
        ],
    )

    # Rótulos internos
    for barras in [b1, b2, b3]:

        for barra in barras:

            altura = barra.get_height()

            if altura > 0:

                ax.text(
                    barra.get_x()
                    + barra.get_width() / 2,
                    barra.get_y()
                    + altura / 2,
                    f"{int(altura)}",
                    ha="center",
                    va="center",
                    fontsize=9,
                    fontweight="bold",
                    color="white",
                )

    ax.set_title(
        "Resultados das 30 Execuções",
        fontsize=16,
        fontweight="bold",
    )

    ax.set_xlabel(
        "Agente e tamanho do ambiente",
        fontsize=11,
    )

    ax.set_ylabel(
        "Número de execuções",
        fontsize=11,
    )

    ax.set_xticks(x)

    ax.set_xticklabels(
        labels,
        fontsize=8,
    )

    ax.legend(
        ncol=3,
        loc="upper center",
    )

    ax.grid(
        axis="y",
        alpha=0.35,
    )

    fig.tight_layout()

    salvar(
        fig,
        pasta,
        "04_resultados_execucoes.png",
    )


# =========================================================
# GRÁFICO 5
# FITNESS DO V3
# =========================================================

def grafico_fitness_v3(
    fitness: pd.DataFrame,
    pasta: Path,
) -> None:
    """
    Gera um gráfico de evolução do fitness do V3
    para cada tamanho de ambiente.

    Exemplo:
        05_fitness_v3_4x4.png
        05_fitness_v3_5x5.png
        05_fitness_v3_10x10.png
    """

    fitness = fitness.copy()

    # -----------------------------------------------------
    # Verificar coluna tamanho
    # -----------------------------------------------------
    if "tamanho" not in fitness.columns:
        raise ValueError(
            'O CSV de fitness precisa possuir a coluna "tamanho".'
        )

    # -----------------------------------------------------
    # Limpeza
    # -----------------------------------------------------
    fitness = fitness.dropna(
        subset=[
            "tamanho",
            "geracao",
            "melhor",
            "media",
            "pior",
        ]
    )

    fitness["tamanho"] = pd.to_numeric(
        fitness["tamanho"],
        errors="raise",
    )

    fitness["geracao"] = pd.to_numeric(
        fitness["geracao"],
        errors="raise",
    )

    tamanhos = sorted(
        fitness["tamanho"].unique()
    )

    print(
        f"  Fitness disponível para: {tamanhos}"
    )

    # -----------------------------------------------------
    # UM GRÁFICO PARA CADA AMBIENTE
    # -----------------------------------------------------
    for tamanho in tamanhos:

        dados = (
            fitness[
                fitness["tamanho"] == tamanho
            ]
            .sort_values("geracao")
            .copy()
        )

        if dados.empty:
            continue

        # -------------------------------------------------
        # Detectar caso sem aprendizagem
        # -------------------------------------------------
        tudo_zero = (
            (dados["melhor"] == 0).all()
            and (dados["media"] == 0).all()
            and (dados["pior"] == 0).all()
        )

        fig, ax = plt.subplots(
            figsize=(13, 7)
        )

        # =================================================
        # CURVAS
        # =================================================

        ax.plot(
            dados["geracao"],
            dados["melhor"],
            linewidth=2.5,
            label="Melhor fitness",
            color="#198754",
        )

        ax.plot(
            dados["geracao"],
            dados["media"],
            linewidth=2.3,
            label="Fitness médio",
            color="#0d6efd",
        )

        ax.plot(
            dados["geracao"],
            dados["pior"],
            linewidth=2.0,
            label="Pior fitness",
            color="#dc3545",
        )

        # =================================================
        # TÍTULO
        # =================================================

        ax.set_title(
            f"Evolução do Fitness do Agente V3 — Ambiente {int(tamanho)}×{int(tamanho)}",
            fontsize=17,
            fontweight="bold",
            pad=15,
        )

        ax.set_xlabel(
            "Geração",
            fontsize=12,
        )

        ax.set_ylabel(
            "Fitness",
            fontsize=12,
        )

        # =================================================
        # EIXO X
        # =================================================

        geracao_min = int(
            dados["geracao"].min()
        )

        geracao_max = int(
            dados["geracao"].max()
        )

        ax.set_xlim(
            geracao_min,
            geracao_max,
        )

        # Mostra aproximadamente 10 divisões
        passo = max(
            1,
            geracao_max // 10,
        )

        ticks = np.arange(
            geracao_min,
            geracao_max + 1,
            passo,
        )

        ax.set_xticks(ticks)

        # =================================================
        # GRID
        # =================================================

        ax.grid(
            axis="both",
            linestyle="--",
            linewidth=0.7,
            alpha=0.35,
        )

        # =================================================
        # LEGENDA
        # =================================================

        ax.legend(
            loc="best",
            fontsize=10,
            frameon=True,
        )

        # =================================================
        # REMOVER BORDAS
        # =================================================

        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

        # =================================================
        # INFORMAÇÕES FINAIS
        # =================================================

        melhor_final = dados.iloc[-1]["melhor"]
        media_final = dados.iloc[-1]["media"]
        pior_final = dados.iloc[-1]["pior"]

        texto = (
            f"Gerações: {geracao_min}–{geracao_max}\n"
            f"Melhor final: {melhor_final:.2f}\n"
            f"Média final: {media_final:.2f}\n"
            f"Pior final: {pior_final:.2f}"
        )

        ax.text(
            0.015,
            0.97,
            texto,
            transform=ax.transAxes,
            fontsize=9,
            verticalalignment="top",
            bbox={
                "boxstyle": "round,pad=0.5",
                "facecolor": "white",
                "edgecolor": "#dddddd",
                "alpha": 0.90,
            },
        )

        # =================================================
        # AVISO SE TUDO FOR ZERO
        # =================================================

        if tudo_zero:

            ax.text(
                0.5,
                0.5,
                "Fitness igual a zero em todas as gerações",
                transform=ax.transAxes,
                ha="center",
                va="center",
                fontsize=14,
                fontweight="bold",
                color="#dc3545",
            )

        fig.tight_layout()

        nome = (
            f"05_fitness_v3_"
            f"{int(tamanho)}x{int(tamanho)}.png"
        )

        salvar(
            fig,
            pasta,
            nome,
        )


# =========================================================
# TABELA RESUMO
# =========================================================

def gerar_tabela_resumo(
    dados: pd.DataFrame,
    pasta: Path,
) -> None:

    resumo = (
        dados
        .groupby(
            ["tamanho", "versao"],
            as_index=False,
        )
        .agg(
            execucoes=(
                "execucao",
                "count",
            ),
            vitorias=(
                "venceu",
                "sum",
            ),
            mortes=(
                "morreu",
                "sum",
            ),
            interrompidas=(
                "interrompida",
                "sum",
            ),
            taxa_vitoria=(
                "venceu",
                "mean",
            ),
            pontuacao_media=(
                "pontuacao",
                "mean",
            ),
            pontuacao_dp=(
                "pontuacao",
                "std",
            ),
            passos_medios=(
                "passos",
                "mean",
            ),
            passos_dp=(
                "passos",
                "std",
            ),
        )
    )

    resumo["taxa_vitoria"] = (
        resumo["taxa_vitoria"] * 100
    )

    resumo["versao"] = (
        resumo["versao"]
        .map(NOMES_VERSAO)
    )

    resumo.to_csv(
        pasta / "resumo_estatistico.csv",
        index=False,
        encoding="utf-8-sig",
    )

    print(
        "  ✅ resumo_estatistico.csv"
    )


# =========================================================
# GERAÇÃO
# =========================================================

def gerar_graficos(
    entrada: Path,
    saida: Path,
    fitness_path: Path | None = None,
) -> None:

    print(
        f"\n📂 Carregando dados: {entrada}"
    )

    dados = carregar_resultado(
        entrada
    )

    print(
        f"Total de execuções: {len(dados)}"
    )

    print(
        "Tamanhos:",
        sorted(
            dados["tamanho"].unique()
        ),
    )

    print(
        "Versões:",
        sorted(
            dados["versao"].unique()
        ),
    )

    saida.mkdir(
        parents=True,
        exist_ok=True,
    )

    preparar_estilo()

    print(
        "\nGerando gráficos..."
    )

    grafico_taxa_vitoria(
        dados,
        saida,
    )

    grafico_pontuacao_media(
        dados,
        saida,
    )

    grafico_passos_medios(
        dados,
        saida,
    )

    grafico_resultados_execucoes(
        dados,
        saida,
    )

    # Fitness é opcional porque normalmente
    # vem de outro arquivo.
    if fitness_path is not None:

        fitness = carregar_fitness(
            fitness_path
        )

        grafico_fitness_v3(
            fitness,
            saida,
        )

    else:

        print(
            "  ⚠️ 05_fitness_v3.png não gerado."
        )

        print(
            "     Use --fitness dados/fitness_v3.csv"
        )

    gerar_tabela_resumo(
        dados,
        saida,
    )

    print(
        f"\nArquivos salvos em:\n{saida.resolve()}"
    )


# =========================================================
# MAIN
# =========================================================

def main() -> None:

    parser = argparse.ArgumentParser(
        description=__doc__
    )

    parser.add_argument(
        "entrada",
        type=Path,
        help=(
            "CSV com as execuções "
            "da validação"
        ),
    )

    parser.add_argument(
        "--fitness",
        type=Path,
        default=None,
        help=(
            "CSV com histórico de fitness "
            "do V3"
        ),
    )

    parser.add_argument(
        "--saida",
        type=Path,
        default=Path("graficos"),
        help=(
            "Pasta de saída "
            "(padrão: graficos)"
        ),
    )

    argumentos = (
        parser.parse_args()
    )

    if not argumentos.entrada.is_file():

        parser.error(
            "Arquivo não encontrado: "
            f"{argumentos.entrada}"
        )

    if (
        argumentos.fitness
        and not argumentos.fitness.is_file()
    ):

        parser.error(
            "Arquivo de fitness "
            "não encontrado: "
            f"{argumentos.fitness}"
        )

    try:

        gerar_graficos(
            argumentos.entrada,
            argumentos.saida,
            argumentos.fitness,
        )

    except (
        OSError,
        TypeError,
        ValueError,
        KeyError,
    ) as erro:

        parser.error(
            str(erro)
        )


if __name__ == "__main__":
    main()