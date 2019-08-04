export function debug(...args: any[]): void {
  // tslint:disable-next-line:no-console
  console.log(...args);
}

export function error(...args: any[]): void {
  // tslint:disable-next-line:no-console
  console.error(...args);
}

export function warn(...args: any[]): void {
  // tslint:disable-next-line:no-console
  console.warn(...args);
}

export function toHex(value: number, width: number): string {
  return value
    .toString(16)
    .padStart(width, '0')
    .toUpperCase();
}
