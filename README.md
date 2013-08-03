
# grunt-expand-include

Grunt Task for Expanding Include Directives

<p/>
<img src="https://nodei.co/npm/grunt-expand-include.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/grunt-expand-include.png" alt=""/>


## Getting Started

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/)
before, be sure to check out the [Getting
Started](http://gruntjs.com/getting-started) guide, as it explains how
to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as
install and use Grunt plugins. Once you're familiar with that process,
you may install this plugin with this command:

```shell
npm install grunt-expand-include --save-dev
```

Once the plugin has been installed, it may be enabled inside your
Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-expand-include');
```

## Task Options

- `directiveSyntax`: (default `js`) either the name of a pre-defined directive syntax (`js` or `xml`)
   or alternatively defining a new syntax from scratch. The pre-defined syntax are:
 
       ```js
       directiveSyntax: {
           /*  style:   valid JavaScript (JS)  */
           /*  header:  // foo  */
           /*  include: $include("foo", { bar: "quux", baz: "quux" })  */
           /*  expand:  $bar  */
           include: /([ \t]*)include\(\s*"([^"]+)"\s*(?:,\s*(\{(?:[\r\n]|.)*?\}))?\s*\)([ \t]*(\r?\n)?)/g,
           define:  /\s*"?([a-zA-Z][a-zA-Z0-9_-]*)"?\s*:\s*"([^"]*)"\s*/g,
           expand:  /\$([a-zA-Z][a-zA-Z0-9_-]*)/g,
           header:  /^(?:\/\*[^!](?:[\r\n]|.)*?\*\/|(?:\/\/[^\r\n]*\r?\n)*)\r?\n/
       }

       directiveSyntax: {
            /*  style:   valid eXtensible Markup Language (XML)  */
            /*  header:  <!-- foo -->  */
            /*  include: <include file="foo" bar="quux" baz="quux"/>  */
            /*  expand:  &bar;  */
            include: /([ \t]*)<include\s+file="([^"]+)"((?:\s*[a-zA-Z][a-zA-Z0-9_-]*="[^"]*")*)\s*\/>([ \t]*(\r?\n)?)/g,
            define:  /\s*([a-zA-Z][a-zA-Z0-9_-]*)="([^"]*)"\s*/g,
            expand:  /\&([a-zA-Z][a-zA-Z0-9_-]*);/g,
            header:  /^<!--[^!](?:[\r\n]|.)*?-->\r?\n/
       }
       ```

- `onUndefinedVariable`: (default `keep`) action in case of a variable expansion where
  the variable is not defined: `keep` for keeping the directive as-is, `empty` for
  replacing the directive with an empty string or `error` to bail out.

- `stripHeaderOfInclude`: (default `true`) whether to strip the initial header comment
   (see `directiveSyntax.header`) of include files.

- `keepWhitespaceProlog`: (default `false`) whether to keep the whitespace prolog
  (see capture group 1 of `directiveSyntax.include`).

- `keepWhitespaceEpilog`: (default `false`) whether to keep the whitespace epilog
  (see capture group 4 of `directiveSyntax.include`).

- `repeatWhitespaceProlog`: (default `true`) whether to repeat the whitespace epilog
  (see capture group 1 of `directiveSyntax.include`) on all lines of the included file.

- `lineTerminator`: (default `"\n"`) the line terminator character(s) which should
  be applied onto the entire expanded destination file.

- `globalDefines`: (default `{}`) the global variable defines passed into the expansion process
  (can be expanded with `directiveSyntax.expand`).

## Expand Include Task

_Run this task with the `grunt expand-include` command._

Task targets, files and options may be specified according to the Grunt
[Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

## Usage Example

Assuming we have the following source files, compromising a JavaScript library:

- `src/foo-lib.js`:

```js
/*  Universal Module Definition (UMD)  */
(function (root, factory) {
    if (typeof define === "function" && define.amd)
        define('foo', function () { return factory(root); });
    else if (typeof module === "object" && typeof exports === "object")
        module.exports = factory(root);
    else
        root.foo = factory(root);
}(this, function (root) {
    var foo = {};
    include("foo-version.js", { minor: "99", micro: "42" })
    include("foo-bar.js")
    include("foo-baz.js")
    return foo;
}));
```

- `src/foo-version.js`:

```js
foo.version = { major: $major, minor: $minor, micro: $micro };
```

- `src/foo-bar.js`:

```js
foo.bar = function () {
    /*  [...bar functionality...]  */
};
```

- `src/foo-baz.js`:

```js
foo.baz = function () {
    /*  [...baz functionality...]  */
};
```

Assuming we have the following build environment:

- `Grundfile.js`:

```js
// [...]
grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    "expand-include": {
        "foo": {
            src: [ "src/foo-lib.js" ],
            dest: "build/foo.js",
            options: {
                directiveSyntax: "js
                globalDefines: {
                    major: "<%= pkg.version.split('.')[0] %>",
                    minor: "<%= pkg.version.split('.')[1] %>",
                    micro: "<%= pkg.version.split('.')[2] %>"
                }
            }
        }
    }
});
// [...]
```

- `package.json`:
```json
{
    "version": "0.9.0",
    [...]
}
```

Then we get the following generated file as the output:

- `build/foo.js`:

```js
/*  Universal Module Definition (UMD)  */
(function (root, factory) {
    if (typeof define === "function" && define.amd)
        define('foo', function () { return factory(root); });
    else if (typeof module === "object" && typeof exports === "object")
        module.exports = factory(root);
    else
        root.foo = factory(root);
}(this, function (root) {
    var foo = {};
    foo.version = { major: 0, minor: 9, micro: 0 };
    foo.bar = function () {
        /*  [...bar functionality...]  */
    };
    foo.baz = function () {
        /*  [...baz functionality...]  */
    };
    return foo;
}));
```

