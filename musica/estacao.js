// Estação: a trilha do menu e do mapa de fases. Da mesma família da Órbita, mais lenta e sem batida.
import { cria } from './eletronica.js';
export const { iniciarMusica, pararMusica } = cria({
  bpm: 84,
  prog: [[62, 66, 69, 73], [64, 68, 71, 74], [59, 62, 66, 69], [55, 59, 62, 66]],   // Ré lídio: Ré, Mi sobre Ré, Si menor, Sol
  raiz: [38, 38, 35, 31], pad: 0.016,
  arp: [0, 2, 1, 3, 4, 6, 5, 7], arpCada: 2, arpOnda: 'triangle', arpDur: 0.35, arpV: 0.035,
  baixo: [0, 10], baixoDur: 0.7, baixoV: 0.06,
  bumbo: [], bumboV: 0, chimbal: [4, 12], chimbalV: 0.012, palma: [], palmaV: 0,
});
