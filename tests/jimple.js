"use strict";

var Jsimple = require("../");

/** @test {Jsimple} */
describe("Jsimple", () => {
    let jsimple;

    beforeEach(() => jsimple = new Jsimple());

    /** @test {Jsimple#constructor} */
    describe("constructor", () => {
        it("should instanciate", () => jsimple.should.be.an.object);

        it("should be empty", () => jsimple.keys().should.be.empty);

        it("should be frozen", () => {
            Object.isExtensible(jsimple).should.be.false;
            (() => jsimple.foo = "bar").should.throw(Error);
        });
    });

    /** @test {Jsimple#define} */
    describe(".define", () => {
        it("should return jsimple instance", () => jsimple.define("service", () => {}).should.be.equal(jsimple));

        it("should define service", () => jsimple.define("service", () => {}).keys().should.be.eql(["service"]));

        it("should store callable", () => {
            let callable = () => {};

            jsimple.define("service", callable).raw("service").should.be.equal(callable);
        });

        it("should tag callable", () => jsimple.define("service", () => {}, ["tag"]).tagged("tag").should.be.eql(["service"]));

        it("should not tag same callable twice", () => jsimple.define("service", () => {}, ["tag"]).define("service", () => {}, ["tag"]).tagged("tag").should.be.eql(["service"]));
    });

    /** @test {Jsimple#share} */
    describe(".share", () => {
        it("should return jsimple instance", () => jsimple.share("service", () => {}).should.be.equal(jsimple));

        it("should wrap callable", () => {
            let callable = () => {};

            jsimple.share("service", callable);

            jsimple.raw("service").should.be.a.Function();
            jsimple.raw("service").should.not.be.equal(callable);
        });

        it("should overwrite existing service", () => {
            let callable = () => {};

            jsimple.share("service", callable);
            jsimple.share("service", () => {});

            jsimple.raw("service").should.not.be.equal(callable);
        });

        it("should refuse to override an already fetched service", () => {
            jsimple.share("service", () => {}).get("service");

            (() => jsimple.share("service", () => {})).should.throw(Error);
        });

        it("should store scalar values as callable", () => {
            let value = 42;

            jsimple.share("parameter", value);

            jsimple.get("parameter").should.equal(value);
        });

        it("should store object values as callable", () => {
            let value = {};

            jsimple.share("service", value);

            jsimple.get("service").should.equal(value);
        });

        describe("factory", () => {
            it("should share service instance", () => {
                let service,
                    callable = () => service = {};

                jsimple.share("service", callable);

                jsimple.get("service").should.equal(service);
                jsimple.get("service").should.be.equal(jsimple.get("service"));
            });

            it("should receive jsimple instance as an argument", () => {
                let callable = (arg) => arg.should.be.equal(jsimple);

                jsimple.share("service", callable);

                jsimple.get("service");
            });
        });
    });

    /** @test {Jsimple#factory} */
    describe(".factory", () => {
        it("should return jsimple instance", () => jsimple.factory("service", () => {}).should.be.equal(jsimple));

        it("should wrap callable", () => {
            let callable = () => {};

            jsimple.factory("factory", callable);

            jsimple.raw("factory").should.be.a.Function();
            jsimple.raw("factory").should.not.be.equal(callable);
        });

        it("should refuse to override an already fetched service", () => {
            jsimple.share("service", () => {}).get("service");

            (() => jsimple.factory("service", () => {})).should.throw(Error);
        });

        it("should refuse to override an already executed factory", () => {
            jsimple.factory("factory", () => {}).get("factory");

            (() => jsimple.factory("factory", () => {})).should.throw(Error);
        });

        describe("factory", () => {
            it("should not share service instance", () => {
                let callable = () => ({});

                jsimple.factory("factory", callable);

                jsimple.get("factory").should.be.an.object;
                jsimple.get("factory").should.be.eql({});
                jsimple.get("factory").should.not.equal(jsimple.get("factory"));
            });

            it("should receive jsimple instance as an argument", () => {
                let callable = (arg) => arg.should.be.equal(jsimple);

                jsimple.factory("factory", callable);

                jsimple.get("factory");
            });
        });
    });

    /** @test {Jsimple#extend} */
    describe(".extend", () => {
        it("should return jsimple instance", () => jsimple.share("service", () => {}).extend("service", () => {}).should.be.equal(jsimple));

        it("should extend existing service", () => {
            let service,
                callable = () => service = {};

            jsimple.share("service", () => {});

            jsimple.extend("service", callable).get("service").should.be.equal(service);
        });

        it("should receive base service instance as first argument", () => {
            let service, extended,
                callable = () => service = {},
                extendedCallable = (arg) => arg.should.be.equal(service);

            jsimple.share("service", callable);
            jsimple.extend("service", extendedCallable);

            jsimple.get("service");
        });

        it("should receive jsimple instance as second argument", () => {
            let callable = (service, arg) => arg.should.be.equal(jsimple);

            jsimple.share("service", () => {});
            jsimple.extend("service", callable);

            jsimple.get("service");
        });

        it("should refuse to extend an already fetched service", () => {
            jsimple.share("service", () => {}).get("service");

            (() => jsimple.extend("service", () => {})).should.throw(Error);
        });

        it("should refuse to extend an already used factory", () => {
            jsimple.factory("factory", () => {}).get("factory");

            (() => jsimple.extend("factory", () => {})).should.throw(Error);
        });
    });

    /** @test {Jsimple#use} */
    describe(".use", () => {
        it("should inject jsimple", () => jsimple.use((arg) => arg.should.be.equal(jsimple)));

        it("should inject given service", () => {
            let service,
                callable = () => service = {};

            jsimple.share("service", callable);

            jsimple.use(["service"], (arg) => arg.should.be.equal(service));
        });

        it("should inject given services", () => {
            let service, otherService,
                callable = () => service = {},
                otherCallable = () => otherService = {};

            jsimple.share("service", callable);
            jsimple.share("otherService", otherCallable);

            jsimple.use(["service", "otherService"], (arg, otherArg) => {
                arg.should.be.equal(service);
                otherArg.should.be.equal(otherService);
            });
        });

        it("should inject tagged services", () => {
            let service, otherService,
                callable = () => service = {},
                otherCallable = () => otherService = {};

            jsimple.share("service", callable, ["tag", "gat"]);
            jsimple.share("otherService", otherCallable, ["tag"]);

            jsimple.use(["@gat"], (arg) => {
                arg.length.should.equal(1);
                arg[0].should.equal(service);
            });

            jsimple.use(["@tag"], (arg) => {
                arg.length.should.equal(2);
                arg[0].should.equal(service);
                arg[1].should.equal(otherService);
            });
        });
    });

    /** @test {Jsimple#protect} */
    describe(".protect", () => {
        it("should wrap callable", () => {
            let callable = () => {};

            jsimple.protect(callable).should.not.be.equal(callable);
            jsimple.protect(callable)().should.be.equal(callable);
        });
    });

    /** @test {Jsimple#raw} */
    describe(".raw", () => {
        it("should return raw callable", () => {
            let callable = () => {};

            jsimple.define("service", callable).raw("service").should.be.equal(callable);
        });

        it("should return raw callable for value", () => jsimple.share("parameter", 42).raw("parameter").should.be.a.Function());
    });

    /** @test {Jsimple#tagged} */
    describe(".tagged", () => {
        it("should return tagged service names", () => {
            jsimple.define("service", () => {}, ["tag", "gat"]);
            jsimple.define("ecivres", () => {}, ["tag"]);

            jsimple.tagged("tag").should.be.eql(["service", "ecivres"]);
            jsimple.tagged("gat").should.be.eql(["service"]);
        });

        it("should return service names associated with several tags", () => {
            jsimple.define("service", () => {}, ["tag", "gat"]);
            jsimple.define("ecivres", () => {}, ["tag"]);
            jsimple.define("vreseci", () => {}, ["gat"]);

            jsimple.tagged("tag").should.be.eql(["service", "ecivres"]);
            jsimple.tagged(["tag", "gat"]).should.be.eql(["service"]);
        })
    });

    /** @test {Jsimple#proxify} */
    describe(".proxify", () => {
        beforeEach(() => {
            let should = require("should");

            should.extend("then", Proxy.prototype);
            should.extend("Boolean", Proxy.prototype);
        });

        it("should return a proxified instance", () => jsimple.proxify().should.be.an.instanceof(Jsimple));

        it("should be extensible", () => Object.isExtensible(jsimple.proxify()).should.be.true);

        it("should be idempotent", () => {
            (jsimple.proxify().proxify() === jsimple).should.be.true;
            (jsimple.proxify().proxify() === jsimple.proxify()).should.be.true;
        });

        describe("traps", () => {
            beforeEach(() => jsimple = jsimple.proxify());

            describe(".get", () => {
                it("should not override native methods", () => {
                    let service,
                        callable = () => service = {};

                    jsimple.share("service", callable);

                    jsimple.get("service").should.be.equal(service);
                });

                it("should fetch service", () => {
                    let service,
                        callable = () => service = {};

                    jsimple.share("service", callable);

                    jsimple.service.should.be.equal(service);
                });

                it("should execute factory", () => {
                    let service,
                        callable = () => service = {};

                    jsimple.factory("service", callable);

                    jsimple.service.should.be.an.object;
                    jsimple.service.should.be.eql({});
                    jsimple.service.should.not.equal(jsimple.service);
                });
            });

            describe(".set", () => {
                it("should refuse to override native methods", () => {
                    (() => jsimple.factory = () => {}).should.throw(Error);
                    (() => jsimple.get = () => {}).should.throw(Error);
                });

                it("should define a shared service", () => {
                    let service;

                    jsimple.service = () => service = {};

                    jsimple.get("service").should.equal(service);
                    jsimple.get("service").should.be.equal(jsimple.get("service"));
                });
            });

            describe(".has", () => {
                it("should check if service exists", () => {
                    jsimple.service = () => {};

                    ("service" in jsimple).should.be.true;
                    ("factory" in jsimple).should.be.false;
                });

                it("should check if factory exists", () => {
                    jsimple.factory("service", () => {});

                    ("service" in jsimple).should.be.true;
                    ("factory" in jsimple).should.be.false;
                });
            });

            describe(".delete", () => {
                it("should prevent deletion", () => {
                    jsimple.service = () => {};

                    (() => delete jsimple.service).should.throw(Error);
                });
            });
        });

        /** @test {Jsimple#share} */
        describe(".share", () => {
            beforeEach(() => jsimple = jsimple.proxify());

            describe("factory", () => {
                it("should receive jsimple proxy instance as an argument", () => {
                    let otherService,
                        callable = (arg) => arg.otherService.should.be.equal(otherService),
                        otherCallable = () => otherService = {};

                    jsimple.share("service", callable);
                    jsimple.share("otherService", otherCallable);

                    jsimple.get("service");
                });
            });
        });

        /** @test {Jsimple#factory} */
        describe(".factory", () => {
            beforeEach(() => jsimple = jsimple.proxify());

            describe("factory", () => {
                it("should receive jsimple proxy instance as an argument", () => {
                    let service,
                        callable = (arg) => arg.service.should.be.equal(service),
                        otherCallable = () => service = {};

                    jsimple.share("service", otherCallable);
                    jsimple.factory("factory", callable);

                    jsimple.get("factory");
                });
            });
        });

        /** @test {JsimpleProxified.fromJsimple} */
        describe("cast", () => {
            it("should keep current state", () => {
                jsimple.share("service", () => ({}));
                jsimple.share("otherService", () => {});
                jsimple.share("taggedService", () => {}, ["tag"]);

                let fetchedService = jsimple.get("service");
                jsimple = jsimple.proxify();

                jsimple.service.should.be.equal(fetchedService);
                ("otherService" in jsimple).should.be.true;
                jsimple.tagged("tag").should.be.eql(["taggedService"]);
            });
        })
    });
});
