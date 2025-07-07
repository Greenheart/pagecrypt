/** Parse the given Base64 string and return the data as an Uint8Array */
export function parse(string: string) {
    return Uint8Array.from(atob(string), (c) => c.charCodeAt(0))
}

/** Base64 encode the given Uint8Array and return a string */
export function stringify(data: Uint8Array) {
    let str = ''
    for (let i = 0; i < data.length; i++) {
        str += String.fromCharCode(data[i])
    }
    return btoa(str)
}
