import Mapper from 'mapper';
import PPU from 'ppu';

export default interface Hardware {
  mapper: Mapper;
  ppu: PPU;
}
