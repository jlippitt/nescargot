import { APU_CLOCK_SHIFT } from '../../APU';

export default class FrequencyClock {
  private value: number = 0;
  private clock: number = 0;
  private divisor: number;
  private period: number = 0;

  constructor(divisor: number) {
    this.divisor = divisor;
    this.period = this.derivePeriod();
  }

  public setLowerByte(value: number): void {
    this.value = (this.value & 0x0700) | (value & 0xff);
    this.period = this.derivePeriod();
  }

  public setUpperByte(value: number): void {
    this.value = ((value << 8) & 0x0700) | (this.value & 0xff);
    this.period = this.derivePeriod();
  }

  public tick(ticks: number): number {
    let result: number = 0;

    this.clock += ticks;

    while (this.clock >= this.period) {
      this.clock -= this.period;
      ++result;
    }

    return result;
  }

  private derivePeriod = (): number =>
    ((this.value + 1) << APU_CLOCK_SHIFT) * this.divisor
}
