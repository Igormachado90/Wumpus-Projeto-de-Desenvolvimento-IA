# Guia de Integração - Mapas Isométricos (3 Perspectivas)

## 📋 Resumo

O componente `MapaImagem` agora suporta 3 perspectivas isométricas diferentes:
- **Esquerda-Frente** (◀): ângulo 45° para a esquerda
- **Frente** (⬇): perspectiva frontal (padrão)
- **Frente-Direita** (▶): ângulo 45° para a direita

## 🖼️ Como Adicionar as Imagens

### 1. Prepare seus arquivos PNG

Você deve ter 3 arquivos PNG para cada direção (norte, sul, leste, oeste):

```
mapa_esquerda_frente.png   (400x400px)
mapa_frente.png             (400x400px)
mapa_frente_direita.png     (400x400px)
```

### 2. Coloque as imagens nas pastas

```
src/assets/mapas-isometricos/
├── norte/
│   ├── mapa_esquerda_frente.png
│   ├── mapa_frente.png
│   └── mapa_frente_direita.png
├── sul/
├── leste/
└── oeste/
```

### 3. Teste no navegador

O componente automaticamente:
- ✅ Detecta as imagens
- ✅ Exibe a perspectiva "Frente" por padrão
- ✅ Mostra 3 botões para alternar perspectivas
- ✅ Funciona com fallback em grid se as imagens não carregarem

## 🎮 Comportamento do Componente

### Estado
```tsx
const [perspectiva, setPerspectiva] = useState<Perspectiva>('frente');
```

- Estado persiste enquanto o usuário interage com os botões
- Padrão inicial é "Frente"

### Interface
```
┌─────────────────────────────────┐
│     MAPA IMAGINÁRIO             │
├─────────────────────────────────┤
│                                 │
│     [Imagem Isométrica]         │
│                                 │
├─────────────────────────────────┤
│ [◀ Esquerda] [⬇ Frente] [Direita ▶] │
└─────────────────────────────────┘
```

### Fallback
Se alguma imagem não carregar, o componente mostra automaticamente o grid de células (com emojis).

## 🔧 Utilitários Disponíveis

### Funções em `mapasIsometricos.ts`

```tsx
// Obter URL da imagem
import { obterUrlImagem } from '../game/mapasIsometricos';
const url = obterUrlImagem('norte', 'frente');

// Obter todas as perspectivas
import { obterPerspectivas } from '../game/mapasIsometricos';
const perspectivas = obterPerspectivas('norte');
// Retorna: ['esquerda_frente', 'frente', 'frente_direita']
```

## 🎨 Especificações das Imagens

- **Formato**: PNG (com fundo transparente recomendado) ou JPEG
- **Dimensões**: 400x400px (pode ser redimensionado)
- **Projeção**: Isométrica (45 graus)
- **Estilo**: Pixel art ou renderizado (ambos funcionam)

### Exemplo de estrutura isométrica
```
    ┌───┐
   ╱│   │╲
  ╱ │   │ ╲
 │  │   │  │
 │  └───┘  │
 │         │
 └─────────┘
```

## 📝 Próximos Passos (Opcional)

### 1. Alternar perspectiva automaticamente
Detectar movimento do agente e mudar perspectiva:

```tsx
useEffect(() => {
    // Comparar posição anterior com atual
    // Se moveu para norte: perspectiva = 'frente'
    // Se moveu para noroeste: perspectiva = 'esquerda_frente'
}, [jogo.linha, jogo.coluna]);
```

### 2. Animar transição entre perspectivas
Adicionar transição CSS:

```css
.mapa-imagem-visual {
    transition: opacity 0.3s ease;
}
```

### 3. Usar outras direções
Quando tiver imagens para "sul", "leste" e "oeste", alterar:

```tsx
const urlImagem = obterUrlImagem('norte', perspectiva); // ← mudar direção
```

## 🐛 Solução de Problemas

| Problema | Solução |
|----------|---------|
| Imagem não aparece | Verifique caminho do arquivo e nome exato |
| Grid apareça em vez de imagem | Arquivo PNG não encontrado - fallback automático |
| Botões não funcionam | Abra console do navegador para erros |
| Imagem pixelada | Reduza tamanho da imagem ou use `image-rendering: pixelated` |

---

**Status**: ✅ Implementado e pronto para receber imagens!

