# Release Notes

kraken-js v2.1.0
Released: 2016-01-04

## Changes

  * **Core:**

    1. Add more robust error handler for both inside and outside of the middleware continuation

      [Implementation](https://github.com/krakenjs/kraken-js/compare/v2.0.1...v2.1.0), [Pull Request](https://github.com/krakenjs/kraken-js/pull/435)

---

kraken-js v2.0.1
Released: 2015-12-04

## Changes

  * **Core:**

    1. Set morgan option to log request even if server crashes

      [Implementation](https://github.com/krakenjs/kraken-js/commit/8febdea2423ce76608cc5167575f69a68eb97787), [Pull Request](https://github.com/krakenjs/kraken-js/pull/430)

---

kraken-js v2.0.0
Released: 2015-10-07

## Bug Fixes

  * **Core:**

    1. Fix occasional double close error on shutdown

      [Issue](https://github.com/krakenjs/kraken-js/issues/402), [Pull Request](https://github.com/krakenjs/kraken-js/pull/419)

## Changes

  * **Core:**

    1. Add `shutdownHeaders` option to shutdown middleware

      [Pull Request](https://github.com/krakenjs/kraken-js/pull/373)

    2. Print deprecation warnings for the included 404 and 500 handlers.

      [Implementation](https://github.com/krakenjs/kraken-js/commit/a6b3fae2ba25703573c317143ad4d2a1a9c3a937), [Issue](https://github.com/krakenjs/kraken-js/issues/359), [Pull Request](https://github.com/krakenjs/kraken-js/pull/361)

## Breaking Changes

  * **Dependency:** meddleware (v1 -> v3)

    1. Call registered middleware factories with a context set to the method owner. This helps in specific cases (e.g., Passport).  
    **Previously:** The factory was called with a context of `null`.

      [Implementation](https://github.com/krakenjs/meddleware/blob/ffb855528d1ceafed12b9c185d093561fd6bb7e1/index.js#L97), [Issue](https://github.com/krakenjs/meddleware/issues/26), [Pull Request](https://github.com/krakenjs/meddleware/pull/29)

    1. Default middleware `enabled` to `true`. I.e., omitting the [`enabled` option](https://github.com/krakenjs/meddleware/blob/01c2c8fbeade81eac8ea295ae30c5bcc1ed2d446/README.md#options) will still enable the middleware.  
      **Previously:** middleware was defaulted `enabled` to `false`.

      [Implementation](https://github.com/krakenjs/meddleware/blob/01c2c8fbeade81eac8ea295ae30c5bcc1ed2d446/index.js#L171-L173), [Issue](https://github.com/krakenjs/meddleware/issues/13), [Pull Request](https://github.com/krakenjs/meddleware/pull/17)

    2. Remove the ability to toggle the `enabled` state of a middleware at arbitrary points during runtime. Now, a middleware that is not `enabled`—by explicitly setting `enabled` to `false`, given breaking change No.1—will not be `require`d (i.e., not parsed), and cannot be enabled at a later time.  
      **Previously:** middleware could be toggled. Was by design, but largely unused and caused unanticipated behavior.

      [Issue](https://github.com/krakenjs/meddleware/issues/20), [Pull Request](https://github.com/krakenjs/meddleware/pull/25)

  * **Dependency:** confit (v1 -> v2)

    1. Resolve the `import` shortstop handler after merging `config.json`, `[env].json`, and before the other shortstop handlers are resolved.  
    **Previously:** `import` handler resolved only once, before the rest of the shortstop handlers.

      [implementation 1](https://github.com/krakenjs/confit/blob/59feac850a6dfb86ac524f4e14736f167ab215c1/lib/factory.js#L35-L44), [implementation 2](https://github.com/krakenjs/confit/blob/59feac850a6dfb86ac524f4e14736f167ab215c1/lib/factory.js#L61), [Issue](https://github.com/krakenjs/confit/issues/26), [Pull Request](https://github.com/krakenjs/confit/pull/35)

      ###### New Behavior:

      >``` js
      >{ "main": "import:main.json" }                              // config/config.json
      >{ "key": "value", "otherKey": "otherValue" }                // config/main.json
      >{ "main": { "key": "devValue" } }                           // config/dev.json
      >{ "main": { "key": "devValue", "otherKey": "otherValue" } } // result
      >```

    2. Change source priority—from highest to lowest (higher overrides lower)— to: command line arguments, environment variables, `[env].json`, `config.json`, [convenience](https://github.com/krakenjs/confit/blob/59feac850a6dfb86ac524f4e14736f167ab215c1/lib/provider.js#L57-L80) (environment normalization and `env:*` keys).  
    **Previously:** source priority order, from highest to lowest, was `[env].json`, `config.json`, convenience, environment variables, command line arguments.

      [Implementation](https://github.com/krakenjs/confit/blob/59feac850a6dfb86ac524f4e14736f167ab215c1/lib/factory.js#L33-L46), [Pull Request](https://github.com/krakenjs/confit/pull/34)

      ###### New Behavior

      >``` js
      >// config/config.json
      >{ "KEY": "fromConfig", "OTHER_KEY": "fromConfig", "THIRD_KEY": "fromConfig" }
      >```
      >
      >``` sh
      >OTHER_KEY=fromEnv THIRD_KEY=fromEnv node myApp.js --THIRD_KEY=fromArgv
      >```
      >
      >``` js
      >// result
      >{ "KEY": "fromConfig", "OTHER_KEY": "fromEnv", "THIRD_KEY": "fromArgv" }
      >```

