import { toHex } from 'hex';
import Mapper from 'mapper';

import Flags from './flags';
import MMU from './mmu';

const RESET_VECTOR = 0xFFFC;

interface Registers {
  a: number;
  x: number;
  y: number;
  s: number;
  pc: number;
}

export default class State {
  public regs: Registers;
  public flags: Flags;
  public mmu: MMU;
  public ticks: number;

  constructor(mapper: Mapper) {
    const mmu = new MMU(mapper);

    this.regs = {
      a: 0,
      x: 0,
      y: 0,
      s: 0,
      pc: mmu.getWord(RESET_VECTOR),
    };

    this.flags = new Flags();
    this.mmu = mmu;
    this.ticks = 0;
  }

  public toString(): string {
    return `A=${toHex(this.regs.a, 2)} ` +
      `X=${toHex(this.regs.x, 2)} ` +
      `Y=${toHex(this.regs.y, 2)} ` +
      `S=${toHex(this.regs.s, 2)} ` +
      `PC=${toHex(this.regs.pc, 4)} ` +
      `P=${this.flags} ` +
      `T=${this.ticks}`;
  }
}
