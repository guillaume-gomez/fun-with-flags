interface Threshold {
    min: number;
    max: number;
}

export interface FlagData {
    key: string;
    name: string;
    threshold: Threshold
    override: boolean;
}

const additionalFlagParams : FlagData[] = [
    { key: "fr", name: "France", threshold: { min: 140, max: 242 }, override: true },
    { key: "ci", name: "Côte d'Ivoire (Ivory Coast)", threshold: { min: 250, max: 255 }, override: true },
];


export function generateFlagParams() : FlagData[] {
    const flags : Object = require("./flagsName.json");
    return Object.entries(flags).map(([key, name ]) => {
        const override = additionalFlagParams.find(({key: countryKey}) => countryKey === key);
        if(override) {
            return override;
        } else {
            return { key, name, threshold: { min: 100, max: 200}, override: false };
        }
    });
}



export function getThreshold(countryCode: string) : Threshold {
    const flag = generateFlagParams().find(({key}) => countryCode === key);
    if(!flag) {
        throw new Error(`getThreshold : Cannot find the flag data for ${countryCode}`);
    }
    return flag.threshold;
}