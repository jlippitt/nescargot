import { createHardware } from 'hardware';
import CanvasScreen from 'screen/CanvasScreen';

async function loadRomData(): Promise<Uint8Array> {
  const romUrl = new URLSearchParams(location.search).get('url');

  if (!romUrl) {
    throw new Error('No ROM specified');
  }

  const response = await fetch(romUrl);

  if (!response.ok) {
    throw new Error('Failed to fetch ROM data');
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function runInBrowser(): Promise<void> {
  const container = document.getElementById('nescargot');

  if (!container) {
    throw new Error('No container element found on page');
  }

  const romData = await loadRomData();

  const screen = new CanvasScreen(container);

  const { cpu, ppu } = createHardware({
    romData,
    screen,
  });

  function renderFrame(): void {
    let done = false;

    while (!done) {
      const ticks = cpu.tick();
      done = ppu.tick(ticks);
    }

    screen.update();

    window.requestAnimationFrame(renderFrame);
  }

  window.requestAnimationFrame(renderFrame);
}
