import { BootstrapOptions, GuiInterface, register } from 'snek-client';

import Float32SampleBuffer from 'apu/buffers/Float32SampleBuffer';
import { createHardware } from 'Hardware';
import CanvasScreen, { ExternalScreenInterface } from 'screen/CanvasScreen';

const MASTER_CLOCK_RATE = 21477270;
const CPU_CLOCK_RATE = MASTER_CLOCK_RATE / 12;

function bootstrap({ audio, screen, romData }: BootstrapOptions): GuiInterface {
  const sampleBuffer = new Float32SampleBuffer();

  const { cpu, ppu, apu, mapper, joypad } = createHardware({
    romData,
    screen: new CanvasScreen(screen),
    sampleBuffer,
  });

  let prevFrameTime = window.performance.now();
  let excessTicks = 0;

  const update = (now: number) => {
    const allowedTicks =
      ((now - prevFrameTime) * CPU_CLOCK_RATE) / 1000 - excessTicks;

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
      audio.sendAudioData(audioBuffer);
    }
  };

  const suspend = () => {};

  const resume = () => {
    prevFrameTime = window.performance.now();
    excessTicks = 0;
  };

  return {
    update,
    suspend,
    resume,
  };
}

export const runInBrowser = (): void =>
  register({
    name: 'NEScargot',
    system: 'NES',
    fileExtensions: ['nes'],
    screen: {
      width: 256,
      height: 240,
    },
    audio: {
      sampleRate: 11025,
    },
    bootstrap,
  });
