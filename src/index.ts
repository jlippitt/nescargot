import fs from 'fs';

import { createHardware } from 'hardware';
import CanvasScreen from 'screen/canvas';
import DummyScreen from 'screen/dummy';

function run() {
  const canvas = document.getElementById('nescargot');

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('No canvas found on page');
  }

  const screen = new CanvasScreen(canvas);

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

  const { cpu, ppu } = createHardware({
    romData: new Uint8Array(romData.buffer),
    screen: new DummyScreen(),
  });

  while (true) {
    const ticks = cpu.tick();
    ppu.tick(ticks);
  }
}

if (typeof window !== 'undefined') {
  run();
} else {
  runHeadless();
}
