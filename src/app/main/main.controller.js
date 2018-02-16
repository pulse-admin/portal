(function () {
    'use strict';

    angular
        .module('portal.main')
        .controller('MainController', MainController);

    /** @ngInject */
    function MainController ($location, $log, authService) {
        var vm = this;

        vm.hasRole = authService.hasRole;
        vm.isAuthenticated = authService.isAuthenticated;

        activate();

        ////////////////////////////////////////////////////////////////////

        function activate () {
            authService.getToken(true);
            if (authService.hasAcf()) {
                $location.path('/search');
            }
        }
    }
})();
