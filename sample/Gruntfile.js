
/* global module: true */
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        "expand-include": {
            "foo-js": {
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
            },
            "foo-xml": {
                src: [ "src/foo-lib.html" ],
                dest: "build/foo.html",
                options: {
                    directiveSyntax: "xml",
                    globalDefines: {
                        major: "<%= pkg.version.split('.')[0] %>",
                        minor: "<%= pkg.version.split('.')[1] %>",
                        micro: "<%= pkg.version.split('.')[2] %>"
                    }
                }
            }
        },
        clean: {
            clean:     [ "build/*", "build" ],
            distclean: [ "node_modules" ]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadTasks("../tasks");

    grunt.registerTask("default", [ "expand-include" ]);
};

