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
    { key: "bi", name: "Burundi", threshold: { min: 190, max: 95 }, override: true },
    { key: "co", name: "Colombia", threshold: { min: 65, max: 100 }, override: true},
    { key: "bq", name: "Caribbean Netherlands", threshold: { min: 205, max: 200 }, override: true },
    { key: "cy", name: "Cyprus", threshold: { min: 239, max: 255 }, override: true },
    { key: "ee", name: "Estonia", threshold: { min: 20, max: 40 }, override: true },
    { key: "fr", name: "France", threshold: { min: 140, max: 242 }, override: true },
    { key: "ir", name: "Iran", threshold: { min: 150, max: 200 }, override: true },
    { key: "lb", name: "Lebanon", threshold: { min: 189, max: 54 }, override: true },
    { key: "la", name: "Laos", threshold: { min: 67, max: 253 }, override: true },
    { key: "ga", name: "Gabon", threshold: { min: 158, max: 242 }, override: true },
    { key: "fm", name: "Micronesia", threshold: { min: 200, max: 250 }, override: true },
    { key: "mr", name: "Mauritania", threshold: { min: 78, max: 49 }, override: true },
    { key: "mq", name: "Martinique", threshold: { min: 138, max: 146 }, override: true },
    { key: "no", name: "Norway", threshold: { min: 249, max: 33 }, override: true },
    { key: "pw", name: "Palau", threshold: { min: 128, max: 243 }, override: true },
    { key: "ru", name: "Russia", threshold: { min: 55, max: 130 }, override: true },
    { key: "ve", name: "Venezuela", threshold: { min: 50, max: 200 }, override: true },
    { key: "ie", name: "Ireland", threshold: { min: 224, max: 15 }, override: true },
    { key: "kz", name: "Kazakhstan", threshold: { min: 150, max: 230 }, override: true },
    { key: "so", name: "Somalia", threshold: { min: 210, max: 130 }, override: true },
    { key: "sg", name: "Singapore", threshold: { min: 240, max: 90 }, override: true },
    { key: "sl", name: "Sierra Leone", threshold: { min: 140, max: 200 }, override: true },
    { key: "ws", name: "Samoa", threshold: { min: 50, max: 60 }, override: true },
    { key: "ci", name: "Côte d'Ivoire (Ivory Coast)", threshold: { min: 250, max: 255 }, override: true },
    { key: "wf", name: "Wallis and Futuna", threshold: { min: 218, max: 30 }, override: true },
    { key: "tw", name: "Taiwan", threshold: { min: 23, max: 22 }, override: true },
    { key: "tj", name: "Tajikistan", threshold: { min: 207, max: 196 }, override: true },
    { key: "ne", name: "Niger", threshold: { min: 119, max: 32 }, override: true },
    { key: "ml", name: "Mali", threshold: { min: 131, max: 94 }, override: true },
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