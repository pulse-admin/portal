(function () {
    'use strict';

    angular
        .module('portal.main')
        .controller('MainController', MainController);

    /** @ngInject */
    function MainController ($location, $log, $timeout, AuthAPI, IDP, authService) {
        var vm = this;

        vm.hasAcf = hasAcf;
        vm.hasRole = authService.hasRole;
        vm.isAuthenticated = isAuthenticated;
        vm.redirectToDhv = redirectToDhv;

        activate();

        ////////////////////////////////////////////////////////////////////

        function activate () {
            vm.authService = authService;
            vm.authAction = AuthAPI + '/saml/login?disco=true';
            vm.willRedirect = false;
            vm.IDP = IDP;

            authService.getSamlUserToken().then(function (response) {
                if (angular.isDefined(response)) {
                    authService.getToken(true);
                    if (vm.hasAcf()) {
                        $location.path('/search');
                    }
                } else {
                    vm.willRedirect = true;
                }
            }, function () {
                vm.willRedirect = true;
            });
        }

        function hasAcf () {
            return authService.hasAcf();
        }

        function isAuthenticated () {
            return authService.isAuthenticated();
        }

        function redirectToDhv () {
            $timeout(function () {
                if (vm.willRedirect) {
                    /* eslint-disable angular/document-service */
                    document.getElementById('dhvForm').submit();
                    /* eslint-enable angular/document-service */
                }
            },1000);
        }
    }
})();
