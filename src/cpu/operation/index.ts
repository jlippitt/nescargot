import State from '../state';

import {
  zeroPage,
  zeroPageX,
  absolute,
  absoluteX,
  absoluteY,
  indirectX,
  indirectY,
} from './addressMode';

import { clc, cld, cli, clv, sec, sed, sei } from './flags';

import { ldaImmediate, ldxImmediate, ldyImmediate } from './load';

import { sta } from './store';

import { tax, tay, tsx, txa, txs, tya } from './transfer';

type Operation = (state: State) => void;

function xxx() {
  throw new Error(`Unknown op code`);
};

export const opMap: Operation[] = [
  // 0x00
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0x10
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  clc, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0x20
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0x30
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  sec, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0x40
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0x50
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  cli, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0x60
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0x70
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  sei, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0x80
  xxx, sta(indirectX), xxx, xxx,
  xxx, sta(zeroPage), xxx, xxx,
  xxx, xxx, txa, xxx,
  xxx, sta(absolute), xxx, xxx,
  // 0x90
  xxx, sta(indirectY), xxx, xxx,
  xxx, sta(zeroPageX), xxx, xxx,
  tya, sta(absoluteY), txs, xxx,
  xxx, sta(absoluteX), xxx, xxx,
  // 0xA0
  ldyImmediate, xxx, ldxImmediate, xxx,
  xxx, xxx, xxx, xxx,
  tay, ldaImmediate, tax, xxx,
  xxx, xxx, xxx, xxx,
  // 0xB0
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  clv, xxx, tsx, xxx,
  xxx, xxx, xxx, xxx,
  // 0xC0
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0xD0
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  cld, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0xE0
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  // 0xF0
  xxx, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
  sed, xxx, xxx, xxx,
  xxx, xxx, xxx, xxx,
];
