import Interrupt from 'interrupt';
import Mapper from 'mapper';
import PPU from 'ppu';

export default interface Hardware {
  mapper: Mapper;
  interrupt: Interrupt;
  ppu: PPU;
}
