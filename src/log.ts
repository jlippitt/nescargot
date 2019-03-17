function dummyDebug(...args: any[]): void {}

function consoleDebug(...args: any[]): void {
  // tslint:disable-next-line:no-console
  console.log(...args);
}

export const debug = process.env.BROWSER ? dummyDebug : consoleDebug;

export function error(...args: any[]): void {
  // tslint:disable-next-line:no-console
  console.error(...args);
}

export function toHex(value: number, width: number): string {
  return value
    .toString(16)
    .padStart(width, '0')
    .toUpperCase();
}
