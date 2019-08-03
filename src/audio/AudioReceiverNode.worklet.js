class AudioReceiverNode extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args);
    this.buffers = [];
    this.bufferPosition = 0;
    this.port.onmessage = ({ data }) => this.buffers.push(new Float32Array(data));
  }

  process(inputs, outputs) {
    const [left, right] = outputs[0];

    for (let i = 0; i < left.length; ++i) {
      if (this.buffers.length > 0 && this.bufferPosition >= this.buffers[0].length) {
        this.buffers.shift();
        this.bufferPosition = 0;
      }

      // We always expect an even number of samples in the buffer
      // (or else something has gone badly wrong)
      if (this.buffers.length > 0) {
        left[i] = this.buffers[0][this.bufferPosition++];
        right[i] = this.buffers[0][this.bufferPosition++];
      } else {
        left[i] = 0;
        right[i] = 0;
      }
    }

    return true;
  }
}

registerProcessor('AudioReceiverNode', AudioReceiverNode);
