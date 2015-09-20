require("atoum.js")(module);

var testedClass = require("../src/index");

module.exports = {
    testClass: function() {
        this.object(new testedClass);
    },

    testUse: function() {
        var container, service, otherService, module;

        this
            .given(container = new testedClass)
            .and(service = {})
            .and(otherService = {})
            .and(module = this.generateCallback(function() {
                return {};
            }))
            .if(container.share("service", function() { return service; }))
            .if(container.share("otherService", function() { return otherService; }))
            .then()
                .object(container.use(["service", "otherService"], module))
                .callback(module)
                    .wasCalled().withArguments(service, otherService, container)
            .if(module = this.generateCallback(function() {
                return {};
            }))
            .then()
                .object(container.use(module))
                .callback(module)
                    .wasCalled().withArguments(container)
        ;
    },

    testDefine: function() {
        var container, service;

        this
            .given(container = new testedClass)
            .then()
                .error(function() {
                        container.define(function() {}, "service")
                    }
                )
                    .hasMessage("Argument #1 passed to Jimple.define must be a string identifier")
            .given(service = [])
            .then()
                .object(container.define("service", service)).isIdenticalTo(container)
                .array(container.get("service")).isIdenticalTo(service)
        ;
    },

    testShare: function() {
        var container, factory;

        this
            .given(container = new testedClass)
            .then()
                .error(function() {
                        container.share(function() {}, "service")
                    }
                )
                    .hasMessage("Argument #1 passed to Jimple.share must be a string identifier")
                .error(function() {
                        container.share("service", "function")
                    }
                )
                    .hasMessage("Argument #2 passed to Jimple.share must be a function")
            .given(factory = function() { return {}; })
            .then()
                .object(container.share("service", factory)).isIdenticalTo(container)
                .object(container.get("service")).isIdenticalTo(container.get("service"))
            .if(container.share("service", factory, ["tag"]))
            .then()
                .array(container.getTagged("tag")).isEqualTo(["service"])
            .if(container.get("service"))
            .and(container.share("service", factory, ["other"]))
            .then()
                .array(container.getTagged("tag")).isEmpty()
                .array(container.getTagged("other")).isEqualTo(["service"])
        ;
    },

    testExtend: function() {
        var container, service, extended;

        this
            .given(container = new testedClass)
            .then()
                .error(function() {
                        container.extend(function() {}, "service")
                    }
                )
                    .hasMessage("Argument #1 passed to Jimple.extend must be a string identifier")
                .error(function() {
                        container.extend("service", "function")
                    }
                )
                    .hasMessage("Argument #2 passed to Jimple.extend must be a function")
                .error(function() {
                        container.extend("service", function() {})
                    }
                )
                    .hasMessage("Identifier service is not defined")
            .given(extended = this.generateCallback(function() { return {}; }))
            .and(service = {})
            .if(container.share("service", function() { return service; }))
            .then()
                .object(container.extend("service", extended)).isIdenticalTo(container)
            .if(container.get("service"))
            .then()
                .callback(extended).wasCalled().withArguments(service, container)
            .if(container.share("service", function() { return service; }, ["tag"]))
            .and(container.extend("service", extended))
            .then()
                .array(container.getTagged("tag")).isEqualTo(["service"])
            .if(container.extend("service", extended, ["other"]))
            .then()
                .array(container.getTagged("tag")).isEmpty()
                .array(container.getTagged("other")).isEqualTo(["service"])
        ;
    },

    testExists: function() {
        var container;

        this
            .given(container = new testedClass)
            .then()
                .error(function() {
                        container.exists(function() {})
                    }
                )
                    .hasMessage("Argument #1 passed to Jimple.exists must be a string identifier")
            .if(container.share("service", function() { return {}; }))
            .then()
                .bool(container.exists("service")).isTrue()
                .bool(container.exists("unknown")).isFalse()
        ;
    },

    testGet: function() {
        var container;

        this
            .given(container = new testedClass)
            .then()
                .error(function() {
                        container.get(function() {})
                    }
                )
                    .hasMessage("Argument #1 passed to Jimple.get must be a string identifier")
            .if(container.share("service", function() { return {}; }))
            .then()
                .object(container.get("service")).isEqualTo({})
                .error(function() {
                        container.get("unknown");
                    }
                )
                    .hasMessage("Identifier unknown is not defined")
        ;
    },

    testGetTagged: function() {
        var container;

        this
            .given(container = new testedClass)
            .then()
                .error(function() {
                        container.getTagged(function() {})
                    }
                )
                    .hasMessage("Argument #1 passed to Jimple.getTagged must be a string identifier")
            .if(container.share("service", function() { return {}; }))
            .then()
                .array(container.getTagged("tag")).isEmpty()
            .if(container.share("service", function() { return {}; }, ["tag"]))
            .then()
                .array(container.getTagged("tag")).isEqualTo(["service"])
            .if(container.share("service", function() { return {}; }, ["tag", "other"]))
            .then()
                .array(container.getTagged("tag")).isEqualTo(container.getTagged("other"))
        ;
    },

    testKeys: function() {
        var container;

        this
            .given(container = new testedClass)
            .then()
                .array(container.keys()).isEmpty()
            .if(container.share("service", function() { return {}; }))
            .then()
                .array(container.keys()).isEqualTo(["service"])
        ;
    },

    testProtect: function() {
        var container, factory, service;

        this
            .given(container = new testedClass)
            .and(factory = function() { return {}; })
            .then()
                .function(service = container.protect(factory))
                .function(service()).isIdenticalTo(factory)
            .if(factory = "foo")
            .then()
                .error(function() {
                        container.protect(factory)
                    }
                )
                    .hasMessage("Argument #1 passed to Jimple.protect must be a function")
        ;
    },

    testRaw: function() {
        var container, factory;

        this
            .given(container = new testedClass)
            .then()
                .error(function() {
                        container.raw(function() {})
                    }
                )
                    .hasMessage("Argument #1 passed to Jimple.raw must be a string identifier")
            .given(factory = function() { return {}; })
            .if(container.define("service", factory))
            .then()
                .function(container.raw("service")).isIdenticalTo(factory)
        ;
    }
};
