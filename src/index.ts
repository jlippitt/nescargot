import fs from 'fs';

import Cpu from 'cpu';
import Rom from 'rom';
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

  const rom = new Rom(fs.readFileSync(process.argv[2]));
  const cpu = new Cpu(rom);

  while (true) {
    cpu.tick();
  }
}

if (typeof window !== 'undefined') {
  run();
} else {
  runHeadless();
}
