# Webcore

A Node.js web application framework.



## Getting Started

To create a new project:

1. Download [example app](http://github.paypal.com/api/v3/repos/webcore/example-app/tarball/master) 
2. `npm install`
3. `node index.js`



## Directory structure

- **/config** - Application and middleware configuration
- **/controllers** - Controllers
- **/lib** - Custom developer libraries and other code
- **/locales** - Local-based content
- **/models** - Models
- **/public** - Web resources that are publicly available
- **/public/templates** - Server and browser-side templates
- **/tests** - Unit and functional test cases



## Configuration

Configuration is stored in JSON format. Each settings file can be overridden in development mode by creating a `-development` version, e.g. app-development.json.

- **/config/app.json** - Application specific settings 
- **/config/middleware.json** - Custom middleware specfic settings


*app.json values:*

- **host** - The application host. *Default: localhost*
- **port** - The application port to bind to. *Default: 8000*
- **globalAgent**
  - **maxSockets** - Max number of socket connections to open. *Default: 250*
- **viewEngine**
  - **ext** - Which template extension to use. *Defaut: "dust"*
  - **templatePath** - Root path to templates. *Default: [".build", "templates"]*
  - **helpers** - Array of view helpers to load. *Default: null*
  - **cache** - Enables view cache. *Default: true*
- **i18n**
  - **fallback** - Locale fallback to use if content files aren't found. *Default: "en-US"*
  - **contentPath** - Root path to content files. *Default: ["locales"]*



## Customization


### Application Life-cycle

You can customize your application's life-cycle by adding methods to the app delegate in the `index.js` file. 

- **app.configure(config, next)** - Async method run on startup. `next` must be called to continue.
- **app.requestStart(server)** -  Run at the start of an incoming request.
- **app.requestBeforeRoute(server)** - Run before each route.
- **app.requestAfterRoute(server)** - Run after each route.


### Routes

To add a route you need to create a new file in `/controllers` that exports a function which accepts an express server. From there it's all [express](http://expressjs.com/)!

*Example:* 

```
module.exports = function (server) {
    server.get('/path', function (req, res) {
    	// Awesome code!
    }); 
};
```



## Content 


### Format

Content is in key value format. Named variables may be inserted into content strings with `{bracket}` syntax using the name of the value in your data model.

*Example:*

```
myPage.title=Welcome to my site!
myPage.greeting=Hello, {user}. How are you?
```


### File Structure

Content is loaded from country and language subdirectories inside `/locales` based on the user locale. Convention is used to automatically determine which content file to load: the base template file name and path are looked for in the locales folder. 

*Example:*

```
content/
  US/
    en/
      index.properties
      myDir/
         page.properties

public/
  templates/
    index.dust
    myDir/
      page.dust
```



## Builds

A [Grunt](http://gruntjs.com/) task is used for builds. To prepare your code for production run `grunt build` which will create new files in the `.build` directory. This task must be done before running your app in production mode.



## FAQ

### Why would I use Webcore?
Webcore is the glue to your open source. It sits on top of grunt and express, but offers you a more robust feature set in a web application framework. The benefits include support for externalized content, localization, compile-on-the-fly editing, environment-based configuration, baked-in application security and more.

### How do I run in production mode?
Build your project first and then `export NODE_ENV=production` before running the app.
