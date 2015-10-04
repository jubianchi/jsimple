"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject,
    Controller = require("../controller");

@Shared({
    id: "app.controller.default",
    tags: ["controller"]
})
@Inject(["static.path"])
class Default extends Controller {
    constructor(path) {
        super("/");

        this.path = path;
    }

    get(req, res) {
        res.json({
            links: {
                docs: this.path
            }
        });
    }
}
