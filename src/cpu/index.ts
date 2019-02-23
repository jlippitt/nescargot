import Mapper from 'mapper';

import MMU from './mmu';

const RESET_VECTOR = 0xFFFC;

interface Registers {
  a: number;
  x: number;
  y: number;
  s: number;
  pc: number;
}

interface Flags {
  carry: boolean;
  zero: boolean;
  interrupt: boolean;
  decimal: boolean;
  overflow: boolean;
  negative: boolean;
}

export interface CpuState {
  regs: Registers;
  flags: Flags;
  mmu: MMU;
  ticks: number;
}

export default class Cpu {
  private state: CpuState;

  constructor(mapper: Mapper) {
    const mmu = new MMU(mapper)

    this.state = {
      regs: {
        a: 0,
        x: 0,
        y: 0,
        s: 0,
        pc: mmu.getWord(RESET_VECTOR),
      },
      flags: {
        carry: false,
        zero: false,
        interrupt: true,
        decimal: false,
        overflow: false,
        negative: false,
      },
      mmu,
      ticks: 0,
    };

    console.log(this.state.regs.pc.toString(16));
  }

  public tick(): void {
    // TODO
  }
}
