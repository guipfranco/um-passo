# Ptui! (nome provisório: Um Passo / Mina)

Puzzle de mineração com cara de Balatro. Você funde rochas no estilo 2048 durante o dia, cada arrasto cansa, e no fim do dia as rochas quebram e revelam o minério, como uma loot box. Vende, melhora o equipamento e tenta pagar a cota da semana.

## Protótipo atual (v0.4)

### O dia
- Tabuleiro **4x4**, regra do 2048: tudo desliza até bater, duas rochas iguais viram a rocha do nível seguinte.
- Níveis: Cascalho, Pedra, Rocha, Rocha densa, Geodo, Cristalino, Geodo real.
- **40 de energia**, cada arrasto gasta 1. Quando a energia zera, o dia continua, mas **toda peça nova é um torrão de terra**: não se funde com nada e custa $2 no fim do dia. O dia acaba no botão "Encerrar o dia" ou quando o tabuleiro trava.
- Nasce Cascalho (90%) ou Pedra (10%). A próxima rocha fica visível.

### Fim do dia: a revelação
- As rochas quebram uma a uma, **da menor para a maior**, para guardar o suspense.
- Cada rocha sorteia o minério pela tabela abaixo.
- Achado raro (prata ou melhor): a tela treme mais quanto mais raro, saltam faíscas, aparece o nome grande e toca um acorde. O total do dia sobe contando.

| Rocha | Nada | Cobre ($1) | Ferro ($3) | Prata ($8) | Ouro ($20) | Diamante ($60) |
|---|---|---|---|---|---|---|
| Cascalho | 70% | 30% | | | | |
| Pedra | 40% | 45% | 15% | | | |
| Rocha | 15% | 45% | 35% | 5% | | |
| Rocha densa | | 25% | 45% | 25% | 5% | |
| Geodo | | | 30% | 45% | 22% | 3% |
| Cristalino | | | | 40% | 45% | 15% |
| Geodo real | | | | 10% | 50% | 40% |

Regra de equilíbrio: em média uma rocha vale mais que duas do nível de baixo, então fundir sempre compensa no valor esperado.

### Loja (entre os dias)
- **Fôlego**: +5 de energia por dia (até 4 níveis: $25, $40, $60, $90).
- **Picareta**: +25% de chance de nascer Pedra (até 2 níveis: $35, $70).
- **Martelo**: cada rocha sorteia duas vezes e fica com o melhor ($60).

### Semana e cota (meio-termo)
- 5 dias. No fim do 5º dia, paga a cota: $60, $110, $180, $270, $400, depois +50% por semana.
- **Pagou**: o valor sai do dinheiro, a semana avança e a próxima começa com um **Geodo** no tabuleiro.
- **Não pagou**: perde o dinheiro guardado e repete a semana. As melhorias continuam.

### Calibragem (simulação, bot simples de canto)
| Melhorias | Renda média por dia |
|---|---|
| nenhuma | $26 |
| Fôlego 2 | $33 |
| Picareta 1 + Martelo | $46 |
| tudo no máximo | $82 |

O dilema da semana 1: a cota de $60 deixa folga para uma melhoria, não para todas. O bot que compra tudo sem pensar não paga a cota.

## Estilo visual
**Pedrinhas vivas** (estilo Threes): cada nível é uma pedrinha com cor, tamanho e humor próprios; pedrinhas iguais lado a lado se olham. No fim do dia cada uma incha as bochechas e cospe o minério (ou um torrão, se não tinha nada). Rascunhos em `bichos.html`.

Versão anterior, Balatro: fundo girando, efeito de tela antiga (CRT), fonte pixelada grande, **cor como rótulo** (vermelho = cota, dourado = dinheiro, azul = energia), números enormes e muito "juice" na revelação. Os rascunhos dos três estilos considerados estão em `rascunhos.html`.

## Ideias para depois
- **Lupa**: espia o minério de uma rocha durante o dia.
- **Rocha com veio**: aparece às vezes, com chance melhor.
- **Mochila 5x5** (grid maior) e começar menor (3x3) como progressão.
- Andares mais fundos com rochas melhores e obstáculos.
- Peças especiais: dinamite, coringa.
- Proteção contra azar na revelação.
- Salvar o progresso no aparelho.

## Histórico
- v0.1: você era uma peça que andava e absorvia monstros (dungeon crawler).
- v0.2: arrasto movendo tudo, mas só você se fundia.
- v0.3: 2048 com combate estilo Slay the Spire (dano = valor da fusão) e baralho de peças.
- v0.4: mineração com revelação estilo loot box, energia diária e cota semanal.
