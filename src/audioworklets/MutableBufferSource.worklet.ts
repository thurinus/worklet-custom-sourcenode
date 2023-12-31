import { channel } from "diagnostics_channel";
import { MutableBufferSourceWorkletMessage } from "../WorkletTypes";

class MutableBufferSource extends AudioWorkletProcessor {
  /**
   * Samples stored as segments of multiple arrays, representing channels.
   * Done this way to facilitate efficient addition of new samples without copying them into a master array.
   *
   * HISTORICAL:
   * There seems to be some sort of limitation to doing hefty processing like that in the message event handler anyway,
   * though this is speculation since no error was thrown despite the copying not working.
   */
  private segmentSamples: Float32Array[][] = [];
  private segmentCache: Map<string, Float32Array[]> = new Map();

  /**
   * Offset of each segment from the start (cumulative).
   * First index is default to 0, so
   */
  private segmentOffsets: number[] = [0];

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
        this.segmentCache.set(e.data.url, e.data.channelData);
        this.segmentSamples.push(data);
        this.segmentOffsets.push(
          this.segmentOffsets[this.segmentOffsets.length - 1] + data[0].length
        );
        break;
      case "DISPOSE":
        this.disposed = true;
        break;
    }
  };

  private getSegmentIndex(sampleIndex: number) {
    for (let i = 0; i < this.segmentOffsets.length - 1; i++) {
      if (
        this.segmentOffsets[i] <= sampleIndex &&
        sampleIndex < this.segmentOffsets[i + 1]
      ) {
        return i;
      }
    }
    // segment not found
    return -1;
  }

  private returnMemoryToMainThread() {
    // const toTransfer: ArrayBuffer[] = [];
    // let data: Float32Array | null = null;
    for (const [url, channelData] of this.segmentCache) {
      const toTransfer = channelData.map((channel) => channel.buffer);
      const message: MutableBufferSourceWorkletMessage = {
        type: "RESTORE_SAMPLES",
        url,
        channelData,
      };
      this.port.postMessage(message, toTransfer);
    }

    // for (const segment of this.segmentSamples) {
    //   for (const channel of segment) {
    //     data = channel;
    //     toTransfer.push(channel.buffer);
    //   }
    // }
    // console.log(`jlim returning buffer memory to main thread from worklet`);
    // this.port.postMessage({ channel: data }, toTransfer);
  }

  // see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process for details, like:
  // - the significance of return values
  // - the need to check data block sizes and not assume always 128 long...
  process(_inputs: any, outputs: any, _parameters: any) {
    const output = outputs[0];
    let absoluteSampleIndex = this.bufferHead;

    // just count the number of samples needed for a single channel, and handle all channels.
    for (let s = 0; s < output[0].length; s++) {
      const segmentIndex = this.getSegmentIndex(absoluteSampleIndex);
      if (segmentIndex !== -1) {
        const segmentOffset = this.segmentOffsets[segmentIndex];
        const segmentSampleIndex = absoluteSampleIndex - segmentOffset;

        const targetNumChannels = Math.min(
          this.segmentSamples[segmentIndex].length,
          output.length
        );
        for (
          let channelIndex = 0;
          channelIndex < targetNumChannels;
          channelIndex++
        ) {
          output[channelIndex][s] =
            this.segmentSamples[segmentIndex][channelIndex][segmentSampleIndex];
        }

        absoluteSampleIndex += 1;
      } else {
        // console.log(
        //   `jlim died with segment index: ${segmentIndex}, sample index: ${absoluteSampleIndex}`
        // );
        // return false;
      }
    }

    this.bufferHead = absoluteSampleIndex;

    // TODO: find some way to auto-dispose when playback has finished.
    if (
      this.segmentSamples.length > 0 &&
      this.bufferHead >= this.segmentOffsets[this.segmentOffsets.length - 1]
    ) {
      console.log(`jlim auto-dispose`);
      return false;
    }

    // attempt to return memory to main thread
    if (this.disposed) {
      this.returnMemoryToMainThread();
    }

    return !this.disposed;
  }
}

console.log(globalThis);

registerProcessor("mutableBufferSource-worklet", MutableBufferSource);

export {};
