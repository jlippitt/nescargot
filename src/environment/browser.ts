import { createAudioController } from 'audio/AudioController';
import { createHardware } from 'Hardware';
import CanvasScreen from 'screen/CanvasScreen';

const MASTER_CLOCK_RATE = 21477270;

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

  const audioController = await createAudioController();

  const { cpu, ppu, apu } = createHardware({
    romData,
    screen,
  });

  audioController.start();

  let prevFrameTime = window.performance.now();
  let excessTicks = 0;

  function renderFrame(now: number): void {
    const allowedTicks =
      ((now - prevFrameTime) * MASTER_CLOCK_RATE) / 12 / 1000 - excessTicks;

    let currentTicks = 0;

    while (currentTicks < Math.ceil(allowedTicks)) {
      const ticks = cpu.tick();

      if (ppu.tick(ticks)) {
        screen.update();
      }

      apu.tick(ticks);

      currentTicks += ticks;
    }

    prevFrameTime = now;
    excessTicks = Math.max(0, currentTicks - allowedTicks);

    window.requestAnimationFrame(renderFrame);
  }

  window.requestAnimationFrame(renderFrame);
}
