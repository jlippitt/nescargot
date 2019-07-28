import Interrupt from 'interrupt';
import Joypad from 'joypad';
import Mapper from 'mapper';
import PPU from 'ppu';

import DMA from './DMA';

export default interface Hardware {
  joypad: Joypad;
  mapper: Mapper;
  interrupt: Interrupt;
  ppu: PPU;
  dma: DMA;
}
