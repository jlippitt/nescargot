import State from './state';

export default interface AddressMode {
  lookup(state: State, pageCheck?: boolean): number;
  toString(): string;
}

export const zeroPage = {
  lookup: (state: State): number => {
    state.clock.tick(1);
    return state.nextByte();
  },
  toString: (): string => 'z',
};

export const zeroPageX = {
  lookup: (state: State): number => {
    const { regs, clock } = state;
    const immediate = state.nextByte();
    clock.tick(2);
    return (immediate + regs.x) & 0xff;
  },
  toString: (): string => 'z,x',
};

export const zeroPageY = {
  lookup: (state: State): number => {
    const { regs, clock } = state;
    const immediate = state.nextByte();
    clock.tick(2);
    return (immediate + regs.y) & 0xff;
  },
  toString: (): string => 'z,y',
};

export const absolute = {
  lookup: (state: State): number => {
    state.clock.tick(2);
    return state.nextWord();
  },
  toString: (): string => 'a',
};

export const absoluteX = {
  lookup: (state: State, pageCheck: boolean = false): number => {
    const { regs, clock } = state;
    const immediate = state.nextWord();
    const address = (immediate + regs.x) & 0xffff;

    if (pageCheck && (address & 0xff00) === (immediate & 0xff00)) {
      clock.tick(2);
    } else {
      clock.tick(3);
    }

    return address;
  },
  toString: (): string => 'a,x',
};

export const absoluteY = {
  lookup: (state: State, pageCheck: boolean = false): number => {
    const { regs, clock } = state;
    const immediate = state.nextWord();
    const address = (immediate + regs.y) & 0xffff;

    if (pageCheck && (address & 0xff00) === (immediate & 0xff00)) {
      clock.tick(2);
    } else {
      clock.tick(3);
    }

    return address;
  },
  toString: (): string => 'a,y',
};

export const indirectX = {
  lookup: (state: State): number => {
    const { regs, mmu, clock } = state;
    const immediate = state.nextByte();
    clock.tick(4);
    return mmu.getWord((immediate + regs.x) & 0xff);
  },
  toString: (): string => '(d,x)',
};

export const indirectY = {
  lookup: (state: State, pageCheck: boolean = false): number => {
    const { regs, mmu, clock } = state;
    const immediate = state.nextByte();
    const lower = mmu.getByte(immediate);
    const upper = mmu.getByte((immediate & 0xff00) | ((immediate + 1) & 0xff));
    const pointer = (upper << 8) | lower;
    const address = (pointer + regs.y) & 0xffff;

    if (pageCheck && (address & 0xff00) === (pointer & 0xff00)) {
      clock.tick(3);
    } else {
      clock.tick(4);
    }

    return address;
  },
  toString: (): string => '(d),y',
};
