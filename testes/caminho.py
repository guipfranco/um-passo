"""Gera caminho_dados.js, os dados do desenho do caminho da Jornada (caminho.html).

  python testes/caminho.py

Abre o jogo no Edge sem janela (testes/caminho/extrai.html), monta cada fase e anota as mecânicas dela; junta com a
dificuldade medida pelos robôs na última calibragem (testes/calibrar/dificuldade.json). Rode depois de mudar fases
(e de recalibrar) para o desenho acompanhar o jogo.
"""
import html, json, os, pathlib, re, shutil, subprocess, sys, tempfile, datetime
AQUI = pathlib.Path(__file__).resolve().parent
NAV = next((n for n in [r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
            r'C:\Program Files\Google\Chrome\Application\chrome.exe', '/opt/pw-browsers/chromium'] if os.path.isfile(n)), None) or sys.exit('Não achei Edge nem Chrome.')
perfil = tempfile.mkdtemp(prefix='ptui_')
try:
    url = (AQUI / 'caminho' / 'extrai.html').as_uri()
    r = subprocess.run([NAV, '--headless', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', f'--user-data-dir={perfil}',
                        '--virtual-time-budget=60000', '--dump-dom', url], capture_output=True, encoding='utf-8', errors='replace', timeout=300)
finally:
    shutil.rmtree(perfil, ignore_errors=True)
m = re.search(r'<pre id="out"[^>]*>(.*?)</pre>', r.stdout, re.S)
if not m or not m.group(1).strip().startswith('{'): sys.exit('Não terminou: ' + (m.group(1)[:400] if m else r.stdout[-400:]))
dados = json.loads(html.unescape(m.group(1)))
dif = AQUI / 'calibrar' / 'dificuldade.json'
dados['dificuldade'] = json.loads(dif.read_text(encoding='utf-8')) if dif.exists() else {}
dados['gerado'] = datetime.date.today().isoformat()
arq = AQUI.parent / 'caminho_dados.js'
arq.write_text('// Gerado por testes/caminho.py (não edite à mão): as fases da Jornada e a dificuldade medida pelos robôs.\n'
               'const CAMINHO = ' + json.dumps(dados, ensure_ascii=False) + ';\n', encoding='utf-8')
print(f'gravado: {arq} ({len(dados["fases"])} fases)')
