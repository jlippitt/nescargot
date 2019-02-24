import State from '../state';

export default interface AddressMode {
  lookup(state: State): number;
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
    return (immediate + regs.x) & 0xFF;
  },
  toString: (): string => 'z,x',
};

export const absolute = {
  lookup: (state: State): number => {
    state.clock.tick(2);
    return state.nextWord();
  },
  toString: (): string => 'a',
};

export const absoluteX = {
  lookup: (state: State): number => {
    const { regs, clock } = state;
    const immediate = state.nextWord();
    clock.tick(3);
    return (immediate + regs.x) & 0xFFFF;
  },
  toString: (): string => 'a,x',
};

export const absoluteY = {
  lookup: (state: State): number => {
    const { regs, clock } = state;
    const immediate = state.nextWord();
    clock.tick(3);
    return (immediate + regs.y) & 0xFFFF;
  },
  toString: (): string => 'a,y',
};

export const indirectX = {
  lookup: (state: State): number => {
    const { regs, mmu, clock } = state;
    const immediate = state.nextByte();
    clock.tick(4);
    return mmu.getWord((immediate + regs.x) & 0xFF);
  },
  toString: (): string => '(d,x)',
};

export const indirectY = {
  lookup: (state: State): number => {
    const { regs, mmu, clock } = state;
    const immediate = state.nextByte();
    const pointer = mmu.getWord(immediate);
    clock.tick(4);
    return (pointer + regs.y) & 0xFFFF;
  },
  toString: (): string => '(d),y',
};
