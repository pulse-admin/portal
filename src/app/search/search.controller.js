(function () {
    'use strict';

    angular
        .module('portal.search')
        .controller('SearchController', SearchController);

    /** @ngInject */
    function SearchController ($location, $log, authService) {
        var vm = this;

        vm.hasAcf = hasAcf;
        vm.isAuthenticated = isAuthenticated;
        vm.registerHandler = registerHandler;
        vm.triggerHandlers = triggerHandlers;

        vm.authService = authService;

        activate();

        ////////////////////////////////////////////////////////////////////

        function activate () {
            if (!vm.isAuthenticated()) {
                $location.path('/');
            }
            if (!vm.hasAcf()) {
                $location.path('/');
            }
            vm.handlers = [];
        }

        function hasAcf () {
            return authService.hasAcf();
        }

        function isAuthenticated () {
            return authService.isAuthenticated();
        }

        function registerHandler (handler) {
            vm.handlers.push(handler);
            var removeHandler = function () {
                vm.handlers = vm.handlers.filter(function (aHandler) {
                    return aHandler !== handler;
                });
            };
            return removeHandler;
        }

        function triggerHandlers () {
            angular.forEach(vm.handlers, function (handler) {
                handler();
            });
        }
    }
})();
