(function () {
    'use strict';

    describe('review.controller', function () {
        var $log, authService, ctrl, location, scope, vm;

        beforeEach(function () {
            module('portal.review', 'portal.constants', function ($provide) {
                $provide.decorator('authService', function ($delegate) {
                    $delegate.isAuthenticated = jasmine.createSpy('isAuthenticated');
                    $delegate.hasAcf = jasmine.createSpy('hasAcf');
                    return $delegate;
                });
            });

            inject(function ($controller, _$location_, _$log_, $q, $rootScope, _authService_) {
                authService = _authService_;
                $log = _$log_;
                location = _$location_;
                authService.isAuthenticated.and.returnValue(true);
                authService.hasAcf.and.returnValue(true);

                ctrl = $controller;
                scope = $rootScope.$new();
                vm = ctrl('ReviewController');
                scope.$digest();
            });
        });

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                //console.debug("\n Debug: " + $log.debug.logs.join("\n Debug: "));
            }
        });

        it('should know if the user is authenticated', function () {
            expect(vm.isAuthenticated).toBeDefined();
            expect(vm.isAuthenticated()).toBeTruthy();
        });

        it('should know if the user has an ACF', function () {
            expect(vm.hasAcf).toBeDefined();
            expect(vm.hasAcf()).toBeTruthy();
        });

        it('should redirect the user to home if they\'re not authenticated', function () {
            authService.isAuthenticated.and.returnValue(false);
            spyOn(location, 'path');
            vm = ctrl('ReviewController');
            scope.$digest();

            expect(location.path).toHaveBeenCalledWith('/');
        });

        it('should redirect the user to home if they don\'t have an acf', function () {
            authService.hasAcf.and.returnValue(false);
            spyOn(location, 'path');
            vm = ctrl('ReviewController');
            scope.$digest();

            expect(location.path).toHaveBeenCalledWith('/');
        });

        describe('handlers and triggers', function () {
            it('should have a function to register handlers', function () {
                expect(vm.registerHandler).toBeDefined();
            });

            it('should add a handler function is one is passed in', function () {
                expect(vm.handlers.length).toBe(0);
                vm.registerHandler(function () {});
                expect(vm.handlers.length).toBe(1);
            });

            it('should remove handlers when scope is destroyed', function () {
                expect(vm.handlers.length).toBe(0);
                var removeHandler = vm.registerHandler(function () {});
                expect(vm.handlers.length).toBe(1);
                removeHandler();
                expect(vm.handlers.length).toBe(0);
            });

            it('should have a function to trigger handlers', function () {
                expect(vm.triggerHandlers).toBeDefined();
            });

            it('should call handler functions when triggered', function () {
                this.aFunc = function () {};
                spyOn(this, 'aFunc');
                vm.registerHandler(this.aFunc);
                vm.triggerHandlers();
                expect(this.aFunc).toHaveBeenCalled();
            });
        });
    });
})();
