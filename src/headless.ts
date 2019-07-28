import fs from 'fs';

import { createHardware } from 'hardware';
import DummyScreen from 'screen/DummyScreen';

export function runHeadless(): void {
  if (process.argv.length < 3) {
    throw new Error('No ROM specified');
  }

  const romData = fs.readFileSync(process.argv[2]);

  const { cpu, ppu } = createHardware({
    romData: new Uint8Array(romData.buffer),
    screen: new DummyScreen(),
  });

  while (true) {
    const ticks = cpu.tick();
    ppu.tick(ticks);
  }
}
