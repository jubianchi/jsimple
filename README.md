# jsimple - a JS dependency injection container/service locator [![Build Status](https://travis-ci.org/jubianchi/jsimple.svg?branch=master)](https://travis-ci.org/jubianchi/jsimple) [![Greenkeeper badge](https://badges.greenkeeper.io/jubianchi/jsimple.svg)](https://greenkeeper.io/)

## Installation

Before using jsimple in your project, add it to your `package.json`:

```sh
npm install --save --no-optional jsimple
```

Using `--no-optional` will prevent NPM from installing the `harmony-reflect` package and you won't be able to use the
Proxy features of jsimple. If you want them simply remove the flag:

```sh
npm install --save jsimple
```

## Usage

Creating a jsimple container is as simple as instanciating it:

```js
"use strict";

let Jsimple = require("jsimple"),
    container = new Jsimple();
```

### Defining services

There are four ways to defines services with jsimple:

* Defining them as *shared* services
* Defining them through *factory* functions
* Defining *function* as services
* Defining *parameters* as services

#### Shared services

Shared services are defined through a function which will build them once and jsimple will then share the same instance
across every call:

```js
container.share("app", () => {
    let express = require("express");

    return express();
});
```

This will define a service called `app` which is an Express application. Now everytime you request this service you will get
the exact same instance:

```js
console.log(container.get("app") === container.get("app")); //true
```

#### Service factories

Sometime you will want to have a new instance of a service each time you fetch it from jsimple. This is where factories are useful:

```js
container.factory("session", (c) => {
    return {
        id: c.get("session.id_generator")()
    };
});
```

This will define a factory called `session` which will return a new fresh object each time you fetch it from jsimple:

```js
console.log(container.get("session") === container.get("session")); //false
```

As you can see in the previous example, the factory function received one argument (`c`): this is the current jsimple instance.
jsimple will automatically pass itself as an argument of both factories and shared service factories.

#### Function services

Sometimes you will need to store a function inside jsimple to use it later. For example, in our previous example (the `session` factory)
the `session.id_generator` is just a plain function. But how did we do that ?

```js
container.share("session.id_generator", container.protect(require('uuid').v4));
```

Doing so we store the `uuid#v4` function in the container and we can use it later.

#### Parameters as services

Defining parameters as services is the process of storing simple values inside jsimple. This can be usefull to store configuration values.
They can be of any kind but not function (scalars, objects, arrays):

```js
container.share("port", 4242);

container.get("app").listen(container.get("port"));
```

### Extending/Overriding services

Any service of any kind defined insde jsimple can be extended or overridden. **The only rule here is you can't modify a service
of any kind once it has been fetched from jsimple.**

#### Extending shared services

Let's see how we would extend our `app` service:

```js
container.extend("app", (app, c) => {
    app.locals.title = "My jsimple Powered App";

    return app;
});
```

Now everytime we fetch the `app` service it will automatically have its `title` defined:

```js
console.log(container.get("app").locals.title); //My jsimple Powered App
```

#### Extending service factories

Extending service factories is as simple as extending shared services:

```js
container.extend("session", (session, c) => {
    session.start = new Date();

    return session;
});
```

Now everytime we fetch a `session` instance it will automatically have its `start` date defined:

```js
console.log(container.get("session").start); //Mon Sep 21 2015 16:52:51 GMT+0200 (CEST)
```

### Overriding services

Overriding services is just the process of replacing any service's definition in the container:

```js
container.factory("session", (c) => {
    return {};
});
```

Now if we fetch the `session` from jsimple we'll just get an empty object:

```js
console.log(container.get("session")); //{}
```

No more `id` nor `start` attributes.

### Using tags

In jsimple each service can have one or more associated tags. This is useful to create groups of services. Let's see an example:

```
container.share("app.static", container.protect(express.static("public")), ["middleware"]);
container.share("app.static", container.protect(express.static("files")), ["middleware"]);

container.extend("app", (app, c) => {
    c.tagged("middleware").forEach(middleware => app.use(c.get(middleware)));

    return app;
});
```

Our Express app will now have the `static` middleware configured to lookup the `public` and `files` folders when we request
resources.

### Using the proxy

jsimple provides a proxy mode which will ease fetching and defining service in some cases. No more calls to `Jsimple#get`
or `Jsimple#share`:

```js
"use strict";

let Jsimple = require("jsimple"),
    container = (new Jsimple()).proxify(); //Here the magic happens!

container.app = () => {
    let express = require("express");

    return express();
};

container["app.static"] = container.protect(express.static("public")), ["middleware"]);
container["app.static"] = container.protect(express.static("files")), ["middleware"]);

container.extend("app", (app, c) => {
    c.tagged("middleware").forEach(middleware => app.use(c[middleware]));

    return app;
});
```

See how we removed every call to `share` and `get`! We now call services as if they were direct property on the `container` object.
**Do not forget that to use this feature you have to remove the `--no-optional` flag from the `npm install` command.**

### Using decorators

jsimple also take advantage of [ES7 decorators](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841) and
provides some usefull annotations to help you define services and factories.

All decorators apply to the last instanciated `Jsimple` instance. This can be customized using the `jsimple` argument on decorators.

**Keep in mind that decorators are experimental and support is provided through Babel which only supports class decorators.**

#### Shared services

Given a file where you create your `Jsimple` instance:

```js
"use strict";

let Jsimple = require("jsimple"),
    container = new Jsimple();

//...
```

And a file where you define a class to be used as a shared service:

```js
"use strict";

let Shared = require("jsimple/decorator").Shared;

@Shared({ id: "myService" })
class MyService {
    //...
}
```

This will declare a shared service identified by `myService` in the `Jsimple` instance.

#### Service factories

Declaring factory services is not really different from the previous example. Once you have created your `Jsimple` instance,
use the `Factory` decorator:

```js
"use strict";

let Factory = require("jsimple/decorator").Factory;

@Factory({ id: "myFactory" })
class MyService {
    //...
}
```

#### Extending/Overriding services

You can also extend shared services or factory using a dedicated decorator:

```js
"use strict";

let Extend = require("jsimple/decorator").Extend;

@Extend({ id: "myService" })
class MyService {
    constructor(service) {
        //...
    }

    //...
}
```

Here, we are extending the `myService` service. Note that the extending service will receive an instance of the extended service as
its first constructor argument.

#### Defining dependencies

In addition to defining services and factories, decorators let you define your classes' dependencies. You can do that using one
of those two syntaxes:

```js
"use strict";

let Shared = require("jsimple/decorator").Shared;

@Shared({
    id: "myService",
    use: ["myOtherService"]
})
class MyService {
    constructor(otherService) {
        //...
    }

    //...
}
```

As you can see, the `Shared` decorator (but also `Factory` and `Extend`) takes an extra `use` argument by which you can define an array of dependencies. A more elegant way of doing this is
by using the `Inject` decorator:

```js
"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject;

@Shared({ id: "myService" })
@Inject(["myOtherService"])
class MyService {
    constructor(otherService) {
        //...
    }

    //...
}
```

The `Inject` decorator will create a Proxy around the annotated class so that when it's instanciated it will automatically fetch
its dependencies through jsimple.

**Note that using `Inject` applies a Proxy on the class itself so even when you instanciate it by hand, it will try to fetch its dependencies through jsimple:**

```js
"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject;

@Shared({ id: "myService" })
@Inject(["myOtherService"])
class MyService {
    constructor(otherService) {
        //...
    }

    //...
}

let myService = new MyService();

// Is equivalent to

let myService = new MyService(container.get("myService"));
```

The `Inject` helper will only inject service for arguments you don't manually provide:

```js
"use strict";

let Shared = require("jsimple/decorator").Shared,
    Inject = require("jsimple/decorator").Inject;

@Shared({ id: "myService" })
@Inject(["myOtherService"])
class MyService {
    constructor(otherService) {
        //...
    }

    //...
}

let myService = new MyService(new OtherService());
```

This will never call jsimple as all the constructor arguments are manually provided.

## License

[The MIT License (MIT)](LICENSE)

Copyright (c) 2015 jubianchi
