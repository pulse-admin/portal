'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var browserSync = require('browser-sync');
var browserSyncSpa = require('browser-sync-spa');

var util = require('util');

var proxyMiddleware = require('http-proxy-middleware');

function browserSyncInit(baseDir, browser) {
    browser = browser === undefined ? 'default' : browser;

    var routes = null;
    if(baseDir === conf.paths.src || (util.isArray(baseDir) && baseDir.indexOf(conf.paths.src) !== -1)) {
        routes = {
            '/bower_components': 'bower_components'
        };
    }

    var server = {
        baseDir: baseDir,
        https: true,
        routes: routes
    };

    /*
     * For more details and option, https://github.com/chimurai/http-proxy-middleware/blob/v0.9.0/README.md
     */
    server.middleware = [
        proxyMiddleware('/rest', {
            target: 'https://localhost:9090/',
            pathRewrite: { '^/rest' : '/' },
            changeOrigin: true,
            secure: false, // TODO want to change this when we get an SSL cert thats not self signed,
            rejectUnauthorized: false
        }),
        proxyMiddleware('/auth', {
            target: 'https://localhost:8082/o/PULSEAuthPortlet/rest/auth',
            pathRewrite: { '^/auth' : '' },
            changeOrigin: true,
            secure: false,
            rejectUnauthorized: false
        })
    ];

    browserSync.instance = browserSync.init({
        startPath: '/',
        notify: false,
        open: false,
        server: server,
        browser: browser
    });
}

browserSync.use(browserSyncSpa({
    selector: '[ng-app]'// Only needed for angular apps
}));

gulp.task('serve', ['watch'], function () {
    browserSyncInit([path.join(conf.paths.tmp, '/serve'), conf.paths.src]);
});

gulp.task('serve:dist', ['build'], function () {
    browserSyncInit(conf.paths.dist);
});

gulp.task('serve:e2e', ['inject'], function () {
    browserSyncInit([conf.paths.tmp + '/serve', conf.paths.src], []);
});

gulp.task('serve:e2e-dist', ['build'], function () {
    browserSyncInit(conf.paths.dist, []);
});
