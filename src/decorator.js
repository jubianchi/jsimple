"use strict";

/**
 * @ignore
 */
let factory = (target, args) => {
    return (service, jsimple) => {
        if (service && jsimple) {
            args.use = [service].concat(args);
        }

        if (!jsimple) {
            jsimple = service;
        }

        if (args.use.length === 0) {
            return new target();
        }

        try {
            require.resolve("harmony-reflect");
        } catch (err) {
            throw new Error("You should install harmony-reflect module and use the --harmony_proxies flag to use this feature");
        }

        require("harmony-reflect");

        return Reflect.construct(target, args.use.map(arg => {
            if (typeof arg === "string") {
                return jsimple.get(arg)
            }

            return arg;
        }));
    }
};

/**
 * @access public
 */
class Decorator {
    /**
     * Sets the default Jsimple instance
     *
     * @param {Jsimple} jsimple
     */
    static setJsimple(jsimple) {
        Decorator.jsimple = jsimple;
    }

    /**
     *
     * @param {Object} args
     *
     * @returns {Function}
     */
    static share(args) {
        args.use = args.use || [];
        args.tags = args.tags || [];
        args.jsimple = args.jsimple || Decorator.jsimple;

        return function(target) {
            args.jsimple.share(args.id, factory(target, args), args.tags);

            return target;
        }
    }

    /**
     *
     * @param {Object} args
     *
     * @returns {Function}
     */
    static factory(args) {
        args.use = args.use || [];
        args.tags = args.tags || [];
        args.jsimple = args.jsimple || Decorator.jsimple;

        return function(target) {
            args.jsimple.factory(args.id, factory(target, args), args.tags);

            return target;
        }
    }

    /**
     *
     * @param {Object} args
     *
     * @returns {Function}
     */
    static extend(args) {
        args.use = args.use || [];
        args.tags = args.tags || [];
        args.jsimple = args.jsimple || Decorator.jsimple;

        return function(target) {
            args.jsimple.extend(args.id, factory(target, args), args.tags);

            return target;
        }
    }

    /**
     *
     * @param {Array<String>|Object} args
     *
     * @returns {Function}
     */
    static use(args) {
        if (args instanceof Array) {
            args = {
                deps: args
            };
        }

        args.jsimple = args.jsimple || Decorator.jsimple;

        try {
            require.resolve("harmony-reflect");
        } catch (err) {
            throw new Error("You should install harmony-reflect module and use the --harmony_proxies flag to use this feature");
        }

        require("harmony-reflect");

        return function(target) {
            return new Proxy(target, {
                construct: (target, ctorArgs) => {
                    return Reflect.construct(target, args.deps.map((dep, index) => {
                        if (ctorArgs[index]) {
                            return ctorArgs[index];
                        }

                        return args.jsimple.get(dep);
                    }));
                }
            });
        };
    }
}

/**
 *
 * @see Decorator.share
 *
 * @param {Object} args
 *
 * @returns {Function}
 */
let Shared = Decorator.share;

/**
 *
 * @see Decorator.factory
 *
 * @param {Object} args
 *
 * @returns {Function}
 */
let Factory = Decorator.factory;

/**
 *
 * @see Decorator.extend
 *
 * @param {Object} args
 *
 * @returns {Function}
 */
let Extend = Decorator.extend;

/**
 *
 * @see Decorator.use
 *
 * @param {Array<String>|Object} args
 *
 * @returns {Function}
 */
let Use = Decorator.use;

/**
 *
 * @see Decorator.use
 *
 * @param {Array<String>|Object} args
 *
 * @returns {Function}
 */
let Inject = Decorator.use;

module.exports = { Decorator, Shared, Factory, Extend, Use, Inject };
