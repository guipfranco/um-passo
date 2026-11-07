# Um Passo (nome provisório)

Puzzle de celular: você é um número num tabuleiro pequeno. Cada swipe move o tabuleiro inteiro uma casa, e você cresce dobrando ao encostar em quem tem o seu tamanho.

## Regras do nível teste (v0.2)

- Tabuleiro 4x4, você começa como **1**. Você é dourado; inimigos são tons de vermelho (mais escuro = mais forte).
- **Arrastar faz tudo deslizar até bater em algo**, como no 2048. Há um botão para trocar para o modo antigo, de uma casa por arrasto, como no Threes. Quem está mais à frente anda primeiro.
- No modo até o fim, dá para dobrar mais de uma vez no mesmo arrasto (combo).
- Quando você e um monstro se encostam (você anda nele, ou ele anda em você):

| Monstro | Resultado |
|---|---|
| **igual** | some, e **você dobra** (1, 2, 4, 8...) |
| **menor** | some |
| **maior** | **você morre** (também se ele deslizar em cima de você) |

- Monstro com monstro: bloqueia, ninguém se funde.
- A cada jogada entra uma peça nova pela borda oposta ao arrasto. O valor dela aparece em "Próximo".
- Se não existir ninguém do seu tamanho no tabuleiro, a próxima peça é garantida igual a você.
- Vitória: chegar a **64**. Derrota: encostar num maior, ou nenhum arrasto mexer mais o tabuleiro.

## Alavancas (bloco `CFG` no código)

- `N`: tamanho do tabuleiro.
- `slideAll`: modo padrão (até o fim ou uma casa).
- `goal`: valor para vencer.
- `initial`: monstros no começo.
- `spawnTable`: o que nasce em relação ao seu valor.

## Perguntas em aberto

- Os menores devem sumir ou só bloquear?
- Monstros devem se fundir entre si, como no Threes?
- Morrer quando um maior desliza em cima de você é justo, ou só quando você vai nele?

## Ideias guardadas para depois

Ficaram fora do nível teste. Estavam na v0.1 e podem voltar se fizerem sentido:

- Vários andares com escada e meta crescente.
- Bênçãos entre andares (Espinhos, Empurrão, Voraz...).
- Vida e dano ao bater num maior.
- Caçadores que andam até você.
- Relógio: monstros crescem a cada N turnos.
