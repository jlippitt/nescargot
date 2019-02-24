import { toHex } from 'log';
import Mapper from 'mapper';

import Clock from './clock';
import Flags from './flags';
import Hardware from './hardware';
import MMU from './mmu';

const RESET_VECTOR = 0xfffc;

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
  public clock: Clock;

  constructor(hardware: Hardware) {
    const mmu = new MMU(hardware);

    this.regs = {
      a: 0,
      x: 0,
      y: 0,
      s: 0,
      pc: mmu.getWord(RESET_VECTOR),
    };

    this.flags = new Flags();
    this.mmu = mmu;
    this.clock = new Clock();
  }

  public nextByte(): number {
    return this.mmu.getByte(this.regs.pc++);
  }

  public nextWord(): number {
    const value = this.mmu.getWord(this.regs.pc);
    this.regs.pc += 2;
    return value;
  }

  public pushByte(value: number) {
    this.mmu.setByte(this.regs.s, value);
    this.regs.s = (this.regs.s - 1) & 0xff;
  }

  public pushWord(value: number) {
    this.pushByte(value >> 8);
    this.pushByte(value & 0xff);
  }

  public toString(): string {
    return (
      `A=${toHex(this.regs.a, 2)} ` +
      `X=${toHex(this.regs.x, 2)} ` +
      `Y=${toHex(this.regs.y, 2)} ` +
      `S=${toHex(this.regs.s, 2)} ` +
      `PC=${toHex(this.regs.pc, 4)} ` +
      `P=${this.flags} ` +
      `T=${this.clock}`
    );
  }
}
