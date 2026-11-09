// Pulsar: a trilha do Clássico, que pede mais ritmo. Da mesma família da Órbita, mais rápida e com batida reta.
import { cria } from './eletronica.js';
export const { iniciarMusica, pararMusica } = cria({
  bpm: 112,
  prog: [[59, 62, 66, 71], [55, 59, 62, 67], [62, 66, 69, 74], [57, 61, 64, 69]],   // Si menor, Sol, Ré, Lá
  raiz: [35, 31, 38, 33], pad: 0.011,
  arp: [0, 1, 2, 4, 2, 1, 3, 5], arpCada: 1, arpV: 0.024,
  baixo: [0, 3, 6, 8, 11, 14], baixoDur: 0.18, baixoV: 0.07,
  bumbo: [0, 4, 8, 12], bumboV: 0.13, chimbal: [2, 6, 10, 14], chimbalV: 0.03, palma: [4, 12], palmaV: 0.045,
});
