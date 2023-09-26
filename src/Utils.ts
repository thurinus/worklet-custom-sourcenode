const buffers = new Map<string, AudioBuffer>();

export async function loadAudioBuffer(url: string, audioContext: AudioContext) {
  try {
    if (buffers.has(url)) {
      return buffers.get(url);
    }
    const response = await fetch(url);
    const rawBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(rawBuffer);
    buffers.set(url, audioBuffer);
    return audioBuffer;
  } catch (error) {
    console.error(error);
    return null;
  }
}
