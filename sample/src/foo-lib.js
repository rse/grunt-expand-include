/*
**  The Foo Library
*/

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
