"use strict";

try {
    require.resolve("harmony-reflect");
} catch (err) {
    throw new Error("You should install harmony-reflect module and use the --harmony_proxies flag to use this feature");
}

require("harmony-reflect");

/**
 * @access private
 */
let Jimple = require(".");

/**
 * @access private
 * @extends {Jimple}
 */
class JimpleProxy extends Proxy {
    /**
     * Builds a proxy on a Jimple instance
     *
     * @param {?Jimple} jimple A Jimple instance to wrap in a Proxy
     */
    constructor(jimple) {
        let handler = {
            get: (target, name) => {
                return name in target ? target[name] : target.get(name);
            },

            set: (target, name, value, receiver) => {
                if (name in target) {
                    throw new Error(`Cannot define a service named ${name}`);
                }

                target.share(name, value);

                return true;
            },

            has: (target, name) => target.exists(name),

            deleteProperty: () => false
        };

        super(jimple || new Jimple(), handler);
    }
}

module.exports = JimpleProxy;
