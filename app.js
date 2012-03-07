var path = require("path"),
    fs = require("fs"),
    strata = require("strata"),
    mustache = require("mustache"),
    utils = strata.utils;

function getTemplate(filename) {
    var file = path.resolve(__dirname, "templates", filename + ".mustache");
    return fs.readFileSync(file, "utf8");
}

function render(template, view) {
    return mustache.to_html(template, view || {});
}

var indexLayout = getTemplate("chapter-index");
var chapterLayout = getTemplate("chapter");

strata.use(strata.commonLogger);
// strata.use(strata.gzip);
strata.use(strata.contentLength);
strata.use(strata.contentType, "text/html");
strata.use(strata.rewrite, "/manual", "/manual.html");
strata.use(strata.file, path.resolve(__dirname, "public"), "index.html");

strata.get("/manual/chapter-index", function (env, callback) {
    var chapters = [];

    strata.manual.forEach(function (chapter, index) {
        chapters.push({url: "/manual/" + index, title: chapter.title});
    });

    var content = render(indexLayout, {
        chapters: chapters
    });

    callback(200, {}, content);
});

strata.get("/manual/:index", function (env, callback) {
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
        utils.notFound(env, callback);
    }
});

module.exports = strata.app;
