import React, { useState, useEffect } from 'react';
import { sortBy } from "lodash";
import useOpenCV from "./customHooks/useOpenCV";
import { FlagData, generateFlagParams, getThreshold } from "./flagsConfig";
import FlagsSelect from "./components/FlagsSelect";
import ThreeCanvas, { SceneParam } from "./components/ThreeCanvas";
import './App.css';

function App() {
  const { openCVLoaded } = useOpenCV();
  const [debugZone, setDebugZone] = useState<boolean>(false);
  const [flags] = useState<FlagData[]>(sortBy(generateFlagParams(), 'name'));
  const [minThresholdInput, setMinThresholdInput] = useState<number>(100);
  const [maxThresholdInput, setMaxThresholdInput] = useState<number>(200);
  const [params, setParams] = useState<SceneParam>({min: null, max: null, countryCode: null});

  function onChange(countryCode: string) {
    const { min, max } = getThreshold(countryCode)
    setParams({min, max, countryCode});
  }

  return (
    <div className="App">
       { debugZone &&
          <div className="debug">
            <h5>Debug Zone</h5>
              <canvas id="canvasTest"></canvas>
              <canvas id="canvasTest2"></canvas>
              <canvas id="contours"></canvas>
          </div>
        }
        { openCVLoaded ?
          <FlagsSelect flags={flags} onChange={onChange} /> :
          <p>Loading Open CV</p>
        }
        <input type="range" min={0} max={255} value={minThresholdInput} onChange={(event) => setMinThresholdInput(parseInt(event.target.value, 10)) }/>
        <input type="range" min={0} max={255} value={maxThresholdInput} onChange={(event) => setMaxThresholdInput(parseInt(event.target.value, 10))} />
        <div id="image-container">
          {
            flags.map(({key, name}) =>
              <img
                key={key}
                className="imageSrc"
                id={key}
                src={`${process.env.PUBLIC_URL}/textures/${key}.png`}
                alt={`Flag of ${name}`}
              />
            )
          }
        </div>
        <ThreeCanvas params={params} />
    </div>
  );
}

export default App;
