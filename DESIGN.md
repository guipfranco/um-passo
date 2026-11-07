# Um Passo (nome provisório)

Puzzle roguelike de celular: você é um número num tabuleiro pequeno, anda uma casa por swipe e cresce absorvendo monstros do seu tamanho.

## A ideia em uma frase

O "mover um passo só" do Threes, com a lógica de dungeon crawl: cada swipe é um turno, o mundo reage, e o número que você carrega é ao mesmo tempo seu nível, sua força e seu objetivo.

## Pilares

1. **Um swipe, uma decisão.** Nada de deslizar até a parede como no 2048. Cada passo pesa.
2. **Ler o tabuleiro de relance.** A comparação com o seu número tem que ser instantânea: igual brilha, menor apaga, maior ameaça.
3. **Crescer muda o tabuleiro.** Quando você sobe de nível, o que era ameaça vira comida e o que era comida vira lixo. O mesmo tabuleiro vira outro puzzle.
4. **Partidas curtas.** Uma run de 5 a 10 minutos, jogável com o polegar.

## Regras do protótipo (v0.1)

| Você bate em... | Resultado |
|---|---|
| Casa vazia | anda |
| Monstro **igual** | absorve, sobe +1 nível |
| Monstro **menor** | derrota, ganha ouro (não sobe) |
| Monstro **maior** | perde 1 vida, não anda |
| Parede | nada (não gasta turno) |

- Tabuleiro 5x5, você começa no 1 no centro, com 3 vidas (máximo 6).
- Todo turno nasce um monstro; o próximo aparece em "Próximo" (herança direta do Threes).
- Os valores que nascem giram em torno do seu nível (de -2 a +2, com mais peso no igual e no -1).
- **Relógio do andar:** a cada 10 turnos, todos os monstros crescem +1. Sem isso não havia pressão nenhuma (um bot guloso passava do andar 170 sem morrer). Agora ficar farmando tem custo e o tabuleiro muda sozinho: o que era menor vira do seu tamanho, o que era igual vira ameaça.
- Se não houver nenhum monstro do seu tamanho, o próximo a nascer é garantido igual. Isso evita travar.
- **Caçadores** (redondos, a partir do andar 2) andam na sua direção a cada 2 turnos e atacam se forem maiores. Eles avisam um turno antes (anel vermelho).
- Ao chegar no nível-meta, abre uma escada. Descer = próximo andar, você mantém o nível e escolhe 1 de 3 bênçãos.

### Por que "menor" não te faz subir

Se tudo que é menor desse nível, o jogo vira "coma tudo". Deixando só o igual subir, o jogador precisa **procurar** o par certo, e os menores viram obstáculo que dá para limpar (com recompensa em ouro). É aqui que nasce o puzzle. A bênção "Voraz" testa a versão alternativa.

## Loop

- **Micro (turno):** olhar o tabuleiro, achar o próximo igual, planejar o caminho sem ficar ao lado de um maior.
- **Médio (andar):** chegar ao nível-meta e alcançar a escada antes de ser encurralado.
- **Macro (run):** montar uma combinação de bênçãos que muda como você joga.
- **Meta (entre runs, futuro):** desbloquear personagens, bênçãos e tipos de andar.

## Alavancas para testar (todas no `CFG` do código)

- Tamanho do tabuleiro (4x4 é mais apertado e tenso; 6x6 dá mais espaço para planejar).
- Tabela de nascimento: mais iguais = mais fluido, mais maiores = mais tenso.
- Nascer todo turno ou a cada 2.
- Bater no maior: custa vida (atual) ou simplesmente é proibido (puzzle puro, sem dano)?
- Ritmo dos caçadores.
- Quantos níveis subir por andar (hoje 2, 2, 3, 3, 4, 4...).
- Intervalo do relógio de crescimento (hoje 10 turnos).

## Variações de regra que valem um teste

1. **O mundo anda junto (mais Threes):** a cada swipe, todos os monstros também andam uma casa na mesma direção, se puderem. Vira puzzle de empurrar e alinhar.
2. **Monstros se fundem entre si:** dois 3 que se encostam viram um 4. O tabuleiro "evolui" se você demorar.
3. **Somar em vez de +1:** absorver um 3 sendo 3 vira 6 (mais perto do 2048/Threes). Números crescem rápido, sensação de poder maior.
4. **Absorver menor tira vida, não dá ouro:** menores viram bloqueio puro.
5. **Seu número é sua vida:** bater num maior te faz perder níveis em vez de corações. Uma barra só, mais elegante.

## Ideias de conteúdo para depois

- **Tipos de monstro:** parado, caçador, fujão (corre de você e some se não pegar), bomba (explode em X turnos), escudo (precisa de 2 batidas), espelho (sempre igual ao seu número, mas foge), divisor (ao morrer vira dois menores).
- **Itens no chão:** poção, chave, troca de posição, "-1 em todos os vizinhos".
- **Andares especiais:** loja (gasta o ouro), chefão (um 10 que só cai se você chegar a 10, ou com espinhos), sala-puzzle fixa sem aleatoriedade.
- **Personagens:** um que começa com 2 vidas mas sobe com menores; outro que empurra; outro que anda na diagonal.
- **Desafio diário:** mesma semente para todo mundo, placar compartilhado.

## Perguntas em aberto

- O jogo é mais **puzzle** (pouca aleatoriedade, tabuleiro "resolvível") ou mais **roguelike** (sobreviver ao caos)? O protótipo está no meio. Jogar algumas runs vai mostrar para que lado puxa.
- Ouro serve para quê? Loja entre andares é o caminho natural.
- Tema visual: números puros (abstrato, tipo Threes) ou criaturas com o número em cima (mais dungeon)?

## Próximos passos

1. Jogar no celular umas 10 runs e anotar o que irrita e o que dá vontade de jogar de novo.
2. Testar as variações 1 e 5, que mudam mais o jogo.
3. Escolher a direção (puzzle x roguelike) e cortar o que não serve.
4. Loja + 2 novos tipos de monstro.
5. Publicar como PWA (GitHub Pages) para jogar pelo celular sem instalar nada.
