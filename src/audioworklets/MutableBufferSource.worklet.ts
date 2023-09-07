import { MutableBufferSourceWorkletMessage } from "../WorkletTypes";

class MutableBufferSource extends AudioWorkletProcessor {
  private samples?: Float32Array[];
  private bufferHead = 0;
  private disposed = false;

  constructor() {
    super();
    this.port.onmessage = this.handleMessage;
  }

  handleMessage = (e: MessageEvent<MutableBufferSourceWorkletMessage>) => {
    switch (e.data.type) {
      case "ADD_SAMPLES":
        const data = e.data.channelData;
        console.log(`jlim adding samples. rate is: ${sampleRate}`);
        if (!this.samples) {
          this.samples = data;
          console.log(
            `jlim assigned data directly to samples. sample length is ${this.samples[0].length}`
          );
        } else {
          const offset = this.samples[0].length;
          // cycle channels
          console.log(`jlim about to concat samples with offset: ${offset}`);
          for (let c = 0; c < this.samples.length; c++) {
            console.log(`jlim adding to sample channel ${c}`);
            for (let s = 0; s < data[c].length; s++) {
              this.samples[c][s + offset] = data[c][s];
            }
          }
          console.log(
            `jlim post added samples. now sample length is ${this.samples[0].length}`
          );
        }
        break;
      case "DISPOSE":
        this.disposed = true;
        break;
    }
  };

  // see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process for details, like:
  // - the significance of return values
  // - the need to check data block sizes and not assume always 128 long...
  process(_inputs: any, outputs: any, _parameters: any) {
    const output = outputs[0];
    let absoluteSampleIndex = this.bufferHead;
    if (this.samples) {
      for (let s = 0; s < output[0].length; s++) {
        output[0][s] = this.samples[0][absoluteSampleIndex];
        // output[1][s] = this.samples[1][absoluteSampleIndex];

        absoluteSampleIndex += 1;
      }
    }

    // console.log(`jlim bufferhead: ${this.bufferHead}`);
    this.bufferHead = absoluteSampleIndex;

    if (this.samples && this.bufferHead >= this.samples[0].length) {
      return false;
    }

    return !this.disposed;
  }
}

console.log(globalThis);

registerProcessor("mutableBufferSource-worklet", MutableBufferSource);

export {};
