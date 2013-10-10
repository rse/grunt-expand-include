
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
grunt.loadNpmTasks("grunt-expand-include");
```

## Task Options

- `directiveSyntax`: (default `js`) either the name of a pre-defined directive syntax (`js`, `css` or `xml`)
   or alternatively defining a new syntax from scratch. The pre-defined syntax are:

       ```js
       directiveSyntax: {
            /*  style:   valid JavaScript (JS)  */
            /*  header:  // foo  */
            /*  include: include("foo", { bar: "quux", baz: "quux" });  */
            /*  expand:  $bar  */
            /*  adjust:  require("quux")  */
            include: /([ \t]*)include\(\s*(["'])((?:\\\2|(?!\2).)+)\2\s*(?:,\s*(\{(?:[\r\n]|.)*?\}))?\s*\)\s*;?([ \t]*(\r?\n)?)/g,
            define:  /\s*(["']?)([a-zA-Z][a-zA-Z0-9_-]*)\1\s*:\s*(["'])((?:\\\3|(?!\3).)*)\3\s*/g,
            expand:  /\$([a-zA-Z][a-zA-Z0-9_-]*)/g,
            header:  /^(?:\/\*[^!](?:[\r\n]|.)*?\*\/|(?:\/\/[^\r\n]*\r?\n)*)\r?\n/,
            adjust:  /(\brequire\((["']))((?:\\\2|(?!\2).)+)(\2\))/g
       }
       directiveSyntax: {
            /*  style:   valid Cascading Style Sheets (CSS)  */
            /*  header:  // foo  */
            /*  include: @import "foo";  */
            /*  expand:  @bar  */
            /*  adjust:  url("quux")  */
            include: /([ \t]*)include\(\s*(["'])((?:\\\2|(?!\2).)+)\2\s*(?:,\s*(\{(?:[\r\n]|.)*?\}))?\s*\)\s*;?([ \t]*(\r?\n)?)/g,
            define:  /\s*(["']?)([a-zA-Z][a-zA-Z0-9_-]*)\1\s*:\s*(["'])((?:\\\3|(?!\3).)*)\3\s*/g,
            expand:  /\$([a-zA-Z][a-zA-Z0-9_-]*)/g,
            header:  /^(?:\/\*[^!](?:[\r\n]|.)*?\*\/|(?:\/\/[^\r\n]*\r?\n)*)\r?\n/,
            adjust:  /(\burl\((["']))((?:\\\2|(?!\2).)+)(\2\))/g
       }
       directiveSyntax: {
            /*  style:   valid eXtensible Markup Language (XML)  */
            /*  header:  <!-- foo -->  */
            /*  include: <include file="foo" bar="quux" baz="quux"/>  */
            /*  expand:  &bar;  */
            /*  adjust:  href="quux" or src="quux"  */
            include: /([ \t]*)<include\s+file=(["'])((?:\\\2|(?!\2).)+)\2((?:\s*[a-zA-Z][a-zA-Z0-9_-]*=(["'])(?:\\\5|(?!\5).)*\5)*)\s*\/>([ \t]*(\r?\n)?)/g,
            define:  /\s*()([a-zA-Z][a-zA-Z0-9_-]*)=(["'])((?:\\\3|(?!\3).)*)\3\s*/g,
            expand:  /\&([a-zA-Z][a-zA-Z0-9_-]*);/g,
            header:  /^<!--[^!](?:[\r\n]|.)*?-->\r?\n/,
            adjust:  /(\s(?:href|src)=(["']))((?:\\\2|(?!\2).)+)(\2)/g
       }
       ```

  ATTENTION: when providing an own `directiveSyntax` for parsing other
  languages, ensure that you are providing the same number of capturing
  groups and in the same order. The underlying implementation depends on
  them for processing the parsed input snippets!

- `expandIncludes`: (default `true`) whether to expand the `directiveSyntax.include`
  directives (a primary functionality of this plugin).

- `expandDefines`: (default `true`) whether to expand the `directiveSyntax.expand`
  directives (a secondary functionality of this plugin). Disable in case
  this expansion functionality causes trouble to you.

- `adjustReferences`: (default `true`) whether to expand the `directiveSyntax.adjust`
  directives (a secondary functionality of this plugin). Disable in case
  this expansion functionality causes trouble to you.

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
    include("foo-version.js", { minor: "99", micro: "42" });
    include("foo-bar.js");
    include("foo-baz.js");
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

- `Gruntfile.js`:

```js
// [...]
grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    "expand-include": {
        "foo": {
            src: [ "src/foo-lib.js" ],
            dest: "build/foo.js",
            options: {
                directiveSyntax: "js",
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

