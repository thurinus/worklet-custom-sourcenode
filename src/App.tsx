import React, { useCallback, useRef } from "react";
import { loadAudioBuffer } from "./Utils";
import { MutableBufferSourceWorkletMessage } from "./WorkletTypes";

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

  // const onRegularAudioBufferSource = useCallback(async () => {
  //   const context = getContext();

  //   const buffer = await loadAudioBuffer(
  //     "https://dev-media.darkdesk.io/public/audio_test/segment_10_gray.wav",
  //     context
  //   );

  //   if (buffer) {
  //     const node = new AudioBufferSourceNode(context, { buffer });
  //     node.start();
  //     node.connect(context.destination);
  //     activeNodes.current.add(node);
  //   }
  // }, []);

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

      const node2 = new AudioWorkletNode(
        context,
        "mutableBufferSource-worklet"
      );
      node2.connect(context.destination);
      activeNodes.current.add(node2);

      const bufferUrl =
        "https://dev-media.darkdesk.io/public/audio_test/segment_10_gray.wav";
      const buffer = await loadAudioBuffer(bufferUrl, context);

      /** MESSAGE HANDLER FOR THE PORT */
      node.port.onmessage = (
        e: MessageEvent<MutableBufferSourceWorkletMessage>
      ) => {
        (async () => {
          for (let i = 0; i < e.data.channelData.length; i++) {
            const currData = e.data.channelData[i];
            console.log(
              `jlim url: ${e.data.url} channel ${i} length: ${currData.byteLength}`
            );
          }
          // const buffer = await loadAudioBuffer(e.data.url, context);
          // if (buffer) {
          //   console.log(
          //     `jlim buffer length before restoration: ${buffer.length}`
          //   );
          // }
        })().catch((e) =>
          console.log(`jlim error while attempting to restore buffer`)
        );

        // console.log(`jlim message received on main thread from worklet`);
        // if (buffer) {
        //   console.log(
        //     `jlim channel transferred is length: ${e.data.channel.byteLength}`
        //   );
        //   // THIS DOESNT WORK
        //   buffer.copyToChannel(e.data.channel, 0);
        //   const channelData = buffer.getChannelData(0);
        //   console.log(
        //     `jlim attempting to get buffer data after transfer back, size: ${channelData.byteLength}`
        //   );
        // }
      };

      if (buffer) {
        const channelData: Float32Array[] = [];
        const toTransfer: ArrayBuffer[] = [];
        console.time(`jlim getchanneldata`);
        for (let i = 0; i < buffer.numberOfChannels; i++) {
          const currData = buffer.getChannelData(i);
          channelData.push(currData);
          toTransfer.push(currData.buffer);
        }
        console.timeEnd(`jlim getchanneldata`);
        console.log(
          `jlim buffer bytelength BEFORE Transferable transfer: ${channelData[0].byteLength}`
        );
        // Took a bit to truly grok how Transferables worked. The 2nd argument isn't supposed to be a unique way to pass arguments while also transferring
        // ownership of related resources to the worklet context. The argument should still be included in the first argument of `postMessage`; the second argument
        // just specifies which underlying resources, in this case the ArrayBuffer underpinning the Float32Array, to transfer context.
        // to the worklet.
        // See Transferable doc for details: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
        const addSampleMsg: MutableBufferSourceWorkletMessage = {
          type: "ADD_SAMPLES",
          channelData,
          url: bufferUrl,
        };
        node.port.postMessage(addSampleMsg, toTransfer);
        console.log(
          `jlim buffer bytelength AFTER Transferable transfer: ${channelData[0].byteLength}`
        );
        // intervalHandle.current = setInterval(() => {
        //   node.port.postMessage({ type: "ADD_SAMPLES", channelData });
        // }, 1000);
      }

      const bufferUrl2 =
        "https://dev-media.darkdesk.io/public/audio_test/segment_11_gray.wav";
      const buffer2 = await loadAudioBuffer(
        bufferUrl2,
        // "https://dev-media.darkdesk.io/public/audio_test_2/seg1.wav",
        context
      );

      if (buffer2) {
        console.log(`buffer2 loaded`);
        const channelData: Float32Array[] = [];
        const toTransfer: ArrayBuffer[] = [];
        for (let i = 0; i < buffer2.numberOfChannels; i++) {
          const currData = buffer2.getChannelData(i);
          channelData.push(currData);
          toTransfer.push(currData.buffer);
        }
        const addSampleMsg: MutableBufferSourceWorkletMessage = {
          type: "ADD_SAMPLES",
          channelData,
          url: bufferUrl2,
        };
        console.time(`jlim postmessage`);
        node.port.postMessage(addSampleMsg);
        console.timeEnd(`jlim postmessage`);

        // add to node 2 too
        // node2.port.postMessage(
        //   { type: "ADD_SAMPLES", channelData },
        //   toTransfer
        // );
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
      {/* <div>
        <button onClick={onRegularAudioBufferSource}>
          Run regular AudioBufferSourceNode
        </button>
      </div> */}

      <br />
      <button onClick={onStop}>Stop</button>
    </div>
  );
}

export default App;
