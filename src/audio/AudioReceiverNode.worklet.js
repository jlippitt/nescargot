class AudioReceiverNode extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args);
    this.buffers = [];
    this.bufferPosition = 0;
    this.port.onmessage = ({ data }) => this.buffers.push(new Float32Array(data));
  }

  process(inputs, outputs) {
    const [output] = outputs[0];

    for (let i = 0; i < output.length; ++i) {
      if (this.buffers.length > 0 && this.bufferPosition >= this.buffers[0].length) {
        this.buffers.shift();
        this.bufferPosition = 0;
      }

      if (this.buffers.length > 0) {
        output[i] = this.buffers[0][this.bufferPosition++];
      } else {
        output[i] = 0;
      }
    }

    return true;
  }
}

registerProcessor('AudioReceiverNode', AudioReceiverNode);
