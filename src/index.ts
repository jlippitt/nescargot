import Screen from 'screen';

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
