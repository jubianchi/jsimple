"use strict";

let container = require("./src/container");

require("babel/register")(require("./config/babel"));
require("./src/application");
require("./src/application/middlewares");
require("./src/application/controllers");

container.app.start();
