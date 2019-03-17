import { runInBrowser } from 'browser';
import { runHeadless } from 'headless';
import { error } from 'log';

if (typeof window !== 'undefined') {
  runInBrowser().catch(error);
} else {
  runHeadless();
}
