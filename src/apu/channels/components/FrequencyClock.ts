export type DerivePeriod = (value: number) => number;

export const deriveLinearPeriod = (multiplier: number) => (
  value: number,
): number => (value + 1) * multiplier;

export default class FrequencyClock {
  private derivePeriod: DerivePeriod;
  private value: number = 0;
  private period: number;
  private clock: number;

  constructor(derivePeriod: DerivePeriod) {
    this.derivePeriod = derivePeriod;
    this.period = this.derivePeriod(this.value);
    this.clock = this.period;
  }

  public getValue(): number {
    return this.value;
  }

  public setValue(value: number) {
    this.value = value;
    this.period = this.derivePeriod(this.value);
  }

  public setLowerByte(value: number): void {
    this.setValue((this.getValue() & 0xff00) | (value & 0xff));
  }

  public setUpperByte(value: number): void {
    this.setValue(((value << 8) & 0xff00) | (this.getValue() & 0xff));
  }

  public tick(ticks: number): number {
    let result: number = 0;

    this.clock -= ticks;

    while (this.clock <= 0) {
      this.clock += this.period;
      ++result;
    }

    return result;
  }
}
