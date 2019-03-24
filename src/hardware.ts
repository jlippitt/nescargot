import CPU from 'cpu';
import Interrupt from 'interrupt';
import { createMapper } from 'mapper';
import PPU from 'ppu';
import Screen from 'screen';

interface Hardware {
  cpu: CPU;
  ppu: PPU;
}

interface Options {
  romData: Uint8Array;
  screen: Screen;
}

export function createHardware({ romData, screen }: Options): Hardware {
  const mapper = createMapper(romData);
  const interrupt = new Interrupt();
  const ppu = new PPU({ screen, interrupt, mapper });
  const cpu = new CPU({ mapper, interrupt, ppu });
  return { cpu, ppu };
}
