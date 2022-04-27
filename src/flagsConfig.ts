interface Threshold {
    min: number;
    max: number;
}

interface FlagData {
    name: string;
    threshold: Threshold
}

export const flagsParams : FlagData[] = [
    { name: "argentine", threshold: { min: 100, max: 200 } },
    { name: "brazilSimp", threshold: { min: 100, max: 200 } },
    { name: "cote-ivoire", threshold: { min: 200, max: 250 } },
    { name: "danemark", threshold: { min: 100, max: 200 } },
    { name: "france", threshold: { min: 100, max: 200 } },
    { name: "iceland", threshold: { min: 100, max: 200 } },
    { name: "lebanon", threshold: { min: 200, max: 250 } }
];


export function getThreshold(countryName: string) : Threshold {
    const flag = flagsParams.find(({name}) => countryName === name);
    if(!flag) {
        throw new Error(`getThreshold : Cannot find the flag data for ${countryName}`);
    }
    return flag.threshold;
}