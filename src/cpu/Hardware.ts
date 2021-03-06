import APU from 'apu/APU';
import DMA from 'DMA';
import Interrupt from 'Interrupt';
import Joypad from 'Joypad';
import Mapper from 'mapper/Mapper';
import PPU from 'ppu/PPU';
import SampleReader from 'SampleReader';

export default interface Hardware {
  joypad: Joypad;
  mapper: Mapper;
  interrupt: Interrupt;
  apu: APU;
  ppu: PPU;
  dma: DMA;
  sampleReader: SampleReader;
}
