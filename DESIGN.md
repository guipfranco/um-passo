# Um Passo (nome provisório)

Roguelite de luta por turnos, estilo Slay the Spire, em que o combate é um tabuleiro de 2048. Você ataca fundindo peças: quanto maior a peça que você forma, maior o dano.

## Luta teste (v0.3, o que está jogável)

- Tabuleiro **3x3**, regra do 2048: tudo desliza até bater, dois iguais se fundem e dobram.
- **Cada fusão é um ataque**: causa dano igual ao valor da peça que nasceu. Fusões no mesmo arrasto somam (combo).
- **Baralho**: as peças novas saem do seu baralho, não do acaso puro. O inicial tem 6 cartas de 2 e 2 de 4. Quando acaba, é embaralhado de novo. A próxima peça fica visível.
- **Inimigo**: Gosma, 120 de vida, ataca 3 a cada 3 jogadas, e avisa antes (intenção, como no Slay the Spire).
- Você tem 20 de vida.
- **Encurralado** (nenhum arrasto possível): você leva um golpe e as 2 menores peças somem.
- Calibragem com bots: vencem 54% a 66% das lutas, em cerca de 19 jogadas.

## Para onde vai (ideias do Guilherme, ainda não feitas)

- **Grid como progressão**: começar pequeno (2x2 ou 3x3) e comprar mais casas entre lutas.
- **Baralho que evolui**: no começo só números baixos; ao longo da run entram cartas melhores e especiais, por exemplo:
  - multiplicador (a fusão com ela vale ×2 de dano),
  - coringa (se funde com qualquer número),
  - outras a definir.
- **Estrutura de run**: sequência de lutas, cada uma contra um inimigo; entre elas, recompensas e loja.

## Perguntas em aberto

- Dano = valor da peça formada é o melhor? Alternativas: dano só ao formar peças acima de X, ou dano ao "lançar" uma peça no inimigo.
- O que acontece quando o tabuleiro trava: golpe + limpeza (atual), ou derrota direta?
- Inimigos com comportamentos diferentes (bloqueiam casas, jogam peças ruins no seu tabuleiro, etc.).

## Histórico

- v0.1: você era uma peça que andava e absorvia monstros (dungeon crawler). Faltava o prazer de mexer o tabuleiro todo.
- v0.2: arrasto movendo tudo, mas só você se fundia; as outras peças viravam obstáculo.
- v0.3: volta à regra do 2048 com combate por cima.
