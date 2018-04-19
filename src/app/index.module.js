(function () {
    'use strict';

    angular
        .module('portal', [
            // external modules
            'angular-confirm',
            'angular-filters',
            'angulartics',
            'angulartics.google.analytics',
            'cb.x2js',
            'googlechart',
            'ngAnimate',
            'ngAria',
            'ngDomEvents',
            'ngIdle',
            'ngMessages',
            'ngResource',
            'ngRoute',
            'ngSanitize',
            'ngTouch',
            'ngXslt',
            'ordinal',
            'prettyXml',
            'smart-table',
            'swaggerUi',
            'ui.bootstrap',

            // internal modules
            'portal.common',
            'portal.constants',
            'portal.main',
            'portal.resources',
            'portal.review',
            'portal.search',
        ]);

})();
