/** Parse the given Base64 string and return the data as an Uint8Array */
export function parse(string: string) {
    return Uint8Array.from(atob(string), (c) => c.charCodeAt(0))
}

/** Base64 encode the given Uint8Array and return a string */
export function stringify(data: Uint8Array) {
    return btoa(String.fromCharCode(...new Uint8Array(data)))
}
