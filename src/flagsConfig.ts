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

/*const additionalFlagParams : FlagData[] = [
    { key: "ar", name: "argentine", threshold: { min: 100, max: 200 }, override: false },
    { key: "br", name: "brazilSimp", threshold: { min: 90, max: 255 }, override: true },
    { key: "cr", name: "cote-ivoire", threshold: { min: 200, max: 250 }, override: true },
    { key: "dn", name: "danemark", threshold: { min: 100, max: 200 }, override: true },
    { key: "fr", name: "france", threshold: { min: 100, max: 200 }, override: false },
    { key: "ic", name: "iceland", threshold: { min: 100, max: 200 }, override: false },
    { key: "li", name: "lebanon", threshold: { min: 200, max: 250 }, override: false }
];
*/
export function generateFlagParams() : FlagData[] {
    const flags : Object = require("./flagsName.json");
    return Object.entries(flags).map(([key, name ]) => {
        return { key, name, threshold: { min: 100, max: 200}, override: false };
    });
}



export function getThreshold(countryCode: string) : Threshold {
    const flag = generateFlagParams().find(({key}) => countryCode === key);
    if(!flag) {
        throw new Error(`getThreshold : Cannot find the flag data for ${countryCode}`);
    }
    return flag.threshold;
}