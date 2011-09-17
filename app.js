var path = require("path"),
    fs = require("fs"),
    strata = require("strata"),
    markdown = require("markdown"),
    ejs = require("ejs");

function notFound(env, callback) {
    callback(404, {"Content-Type": "text/plain"}, "Not found!");
}

function view(filename) {
    return fs.readFileSync(path.resolve(__dirname, "views", filename), "utf8");
}

function render(layout, locals) {
    locals = locals || {};
    return ejs.render(layout, {locals: locals});
}

var indexLayout = view("chapter-index.ejs");
var chapterLayout = view("chapter.ejs");

var app = new strata.Builder(notFound);

app.use(strata.commonLogger);
app.use(strata.gzip);
app.use(strata.contentLength);
app.use(strata.contentType, "text/html");
app.use(strata.rewrite, "/manual", "/manual.html");
app.use(strata.static, path.resolve(__dirname, "public"), "index.html");

app.get("/manual/chapter-index", function (env, callback) {
    var chapters = [];

    for (var prop in strata.manual) {
        if ((/^\d+$/).test(prop)) {
            chapters.push(["/manual/" + prop, strata.manual[prop].title]);
        }
    }

    chapters.sort();

    var content = render(indexLayout, {
        chapters: chapters
    });

    callback(200, {}, content);
});

app.get("/manual/:number", function (env, callback) {
    var chapter = strata.manual[env.route.number];

    if (chapter) {
        var editBase = "https://github.com/mjijackson/strata/edit/master/doc/";

        var content = render(chapterLayout, {
            title: chapter.title,
            content: markdown.parse(chapter.text),
            editUrl: editBase + path.basename(chapter.file)
        });

        callback(200, {}, content);
    } else {
        notFound(env, callback);
    }
});

module.exports = app;
