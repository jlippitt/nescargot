export type DerivePeriod = (value: number) => number;

export const deriveLinearPeriod = (value: number) => value;

export default class FrequencyClock {
  private derivePeriod: DerivePeriod;
  private value: number = 0;
  private clockShift: number;
  private clockRemainder: number = 0;
  private period: number;
  private divider: number;

  constructor(derivePeriod: DerivePeriod, clockShift: number) {
    this.derivePeriod = derivePeriod;
    this.clockShift = clockShift;
    this.period = this.derivePeriod(this.value);
    this.divider = this.period;
  }

  public getValue(): number {
    return this.value;
  }

  public setValue(value: number) {
    this.value = value;
    this.period = this.derivePeriod(this.value);
    this.divider = this.period;
  }

  public setLowerByte(value: number): void {
    this.setValue((this.getValue() & 0x0700) | (value & 0xff));
  }

  public setUpperByte(value: number): void {
    this.setValue(((value << 8) & 0x0700) | (this.getValue() & 0xff));
  }

  public tick(cpuTicks: number): number {
    let result: number = 0;

    const dividerTicks = (cpuTicks + this.clockRemainder) >> this.clockShift;

    this.clockRemainder =
      (cpuTicks + this.clockRemainder) % (1 << this.clockShift);

    for (let i = 0; i < dividerTicks; ++i) {
      if (this.divider === 0) {
        this.divider = this.period;
        ++result;
      } else {
        --this.divider;
      }
    }

    return result;
  }
}
