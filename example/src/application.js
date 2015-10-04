"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject;

@Shared({ id: "app" })
@Inject(["config.port", "callback", "@middleware", "@controller"])
class Application {
    constructor(port, callback, middlewares, controllers) {
        this.port = port;
        this.callback = callback;
        this.middlewares = middlewares;
        this.controllers = controllers;
    }

    start() {
        let express = require("express")();

        this.middlewares.forEach(middleware => middleware.mount(express));
        this.controllers.forEach(controller => controller.mount(express));

        express.listen(this.port, this.callback);
    }
}
