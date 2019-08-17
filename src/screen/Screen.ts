export default interface Screen {
  drawLine(lineBuffer: number[]): void;
  skipLine(): void;
}
