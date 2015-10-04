"use strict";

try {
    require.resolve("harmony-reflect");
} catch (err) {
    throw new Error("You should install harmony-reflect module and use the --harmony_proxies flag to use this feature");
}

require("harmony-reflect");

/**
 * @ignore
 */
let Jsimple = require("./jsimple");

/**
 * @access private
 * @extends {Jsimple}
 * @extends {Proxy}
 */
class JsimpleProxy extends Proxy {
    /**
     * Builds a proxy on a Jsimple instance
     *
     * @param {Jsimple} [jsimple] A Jsimple instance to wrap in a Proxy
     */
    constructor(jsimple) {
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

        super(jsimple || new Jsimple(), handler);
    }
}

module.exports = JsimpleProxy;
