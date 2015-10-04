"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject,
    Controller = require("../controller");

@Shared({
    id: "app.controller.home",
    tags: ["controller"]
})
@Inject(["config.static"])
class Home extends Controller {
    constructor(config) {
        super("/");

        this.url = config.url;
    }

    get(req, res) {
        res.json({
            links: [
                {
                    rel: "self",
                    href: req.protocol + '://' + req.get('host') + req.originalUrl
                },
                {
                    rel: "docs",
                    docs: req.protocol + '://' + req.get('host') + this.url
                }
            ]
        });
    }
}
