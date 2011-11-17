var path = require("path"),
    fs = require("fs"),
    strata = require("strata"),
    mustache = require("mustache");

function notFound(env, callback) {
    callback(404, {"Content-Type": "text/plain"}, "Not found!");
}

function getTemplate(filename) {
    var file = path.resolve(__dirname, "templates", filename + ".mustache");
    return fs.readFileSync(file, "utf8");
}

function render(template, view) {
    return mustache.to_html(template, view || {});
}

var indexLayout = getTemplate("chapter-index");
var chapterLayout = getTemplate("chapter");

var app = new strata.Builder;

app.use(strata.commonLogger);
app.use(strata.gzip);
app.use(strata.contentLength);
app.use(strata.contentType, "text/html");
app.use(strata.rewrite, "/manual", "/manual.html");
app.use(strata.static, path.resolve(__dirname, "public"), "index.html");

app.route("/manual/chapter-index", function (env, callback) {
    var chapters = [];

    strata.manual.forEach(function (chapter, index) {
        chapters.push({url: "/manual/" + index, title: chapter.title});
    });

    var content = render(indexLayout, {
        chapters: chapters
    });

    callback(200, {}, content);
}, ["HEAD", "GET"]);

app.route("/manual/:index", function (env, callback) {
    var index = parseInt(env.route.index) || 0;
    var chapter = strata.manual[index];

    if (chapter) {
        var content = chapter.html;

        // Make all links open in a new tab.
        content = content.replace(/<a href=/g, '<a target="_blank" href=');

        var editBase = "https://github.com/mjijackson/strata/edit/master/doc/";

        var content = render(chapterLayout, {
            title: chapter.title,
            content: content,
            editUrl: editBase + path.basename(chapter.file)
        });

        callback(200, {}, content);
    } else {
        notFound(env, callback);
    }
}, ["HEAD", "GET"]);

app.run(notFound);

module.exports = app;
