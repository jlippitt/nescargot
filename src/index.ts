import fs from 'fs';

import { createHardware } from 'hardware';
import { error } from 'log';
import CanvasScreen from 'screen/canvas';
import DummyScreen from 'screen/dummy';

async function run() {
  const canvas = document.getElementById('nescargot');

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('No canvas found on page');
  }

  const romUrl = new URLSearchParams(location.search).get('url');

  if (!romUrl) {
    throw new Error('No ROM specified');
  }

  const response = await fetch(romUrl);

  if (!response.ok) {
    throw new Error('Failed to fetch ROM data');
  }

  const romData = new Uint8Array(await response.arrayBuffer());

  const screen = new CanvasScreen(canvas);

  const { cpu, ppu } = createHardware({
    romData,
    screen,
  });

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
  run().catch(error);
} else {
  runHeadless();
}
