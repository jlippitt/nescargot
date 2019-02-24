import fs from 'fs';

import CPU from 'cpu';
import { createMapper } from 'mapper';
import PPU from 'ppu';
import Screen from 'screen';

function run() {
  const canvas = document.getElementById('nescargot');

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('No canvas found on page');
  }

  const screen = new Screen(canvas);

  function renderFrame(): void {
    screen.update();
    window.requestAnimationFrame(renderFrame);
  }

  window.requestAnimationFrame(renderFrame);
}

function runHeadless() {
  if (process.argv.length < 3) {
    throw new Error('No ROM specified');
  }

  const romData = fs.readFileSync(process.argv[2]);

  const mapper = createMapper(new Uint8Array(romData.buffer));
  const ppu = new PPU();
  const cpu = new CPU({ mapper, ppu });

  while (true) {
    cpu.tick();
  }
}

if (typeof window !== 'undefined') {
  run();
} else {
  runHeadless();
}
