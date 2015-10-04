"use strict";

class Controller {
    constructor(prefix) {
        this.prefix = prefix;
    }

    mount(app) {
        Object.getOwnPropertyNames(this.constructor.prototype)
            .filter(property => typeof this[property] === "function")
            .forEach(property => {
                let matches = property.match(/^(get|post|put)(.*)$/);

                if (matches) {
                    app[matches[1]](this.prefix + matches[2], this[property].bind(this));
                }
            });
    }
}

module.exports = Controller;
