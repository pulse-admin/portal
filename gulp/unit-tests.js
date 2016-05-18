'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var karma = require('karma');

var pathSrcHtml = [
    path.join(conf.paths.src, '/**/*.html')
];

var pathSrcJs = [
    path.join(conf.paths.src, '/**/!(*.spec).js')
];

function runTests (singleRun, done) {
    var reporters = ['dots', 'junit', 'growl', 'html'];
    var preprocessors = {};

    pathSrcHtml.forEach(function(path) {
        preprocessors[path] = ['ng-html2js'];
    });

    pathSrcJs.forEach(function(path) {
        preprocessors[path] = ['coverage'];
    });
    reporters.push('coverage')

    var localConfig = {
        configFile: path.join(__dirname, '/../karma.conf.js'),
        singleRun: singleRun,
        autoWatch: !singleRun,
        reporters: reporters,
        preprocessors: preprocessors,
        htmlReporter: {
            outputFile: 'test_reports/units.html'
        },
        junitReporter: {
            outputDir: 'test_reports',
            suite: 'unit'
        },
        coverageReporter: {
            // specify a common output directory
            dir: 'coverage',
            reporters: [
                { type: 'lcov', subdir: '.' },
                // display summary to screen
                { type: 'text-summary' }
            ]
        }
    };

    var server = new karma.Server(localConfig, function(failCount) {
        done(failCount ? new Error("Failed " + failCount + " tests.") : null);
    })
    server.start();
}

gulp.task('test', ['scripts'], function(done) {
    runTests(true, done);
});

gulp.task('test:auto', ['watch'], function(done) {
    runTests(false, done);
});
