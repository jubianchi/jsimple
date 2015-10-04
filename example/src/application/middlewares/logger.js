"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject;

@Shared({
    id: "app.logger",
    tags: ["middleware"]
})
@Inject(["logger.format"])
class Logger {
    constructor(format) {
        this.format = format;
    }

    mount(app) {
        let morgan = require("morgan");

        app.use(morgan(this.format));
    }
}
