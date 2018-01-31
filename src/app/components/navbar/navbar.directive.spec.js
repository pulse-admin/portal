(function () {
    'use strict';

    describe('navbar.directive', function () {
        var $log, authService, el, scope, vm;

        beforeEach(function () {
            module('portal', function ($provide) {
                $provide.decorator('authService', function ($delegate) {
                    $delegate.getUserAcf = jasmine.createSpy('getUserAcf');
                    $delegate.getUserName = jasmine.createSpy('getUserName');
                    $delegate.hasAcf = jasmine.createSpy('hasAcf');
                    $delegate.isAuthenticated = jasmine.createSpy('isAuthenticated');
                    $delegate.logout = jasmine.createSpy('logout');
                    $delegate.refreshToken = jasmine.createSpy('refreshToken');
                    return $delegate;
                });
            });
            inject(function ($compile, _$log_, $rootScope, _authService_) {
                $log = _$log_;
                authService = _authService_;

                el = angular.element('<ai-navbar></ai-navbar>');

                scope = $rootScope.$new()
                $compile(el)(scope);
                scope.$digest();
                vm = el.isolateScope().vm;
            });
        });

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                //console.debug("\n Debug: " + $log.debug.logs.join("\n Debug: "));
            }
        });

        it('should be compiled', function () {
            expect(el.html()).not.toEqual(null);
        });

        it('should have isolate scope object with instanciate members', function () {
            expect(vm).toEqual(jasmine.any(Object));
        });

        it('should know if the user is logged in', function () {
            expect(vm.isAuthenticated).toBeDefined();
            vm.isAuthenticated();
            expect(authService.isAuthenticated).toHaveBeenCalled();
        });

        it('should know the user\'s username', function () {
            expect(vm.getUserName).toBeDefined();
            vm.getUserName();
            expect(authService.getUserName).toHaveBeenCalled();
        });

        it('should know if the user has an ACF', function () {
            expect(vm.hasAcf).toBeDefined();
            vm.hasAcf();
            expect(authService.hasAcf).toHaveBeenCalled();
        });

        it('should know the user\'s ACF', function () {
            expect(vm.getUserAcf).toBeDefined();
            vm.getUserAcf();
            expect(authService.getUserAcf).toHaveBeenCalled();
        });

        it('should have a way to log out', function () {
            expect(vm.logout).toBeDefined();
            vm.logout();
            expect(authService.logout).toHaveBeenCalled();
        });

        it('should call the authService.refreshToken on a Keepalive ping', function () {
            scope.$broadcast('Keepalive');
            scope.$digest();
            expect(authService.refreshToken).toHaveBeenCalled();
        });

        it('should log when Idle happens', function () {
            var initialLogLength = $log.warn.logs.length;
            scope.$broadcast('IdleWarn');
            scope.$digest();
            expect($log.warn.logs.length).toBe(initialLogLength + 1);
        });

        it('should call the authService.logout on a IdleTimeout ping', function () {
            scope.$broadcast('IdleTimeout');
            scope.$digest();
            expect(authService.logout).toHaveBeenCalled();
        });
    });
})();
