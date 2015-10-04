"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject;

@Shared({ id: "app" })
@Inject(["port", "callback", "@middleware", "@controller"])
class Application {
    constructor(port, callback, middlewares, controllers) {
        let express = require("express");

        this.port = port;
        this.callback = callback;
        this.middlewares = middlewares;
        this.controllers = controllers;

        this.express = express();
    }

    start() {
        this.middlewares.forEach(middleware => middleware.mount(this.express));
        this.controllers.forEach(controller => controller.mount(this.express));

        this.express.listen(this.port, this.callback);
    }
}
