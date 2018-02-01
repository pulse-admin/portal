(function () {
    'use strict';

    describe('the Authentication services', function () {

        var $httpBackend, $log, $q, $window, API, AuthAPI, authService, mock, networkService, requestHandler;

        requestHandler = {};
        mock = {};
        mock.userAcf = {name: 'ACF Number 1', address: {}, id: 1};
        mock.user = {
            user_id: 'user_id',
            username: 'username',
            auth_source: 'auth_source',
            full_name: 'full_name',
            organization: 'organization',
            purpose_for_use: 'purpose_for_use',
            role: 'role',
            pulseUserId: '1',
            acf: mock.userAcf,
            authorities: ['ROLE_ADMIN'],
        };
        mock.acfs = [{id: 1, name: 'ACF 1', address: {}}, {id: 2, name: 'ACF 2', address: {}}];
        var tokenPrefix = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.';
        var tokenSuffix = '.Fo482cebe7EfuTtGHjvgsMByC0l-V8ZULMlCNVoxWmI'

        beforeEach(function () {
            module('portal.common', 'portal.constants', function ($provide) {
                $provide.decorator('networkService', function ($delegate) {
                    $delegate.emptyFunction = jasmine.createSpy('emptyFunction');
                    return $delegate;
                });
            });

            inject(function (_$httpBackend_, $localStorage, _$log_, _$q_, _$window_, _API_, _AuthAPI_, _authService_, _networkService_) {
                $httpBackend = _$httpBackend_;
                $log = _$log_;
                $q = _$q_;
                $window = _$window_;
                API = _API_;
                AuthAPI = _AuthAPI_;
                authService = _authService_;
                networkService = _networkService_;
                networkService.emptyFunction.and.returnValue($q.when({}));

                mock.jwt = generateJwt({acf: mock.userAcf});
                mock.token = tokenPrefix + $window.btoa(mock.jwt) + tokenSuffix;
                mock.tokenWOAcf = tokenPrefix + $window.btoa(generateJwt({acf: undefined})) + tokenSuffix;
                delete($localStorage.jwtToken);

                spyOn($window.location, 'replace');
                requestHandler.getAcf = $httpBackend.whenGET(API + '/acfs/1').respond(200, mock.acfs[0]);
                requestHandler.getSamlUserToken = $httpBackend.whenGET(AuthAPI + '/jwt').respond(200, {token: mock.token});
                requestHandler.refreshToken = $httpBackend.whenPOST(AuthAPI + '/jwt/keepalive', mock.acfs[0]).respond(200, {token: mock.token});
            })
        });

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                /* eslint-disable no-console,angular/log */
                console.log('Debug:\n' + $log.debug.logs.map(function (o) { return angular.toJson(o); }).join('\n'));
                /* eslint-enable no-console,angular/log */
            }
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should read a jwt to see if the user is authenticated', function () {
            expect(authService.isAuthenticated()).toBeFalsy();
            authService.saveToken(mock.token);
            expect(authService.isAuthenticated()).toBeTruthy();
            expect(authService.getToken()).toEqual(mock.token);
            authService.logout();
            requestHandler.getSamlUserToken.respond(200, {token: 'fake token'});
            authService.getToken(true);
            $httpBackend.flush();
            expect(authService.getToken()).toBeUndefined();
            authService.saveToken('invalid token format');
            expect(authService.isAuthenticated()).toBeFalsy();
        });

        it('should know the logged in user\'s name', function () {
            authService.saveToken(mock.token);
            expect(authService.getUserName()).toEqual('full_name');
        });

        it('should know the logged in user\'s ACF', function () {
            authService.saveToken(mock.token);
            expect(authService.hasAcf()).toBeTruthy();
            authService.logout();
            expect(authService.hasAcf()).toBeFalsy();
            authService.saveToken(mock.tokenWOAcf);
            expect(authService.hasAcf()).toBeFalsy();
        });

        it('should know the logged in user\'s ACF', function () {
            authService.saveToken(mock.token);
            expect(authService.getUserAcf().name).toEqual('ACF Number 1');
            authService.logout();
            expect(authService.getUserAcf()).toEqual('');
        });

        it('should not have a username if the user isn\'t logged in', function () {
            authService.logout();
            expect(authService.getUserName()).toEqual('');
        });

        it('should allow the user to log out', function () {
            authService.saveToken(mock.token);
            expect(authService.isAuthenticated()).toBeTruthy();
            authService.logout();
            expect(authService.isAuthenticated()).toBeFalsy();
        });

        it('should redirect the user to an external page on logout', function () {
            authService.logout();
            expect($window.location.replace).toHaveBeenCalledWith(AuthAPI + '/saml/logout');
        });

        it('should call the saml SP to find the Spring Boot User Object', function () {
            authService.getSamlUserToken();
            $httpBackend.flush();
            requestHandler.getSamlUserToken.respond(401, {error: 'test'});
            authService.getSamlUserToken().then(function (response) {
                expect(response.message).toEqual('test');
            });
            $httpBackend.flush();
        });

        it('should call the saml SP on getToken if the user is not logged in', function () {
            $httpBackend.expectGET(AuthAPI + '/jwt');
            authService.getToken(true);
            $httpBackend.flush();
        });

        it('should have a way to display the token parameters', function () {
            authService.saveToken(mock.token);
            var storedJwt = authService.getTokenVals();
            expect(storedJwt).toEqual(angular.fromJson(mock.jwt));
        });

        it('should have a way to get the entire user\'s identity', function () {
            expect(authService.getUserIdentity).toBeDefined();
            expect(authService.getUserIdentity()).not.toEqual(mock.user);
            authService.saveToken(mock.token);
            expect(authService.getUserIdentity()).toEqual(mock.user);
        });

        it('should have a way to get the entire user\'s identity even if without ACF', function () {
            var userWOAcf = angular.copy(mock.user);
            delete(userWOAcf.acf);
            expect(authService.getUserIdentity()).not.toEqual(userWOAcf);
            authService.saveToken(mock.tokenWOAcf);
            expect(authService.getUserIdentity()).toEqual(userWOAcf);
        });

        it('should have a way to refresh the token', function () {
            authService.saveToken(mock.token);
            authService.refreshToken().then(function (response) {
                expect(response).toEqual(mock.token);
            });
            $httpBackend.flush();
            requestHandler.refreshToken.respond(200, {token: 'fake token'});
            authService.refreshToken().then(function (response) {
                expect(response).toBeNull;
            });
            $httpBackend.flush();
            requestHandler.refreshToken.respond(401, {error: 'test'});
            authService.refreshToken().then(function (response) {
                expect(response.message).toEqual('test');
            });
            $httpBackend.flush();
        });

        it('should be able to clear the user\'s ACF', function () {
            authService.saveToken(mock.token);
            authService.clearToken();
            expect(authService.hasAcf()).toBeFalsy();
        });

        describe('with respect to roles', function () {
            beforeEach(function () {
                authService.saveToken(mock.token);
            });

            it('should know if a user has a role', function () {
                expect(authService.hasRole(['ROLE_ADMIN'])).toBe(true);
            });

            it('should know if a user does not have a role', function () {
                expect(authService.hasRole(['ROLE_PROVIDER'])).toBe(false);
            });

            it('should know if a user has any of a set of roles', function () {
                expect(authService.hasRole(['ROLE_ADMIN', 'ROLE_PROVIDER'])).toBe(true);
            });

            it('should know if a user does not have any of a set of roles', function () {
                expect(authService.hasRole(['ROLE_ORGANIZATIONAL_ADMIN', 'ROLE_PROVIDER'])).toBe(false);
            });
        });

        function generateJwt (options) {
            var user = angular.copy(mock.user);
            var iatDate = new Date();
            var expDate = new Date();
            expDate.setDate(expDate.getDate() + 1);
            var data = {
                sub: user.username,
                iat: iatDate.getTime(),
                exp: expDate.getTime(),
                Identity: [user.user_id, user.username, user.auth_source, user.full_name, user.organization, user.purpose_for_use, user.role, user.pulseUserId, options.acf],
                Authorities: user.authorities,
            };
            var ret;
            if (options && options.acf) {
                data.Identity.push(options.acf);
            }
            ret = angular.toJson(data);

            return ret;
        }
    });
})();
