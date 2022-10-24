const crypto = require("crypto")

function genAddress(existingAddresses) {
    let addr = Math.floor(Math.random()*0xffffff).toString(16).padStart(6, '0');
    while (existingAddresses.includes(addr))
        addr = Math.floor(Math.random()*0xffffff).toString(16).padStart(6, '0');

    return addr;
}

function genHex(len) {
    return crypto.randomBytes(len).toString('hex');
}

module.exports = {
    genAddress,
    genHex
}