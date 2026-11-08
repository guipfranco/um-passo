"""Calibra as fases do Clássico: um robô que joga como quem sabe 2048 (e corre atrás das metas) joga cada fase
N vezes sem limite e mede quantos arrastos usa para cumprir. Daí saem os arrastos e as estrelas.

  python testes/calibrar.py [N] [a-b] [--grava]

  N        partidas por fase (padrão 20)
  a-b      só as fases de a até b
  --grava  grava src/missoes_calib.js (mantém as fases que não foram recalibradas)

Fases que o robô cumpre em menos de 70% das vezes aparecem marcadas como DIFÍCIL.
Os quebra-cabeças não passam por aqui: testes/calibrar/quebracabecas.html gera e confere.
"""
import html, json, os, pathlib, re, shutil, subprocess, sys, tempfile
AQUI = pathlib.Path(__file__).resolve().parent
NAV = next((n for n in [r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
            r'C:\Program Files\Google\Chrome\Application\chrome.exe', '/opt/pw-browsers/chromium'] if os.path.isfile(n)), None) or sys.exit('Não achei Edge nem Chrome.')
args = [a for a in sys.argv[1:] if not a.startswith('--')]
n = next((a for a in args if a.isdigit()), '20')
faixa = next((a for a in args if '-' in a), None)
perfil = tempfile.mkdtemp(prefix='ptui_')
try:
    url = (AQUI / 'calibrar' / 'classico.html').as_uri() + '#' + n + (':' + faixa if faixa else '')
    r = subprocess.run([NAV, '--headless', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', f'--user-data-dir={perfil}',
                        '--virtual-time-budget=900000', '--dump-dom', url], capture_output=True, encoding='utf-8', errors='replace', timeout=1200)
finally:
    shutil.rmtree(perfil, ignore_errors=True)
m = re.search(r'<pre id="out"[^>]*>(.*?)</pre>', r.stdout, re.S)
if not m: sys.exit('Não terminou.')
tabela, js = html.unescape(m.group(1)).split('=====')
print(tabela.strip())
if '--grava' in sys.argv:
    arq = AQUI.parent / 'src' / 'missoes_calib.js'
    velho = {int(k): [int(a), int(b), int(c)] for k, a, b, c in re.findall(r'(\d+):\[(\d+),(\d+),(\d+)\]', arq.read_text(encoding='utf-8'))}
    velho.update({int(k): v for k, v in json.loads(js).items()})
    linhas = ',\n'.join(f'  {k}:[{v[0]},{v[1]},{v[2]}]' for k, v in sorted(velho.items()))
    arq.write_text("// Arrastos e estrelas de cada fase do Clássico, calibrados com o robô (testes/calibrar/classico.html).\n"
                   "// fase: [arrastos, sobrando para ★★, sobrando para ★★★]. Os quebra-cabeças usam os valores de quebracabecas.js.\n"
                   "const CALIB = {\n" + linhas + "\n};\n"
                   "MISSOES.forEach((m,i)=>{ const c=CALIB[i+1]; if(c){ m.arrastos=c[0]; m.estrelas=[c[1],c[2]]; } });\n", encoding='utf-8')
    print(f'\ngravado: {arq} ({len(velho)} fases)')
