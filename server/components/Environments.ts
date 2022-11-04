import Environment from "./Environment";

export default class Environments {
  #environments: Map<string, Environment> = new Map();
  #active: string | undefined;

  create(envAddress: string, env: Environment) {
    if (!this.#environments.has(envAddress)) {
      this.#environments.set(envAddress, env);
    }
  }

  get(envAddress: string) {
    return this.#environments.get(envAddress);
  }

  getAll() {
    let envs: Map<string, string> = new Map();
    this.#environments.forEach((env, key) => {
      envs.set(key, env.name);
    });
    return envs;
  }

  clear() {
    this.#environments.clear();
  }

  get active() {
    if (this.#active) {
      return this.#environments.get(this.#active);
    } else {
      return undefined;
    }
  }

  select(env: string) {
    if (Object.keys(this.#environments).includes(env)) {
      this.#active = env;
    } else {
      throw "Environment not found";
    }
  }
}