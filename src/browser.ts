import { createHardware } from 'hardware';
import CanvasScreen from 'screen/canvas';

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
  const canvas = document.getElementById('nescargot');

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('No canvas found on page');
  }

  const romData = await loadRomData();

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
