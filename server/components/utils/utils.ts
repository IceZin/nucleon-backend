import crypto from "crypto"

type Cookies = {[key: string]: string};

export function genAddress(existingAddresses: string) {
    let addr = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    while (existingAddresses.includes(addr))
        addr = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

    return addr;
}

export function genHex(len: number) {
    return crypto.randomBytes(len).toString('hex');
}

export function parseCookies(cookiesRaw: string): Cookies {
    let cookies = cookiesRaw.split(';');
    let arr = {} as Cookies;

    cookies.forEach(cookie => {
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }

        let ck = cookie.substring(0, cookie.indexOf('='));
        let ck_val = cookie.substring(cookie.indexOf('=') + 1, cookie.length);

        arr[ck] = ck_val;
    });

    return arr;
}