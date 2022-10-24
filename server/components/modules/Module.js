class Module {
    #sessions;

    constructor() {
        this.#sessions = {}
    }

    addSession(addr, obj) {
        if (this.#sessions[addr] != undefined) return;

        this.#sessions[addr] = obj;
    }

    removeSession(addr) {
        if (this.#sessions[addr] == undefined) return;

        delete this.#sessions[addr];
    }

    broadcast(excludeAddresses, data) {
        Object.keys(this.#sessions).forEach(sessionAddr => {
            if (!excludeAddresses.includes(sessionAddr)) {
                console.log(sessionAddr);
                this.#sessions[sessionAddr].sendJSON(data);
            }
        })
    }

    handleAction(addr, socket, data) {
        if (this.actions[data.action]) {
            this.actions[data.action](addr, socket, data)
        }
    }
}

module.exports = Module;