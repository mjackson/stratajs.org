var path = require("path"),
    fs = require("fs"),
    strata = require("strata"),
    markdown = require("markdown"),
    ejs = require("ejs");

function notFound(env, callback) {
    callback(404, {"Content-Type": "text/plain"}, "Not found!");
}

var layout = fs.readFileSync(path.resolve(__dirname, "layout.ejs"), "utf8");
var render = function (content, locals) {
    locals = locals || {};
    locals.title = locals.title;
    locals.content = content;
    return ejs.render(layout, {locals: locals});
}

var app = new strata.Builder;

app.use(strata.commonLogger);
// app.use(strata.gzip);
app.use(strata.contentLength);
app.use(strata.contentType, "text/html");
app.use(strata.static, path.resolve(__dirname, "public"));

app.route("/examples/:number", function (env, callback) {
    var route = env["strata.route"];
    var example = strata.examples[route.number];

    if (example) {
        var text = "# " + example.name + "\n" + example.text;
        var title = example.name + " Example";
        callback(200, {}, render(markdown.parse(text), {title: title}));
    } else {
        notFound(env, callback);
    }
});

app.run(function (env, callback) {
    callback(200, {}, "Welcome to Strata!")
});

module.exports = app;
