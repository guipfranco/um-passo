"""Calibra as fases do Clássico: um robô guloso joga cada fase N vezes (padrão 100) com as regras do jogo.

  python testes/calibrar.py [N]

Mostra, por fase, quanto o robô cumpre a missão e os totais do dia (p25/p50/p75/p90).
Regra usada até aqui: estrelas ≈ [p50 a p60, p90] do robô; cada grupo começa fácil e termina mais difícil.
"""
import html, os, pathlib, re, shutil, subprocess, sys, tempfile
AQUI = pathlib.Path(__file__).resolve().parent
NAV = next((n for n in [r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
            r'C:\Program Files\Google\Chrome\Application\chrome.exe', '/opt/pw-browsers/chromium'] if os.path.isfile(n)), None) or sys.exit('Não achei Edge nem Chrome.')
n = sys.argv[1] if len(sys.argv) > 1 else '100'
perfil = tempfile.mkdtemp(prefix='ptui_')
try:
    r = subprocess.run([NAV, '--headless', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', f'--user-data-dir={perfil}',
                        '--virtual-time-budget=100000', '--dump-dom', (AQUI / 'calibrar' / 'classico.html').as_uri() + '#' + n],
                       capture_output=True, encoding='utf-8', errors='replace', timeout=600)
finally:
    shutil.rmtree(perfil, ignore_errors=True)
m = re.search(r'<pre id="out"[^>]*>(.*?)</pre>', r.stdout, re.S)
print(html.unescape(m.group(1)) if m else 'Não terminou.')
