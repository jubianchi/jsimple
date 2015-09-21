"use strict";

/**
 * @access public
 */
class Jimple {
    /**
     * Builds a new Jimple instance
     */
    constructor() {
        /** @type {Map<String, *>} */
        this.values = new Map();

        /** @type {Map<String, Set>} */
        this.tagmap = new Map();

        /** @type {Map<String, *>} */
        this.shared = new Map();

        /** @type {Set<String>} */
        this.frozen = new Set();

        /** @type {boolean} */
        this.proxified = false;

        Object.seal(this);
    }

    /**
     *
     * @param {Array<String>|Function(deps: *, container: Jimple): *} deps   List of dependencies to inject or executable function
     * @param {Function(deps: *, container: Jimple): *}               [code] Executable function
     *
     * @returns {*} Result of executing the provided function as code
     */
    use(deps, code) {
        if (deps.constructor.name === "Array") {
            deps = deps || [];
            deps.forEach((value, key) => deps[key] = this.get(value));
            deps.push(this);

            return code.apply(null, deps);
        }

        if (typeof deps === "function") {
            return deps(this);
        } else {
            return code(this);
        }
    }

    /**
     * Sets a parameter or an object factory
     *
     * @param {String}                           name   The unique identifier for the parameter or factory
     * @param {*|Function(container: Jimple): *} value  The parameter value or a factory function
     * @param {Array<String>}                    [tags] An array of tags to associate to the parameter or factory
     *
     * @returns {Jimple} The current Jimple instance
     */
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

        if (this.shared.has(name)) {
            this.shared.delete(name);
        }

        return this;
    }

    /**
     *
     * @param {String}                         name   The unique identifier for the factory
     * @param {Function(container: Jimple): *} code   The executable factory function
     * @param {Array<String>}                  [tags] An array of tags to associate to the factory
     *
     * @returns {Jimple} The current Jimple instance
     */
    share(name, code, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.share must be a string identifier")
        }

        if (typeof code !== "function") {
            throw new Error("Argument #2 passed to Jimple.share must be a function")
        }

        return this.define(
            name,
            jimple => {
                if (jimple.shared.has(name) === false) {
                    jimple.shared.set(name, code(jimple));
                }

                let instance = jimple.shared.get(name);

                this.frozen.add(name);

                return instance;
            },
            tags || []
        );
    }

    /**
     *
     * @param {String}                         name   The unique identifier for the factory
     * @param {Function(container: Jimple): *} code   The executable factory function
     * @param {Array<String>}                  [tags] An array of tags to associate to the factory
     *
     * @returns {Jimple} The current Jimple instance
     */
    factory(name, code, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.factory must be a string identifier")
        }

        if (typeof code !== "function") {
            throw new Error("Argument #2 passed to Jimple.factory must be a function")
        }

        return this.define(
            name,
            jimple => {
                let instance = code(jimple);

                this.frozen.add(name);

                return instance;
            },
            tags || []
        );
    }

    /**
     *
     * @param {String}                                     name   The unique identifier for the parameter or factory to extend
     * @param {Function(service: *, container: Jimple): *} code   The executable extended function
     * @param {Array<String>}                              [tags] An array of tags to associate to the the parameter or factory to extend
     *
     * @returns {Jimple} The current Jimple instance
     */
    extend(name, code, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.extend must be a string identifier")
        }

        if (typeof code !== "function") {
            throw new Error("Argument #2 passed to Jimple.extend must be a function")
        }

        if (this.frozen.has(name)) {
            throw new Error("Cannot extend an already fetched service");
        }

        let service = this.raw(name);

        return this.share(
            name,
            jimple => code(service(jimple), jimple),
            tags || this.values.get(name).tags
        );
    }

    /**
     *
     * @param {String} name The unique identifier for the parameter, service or factory
     *
     * @returns {Boolean} Wether the parameter, service or factory exists
     */
    exists(name) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.exists must be a string identifier")
        }

        return this.values.has(name);
    }

    /**
     *
     * @param {String} name The unique identifier for the parameter, service or factory to fetch
     *
     * @returns {*} Result of executing the factory function
     */
    get(name) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.get must be a string identifier")
        }

        return this.raw(name)(this);
    }

    /**
     *
     * @deprecated Use {@link Jimple#tagged} instead
     * @see Jimple#tagged
     *
     * @param {String} tag The tag name for which to fetch parameters, services or factories
     *
     * @return {Array} Service names associated with the provided tag
     */
    getTagged(tag) {
        return this.tagged(tag);
    }

    /**
     *
     * @param {String} tag tag The tag name for which to fetch parameters, services or factories
     *
     * @returns {Array} Service names associated with the provided tag
     */
    tagged(tag) {
        if (typeof tag !== "string") {
            throw new Error("Argument #1 passed to Jimple.tagged must be a string identifier")
        }

        return Array.from(this.tagmap.get(tag) || []);
    }

    /**
     *
     * @deprecated
     *
     * @return {Array} Declared parameter, service and factory names
     */
    keys() {
        return Array.from(this.values.keys());
    }

    /**
     *
     * @param {Function(): *} code Function to be protected from becoming a factory
     *
     * @returns {Function(): *} Function wrapping the provided function as code
     */
    protect(code) {
        if (typeof code !== "function") {
            throw new Error("Argument #1 passed to Jimple.protect must be a function")
        }

        return () => code;
    }

    /**
     *
     * @param {String} name The unique identifier for the factory to fetch
     *
     * @returns {Function(container: Jimple): *} The declared factory function
     */
    raw(name) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jimple.raw must be a string identifier")
        }

        if (this.exists(name) === false) {
            throw new Error(`Identifier ${name} is not defined`);
        }

        return this.values.get(name);
    }

    /**
     *
     * @returns {Jimple} The current Jimple instance wrapped in a Proxy
     */
    proxify() {
        var Proxy = require("./proxy.js");

        if (this.proxified === false) {
            this.proxified = true;

            return new Proxy(this);
        }

        return this;
    }
}

module.exports = Jimple;
