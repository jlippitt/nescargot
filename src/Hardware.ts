import APU from 'apu/APU';
import CPU from 'cpu/CPU';
import DMA from 'DMA';
import Interrupt from 'Interrupt';
import Joypad from 'Joypad';
import { createMapper } from 'mapper/Mapper';
import PPU from 'ppu/PPU';
import Screen from 'screen/Screen';

export default interface Hardware {
  cpu: CPU;
  ppu: PPU;
  apu: APU;
  joypad: Joypad;
}

interface Options {
  romData: Uint8Array;
  screen: Screen;
}

export function createHardware({ romData, screen }: Options): Hardware {
  const mapper = createMapper(romData);
  const interrupt = new Interrupt();
  const ppu = new PPU({ screen, interrupt, mapper });
  const apu = new APU();
  const joypad = new Joypad();
  const dma = new DMA(ppu.getOam(), interrupt);
  const cpu = new CPU({ mapper, interrupt, ppu, apu, joypad, dma });
  return { cpu, ppu, apu, joypad };
}
