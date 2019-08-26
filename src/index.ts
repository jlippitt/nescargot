import { runInBrowser } from 'environment/browser';
import { runInConsole } from 'environment/console';
import { error } from 'log';

if (typeof window !== 'undefined') {
  runInBrowser();
} else {
  runInConsole();
}
