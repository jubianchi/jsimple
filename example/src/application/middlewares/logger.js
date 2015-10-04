"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject;

@Shared({
    id: "app.logger",
    tags: ["middleware"]
})
@Inject(["config.logger"])
class Logger {
    constructor(config) {
        this.format = config.format;
    }

    mount(app) {
        let morgan = require("morgan");

        app.use(morgan(this.format));
    }
}
