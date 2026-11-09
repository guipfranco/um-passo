"""Roda os testes do jogo no Edge (ou Chrome) sem janela.

Cada página .html desta pasta abre o index.html num iframe, mexe no jogo e escreve
{"log": [...], "errs": [...]} no <pre id="out">. O teste falha se errs não vier vazio.

  python testes/rodar.py              todos
  python testes/rodar.py editor -v    só os que têm "editor" no nome, mostrando o log

Tempo virtual por página: comentário <!-- tempo: 120000 --> no arquivo (padrão 30000 ms).
"""
import concurrent.futures, html, json, os, pathlib, re, shutil, subprocess, sys, tempfile

AQUI = pathlib.Path(__file__).resolve().parent
NAVEGADORES = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '/opt/pw-browsers/chromium', 'chromium', 'google-chrome', 'msedge',
]

def navegador():
    for n in NAVEGADORES:
        if os.path.isfile(n) or shutil.which(n):
            return n
    sys.exit('Não achei Edge nem Chrome.')

def roda(nav, arq):
    tempo = re.search(r'<!-- tempo: (\d+) -->', arq.read_text(encoding='utf-8'))
    perfil = tempfile.mkdtemp(prefix='ptui_')
    try:
      try:
        r = subprocess.run([nav, '--headless', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--force-prefers-reduced-motion',
                            f'--user-data-dir={perfil}', f'--virtual-time-budget={tempo.group(1) if tempo else 30000}',
                            '--dump-dom', arq.as_uri()],
                           capture_output=True, encoding='utf-8', errors='replace', timeout=300)
      except subprocess.TimeoutExpired:
        return arq.stem, False, {'log': [], 'errs': ['passou de 5 minutos (travou?)']}
    finally:
        shutil.rmtree(perfil, ignore_errors=True)
    m = re.search(r'<pre id="out"[^>]*>(.*?)</pre>', r.stdout, re.S)
    try:
        res = json.loads(html.unescape(m.group(1)))
    except Exception:
        return arq.stem, False, {'log': [], 'errs': ['não terminou (aumente o tempo ou veja se travou)']}
    return arq.stem, not res.get('errs'), res

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    ver = '-v' in sys.argv
    arqs = [a for a in sorted(AQUI.glob('*.html')) if not args or any(x in a.stem for x in args)]
    nav = navegador()
    falhas = 0
    # quantos navegadores ao mesmo tempo: 4 por padrão; PARALELO=1 ou 2 quando a máquina está ocupada (ex.: vários agentes testando)
    with concurrent.futures.ThreadPoolExecutor(int(os.environ.get('PARALELO', '4'))) as ex:
        for nome, ok, res in ex.map(lambda a: roda(nav, a), arqs):
            falhas += not ok
            print(f"{'OK    ' if ok else 'FALHOU'} {nome}")
            if ver or not ok:
                for l in res['log']: print('       ', l)
                for e in res['errs']: print('   ERRO', e)
    print(f'\n{len(arqs) - falhas} de {len(arqs)} passaram.')
    sys.exit(1 if falhas else 0)

main()
