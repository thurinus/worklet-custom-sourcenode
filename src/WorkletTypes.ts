export interface MutableBufferSourceWorkletMessage {
  type: "ADD_SAMPLES" | "DISPOSE" | "RESTORE_SAMPLES";
  url: string;
  channelData: Float32Array[];
}
