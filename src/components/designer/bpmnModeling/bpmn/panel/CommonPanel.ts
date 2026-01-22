export function setPropeties(uengineProperties: Record<string, any>, requiredKeyLists: Record<string, any>) {
    Object.keys(requiredKeyLists).forEach((key: string) => {
        ensureKeyExists(uengineProperties, key, requiredKeyLists[key]);
    });

    return uengineProperties;
}

function ensureKeyExists(obj: Record<string, any>, key: string, defaultValue: any) {
    if (!obj.hasOwnProperty(key)) {
        obj[key] = defaultValue;
    }
}
