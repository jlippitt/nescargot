import { times } from 'lodash';

import Channel from './channels/Channel';

const pulseTable = times(31, (n) => 95.52 / (8128.0 / n + 100));

interface Channels {
  pulse1: Channel;
  pulse2: Channel;
}

interface Enabled {
  pulse1: boolean;
  pulse2: boolean;
}

export default class Mixer {
  public channels: Channels;
  public enabled: Enabled;

  constructor(channels: Channels) {
    this.channels = channels;

    this.enabled = {
      pulse1: false,
      pulse2: false,
    };
  }

  public setByte(value: number): void {
    this.enabled.pulse1 = (value & 0x01) !== 0;
    this.enabled.pulse2 = (value & 0x02) !== 0;
  }

  public sample(): number {
    const pulse1 = this.enabled.pulse1 ? this.channels.pulse1.sample() : 0;
    const pulse2 = this.enabled.pulse2 ? this.channels.pulse2.sample() : 0;

    return pulseTable[pulse1 + pulse2];
  }
}
