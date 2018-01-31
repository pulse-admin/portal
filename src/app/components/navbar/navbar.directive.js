(function () {
    'use strict';

    angular
        .module('portal')
        .directive('aiNavbar', aiNavbar);

    /** @ngInject */
    function aiNavbar () {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/navbar/navbar.html',
            scope: {},
            controller: NavbarController,
            controllerAs: 'vm',
            bindToController: {
                active: '@',
            },
        };

        return directive;

        /** @ngInject */
        function NavbarController ($log, $scope, Idle, authService) {
            var vm = this;

            vm.isAuthenticated = authService.isAuthenticated;
            vm.getUserAcf = authService.getUserAcf;
            vm.getUserName = authService.getUserName;
            vm.hasAcf = authService.hasAcf;
            vm.logout = authService.logout;

            activate();

            ////////////////////////////////////////////////////////////////////

            function activate () {
                vm.navCollapse = true;
                Idle.watch();
                $scope.$on('Keepalive', function () {
                    $log.info('Keepalive');
                    authService.refreshToken();
                });
                $scope.$on('IdleWarn', function (e, countdown) {
                    $log.warn('User will be logged out in ' + countdown + ' seconds');
                });
                $scope.$on('IdleTimeout', function () {
                    vm.logout();
                });
            }
        }
    }
})();
