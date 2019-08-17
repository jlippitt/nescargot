import Float32SampleBuffer from 'apu/buffers/Float32SampleBuffer';
import AudioController from 'audio/AudioController';
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

  const sampleBuffer = new Float32SampleBuffer();

  const { cpu, ppu, apu, mapper, joypad } = createHardware({
    romData,
    screen,
    sampleBuffer,
  });

  const audioController = new AudioController();

  let prevFrameTime = window.performance.now();
  let excessTicks = 0;
  let frameRequest: number;

  function renderFrame(now: number): void {
    const allowedTicks =
      ((now - prevFrameTime) * MASTER_CLOCK_RATE) / 12 / 1000 - excessTicks;

    let currentTicks = 0;

    joypad.poll();

    while (currentTicks < Math.ceil(allowedTicks)) {
      const ticks = cpu.tick();
      ppu.tick(ticks);
      apu.tick(ticks);
      mapper.tick(ticks);
      currentTicks += ticks;
    }

    prevFrameTime = now;
    excessTicks = Math.max(0, currentTicks - allowedTicks);

    const audioBuffer = sampleBuffer.fetchAvailableAudioData();

    if (audioBuffer) {
      audioController.sendAudioData(audioBuffer);
    }

    if (!document.hidden) {
      frameRequest = window.requestAnimationFrame(renderFrame);
    }
  }

  window.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      audioController.suspend();
      window.cancelAnimationFrame(frameRequest);
    } else {
      audioController.resume();
      frameRequest = window.requestAnimationFrame(renderFrame);
      prevFrameTime = window.performance.now();
      excessTicks = 0;
    }
  });

  frameRequest = window.requestAnimationFrame(renderFrame);
}
