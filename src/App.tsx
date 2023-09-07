import React, { useCallback, useRef } from "react";
import { loadAudioBuffer } from "./Utils";

let context: AudioContext;
function getContext() {
  if (!context) context = new AudioContext();
  return context;
}

function App() {
  const activeNodes = useRef(new Set<AudioNode>());
  const intervalHandle = useRef<NodeJS.Timer>();

  const onStop = useCallback(() => {
    activeNodes.current.forEach((node) => {
      node.disconnect();
      if (node instanceof AudioWorkletNode) {
        node.port.postMessage({ type: "DISPOSE" });
      }
    });
    activeNodes.current.clear();
    clearInterval(intervalHandle.current);
  }, []);

  const onMutableBufferSourceWorklet = useCallback(async () => {
    const context = getContext();
    try {
      await context.audioWorklet.addModule(
        new URL("./audioworklets/MutableBufferSource.worklet", import.meta.url)
      );

      console.log(`MutableBufferSource worklet loaded`);

      const node = new AudioWorkletNode(context, "mutableBufferSource-worklet");
      node.connect(context.destination);
      activeNodes.current.add(node);

      const buffer = await loadAudioBuffer(
        "https://dev-media.darkdesk.io/public/audio_test_2/seg0.wav",
        context
      );

      if (buffer) {
        console.log(`buffer loaded`);
        const channelData: Float32Array[] = [];
        for (let i = 0; i < buffer.numberOfChannels; i++) {
          channelData.push(buffer.getChannelData(i));
        }
        node.port.postMessage({ type: "ADD_SAMPLES", channelData });
        // intervalHandle.current = setInterval(() => {
        //   node.port.postMessage({ type: "ADD_SAMPLES", channelData });
        // }, 1000);
      }

      const buffer2 = await loadAudioBuffer(
        "https://dev-media.darkdesk.io/public/audio_test_2/seg1.wav",
        context
      );

      if (buffer2) {
        console.log(`buffer2 loaded`);
        const channelData: Float32Array[] = [];
        for (let i = 0; i < buffer2.numberOfChannels; i++) {
          channelData.push(buffer2.getChannelData(i));
        }
        node.port.postMessage({ type: "ADD_SAMPLES", channelData });
      }
    } catch (e) {
      console.log(`error loading MutableBufferSource worklet: ${e}`);
    }
  }, []);

  return (
    <div className="App">
      <div>
        <button onClick={onMutableBufferSourceWorklet}>
          Run MutableBufferSource Worklet
        </button>
      </div>

      <br />
      <button onClick={onStop}>Stop</button>
    </div>
  );
}

export default App;
