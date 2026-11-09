# Ptui! (um-passo)

**2048 Astros** (até 2026-11-09 se chamava 2048 Stars): o jogo de juntar peças com a escada de corpos celestes em 3D (Poeira até Galáxia), código em `src/espaco.js` (motor) e `src/espaco_jogo.js` (integração). É o padrão desde 2026-11-08. `?espaco=0` volta ao **Ptui!** antigo, o puzzle de mineração com pedrinhas que cospem minério (fica gravado no aparelho; `?espaco` religa). Publicado em https://guipfranco.github.io/um-passo/ (laboratório: `?lab`).

## Modos (ordem do menu)

- **Jornada** (o antigo Clássico de fases): 10 mundos de 12 fases, cada mundo apresenta um passo de uma mecânica, da mais simples para a mais complexa, e explora como ela interage com as antigas (o desenho está em `proposta.html`; o caminho real, gerado do jogo, em `caminho.html`). Os 10 mundos estão prontos (um mundo com `breve:true` em MUNDOS aparece como "em construção"). O lixo espacial ('L' no mapa, meta `{rache:n}`) racha com junção na casa ao lado. Para calibrar quando o disco C: estiver cheio, rode com `TMP=E:\tmp\edge` (o navegador sem janela guarda o perfil na pasta temporária). Cada fase tem uma ou mais metas e até 3 estrelas. Código em `src/classico.js`; mundos e fases em `src/missoes.js`; arrastos e estrelas em `src/missoes_calib.js` (`python testes/calibrar.py --grava`); quebra-cabeças em `src/quebracabecas.js` (gerados por `testes/calibrar/quebracabecas.html`).
- **Mineração**: o roguelite (andares, mapa, loja, itens, fiscal).
- **Laboratório**: testar qualquer regra; dele saem o Editor de níveis e o Catálogo.

## Fundo e malha do espaço

- Céu (`ceuDesenha` em `src/espaco_jogo.js`): nebulosa viva pela placa de vídeo (`NEB`), estrelas e planeta do mundo em camadas que andam com a câmera, passagens (cometa, satélite, chuva, nave), névoa na cor do planeta a cada junção e anel só no recorde da partida (`S.espMax`). Sem WebGL, volta o céu pintado (`buildFundo` sem `semNebulosa`).
- Malha da gravidade (`malhaQuadro`): rede na cor do mundo, atrás das peças, afundada pelo peso de cada planeta (o poço escurece); treme a cada junção e ganha uma onda no recorde. Respeita as casas vazias do formato. Rascunhos: `fundo.html` e `malha.html`.
- Desempenho: a malha é desenhada em poucos traços agrupados e só quando algo se mexe; a nebulosa fica numa camada própria (`#neb`) a 30 quadros por segundo; peças paradas não são redesenhadas; se o quadro passar de 9 ms em média, a malha cai para 30 quadros por segundo. Medidor no aparelho: abrir o jogo com `?fps`.
- Arrasto: arrastando rápido, a jogada vale na hora (sem esperar soltar o dedo); devagar, segue a prévia (dá para voltar e desistir).

## Som do espaço

- Efeitos: `SONS_ESP` em `src/sfx.js` (cada corpo com o seu material; eco e delay próprios). No espaço eles substituem os da mina; a Mineração segue com os sons antigos.
- Músicas: eletrônicas tocadas na hora, sem arquivo (`musica/eletronica.js`): Estação no menu e na lista de fases, Órbita nas fases da Jornada, Pulsar no Clássico (`qualTrilha` em `src/sfx.js`). Rascunho para ouvir e comparar: `som.html`.

## Montar e publicar

- O código fica em `src/` (`jogo.js` é a lógica; `config.js` os dados; `svg.js` a arte). O HTML e o CSS ficam em `build.py`.
- `python build.py` monta o `index.html`. Não edite o `index.html` à mão.
- Publicar é commit e push em `main`; o GitHub Pages atualiza em 1 a 2 minutos.

## Testes

- `python testes/rodar.py` roda tudo no Edge sem janela (uns 45 s). `python testes/rodar.py editor -v` roda só um e mostra o log.
- Cada página em `testes/` abre o jogo num iframe, mexe nele e escreve `{log, errs}`. O teste falha se aparecer erro.
- Eles conferem que nada quebra, não os números do balanceamento: a mecânica ainda está mudando. Quando um teste ficar velho por mudança de regra, ajuste o teste.
- Rode depois de cada mudança e antes de publicar.
- Calibrar o Clássico: `python testes/calibrar.py 20 1-48 --grava` e depois `... 49-96 --grava` (cada metade leva uns 15 a 30 min). Dois robôs (`testes/calibrar/robo.js`) jogam cada fase e vale o melhor: o do canto (táticas do 2048) e o da meta. Recalibre quando mudar regra, fase ou tamanho de tabuleiro; mudança só visual não pede. Fases marcadas DIFÍCIL (robô cumpre menos de 70%) merecem revisão.
- Desenho do caminho da Jornada (`caminho.html`: onde cada mecânica estreia, treina e se mistura, com a dificuldade dos robôs): depois de mudar fases e recalibrar, rode `python testes/caminho.py` para regenerar `caminho_dados.js`. A regra de progressão combinada com o Guilherme está no topo da página: uma novidade por fase, estreia sozinha pedindo 1, pelo menos 2 fases de treino sozinha antes de misturar.
- Até onde se sobe em cada tamanho de tabuleiro: abrir `testes/calibrar/subida.html#20:4` no Edge sem janela (20 partidas no 4x4). Quebra-cabeças: `testes/calibrar/quebracabecas.html` gera e confere.
