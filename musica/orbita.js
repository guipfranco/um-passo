// Órbita: a trilha das fases da Jornada (aprovada no rascunho som.html). Arpejo que gira, baixo, batida leve.
import { cria } from './eletronica.js';
export const { iniciarMusica, pararMusica } = cria({
  bpm: 100,
  prog: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 66]],   // Ré, Si menor, Sol, Lá
  raiz: [38, 35, 31, 33], pad: 0.012,
  arp: [0, 1, 2, 3, 6, 7, 2, 1], arpCada: 1, arpV: 0.026,
  baixo: [0, 4, 8, 12, 14], baixoV: 0.07,
  bumbo: [0, 8], bumboV: 0.14, chimbal: [2, 6, 10, 14], chimbalV: 0.028, palma: [4, 12], palmaV: 0.04,
});
