# Um Passo (nome provisório)

Puzzle de celular: você é um número num tabuleiro pequeno. Cada swipe move o tabuleiro inteiro uma casa, e você cresce dobrando ao encostar em quem tem o seu tamanho.

## Regras do nível teste (v0.2)

- Tabuleiro 5x5, você começa como **1**, no centro.
- **Arrastar move tudo uma casa** naquela direção, como no Threes. Quem está mais à frente anda primeiro, então uma fila inteira desliza junta se tiver espaço na ponta.
- Quando você e um monstro se encostam (você anda nele, ou ele anda em você):

| Monstro | Resultado |
|---|---|
| **igual** | some, e **você dobra** (1, 2, 4, 8...) |
| **menor** | some |
| **maior** | bloqueia |

- Monstro com monstro: bloqueia, ninguém se funde.
- A cada jogada entra uma peça nova pela borda oposta ao arrasto. O valor dela aparece em "Próximo".
- Se não existir ninguém do seu tamanho no tabuleiro, a próxima peça é garantida igual a você.
- Vitória: chegar a **64**. Derrota: nenhum arrasto mexe mais o tabuleiro.

## Alavancas (bloco `CFG` no código)

- `N`: tamanho do tabuleiro.
- `goal`: valor para vencer.
- `initial`: monstros no começo.
- `spawnTable`: o que nasce em relação ao seu valor.

## Perguntas em aberto

- Os menores devem sumir ou só bloquear?
- Monstros devem se fundir entre si, como no Threes?
- 4x4 (mais apertado) ou 5x5?

## Ideias guardadas para depois

Ficaram fora do nível teste. Estavam na v0.1 e podem voltar se fizerem sentido:

- Vários andares com escada e meta crescente.
- Bênçãos entre andares (Espinhos, Empurrão, Voraz...).
- Vida e dano ao bater num maior.
- Caçadores que andam até você.
- Relógio: monstros crescem a cada N turnos.
