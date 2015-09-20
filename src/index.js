"use strict";

class Jimple {
    constructor() {
        this.values = new Map();
        this.tagmap = new Map();
        this.shared = new Map();
    }

    use(deps, module) {
        if (deps.constructor.name === "Array") {
            deps = deps || [];
            deps.forEach((value, key) => deps[key] = this.get(value));
            deps.push(this);

            return module.apply(null, deps);
        }

        if (typeof deps === "function") {
            return deps(this);
        } else {
            return module(this);
        }
    }

    define(name, value, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.define must be a string identifier")
        }

        if (this.values.has(name)) {
            (this.values.get(name).tags || []).forEach(tag => {
                this.tagmap.get(tag).delete(name);
            });

            this.values.delete(name);
        }

        if (typeof value !== "function") {
            this.values.set(name, () => value);
        } else {
            this.values.set(name, value);
        }

        this.values.get(name).tags = tags || [];
        this.values.get(name).tags.forEach(tag => {
            if (this.tagmap.has(tag) === false) {
                this.tagmap.set(tag, new Set());
            }

            this.tagmap.get(tag).add(name);
        });

        return this;
    }

    share(name, code, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.share must be a string identifier")
        }

        if (typeof code !== "function") {
            throw new Error("Argument #2 passed to Jimple.share must be a function")
        }

        if (this.shared.has(name)) {
            this.shared.delete(name);
        }

        return this.define(
            name,
            jimple => {
                if (jimple.shared.has(name) === false) {
                    jimple.shared.set(name, code(jimple));
                }

                return jimple.shared.get(name);
            },
            tags || []
        );
    }

    factory(name, code, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.factory must be a string identifier")
        }

        if (typeof code !== "function") {
            throw new Error("Argument #2 passed to Jimple.factory must be a function")
        }

        if (this.shared.has(name)) {
            this.shared.delete(name);
        }

        return this.define(name, code, tags || []);
    }

    extend(name, code, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.extend must be a string identifier")
        }

        if (typeof code !== "function") {
            throw new Error("Argument #2 passed to Jimple.extend must be a function")
        }

        let service = this.raw(name);

        return this.share(
            name,
            jimple => code(service(jimple), jimple),
            tags || this.values.get(name).tags
        );
    }

    exists(name) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.exists must be a string identifier")
        }

        return this.values.has(name);
    }

    get(name) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.get must be a string identifier")
        }

        return this.raw(name)(this);
    }

    /**
     * @deprecated
     */
    getTagged(tag) {
        return this.tagged(tag);
    }

    tagged(tag) {
        if (typeof tag !== "string") {
            throw new Error("Argument #1 passed to Jimple.tagged must be a string identifier")
        }

        return Array.from(this.tagmap.get(tag) || []);
    }

    /*
     * @deprecated
     */
    keys() {
        return Array.from(this.values.keys());
    }

    protect(code) {
        if (typeof code !== "function") {
            throw new Error("Argument #1 passed to Jimple.protect must be a function")
        }

        return () => code;
    }

    raw(name) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.raw must be a string identifier")
        }

        if (this.exists(name) === false) {
            throw new Error(`Identifier ${name} is not defined`);
        }

        return this.values.get(name);
    }
}

module.exports = Jimple;
