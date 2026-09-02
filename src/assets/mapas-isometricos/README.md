# Mapas Isométricos - Wumpus Game

Estrutura de pastas para armazenar imagens isométricas do mapa em diferentes perspectivas.

## 📁 Estrutura de Diretórios

```
mapas-isometricos/
├── norte/
│   ├── mapa_esquerda_frente.png    # Perspectiva esquerda-frente
│   ├── mapa_frente.png              # Perspectiva frontal
│   └── mapa_frente_direita.png      # Perspectiva frente-direita
├── sul/
│   ├── mapa_esquerda_frente.png
│   ├── mapa_frente.png
│   └── mapa_frente_direita.png
├── leste/
│   ├── mapa_esquerda_frente.png
│   ├── mapa_frente.png
│   └── mapa_frente_direita.png
├── oeste/
│   ├── mapa_esquerda_frente.png
│   ├── mapa_frente.png
│   └── mapa_frente_direita.png
├── config.json
└── README.md
```

## 📸 Convenção de Nomes

Para cada direção, adicione as imagens com os seguintes nomes:

- **mapa_esquerda_frente.png** - Visão isométrica ângulo esquerda (45°)
- **mapa_frente.png** - Visão isométrica frontal (0°)
- **mapa_frente_direita.png** - Visão isométrica ângulo direita (-45°)

## 🎨 Especificações Recomendadas

- **Formato**: PNG ou JPEG
- **Tamanho**: 400x400px (otimizado para web)
- **Fundo**: Transparente (PNG) ou compatível com tema dark
- **Projeção**: Isométrica (45°)
- **Proporção**: Quadrada (1:1)

## ✨ Uso no Componente

O componente `MapaImagem.tsx` agora exibe as 3 perspectivas com botões de alternância:

```
[◀ Esquerda] [⬇ Frente] [Direita ▶]
     (botões)
```

- Clique nos botões para alternar entre as perspectivas
- A imagem padrão é "Frente"
- Se a imagem não carregar, exibe um grid de células fallback

## 🎯 Como Adicionar as Imagens

1. Prepare 3 imagens PNG de 400x400px cada
2. Nomeie como:
   - `mapa_esquerda_frente.png`
   - `mapa_frente.png`
   - `mapa_frente_direita.png`
3. Coloque em cada pasta de direção (norte, sul, leste, oeste)
4. O componente automaticamente detectará e exibirá as imagens

## 🔄 Funcionamento

- **Estado**: O componente mantém o estado da perspectiva selecionada
- **Fallback**: Se a imagem não existir, mostra o grid de células (emoji)
- **Responsive**: As imagens se adaptam ao tamanho do container
- **Animações**: Transições CSS suaves ao alternar perspectivas

---

**Nota**: Use ferramentas como Aseprite, Blender, ou Inkscape para criar mapas isométricos.

