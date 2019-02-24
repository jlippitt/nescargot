import State from '../state';

import {
  absolute,
  absoluteX,
  absoluteY,
  indirectX,
  indirectY,
  zeroPage,
  zeroPageX,
  zeroPageY,
} from './addressMode';

import { bcc, bcs, beq, bmi, bne, bpl, bvc, bvs } from './branch';

import { cmpImmediate, cpxImmediate, cpyImmediate } from './compare';

import { dex, dey } from './decrement';

import { clc, cld, cli, clv, sec, sed, sei } from './flags';

import { jsr, rts } from './jump';

import { bit } from './misc';

import { lda, ldaImmediate, ldxImmediate, ldyImmediate } from './load';

import { sta, stx, sty } from './store';

import { tax, tay, tsx, txa, txs, tya } from './transfer';

type Operation = (state: State) => void;

function xxx() {
  throw new Error('Unknown op code');
}

export const opMap: Operation[] = [
  // 0x00
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0x10
  bpl,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  clc,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0x20
  jsr,
  xxx,
  xxx,
  xxx,
  bit(zeroPage),
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  bit(absolute),
  xxx,
  xxx,
  xxx,
  // 0x30
  bmi,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  sec,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0x40
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0x50
  bvc,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  cli,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0x60
  rts,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0x70
  bvs,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  sei,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0x80
  xxx,
  sta(indirectX),
  xxx,
  xxx,
  sty(zeroPage),
  sta(zeroPage),
  stx(zeroPage),
  xxx,
  dey,
  xxx,
  txa,
  xxx,
  sty(absolute),
  sta(absolute),
  stx(absolute),
  xxx,
  // 0x90
  bcc,
  sta(indirectY),
  xxx,
  xxx,
  sty(zeroPageX),
  sta(zeroPageX),
  stx(zeroPageY),
  xxx,
  tya,
  sta(absoluteY),
  txs,
  xxx,
  xxx,
  sta(absoluteX),
  xxx,
  xxx,
  // 0xA0
  ldyImmediate,
  lda(indirectX),
  ldxImmediate,
  xxx,
  xxx,
  lda(zeroPage),
  xxx,
  xxx,
  tay,
  ldaImmediate,
  tax,
  xxx,
  xxx,
  lda(absolute),
  xxx,
  xxx,
  // 0xB0
  bcs,
  lda(indirectY),
  xxx,
  xxx,
  xxx,
  lda(zeroPageX),
  xxx,
  xxx,
  clv,
  lda(absoluteY),
  tsx,
  xxx,
  xxx,
  lda(absoluteX),
  xxx,
  xxx,
  // 0xC0
  cpyImmediate,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  cmpImmediate,
  dex,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0xD0
  bne,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  cld,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0xE0
  cpxImmediate,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  // 0xF0
  beq,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  sed,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
];
