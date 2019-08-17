export default interface AudioComponent {
  setByte(value: number): void;

  reset(): void;

  advance(increment: number): void;

  sample(): number;
}
