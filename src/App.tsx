import React, { useCallback, useRef } from "react";

let context: AudioContext;
function getContext() {
  if (!context) context = new AudioContext();
  return context;
}

function App() {
  const activeNodes = useRef(new Set<AudioNode>());

  const onStop = useCallback(() => {
    activeNodes.current.forEach(node => {
      node.disconnect();
    });
  }, []);

  const onJsWorklet = useCallback(() => {
    const context = getContext();
    context.audioWorklet
      .addModule(
        new URL("./audioworklets/JavascriptWorklet.worklet", import.meta.url)
      )
      .then(() => {
        console.log(`js worklet loaded`);
        const node = new AudioWorkletNode(context, 'javascript-worklet');
        node.connect(context.destination);
        activeNodes.current.add(node);
      })
      .catch((e) => {
        console.log(`error loading JS worklet: ${e}`);
      });
  }, []);

  const onTsWorklet = useCallback(() => {
    const context = getContext();
    context.audioWorklet
      .addModule(
        new URL("./audioworklets/TypescriptWorklet.worklet", import.meta.url)
      )
      .then(() => {
        console.log(`TS worklet loaded`);
        const node = new AudioWorkletNode(context, 'typescript-worklet');
        node.connect(context.destination);
        activeNodes.current.add(node);
      })
      .catch((e) => {
        console.log(`error loading TS worklet: ${e}`);
      });
  }, []);

  return (
    <div className="App">
      <button onClick={onJsWorklet}>Run Javascript Worklet</button>
      <button onClick={onTsWorklet}>Run Typescript Worklet</button>
      <br />
      <button onClick={onStop}>Stop</button>
    </div>
  );
}

export default App;
