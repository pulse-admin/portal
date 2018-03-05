(function () {
    'use strict';

    describe('the entry point', function () {
        var $location, $log, authService, ctrl, mock, scope;
        mock = {
            token: 'a token here',
        };

        beforeEach(function () {
            module('portal.main', 'portal.constants', function ($provide) {
                $provide.decorator('authService', function ($delegate) {
                    $delegate.getToken = jasmine.createSpy('getToken');
                    $delegate.hasAcf = jasmine.createSpy('hasAcf');
                    return $delegate;
                });
            });

            inject(function ($controller, _$location_, _$log_, $rootScope, _authService_) {
                $location = _$location_;
                $log = _$log_;
                ctrl = $controller;
                authService = _authService_;
                authService.getToken.and.returnValue(mock.token);
                authService.hasAcf.and.returnValue(false);

                spyOn($location, 'path');

                scope = $rootScope.$new();
                $controller('MainController');
                scope.$digest();
            });
        });

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                /* eslint-disable no-console,angular/log */
                console.log('Debug:\n' + $log.debug.logs.map(function (o) { return angular.toJson(o); }).join('\n'));
                /* eslint-enable no-console,angular/log */
            }
        });

        it('should call for the PULSE token on load', function () {
            expect(authService.getToken).toHaveBeenCalledWith(true);
        });

        it('should redirect the user to search if they have an acf', function () {
            var initCount = $location.path.calls.count();
            authService.hasAcf.and.returnValue(true);
            ctrl('MainController');
            scope.$digest();
            expect($location.path.calls.count()).toBe(initCount + 1);
            expect($location.path).toHaveBeenCalledWith('/search');
        });

        it('should not redirect the user to search if they do not have an acf', function () {
            var initCount = $location.path.calls.count();
            ctrl('MainController');
            scope.$digest();
            expect($location.path.calls.count()).toBe(initCount);
            expect($location.path).not.toHaveBeenCalledWith('/search');
        });
    });
})();
