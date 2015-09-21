# jimple - a JS dependency injection container/service locator [![Build Status](https://travis-ci.org/jubianchi/jimple.svg?branch=master)](https://travis-ci.org/jubianchi/jimple)

## Installation

Before using jimple in your project, add it to your `package.json`:

```sh
npm install --save --no-optional jimple
```

Using `--no-optional` will prevent NPM from installing the `harmony-reflect` package and you won't be able to use the
Proxy features of jimple. If you want them simply remove the flag:

```sh
npm install --save jimple
```

## Usage

Creating a jimple container is as simple as instanciating it:

```js
"use strict";

let Jimple = require("jimple"),
    container = new Jimple();
```

### Defining services

There are four ways to defines services with jimple:

* Defining them as *shared* services
* Defining them through *factory* functions
* Defining *function* as services
* Defining *parameters* as services

#### Shared services

Shared services are defined through a function which will build them once and jimple will then share the same instance
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

Sometime you will want to have a new instance of a service each time you fetch it from jimple. This is where factories are useful:

```js
container.factory("session", (c) => {
    return {
        id: c.get("session.id_generator")()
    };
});
```

This will define a factory called `session` which will return a new fresh object each time you fetch it from jimple:

```js
console.log(container.get("session") === container.get("session")); //false
```

As you can see in the previous example, the factory function received one argument (`c`): this is the current jimple instance.
Jimple will automatically pass itself as an argument of both factories and shared service factories.

#### Function services

Sometimes you will need to store a function inside jimple to use it later. For example, in our previous example (the `session` factory)
the `session.id_generator` is just a plain function. But how did we do that ?

```js
container.share("session.id_generator", container.protect(require('uuid').v4));
```

Doing so we store the `uuid#v4` function in the container and we can use it later.

#### Parameters as services

Defining parameters as services is the process of storing simple values inside jimple. This can be usefull to store configuration values.
They can be of any kind but not function (scalars, objects, arrays):

```js
container.share("port", 4242);

container.get("app").listen(container.get("port"));
```

### Extending/Overriding services

Any service of any kind defined insde jimple can be extended or overridden. **The only rule here is you can't modify a service
of any kind once it has been fetched from jimple.**

#### Extending shared services

Let's see how we would extend our `app` service:

```js
container.extend("app", (app, c) => {
    app.locals.title = "My Jimple Powered App";

    return app;
});
```

Now everytime we fetch the `app` service it will automatically have its `title` defined:

```js
console.log(container.get("app").locals.title); //My Jimple Powered App
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

Now if we fetch the `session` from jimple we'll just get an empty object:

```js
console.log(container.get("session")); //{}
```

No more `id` nor `start` attributes.

### Using tags

In jimple each service can have one or more associated tags. This is useful to create groups of services. Let's see an example:

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

Jimple provides a proxy mode which will ease fetching and defining service in some cases. No more calls to `Jimple#get`
or `Jimple#share`:

```js
"use strict";

let Jimple = require("jimple"),
    container = (new Jimple()).proxify(); //Here the magic happens!

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

## License

[The MIT License (MIT)](LICENSE)

Copyright (c) 2015 jubianchi
