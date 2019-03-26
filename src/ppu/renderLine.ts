import { debug } from 'log';

import { PPUState } from './index';

export default function renderLine(state: PPUState) {
  debug(`** Rendering line ${state.line} **`);
}
