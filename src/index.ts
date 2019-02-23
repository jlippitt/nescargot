import Cpu from 'cpu';
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
  const cpu = new Cpu();

  while (true) {
    cpu.tick();
  }
}

if (typeof window !== 'undefined') {
  run();
} else {
  runHeadless();
}
