"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject;

@Shared({
    id: "app.static",
    tags: ["middleware"]
})
@Inject(["static.dir", "static.path"])
class Static {
    constructor(directory, path) {
        this.directory = directory;
        this.path = path;
    }

    mount(app) {
        let express = require("express");

        app.use(this.path, express.static(this.directory));
    }
}
