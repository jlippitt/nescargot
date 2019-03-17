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
} from '../addressMode';

import { adc, adcImmediate, sbc, sbcImmediate } from './arithmetic';

import {
  and,
  andImmediate,
  bit,
  eor,
  eorImmediate,
  ora,
  oraImmediate,
} from './bitwise';

import { bcc, bcs, beq, bmi, bne, bpl, bvc, bvs } from './branch';

import { cmpImmediate, cpxImmediate, cpyImmediate } from './compare';

import { dec, dex, dey } from './decrement';

import { clc, cld, cli, clv, sec, sed, sei } from './flags';

import { inc, inx, iny } from './increment';

import { rti } from './interrupt';

import { jmpAbsolute, jmpIndirect, jsr, rts } from './jump';

import {
  lda,
  ldaImmediate,
  ldx,
  ldxImmediate,
  ldy,
  ldyImmediate,
} from './load';

import {
  asl,
  aslAccumulator,
  lsr,
  lsrAccumulator,
  rol,
  rolAccumulator,
  ror,
  rorAccumulator,
} from './shift';

import { pha, php, pla, plp } from './stack';

import { sta, stx, sty } from './store';

import { tax, tay, tsx, txa, txs, tya } from './transfer';

type Operation = (state: State) => void;

function xxx() {
  throw new Error('Unknown op code');
}

export const opMap: Operation[] = [
  // 0x00
  xxx,
  ora(indirectX),
  xxx,
  xxx,
  xxx,
  ora(zeroPage),
  asl(zeroPage),
  xxx,
  php,
  oraImmediate,
  aslAccumulator,
  xxx,
  xxx,
  ora(absolute),
  asl(absolute),
  xxx,
  // 0x10
  bpl,
  ora(indirectY),
  xxx,
  xxx,
  xxx,
  ora(zeroPageX),
  asl(zeroPageX),
  xxx,
  clc,
  ora(absoluteY),
  xxx,
  xxx,
  xxx,
  ora(absoluteX),
  asl(absoluteX),
  xxx,
  // 0x20
  jsr,
  and(indirectX),
  xxx,
  xxx,
  bit(zeroPage),
  and(zeroPage),
  rol(zeroPage),
  xxx,
  plp,
  andImmediate,
  rolAccumulator,
  xxx,
  bit(absolute),
  and(absolute),
  rol(absolute),
  xxx,
  // 0x30
  bmi,
  and(indirectY),
  xxx,
  xxx,
  xxx,
  and(zeroPageX),
  rol(zeroPageX),
  xxx,
  sec,
  and(absoluteY),
  xxx,
  xxx,
  xxx,
  and(absoluteX),
  rol(absoluteX),
  xxx,
  // 0x40
  rti,
  eor(indirectX),
  xxx,
  xxx,
  xxx,
  eor(zeroPage),
  lsr(zeroPage),
  xxx,
  pha,
  eorImmediate,
  lsrAccumulator,
  xxx,
  jmpAbsolute,
  eor(absolute),
  lsr(absolute),
  xxx,
  // 0x50
  bvc,
  eor(indirectY),
  xxx,
  xxx,
  xxx,
  eor(zeroPageX),
  lsr(zeroPageX),
  xxx,
  cli,
  eor(absoluteY),
  xxx,
  xxx,
  xxx,
  eor(absoluteX),
  lsr(absoluteX),
  xxx,
  // 0x60
  rts,
  adc(indirectX),
  xxx,
  xxx,
  xxx,
  adc(zeroPage),
  ror(zeroPage),
  xxx,
  pla,
  adcImmediate,
  rorAccumulator,
  xxx,
  jmpIndirect,
  adc(absolute),
  ror(absolute),
  xxx,
  // 0x70
  bvs,
  adc(indirectY),
  xxx,
  xxx,
  xxx,
  adc(zeroPageX),
  ror(zeroPageX),
  xxx,
  sei,
  adc(absoluteY),
  xxx,
  xxx,
  xxx,
  adc(absoluteX),
  ror(absoluteX),
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
  ldy(zeroPage),
  lda(zeroPage),
  ldx(zeroPage),
  xxx,
  tay,
  ldaImmediate,
  tax,
  xxx,
  ldy(absolute),
  lda(absolute),
  ldx(absolute),
  xxx,
  // 0xB0
  bcs,
  lda(indirectY),
  xxx,
  xxx,
  ldy(zeroPageX),
  lda(zeroPageX),
  ldx(zeroPageY),
  xxx,
  clv,
  lda(absoluteY),
  tsx,
  xxx,
  ldy(absoluteX),
  lda(absoluteX),
  ldx(absoluteY),
  xxx,
  // 0xC0
  cpyImmediate,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  dec(zeroPage),
  xxx,
  iny,
  cmpImmediate,
  dex,
  xxx,
  xxx,
  xxx,
  dec(absolute),
  xxx,
  // 0xD0
  bne,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  dec(zeroPageX),
  xxx,
  cld,
  xxx,
  xxx,
  xxx,
  xxx,
  xxx,
  dec(absoluteX),
  xxx,
  // 0xE0
  cpxImmediate,
  sbc(indirectX),
  xxx,
  xxx,
  xxx,
  sbc(zeroPage),
  inc(zeroPage),
  xxx,
  inx,
  sbcImmediate,
  xxx,
  xxx,
  xxx,
  sbc(absolute),
  inc(absolute),
  xxx,
  // 0xF0
  beq,
  sbc(indirectY),
  xxx,
  xxx,
  xxx,
  sbc(zeroPageX),
  inc(zeroPageX),
  xxx,
  sed,
  sbc(absoluteY),
  xxx,
  xxx,
  xxx,
  sbc(absoluteX),
  inc(absoluteX),
  xxx,
];
