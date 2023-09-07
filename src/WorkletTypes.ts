export interface MutableBufferSourceWorkletMessage {
  type: "ADD_SAMPLES" | "DISPOSE";
  channelData: Float32Array[];
}
