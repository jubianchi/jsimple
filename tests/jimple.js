"use strict";

var Jimple = require("../src");

describe("Jimple", () => {
    let jimple;

    beforeEach(() => jimple = new Jimple());

    it("should instanciate", () => jimple.should.be.an.object);

    it("should be empty", () => jimple.keys().should.be.empty);

    describe(".define", () => {
        it("should return jimple instance", () => jimple.define("service", () => {}).should.be.equal(jimple));

        it("should define service", () => jimple.define("service", () => {}).keys().should.be.eql(["service"]));

        it("should store callable", () => {
            let callable = () => {};

            jimple.define("service", callable).raw("service").should.be.equal(callable);
        });

        it("should store value as callable", () => {
            let value = 42;

            jimple.define("service", value).raw("service")().should.be.equal(value);
        });

        it("should tag callable", () => jimple.define("service", () => {}, ["tag"]).tagged("tag").should.be.eql(["service"]));

        it("should not tag same callable twice", () => jimple.define("service", () => {}, ["tag"]).define("service", () => {}, ["tag"]).tagged("tag").should.be.eql(["service"]));
    });

    describe(".share", () => {
        it("should return jimple instance", () => jimple.share("service", () => {}).should.be.equal(jimple));

        it("should wrap callable", () => {
            let callable = () => {};

            jimple.share("service", callable);

            jimple.raw("service").should.be.a.Function();
            jimple.raw("service").should.not.be.equal(callable);
        });

        it("should overwrite existing service", () => {
            let callable = () => {};

            jimple.share("service", callable);
            jimple.share("service", () => {});

            jimple.raw("service").should.not.be.equal(callable);
        });

        describe("factory", () => {
            it("should share service instance", () => {
                let service,
                    callable = () => service = {};

                jimple.share("service", callable);

                jimple.get("service").should.equal(service);
                jimple.get("service").should.be.equal(jimple.get("service"));
            });

            it("should receive jimple instance as an argument", () => {
                let callable = (arg) => arg.should.be.equal(jimple);

                jimple.share("service", callable);

                jimple.get("service");
            });

            it("should reset when service change", () => {
                let service,
                    callable = () => service = {};

                jimple.share("service", callable);

                jimple.get("service").should.equal(service);

                jimple.share("service", () => ({}));

                jimple.get("service").should.not.equal(service);
            })
        });
    });

    describe(".factory", () => {
        it("should return jimple instance", () => jimple.factory("service", () => {}).should.be.equal(jimple));

        it("should wrap callable", () => {
            let callable = () => {};

            jimple.factory("factory", callable);

            jimple.raw("factory").should.be.a.Function();
            jimple.raw("factory").should.not.be.equal(callable);
        });

        it("should delete shared instance", () => {
            let service,
                callable = () => service = {};

            jimple.share("service", callable).get("service");

            jimple.factory("service", () => ({})).get("service").should.not.be.equal(service);
        });

        describe("factory", () => {
            it("should not share service instance", () => {
                let callable = () => ({});

                jimple.factory("factory", callable);

                jimple.get("factory").should.not.equal(jimple.get("factory"));
            });

            it("should receive jimple instance as an argument", () => {
                let callable = (arg) => arg.should.be.equal(jimple);

                jimple.factory("factory", callable);

                jimple.get("factory");
            });
        });
    });

    describe(".extend", () => {
        it("should return jimple instance", () => jimple.share("service", () => {}).extend("service", () => {}).should.be.equal(jimple));

        it("should extend existing service", () => {
            let service,
                callable = () => service = {};

            jimple.share("service", () => {});

            jimple.extend("service", callable).get("service").should.be.equal(service);
        });

        it("should receive base service instance as first argument", () => {
            let service, extended,
                callable = () => service = {},
                extendedCallable = (arg) => arg.should.be.equal(service);

            jimple.share("service", callable);
            jimple.extend("service", extendedCallable);

            jimple.get("service");
        });

        it("should receive jimple instance as second argument", () => {
            let callable = (service, arg) => arg.should.be.equal(jimple);

            jimple.share("service", () => {});
            jimple.extend("service", callable);

            jimple.get("service");
        });

        it("should refuse to extend an already fetched service", () => {
            jimple.share("service", () => {}).get("service");

            (() => jimple.extend("service", () => {})).should.throw(Error);
        });

        it("should refuse to extend an already used factory", () => {
            jimple.factory("factory", () => {}).get("factory");

            (() => jimple.extend("factory", () => {})).should.throw(Error);
        });
    });

    describe(".use", () => {
        it("should inject jimple", () => jimple.use((arg) => arg.should.be.equal(jimple)));

        it("should inject given service", () => {
            let service,
                callable = () => service = {};

            jimple.share("service", callable);

            jimple.use(["service"], (arg) => arg.should.be.equal(service));
        });

        it("should inject given services", () => {
            let service, otherService,
                callable = () => service = {},
                otherCallable = () => otherService = {};

            jimple.share("service", callable);
            jimple.share("otherService", otherCallable);

            jimple.use(["service", "otherService"], (arg, otherArg) => {
                arg.should.be.equal(service);
                otherArg.should.be.equal(otherService);
            });
        });
    });

    describe(".protect", () => {
        it("should wrap callable", () => {
            let callable = () => {};

            jimple.protect(callable).should.not.be.equal(callable);
            jimple.protect(callable)().should.be.equal(callable);
        });
    });

    describe(".raw", () => {
        it("should return raw callable", () => {
            let callable = () => {};

            jimple.define("service", callable).raw("service").should.be.equal(callable);
        });

        it("should return raw callable for value", () => jimple.define("service", 42).raw("service").should.be.a.Function());
    });

    describe(".tagged", () => {
        it("should return tagged service names", () => {
            jimple.define("service", () => {}, ["tag", "gat"]);
            jimple.define("ecivres", () => {}, ["tag"]);

            jimple.tagged("tag").should.be.eql(["service", "ecivres"]);
            jimple.tagged("gat").should.be.eql(["service"]);
        });
    });
});
