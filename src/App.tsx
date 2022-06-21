import React, { useState, useEffect } from 'react';
import { sortBy } from "lodash";
import useOpenCV from "./customHooks/useOpenCV";
import { FlagData, generateFlagParams, getThreshold,listOfFlagKeys } from "./flagsConfig";
import FlagsSelect from "./components/FlagsSelect";
import ThreeCanvas, { SceneParam } from "./components/ThreeCanvas";
import './App.css';

const flagKeys = listOfFlagKeys();

function App() {
  const { openCVLoaded } = useOpenCV();
  const [velocity, setVelocity] = useState<number>(0.001);
  //const [debugZone] = useState<boolean>(false);
  const [flags] = useState<FlagData[]>(sortBy(generateFlagParams(), 'name'));
  const [minThresholdInput, setMinThresholdInput] = useState<number>(100);
  const [maxThresholdInput, setMaxThresholdInput] = useState<number>(200);
  const [params, setParams] = useState<SceneParam>({min: null, max: null, countryCode: null});


  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const urlParams = Object.fromEntries(urlSearchParams.entries());
    if(urlParams.flag && flagKeys.includes(urlParams.flag)) {
      setParams({min: 1, max:1, countryCode: urlParams.flag})
    }
}, [] )


  function onChange(countryCode: string) {
    const { min, max } = getThreshold(countryCode);
    setParams({min, max, countryCode});
    setMinThresholdInput(min);
    setMaxThresholdInput(max);
    window.history.replaceState(null, "", `?flag=${countryCode}`);
  }

  function reRunDebug() {
    setParams({...params , min: minThresholdInput, max: maxThresholdInput})
  }

  return (
    <div className="App">
      <div className="flex flex-col justify-center items-center gap-12">
        <div className="lg:absolute md:static lg:top-6 lg:left-8 lg:max-w-xs md:max-w-full md:w-full">
          <div className="card bg-base-100 shadow-xl w-full">
           <div className="card-body flex flex-col gap-5">
           {/*debugZone &&
              <div className="flex flex-col justify-center items-center gap-12">
                <h5>Debug Zone</h5>
                  <div className="flex flex-col gap-5">
                    <canvas id="canvasTest1"></canvas>
                    <canvas id="canvasTest2"></canvas>
                    <canvas id="contours"></canvas>
                  </div>
              </div>*/}
              { openCVLoaded ?
                <FlagsSelect value={params.countryCode || ""} flags={flags} onChange={onChange} /> :
                <p>Loading Open CV</p>
              }
              <div>
                <input
                  type="range"
                  className="range range-primary"
                  min={0}
                  max={10}
                  value={velocity * 1000}
                  onChange={(e) => setVelocity(parseInt(e.target.value,10)/1000)}
                />
                <label>Velocity : {velocity * 1000}</label>
              </div>
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
            </div>
          </div>
        </div>
        <ThreeCanvas params={params} velocity={velocity}/>
      </div>
    </div>
  );
}

export default App;
