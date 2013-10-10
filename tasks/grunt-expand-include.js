/*
**  grunt-expand-include -- Grunt Task for Expanding Include Directives
**  Copyright (c) 2013 Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* global module:  false */
/* global require: false */

var path  = require("path");
var chalk = require("chalk");

module.exports = function (grunt) {
    /*  pre-define parsers  */
    var parsers = {
        "js": {
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
        },
        "css": {
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
        },
        "xml": {
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
    };

    /*  define the Grunt task  */
    grunt.registerMultiTask("expand-include", "Expand Include Directives", function () {
        /*  prepare options  */
        var options = this.options({
            directiveSyntax:        "js",
            expandIncludes:         true,
            expandDefines:          true,
            adjustReferences:       true,
            onUndefinedVariable:    "keep",
            stripHeaderOfInclude:   true,
            keepWhitespaceProlog:   false,
            keepWhitespaceEpilog:   false,
            repeatWhitespaceProlog: true,
            lineTerminator:         "\n",
            globalDefines:          {}
        });
        if (typeof options.directiveSyntax === "string") {
            if (typeof parsers[options.directiveSyntax] === "undefined")
                throw "Invalid pre-defined directive syntax \"" + options.directiveSyntax + "\".";
            options.directiveSyntax = parsers[options.directiveSyntax];
        }
        grunt.verbose.writeflags(options, "Options");

        /*  expand functionality  */
        var expandText = function (destdir, srcdir, srcfile, defines, txt) {
            /*  expand variables  */
            if (options.expandDefines) {
                txt = txt.replace(options.directiveSyntax.expand,
                    function (directive, name) {

                    /*  skip special case  */
                    if (name === "include")
                        return directive;

                    /*  resolve variable  */
                    var txt = defines[name];
                    if (typeof txt === "undefined") {
                        if (options.onUndefinedVariable === "keep")
                            txt = directive;
                        else if (options.onUndefinedVariable === "empty")
                            txt = "";
                        else /* if (options.onUndefinedVariable === "error") */
                            throw "Variable \"" + name + "\" not defined.";
                    }
                    return txt;
                });
            }

            /*  expand includes  */
            if (options.expandIncludes) {
                txt = txt.replace(options.directiveSyntax.include,
                    function (directive, prolog, _q, file, definitions, epilog) {

                    /*  resolve possibly existing escapes  */
                    file = file.replace(new RegExp("\\\\" + _q, "g"), _q);

                    /*  process file  */
                    if (!grunt.file.isPathAbsolute(file))
                        file = path.resolve(path.join(srcdir, file));
                    if (!grunt.file.exists(file))
                        throw "Include file \"" + file + "\" not found.";
                    var include_dir = path.dirname(file);
                    var include_file = path.basename(file);
                    var txt = grunt.file.read(file);

                    /*  optionally strip header comment of includes  */
                    if (options.stripHeaderOfInclude)
                        txt = txt.replace(options.directiveSyntax.header, "");

                    /*  process defines  */
                    var include_defines = defines;
                    if (typeof definitions !== "undefined" && definitions !== "") {
                        definitions.replace(options.directiveSyntax.define,
                            function (define, _q1, name, _q2, value) {
                            /*  resolve possibly existing escapes  */
                            if (typeof _q1 !== "undefined" && _q1 !== "")
                                value = value.replace(new RegExp("\\\\" + _q1, "g"), _q1);
                            value = value.replace(new RegExp("\\\\" + _q2, "g"), _q2);

                            /*  store definition  */
                            include_defines[name] = value;
                        });
                    }

                    /*  expand included text (RECURSION!)  */
                    txt = expandText(
                        destdir,
                        include_dir,
                        include_file,
                        include_defines,
                        txt
                    );

                    /*  post whitespace processing  */
                    if (options.repeatWhitespaceProlog)
                        txt = txt.replace(/^(?=.)/mg, prolog);
                    if (options.keepWhitespaceProlog)
                        txt = prolog + txt;
                    if (options.keepWhitespaceEpilog)
                        txt = txt + epilog;
                    return txt;
                });
            }

            /*  adjust references  */
            if (options.adjustReferences) {
                txt = txt.replace(options.directiveSyntax.adjust,
                    function (directive, prolog, _q, ref, epilog) {

                    /*  resolve possibly existing escapes  */
                    ref = ref.replace(new RegExp("\\\\" + _q, "g"), _q);

                    /*  only adjust references which can be resolved on the filesystem  */
                    var file = path.join(srcdir, ref);
                    if (grunt.file.exists(file)) {
                        /*  adjust path from source to destination anchor  */
                        var ref_new = path.normalize(path.join(path.relative(destdir, srcdir), ref));

                        /*  ensure that the reference is still correct based on the destination  */
                        file = path.join(destdir, ref_new);
                        if (!grunt.file.exists(file))
                            throw "Adjusted referenced file \"" + ref_new + "\" not found " +
                                "(from destination directory \"" + destdir + "\").";

                        /*  provide adjusted directive  */
                        directive = prolog + ref_new + epilog;
                    }

                    return directive;
                });
            }

            return txt;
        };

        /*  iterate over all src-dest file pairs  */
        this.files.forEach(function (f) {
            try {
                f.src.forEach(function (src) {
                    if (!grunt.file.exists(src))
                        throw "Source file \"" + chalk.red(src) + "\" not found.";
                    else {
                        /*  determine destination path  */
                        var dest = f.dest;
                        if (grunt.file.isDir(dest))
                            dest = path.join(dest, path.basename(src));

                        /*  read, expand and post-adjust source  */
                        var txt = grunt.file.read(src);
                        txt = expandText(
                            path.resolve(path.dirname(dest)),
                            path.resolve(path.dirname(src)),
                            path.basename(src),
                            options.globalDefines,
                            txt
                        );
                        txt = txt.replace(/\r?\n/g, options.lineTerminator);

                        /*  write destination  */
                        grunt.file.write(dest, txt);
                        grunt.log.writeln("File \"" + chalk.green(dest) + "\" created.");
                    }
                });
            }
            catch (e) {
                grunt.fail.warn(e);
            }
        });
    });
};

