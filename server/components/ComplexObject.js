const { ModuleResolutionKind } = require("typescript");

class ComplexObject {
    #options
    #updateCallbacks

    constructor(options) {
        this.#options = options;

        this.#updateCallbacks = {}
    }

    broadcastUpdate(opt) {
        Object.values(this.#updateCallbacks).map(callback => {
            callback(opt);
        })
    }

    setOption(opt, val) {
        if (this.#options[opt] != undefined) {
            this.#options[opt] = val;

            this.broadcastUpdate(opt);
        }
    }

    getOption(opt) {
        return this.#options[opt];
    }

    get options() {
        return this.#options;
    }

    registerUpdateCallback(cb) {
        let addr = Math.floor(Math.random()*0xffffff).toString(16).padStart(6, 0);
        while (this.#updateCallbacks[addr] != null) addr = Math.floor(Math.random()*0xffffff).toString(16).padStart(6, 0);

        this.#updateCallbacks[addr] = cb;

        return addr;
    }

    destroyUpdateCallback(addr) {
        if (this.#updateCallbacks[addr] != undefined) {
            delete this.#updateCallbacks[addr];
        }
    }
}

module.exports = ComplexObject;