import fs from 'fs';

import DummySampleBuffer from 'apu/buffers/DummySampleBuffer';
import { createHardware } from 'Hardware';
import DummyScreen from 'screen/DummyScreen';

export function runInConsole(): void {
  if (process.argv.length < 3) {
    throw new Error('No ROM specified');
  }

  const romData = fs.readFileSync(process.argv[2]);

  const { cpu, ppu, apu, mapper } = createHardware({
    romData: new Uint8Array(romData.buffer),
    screen: new DummyScreen(),
    sampleBuffer: new DummySampleBuffer(),
  });

  while (true) {
    const ticks = cpu.tick();
    ppu.tick(ticks);
    apu.tick(ticks);
    mapper.tick(ticks);
  }
}
