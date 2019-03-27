import CPU from 'cpu';
import Interrupt from 'interrupt';
import Joypad from 'joypad';
import { createMapper } from 'mapper';
import PPU from 'ppu';
import Screen from 'screen';

interface Hardware {
  cpu: CPU;
  ppu: PPU;
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
  const joypad = new Joypad();
  const cpu = new CPU({ mapper, interrupt, ppu, joypad });
  return { cpu, ppu, joypad };
}
