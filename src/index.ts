import fs from 'fs';

import Cpu from 'cpu';
import { createMapper } from 'mapper';
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
  const cpu = new Cpu(mapper);

  while (true) {
    cpu.tick();
  }
}

if (typeof window !== 'undefined') {
  run();
} else {
  runHeadless();
}
