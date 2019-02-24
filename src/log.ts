export function debug(...args: any[]): void {
  // tslint:disable-next-line:no-console
  console.log(...args);
}

export function toHex(value: number, width: number): string {
  return value
    .toString(16)
    .padStart(width, '0')
    .toUpperCase();
}
