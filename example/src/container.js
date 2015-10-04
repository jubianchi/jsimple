"use strict";

let Jsimple = require("jsimple"),
    container = (new Jsimple()).proxify();

module.exports = container
    .define("port", 3000)
    .define("static.dir", __dirname + "/../../docs")
    .define("static.path", "/docs")
    .define("logger.format", "combined")
    .share("callback", container.protect(() => process.stdout.write("Listening on port 3000\n")))
;
