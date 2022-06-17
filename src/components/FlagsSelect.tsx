import React from 'react';
import { FlagData } from "../flagsConfig";

interface FlagsSelectProps {
  flags: FlagData[];
  onChange: (countryCode: string) => void;
  value: string;
}


function FlagsSelect({ flags, onChange, value } : FlagsSelectProps) {
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
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" key="none">None</option>
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
