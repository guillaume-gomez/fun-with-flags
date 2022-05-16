import React, { useState, useEffect } from 'react';
import { sortBy } from "lodash";
import useOpenCV from "./customHooks/useOpenCV";
import { FlagData, generateFlagParams, getThreshold } from "./flagsConfig";
import FlagsSelect from "./components/FlagsSelect";
import ThreeCanvas, { SceneParam } from "./components/ThreeCanvas";
import CustomRange from "./components/CustomRange";
import './App.css';

function App() {
  const { openCVLoaded } = useOpenCV();
  const [debugZone, setDebugZone] = useState<boolean>(true);
  const [flags] = useState<FlagData[]>(sortBy(generateFlagParams(), 'name'));
  const [minThresholdInput, setMinThresholdInput] = useState<number>(100);
  const [maxThresholdInput, setMaxThresholdInput] = useState<number>(200);
  const [params, setParams] = useState<SceneParam>({min: null, max: null, countryCode: null});

  function onChange(countryCode: string) {
    const { min, max } = getThreshold(countryCode);
    setParams({min, max, countryCode});
    setMinThresholdInput(min);
    setMaxThresholdInput(max);
  }

  function reRunDebug() {
    setParams({...params , min: minThresholdInput, max: maxThresholdInput})
  }

  return (
    <div className="App">
      <div className="flex flex-col justify-center items-center gap-12">
       { debugZone &&
          <div className="flex flex-col justify-center items-center gap-12">
            <h5>Debug Zone</h5>
              <div className="flex flex-col gap-5">
                <canvas id="canvasTest"></canvas>
                <canvas id="canvasTest2"></canvas>
                <canvas id="contours"></canvas>
              </div>
          </div>
        }
        { openCVLoaded ?
          <FlagsSelect flags={flags} onChange={onChange} /> :
          <p>Loading Open CV</p>
        }
        <CustomRange value={minThresholdInput} onChange={setMinThresholdInput} />
        <CustomRange value={maxThresholdInput} onChange={setMaxThresholdInput} />
        <textarea
          className="textarea textarea-primary"
          value={`{ key: "${params.countryCode}", name: "EnterCountry", threshold: { min: ${minThresholdInput}, max: ${maxThresholdInput} }, override: true },`}
        />
        <button className="btn btn-primary" onClick={reRunDebug}>ReRun</button>
        <div id="image-container">
            {
              flags.map(({key, name}) =>
                <img
                  key={key}
                  className="hidden"
                  id={key}
                  src={`${process.env.PUBLIC_URL}/textures/${key}.png`}
                  alt={`Flag of ${name}`}
                />
              )
            }
        </div>
        <ThreeCanvas params={params} />
      </div>
    </div>
  );
}

export default App;
