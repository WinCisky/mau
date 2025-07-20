import { base } from "$app/paths";
// place files you want to import through the `$lib` alias in this folder.

export function decodeHTMLEntities(str: string | undefined) {
    if (str === undefined) return "";
    //check if DOMParser is available
    if (typeof DOMParser === "undefined") {
        return str;
    }
    var doc = new DOMParser().parseFromString(str, "text/html");
    return doc.documentElement.textContent;
}

export function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 0 && month < 3) return "winter";
    if (month >= 3 && month < 6) return "spring";
    if (month >= 6 && month < 9) return "summer";
    return "fall";
}