"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject;

@Shared({
    id: "app.static",
    tags: ["middleware"]
})
@Inject(["config.static"])
class Static {
    constructor(config) {
        this.directory = config.directory;
        this.url = config.url;
    }

    mount(app) {
        let express = require("express");

        app.use(this.url, express.static(this.directory));
    }
}
