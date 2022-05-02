import React, { useState } from 'react';
import { sortBy } from "lodash";
import { Mat, MatVector } from "opencv-ts";
import useOpenCV from "./customHooks/useOpenCV";
import { FlagData, generateFlagParams, getThreshold } from "./flagsConfig";
import FlagsSelect from "./components/FlagsSelect";
import ThreeCanvas, { SceneParam } from "./components/ThreeCanvas";
import './App.css';

function App() {
  const { openCVLoaded } = useOpenCV();
  const [debugZone, setDebugZone] = useState<boolean>(false);
  const [flags] = useState<FlagData[]>(sortBy(generateFlagParams(), 'name'));
  const [params, setParams] = useState<SceneParam>({min: null, max: null, countryCode: null});

  function onChange(countryCode: string) {
    const { min, max } = getThreshold(countryCode)
    console.log(min, max)
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
        <FlagsSelect flags={flags} onChange={onChange} />
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
