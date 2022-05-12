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
    { key: "al", name: "Albania", threshold: { min: 1, max: 50 }, override: true },
    { key: "aq", name: "Antarctica", threshold: { min: 184, max: 236 }, override: true},
    { key: "aw", name: "Aruba", threshold: { min: 182, max: 246 }, override: true },
    { key: "am", name: "Armenia", threshold: { min: 55, max: 255 }, override: true },
    { key: "at", name: "Austria", threshold: { min: 216, max: 255 }, override: true },
    { key: "az", name: "Azerbaijan", threshold: { min: 106, max: 137 }, override: true },
    { key: "be", name: "Belgium", threshold: { min: 153, max: 178 }, override: true },
    { key: "co", name: "Colombie", threshold: { min: 65, max: 100 }, override: true},
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