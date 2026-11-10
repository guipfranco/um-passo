# Publica o jogo montado no repositório público "2048-astros" (só o que o navegador precisa: a página, as músicas e a
# imagem da prévia). O código-fonte, os testes, os rascunhos e as anotações ficam só neste repositório (privado).
# Uso:
#   python publicar.py                      monta e publica o jogo
#   python publicar.py fundo.html malha.html também publica esses rascunhos (com os arquivos que eles carregam)
#   python publicar.py bastidores.html       a página de bastidores (leva junto a pasta bastidores/ com as fotos)
# O clone do repositório público fica ao lado deste: ../2048-astros (git clone https://github.com/guipfranco/2048-astros).
import os, re, shutil, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(os.path.dirname(AQUI), '2048-astros')
if not os.path.isdir(os.path.join(PUB, '.git')):
    sys.exit(f'Não achei o clone do repositório público em {PUB}.\n'
             'Rode: git clone https://github.com/guipfranco/2048-astros ' + PUB)

subprocess.run([sys.executable, os.path.join(AQUI, 'build.py')], check=True)

arquivos = ['index.html', 'previa.jpg'] + ['musica/' + f for f in sorted(os.listdir(os.path.join(AQUI, 'musica'))) if f.endswith('.js')]
# rascunhos pedidos: o próprio arquivo e os scripts locais que ele carrega (ex.: src/espaco.js)
for r in sys.argv[1:]:
    arquivos.append(r)
    html = open(os.path.join(AQUI, r), encoding='utf-8').read()
    for src in re.findall(r'<script[^>]+src="([^"#?]+)', html):
        if not src.startswith('http'):
            arquivos.append(src)
    # a pasta de mesmo nome, se houver (ex.: bastidores/ com as fotos de bastidores.html)
    pasta = os.path.join(AQUI, os.path.splitext(r)[0])
    if os.path.isdir(pasta):
        for raiz, _, fs in os.walk(pasta):
            arquivos += [os.path.relpath(os.path.join(raiz, f), AQUI).replace(os.sep, '/') for f in fs]

for a in dict.fromkeys(arquivos):
    origem, destino = os.path.join(AQUI, a), os.path.join(PUB, a)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    shutil.copy2(origem, destino)
    print('  ', a)

versao = subprocess.run(['git', '-C', AQUI, 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip()
subprocess.run(['git', '-C', PUB, 'add', '-A'], check=True)
if subprocess.run(['git', '-C', PUB, 'diff', '--cached', '--quiet']).returncode == 0:
    print('Nada mudou no jogo publicado.')
    sys.exit(0)
subprocess.run(['git', '-C', PUB, 'commit', '-q', '-m', f'Publica o jogo (código {versao})'], check=True)
subprocess.run(['git', '-C', PUB, 'push', '-q', 'origin', 'HEAD'], check=True)
print('Publicado: https://guipfranco.github.io/2048-astros/ (o GitHub Pages leva 1 a 2 minutos)')
