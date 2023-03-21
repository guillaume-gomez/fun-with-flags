import React, { useState, useEffect, useRef } from 'react';
import { sortBy } from "lodash";
import { useWindowSize } from "rooks";
import useOpenCV from "./customHooks/useOpenCV";
import { FlagData, generateFlagParams,listOfFlagKeys } from "./flagsConfig";
import FlagsSelect from "./components/FlagsSelect";
import ThreeCanvas, { SceneParam } from "./components/ThreeCanvas";
import Help3D from "./components/Help3D";
import './App.css';

const flagKeys = listOfFlagKeys();

function App() {
  const { openCVLoaded } = useOpenCV();
  const [velocity, setVelocity] = useState<number>(0.001);
  //const [debugZone] = useState<boolean>(false);
  const { innerWidth, innerHeight } = useWindowSize();
  const refContainer = useRef<HTMLDivElement>(null);
  const [widthContainer, setWidthContainer] = useState<number>(500);
  const [heightContainer, setHeightContainer] = useState<number>(500);
  const [flags] = useState<FlagData[]>(sortBy(generateFlagParams(), 'name'));
  const [params, setParams] = useState<SceneParam>({countryCode: null, alignMeshes: false });


  useEffect(() => {
    if(openCVLoaded) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const urlParams = Object.fromEntries(urlSearchParams.entries());
      if(urlParams.flag && flagKeys.includes(urlParams.flag)) {
        setParams({ countryCode: urlParams.flag, alignMeshes: false })
      }
    }
  }, [openCVLoaded]);

  useEffect(() => {
    if(refContainer.current && innerHeight && innerWidth) {
      const rect = refContainer.current.getBoundingClientRect();
      setWidthContainer(rect.width);
      setHeightContainer(innerHeight);
    }
  }, [innerWidth, innerHeight, refContainer]);


  function onChange(countryCode: string) {
    setParams({countryCode, alignMeshes: false});
    window.history.replaceState(null, "", `?flag=${countryCode}`);
  }

  return (
    <div className="App">
      <div className="flex flex-col justify-center gap-5" ref={refContainer}>
        <div className="lg:absolute md:static lg:top-8 lg:left-8 lg:max-w-xs md:max-w-full md:w-full">
          <div className="card bg-base-100 shadow-2xl w-full">
           <div className="card-body p-3 flex flex-col gap-5">
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
                  step={0.01}
                  value={velocity * 1000}
                  onChange={(e) => setVelocity(parseFloat(e.target.value)/1000)}
                />
                <label>Velocity : {velocity * 1000}</label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Align all shapes</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={params.alignMeshes}
                    onClick={() => setParams({...params, alignMeshes: !params.alignMeshes })}
                  />
                </label>
              </div>
              <Help3D />
              <p className="text-xs">Double click to switch to fullscreen</p>
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
        <ThreeCanvas
          params={params}
          velocity={velocity}
          width={widthContainer}
          height={heightContainer}
        />
      </div>
    </div>
  );
}

export default App;
