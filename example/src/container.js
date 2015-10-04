"use strict";

let Jsimple = require("jsimple"),
    config = require("../config/app"),
    container = (new Jsimple()).proxify();

module.exports = container
    .define("config.port", config.port)
    .define("config.static", config.static)
    .define("config.logger", config.logger)
    .share("callback", container.protect(() => process.stdout.write("Listening on port 3000\n")))
;
