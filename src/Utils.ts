export async function loadAudioBuffer(url: string, audioContext: AudioContext) {
  try {
    const response = await fetch(url);
    const rawBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(rawBuffer);

    return audioBuffer;
  } catch (error) {
    console.error(error);
    return null;
  }
}
