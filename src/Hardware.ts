import APU from 'apu/APU';
import SampleBuffer from 'apu/buffers/SampleBuffer';
import CPU from 'cpu/CPU';
import DMA from 'DMA';
import Interrupt from 'Interrupt';
import Joypad from 'Joypad';
import Mapper, { createMapper } from 'mapper/Mapper';
import PPU from 'ppu/PPU';
import SampleReader from 'SampleReader';
import Screen from 'screen/Screen';

export default interface Hardware {
  cpu: CPU;
  ppu: PPU;
  apu: APU;
  mapper: Mapper;
  joypad: Joypad;
}

interface Options {
  romData: Uint8Array;
  screen: Screen;
  sampleBuffer: SampleBuffer;
}

export function createHardware({
  romData,
  screen,
  sampleBuffer,
}: Options): Hardware {
  const interrupt = new Interrupt();
  const mapper = createMapper(romData, interrupt);
  const ppu = new PPU({ screen, interrupt, mapper });
  const sampleReader = new SampleReader(interrupt);
  const apu = new APU({ interrupt, mapper, sampleBuffer, sampleReader });
  const joypad = new Joypad();
  const dma = new DMA(ppu.getOam(), interrupt);
  const cpu = new CPU({
    mapper,
    interrupt,
    ppu,
    apu,
    joypad,
    dma,
    sampleReader,
  });
  return { cpu, ppu, apu, mapper, joypad };
}
