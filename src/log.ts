type LogFunction = (...args: any[]) => void;

export let debug: LogFunction;
export let error: LogFunction;
export let warn: LogFunction;

if (typeof window === 'undefined') {
  // tslint:disable-next-line:no-eval
  eval("require('log-buffer')");

  debug = (...args: any[]): void => {
    // tslint:disable-next-line:no-console
    console.log(...args);
  };

  error = (...args: any[]): void => {
    // tslint:disable-next-line:no-console
    console.log(...args);
  };

  warn = (...args: any[]): void => {
    // tslint:disable-next-line:no-console
    console.log(...args);
  };
} else {
  debug = (...args: any[]): void => {};

  error = (...args: any[]): void => {
    // tslint:disable-next-line:no-console
    console.error(...args);
  };

  warn = (...args: any[]): void => {
    // tslint:disable-next-line:no-console
    console.warn(...args);
  };
}

export function toHex(value: number, width: number): string {
  return value
    .toString(16)
    .padStart(width, '0')
    .toUpperCase();
}
