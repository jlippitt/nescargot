import Interrupt from 'Interrupt';
import Joypad from 'Joypad';
import Mapper from 'mapper/Mapper';
import PPU from 'ppu/PPU';

import DMA from './DMA';

export default interface Hardware {
  joypad: Joypad;
  mapper: Mapper;
  interrupt: Interrupt;
  ppu: PPU;
  dma: DMA;
}
