# nescargot

https://jlippitt.github.io/nescargot/

Browser-based NES emulator in TypeScript with full graphics and audio capabilities. Supports both keyboard and game controller input.

The following NES cartridge mapper types are supported:

* NROM
* MMC1
* MMC2
* MMC3
* MMC5 (partial)*
* UxROM (UNROM/UOROM)
* CNROM
* AxROM
* VRC6 (partial)*

*\* Only tested with Akumajo Densetsu/Castlevania 3.*

Not in the current release:

* Battery-backed save
* Customisable controls
* Support for many obscure mapper types
* Support for games that use unofficial CPU opcodes

**This emulator is *not* cycle-accurate. For performance reasons, some approximations have been made.**

While it will happily play most games I've tried, please do not attempt to develop a NES game using this emulator.
