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