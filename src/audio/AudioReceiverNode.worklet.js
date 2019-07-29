class AudioReceiverNode extends AudioWorkletProcessor {
  process(inputs, outputs) {
    for (const channel of outputs[0]) {
      for (let i = 0; i < channel.length; ++i) {
        channel[i] = Math.random() * 2 - 1;
      }
    }

    return true;
  }
}

registerProcessor('AudioReceiverNode', AudioReceiverNode);
