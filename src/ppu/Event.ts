import Interrupt from 'Interrupt';
import Mapper from 'mapper/Mapper';
import { PPUState } from 'ppu/PPU';
import Screen from 'screen/Screen';

import { SCREEN_HEIGHT } from '../constants';
import Renderer from './Renderer';

const TOTAL_LINES = 262;
const POST_RENDER_LINE = SCREEN_HEIGHT;
const PRE_RENDER_LINE = TOTAL_LINES - 1;

export interface EventOptions {
  state: PPUState;
  interrupt: Interrupt;
  mapper: Mapper;
  renderer: Renderer;
}

export type Event = (options: EventOptions) => NextEvent;

export type NextEvent = [Event, number];

export function render({ state, renderer }: EventOptions): NextEvent {
  renderer.renderLine();

  if (state.mask.renderingEnabled) {
    state.registers.copyHorizontalBits();
  }

  return [hblank1, 4];
}

export function hblank1({ state, mapper }: EventOptions): NextEvent {
  mapper.onPPUSpriteMemoryStart(state);
  return [hblank2, 60];
}

export function hblank2({ state, mapper }: EventOptions): NextEvent {
  mapper.onPPUBackgroundMemoryStart(state);
  return [hblank3, 20];
}

export function hblank3({ state, mapper }: EventOptions): NextEvent {
  if (++state.line === POST_RENDER_LINE) {
    return [postRender, 341];
  } else {
    mapper.onPPULineStart(state);
    return [render, 257];
  }
}

export function postRender({ state, interrupt }: EventOptions): NextEvent {
  ++state.line;
  state.status.vblank = true;

  if (state.control.nmiEnabled) {
    interrupt.triggerNmi();
  }

  return [vblank, 341];
}

export function vblank({ state }: EventOptions): NextEvent {
  if (++state.line === PRE_RENDER_LINE) {
    state.status.vblank = false;
    state.status.spriteHit = false;
    state.status.spriteOverflow = false;
    return [preRender1, 257];
  } else {
    return [vblank, 341];
  }
}

export function preRender1({ state, mapper }: EventOptions): NextEvent {
  mapper.onPPUSpriteMemoryStart(state);

  if (state.mask.renderingEnabled) {
    state.registers.copyHorizontalBits();
  }

  return [preRender2, 47];
}

export function preRender2({ state }: EventOptions): NextEvent {
  if (state.mask.renderingEnabled) {
    state.registers.copyVerticalBits();
  }

  return [preRender3, 17];
}

export function preRender3({ state, mapper }: EventOptions): NextEvent {
  mapper.onPPUBackgroundMemoryStart(state);

  if (state.oddFrame && state.mask.renderingEnabled) {
    return [preRender4, 19];
  } else {
    return [preRender4, 20];
  }
}

export function preRender4({ state, mapper }: EventOptions): NextEvent {
  state.line = 0;
  state.oddFrame = !state.oddFrame;
  mapper.onPPULineStart(state);
  return [render, 257];
}

export const initialEventState: NextEvent = [render, 257];
