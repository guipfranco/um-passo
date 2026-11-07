# Ptui! (um-passo)

Puzzle de mineração com pedrinhas que cospem minério. Publicado em https://guipfranco.github.io/um-passo/ (laboratório: `?lab`).

## Modos (ordem do menu)

- **Clássico**: fases soltas, cada uma com uma missão e até 3 estrelas. As fases ficam em `src/missoes.js`.
- **Mineração**: o roguelite (andares, mapa, loja, itens, fiscal).
- **Laboratório**: testar qualquer regra; dele saem o Editor de níveis e o Catálogo.

## Montar e publicar

- O código fica em `src/` (`jogo.js` é a lógica; `config.js` os dados; `svg.js` a arte). O HTML e o CSS ficam em `build.py`.
- `python build.py` monta o `index.html`. Não edite o `index.html` à mão.
- Publicar é commit e push em `main`; o GitHub Pages atualiza em 1 a 2 minutos.

## Testes

- `python testes/rodar.py` roda tudo no Edge sem janela (uns 45 s). `python testes/rodar.py editor -v` roda só um e mostra o log.
- Cada página em `testes/` abre o jogo num iframe, mexe nele e escreve `{log, errs}`. O teste falha se aparecer erro.
- Eles conferem que nada quebra, não os números do balanceamento: a mecânica ainda está mudando. Quando um teste ficar velho por mudança de regra, ajuste o teste.
- Rode depois de cada mudança e antes de publicar.
