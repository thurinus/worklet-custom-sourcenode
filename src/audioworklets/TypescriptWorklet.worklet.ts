class TypescriptWorklet extends AudioWorkletProcessor {
  // see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process for details, like:
  // - the significance of return values
  // - the need to check data block sizes and not assume always 128 long...
  process(inputs: any, outputs: any, parameters: any) {
    const output = outputs[0];
    output.forEach((channel: any) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.random() * 2 - 1;
      }
    });

    return true;
  }
}

console.log(globalThis);

registerProcessor("typescript-worklet", TypescriptWorklet);

export {};
