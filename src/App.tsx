import React, { useCallback } from "react";

let context: AudioContext;
function getContext() {
  if (!context) context = new AudioContext();
  return context;
}

function App() {
  const onJsWorklet = useCallback(() => {
    const context = getContext();
    context.audioWorklet
      .addModule(
        new URL("./audioworklets/JavascriptWorklet.worklet", import.meta.url)
      )
      .then(() => {
        console.log(`js worklet loaded`);
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
      })
      .catch((e) => {
        console.log(`error loading TS worklet: ${e}`);
      });
  }, []);

  return (
    <div className="App">
      <button onClick={onJsWorklet}>Run Javascript Worklet</button>
      <button onClick={onTsWorklet}>Run Typescript Worklet</button>
    </div>
  );
}

export default App;
