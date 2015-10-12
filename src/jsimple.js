"use strict";

/**
 * @ignore
 */
let Decorator = require("./decorator").Decorator;

/**
 * @access public
 */
class Jsimple {
    /**
     * Builds a new Jsimple instance
     */
    constructor() {
        /**
         * @type {Map<String, *>}
         * @access protected
         */
        this.values = new Map();

        /**
         * @type {Map<String, Set>}
         * @access protected
         */
        this.tagmap = new Map();

        /**
         * @type {Map<String, *>}
         * @access protected
         */
        this.shared = new Map();

        /**
         * @type {Set<String>}
         * @access protected
         */
        this.frozen = new Set();

        Object.freeze(this);

        Decorator.setJsimple(this);
    }

    /**
     *
     * @param {Array<String>|Function(deps: *, container: Jsimple): *} deps   List of dependencies to inject or executable function
     * @param {Function(deps: *, container: Jsimple): *}               [code] Executable function
     *
     * @returns {*} Result of executing the provided function as code
     */
    use(deps, code) {
        if (deps.constructor.name === "Array") {
            deps = deps || [];
            deps.forEach((value, key) => {
                if (value.match(/^@/)) {
                    deps[key] = this.tagged(value.replace(/^@/, "")).map(dep => this.get(dep));
                } else {
                    deps[key] = this.get(value);
                }
            });
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
     * @private
     *
     * @param {String}                           name   The unique identifier for the parameter or factory
     * @param {*|Function(container: Jsimple): *} value  The parameter value or a factory function
     * @param {Array<String>}                    [tags] An array of tags to associate to the parameter or factory
     *
     * @returns {Jsimple} The current Jsimple instance
     */
    define(name, value, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jsimple.define must be a string identifier")
        }

        if (this.frozen.has(name)) {
            throw new Error("Cannot override an already executed factory or fetched service");
        }

        if (typeof value !== "function") {
            throw new Error("Argument #2 passed to Jsimple.define must be a function")
        }

        if (this.values.has(name)) {
            (this.values.get(name).tags || []).forEach(tag => {
                this.tagmap.get(tag).delete(name);
            });

            this.values.delete(name);
        }

        this.values.set(name, value);

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
     * @param {Function(container: Jsimple): *} code   The executable factory function
     * @param {Array<String>}                  [tags] An array of tags to associate to the factory
     *
     * @returns {Jsimple} The current Jsimple instance
     */
    share(name, code, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jsimple.share must be a string identifier")
        }

        return this.define(
            name,
            jsimple => {
                if (jsimple.shared.has(name) === false) {
                    jsimple.shared.set(name, typeof code !== "function" ? code : code(jsimple));
                }

                let instance = jsimple.shared.get(name);

                this.frozen.add(name);

                return instance;
            },
            tags || []
        );
    }

    /**
     *
     * @param {String}                         name   The unique identifier for the factory
     * @param {Function(container: Jsimple): *} code   The executable factory function
     * @param {Array<String>}                  [tags] An array of tags to associate to the factory
     *
     * @returns {Jsimple} The current Jsimple instance
     */
    factory(name, code, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jsimple.factory must be a string identifier")
        }

        if (typeof code !== "function") {
            throw new Error("Argument #2 passed to Jsimple.factory must be a function")
        }

        return this.define(
            name,
            jsimple => {
                let instance = code(jsimple);

                this.frozen.add(name);

                return instance;
            },
            tags || []
        );
    }

    /**
     *
     * @param {String}                                     name   The unique identifier for the parameter or factory to extend
     * @param {Function(service: *, container: Jsimple): *} code   The executable extended function
     * @param {Array<String>}                              [tags] An array of tags to associate to the the parameter or factory to extend
     *
     * @returns {Jsimple} The current Jsimple instance
     */
    extend(name, code, tags) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jsimple.extend must be a string identifier")
        }

        if (typeof code !== "function") {
            throw new Error("Argument #2 passed to Jsimple.extend must be a function")
        }

        let service = this.raw(name);

        return this.share(
            name,
            jsimple => code(service(jsimple), jsimple),
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
            throw new Error("Argument #1 passed to Jsimple.exists must be a string identifier")
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
            throw new Error("Argument #1 passed to Jsimple.get must be a string identifier")
        }

        return this.raw(name)(this);
    }

    /**
     *
     * @deprecated Use {@link Jsimple#tagged} instead
     * @see Jsimple#tagged
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
     * @param {String|Array<String>} tags The tag names for which to fetch parameters, services or factories
     *
     * @returns {Array} Service names associated with the provided tags
     */
    tagged(tags) {
        if (typeof tags !== "string" && tags.constructor.name !== "Array") {
            throw new Error("Argument #1 passed to Jsimple.tagged must be a string identifier or an array of string identifiers")
        }

        if (typeof tags === "string") {
            tags = [tags];
        }

        let tagged;

        tags.forEach(tag => {
            let services = Array.from(this.tagmap.get(tag) || []);

            if (!tagged) {
                tagged = services;
            } else {
                tagged = services.filter(service => tagged.indexOf(service) > -1);
            }
        });

        return tagged;
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
            throw new Error("Argument #1 passed to Jsimple.protect must be a function")
        }

        return () => code;
    }

    /**
     *
     * @param {String} name The unique identifier for the factory to fetch
     *
     * @returns {Function(container: Jsimple): *} The declared factory function
     */
    raw(name) {
        if (typeof name !== "string") {
            throw new Error("Argument #1 passed to Jsimple.raw must be a string identifier")
        }

        if (this.exists(name) === false) {
            throw new Error(`Identifier ${name} is not defined`);
        }

        return this.values.get(name);
    }

    /**
     *
     * @returns {Jsimple} The current Jsimple instance wrapped in a Proxy
     */
    proxify() {
        let jsimple = JsimpleProxified.fromJsimple(this);

        Decorator.setJsimple(jsimple);

        return jsimple;
    }
}

/**
 * @access private
 */
class JsimpleProxified extends Jsimple {
    /**
     * Builds a proxified Jsimple instance from a Jsimple instance
     *
     * @param {Jsimple} jsimple The jsimple instance to proxify
     *
     * @returns {Jsimple} A proxified Jsimple instance
     */
    static fromJsimple(jsimple) {
        if (jsimple instanceof JsimpleProxified) {
            return jsimple;
        }

        let Proxy = require("./proxy.js"),
            proxified = new JsimpleProxified();

        Object.getOwnPropertyNames(jsimple).forEach(property => {
            jsimple[property].forEach((value, key) => {
                if (proxified[property] instanceof Map) {
                    proxified[property].set(key, value);
                }

                if (proxified[property] instanceof Set) {
                    proxified[property].add(value);
                }
            });
        });

        return new Proxy(proxified);
    }
}

module.exports = Jsimple;
