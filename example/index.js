"use strict";

let container = require("./src/container");

require("babel/register")({ optional: "es7.decorators" });
require("./src/application");
require("./src/application/middlewares");
require("./src/application/controllers");

container.app.start();
