import React from 'react';
import { sample } from "lodash";
import { FlagData } from "../flagsConfig";


interface FlagsSelectProps {
  flags: FlagData[];
  onChange: (countryCode: string) => void;
  value: string;
}

const randomKey = "random";

function FlagsSelect({ flags, onChange, value } : FlagsSelectProps) {

  function onChangeSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    if(event.target.value === randomKey) {
      const randomFlag = sample(flags);
      if(!randomFlag) {
        return;
      }
      onChange(randomFlag.key);
    } else {
      onChange(event.target.value);
    }
  }

  return (
    <div
        className="form-control w-full max-w-xs"
        id="select-container"
    >
        <label className="label">
            <span className="label-text">Select a country</span>
        </label>
        <select
          value={value}
          id="country-flags"
          className="select select-primary"
          onChange={onChangeSelect}
        >
          <option value="" key="none">None</option>
          <option value={randomKey} key="rd">Pick a random flag</option>
          {
            flags.map(({key, name}) =>
              <option key={key} value={key}>{name}</option>
            )
          }
        </select>
    </div>
  );
}

export default FlagsSelect;
