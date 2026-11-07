# Progressão: proposta detalhada (v2)

Hoje a evolução é só a loja, igual em toda partida. A proposta troca isso por quatro sistemas num mesmo ciclo:

```
manhã: MAPA (escolhe o caminho do dia)
  -> dia: MINA (2048 de pedrinhas, energia, torrão, paredes)
  -> fim do dia: CUSPE (revelação, com o EQUIPAMENTO agindo)
  -> VENDA com COMBOS
  -> escolhe 1 ITEM de 3
fim da semana: FISCAL DA COTA
entre partidas: ÁLBUM
```

Mudanças desta versão: amigos viraram **itens de equipamento**; a lógica central passa a ser a do Balatro (**jogada fraca + item certo = jogada ótima**); entram as **paredes**; sai a caverna escura; e encerrar o dia mais cedo ganha um motivo.

---

## 1. Equipamento

### A ideia do Balatro que vale copiar
No Balatro, um par (a mão mais fraca) pode render mais que um full house se você tiver os coringas certos. Isso faz cada partida ter uma **estratégia própria**, nascida dos itens que apareceram.

Aqui é igual: hoje a única estratégia é "faça a maior pedrinha possível". Com os itens, **pedrinhas pequenas, tabuleiro cheio, torrão e paredes podem virar estratégias que rendem mais**.

### Como funciona
- **Cinto com 5 vagas.** No fim de cada dia aparecem 3 itens e você leva 1 (ou pula e ganha um trocado). Vender um item devolve metade do valor.
- **O cálculo do cuspe passa a ser:** `(soma dos minérios + bônus em $) × multiplicadores`. É o "fichas × multiplicador" do Balatro.
- **Na revelação, cada item que age pula e mostra o efeito** ("+$1", "×2") enquanto o total sobe. É o momento mais gostoso do Balatro: ver o equipamento trabalhando.
- **Três tipos de efeito**, como no Balatro:
  - **+$**: soma dinheiro (fraco sozinho, forte em quantidade);
  - **×**: multiplica o total (raro e poderoso);
  - **regra**: muda como o jogo funciona.
- **Itens que crescem:** alguns ficam mais fortes a cada vez que a condição acontece, e isso fica para a partida inteira.

### Estratégias e seus itens (primeira leva)

**Miudinha: muitas pedrinhas pequenas** (hoje é a pior jogada)
| Item | Efeito |
|---|---|
| Peneira fina | Cascalho nunca cospe nada: no mínimo, cobre. |
| Vaquinha | +$1 para cada pedrinha que cuspir alguma coisa. |
| Cobre polido | Cobre vale $3 em vez de $1. |
| Formigueiro | Terminar o dia com o tabuleiro cheio (16 peças): ×2. |

**Gigante: uma pedrinha enorme**
| Item | Efeito |
|---|---|
| Lupa de joalheiro | A maior pedrinha do dia cospe ×3. |
| Solitária | Se só houver uma pedrinha de nível 5 ou mais, ela cospe duas vezes. |
| Coroa | Cada vez que você forma um Cristalino, este item ganha ×0,5 para sempre. |

**Exausta: jogar depois da energia acabar** (hoje é castigo)
| Item | Efeito |
|---|---|
| Hora extra | +$1 para cada arrasto feito depois de exausta. |
| Adubo | Torrão encostado numa Rocha ou maior rende $1 em vez de custar $2. |
| Teimosa | Cada torrão no fim do dia dá +1 permanente ao valor do ferro. |
| Minhoca | Dois torrões que se encontram somem. |

**Parede: aproveitar as paredes do tabuleiro**
| Item | Efeito |
|---|---|
| Eco | Pedrinha encostada numa parede cospe com +1 nível. |
| Britadeira | Uma vez por dia, toque numa parede para quebrá-la. |
| Musgo | +$2 para cada parede que tiver pedrinha encostada no fim do dia. |

**Economia**
| Item | Efeito |
|---|---|
| Cofrinho | De manhã, rende +$1 a cada $10 guardados (máximo +$5). |
| Colecionadora | +$2 por tipo diferente de minério achado no dia. |
| Avarenta | ×2 em tudo, mas só se não houver nenhum torrão. |

### Exemplo de como uma jogada "ruim" vira ótima
Dia sem nenhuma pedrinha grande, tabuleiro lotado de Cascalho e Pedra, 14 pedrinhas:
- **Sem itens:** uns $6.
- **Com Peneira fina + Vaquinha + Formigueiro:** todas cospem cobre, +$1 cada, ×2 por estar cheio: **(14 + 14) × 2 = $56**. A pior jogada de hoje vira a melhor.

---

## 2. Paredes no tabuleiro

Blocos de rocha-mãe fixos: **não deslizam, não se fundem**, e as pedrinhas param ao bater neles. Mudam o formato do tabuleiro e criam puzzles novos (cantos para empilhar, corredores).

- **Onde aparecem:** alguns caminhos do mapa têm paredes. Ex.: "Galeria" com uma parede no meio, "Corredor" com uma coluna de paredes.
- **Com itens,** a parede deixa de ser só obstáculo: Eco, Britadeira e Musgo (acima) premiam quem usa as paredes.
- Visual: pedra escura, sem rosto, com rachaduras. É a única coisa no tabuleiro que não é um bichinho.

---

## 3. Mapa da mina

Toda manhã você vê 2 ou 3 entradas e escolhe uma. Cada uma muda o dia.

| Caminho | Regra do dia | Por que escolher |
|---|---|---|
| Veio comum | Dia normal. | Seguro. |
| Veio rico | Nasce mais Pedra e Rocha, mas só 30 de energia. | Rende mais com menos jogadas. |
| Galeria | Tabuleiro com 2 a 4 paredes. Itens de parede brilham. | Puzzle novo. |
| Galeria estreita | Tabuleiro 3x3 só hoje, tudo vale o dobro. | Puzzle apertado. |
| Desmoronamento | Começa com 3 torrões. Prêmio: um item raro garantido. | Troca dinheiro por item. |
| Mercador | Não minera. Compra itens. | Montar o cinto. |
| Fogueira | Não minera. Amanhã +15 de energia, ou troca um item por outro. | Respirar. |
| Evento | Uma escolha curta, com texto. | Surpresa. |

(Saiu a caverna escura: não saber a próxima peça muda pouco.)

### O fiscal da cota
O último dia da semana tem uma regra extra conhecida de manhã, como os chefes do Balatro: "torrão custa $5", "pedrinhas pequenas cospem nada", "só 25 de energia". Pagar a cota no dia do fiscal dá **+1 vaga no cinto** e uma figurinha no álbum.

---

## 4. Por que encerrar o dia mais cedo

Hoje não há motivo. Proposta: **energia que sobra fica guardada para o dia seguinte** (até +15).

Isso conversa com a ideia de "ir até onde dá": a energia limita o tamanho máximo da pedrinha. Guardando energia num dia ruim, amanhã você tem um dia longo e pode chegar a uma pedrinha que normalmente seria impossível. Itens podem premiar isso (ex.: "Madrugador": +$2 por energia guardada).

Já feito: o botão "Encerrar o dia" agora pede um segundo toque enquanto ainda há energia.

---

## 5. Combos de venda

Na hora de vender, o jogo procura combos sozinho, como as mãos do pôquer:

| Combo | Exemplo | Multiplicador |
|---|---|---|
| Par | 2 pratas | ×1,5 nos dois |
| Trinca | 3 ferros | ×2 nos três |
| Escadinha | cobre, ferro e prata | ×2 |
| Escadinha longa | cobre, ferro, prata e ouro | ×3 |
| Arco-íris | um de cada tipo | ×5 |

A **bolsa** guarda poucos minérios (começa com 3) para você fechar um combo amanhã. Itens podem mexer nisso (bolsa maior, Par valendo ×2).

---

## 6. Álbum (entre partidas)

Registra minérios, itens, pedrinhas brilhantes (1 em 50, cospem em triplo), fiscais vencidos e recordes. Páginas completas liberam **variedade no sorteio** (itens novos, caminhos novos, o nível Geodo real), não força. Para ter álbum, a partida precisa acabar: falhar a cota **duas vezes seguidas** encerra a partida.

---

## Implementado (v0.5)
- Itens de equipamento (11), sem limite; pegar de novo sobe o nível (até 3).
- Cálculo do cuspe com bônus e multiplicadores, itens pulando na revelação.
- Energia guardada (até 15), paredes, mapa com 7 caminhos e o fiscal.
- Cada semana é um andar novo (nome e cor), com cota calibrada por simulação: cresce como a renda até o andar 4 e depois aperta.

## Ordem sugerida
1. **Equipamento** com 8 itens (2 de cada estratégia) e o novo cálculo do cuspe, mais a **energia guardada**.
2. **Paredes** e o **mapa** com 4 caminhos e o fiscal.
3. **Combos de venda.**
4. **Álbum** e o fim da partida.
