(function () {
    'use strict';

    angular
        .module('portal.common')
        .factory('authService', authService);

    /** @ngInject */
    function authService ($http, $localStorage, $log, $q, $window, API, AuthAPI) {
        var ACF_LOCATION_IN_IDENTITY = 8;

        var service = {
            clearToken: clearToken,
            getSamlUserToken: getSamlUserToken,
            getToken: getToken,
            getTokenVals: getTokenVals,
            getUserAcf: getUserAcf,
            getUserIdentity: getUserIdentity,
            getUserName: getUserName,
            hasAcf: hasAcf,
            hasRole: hasRole,
            isAuthenticated: isAuthenticated,
            logout: logout,
            refreshToken: refreshToken,
            saveToken: saveToken,
        }
        return service;

        ////////////////////////////////////////////////////////////////////

        function clearToken () {
            delete($localStorage.jwtToken);
        }

        function getAcf (acfId) {
            return angular.fromJson(enhancedGet('/acfs/' + acfId ));
        }

        function getSamlUserToken () {
            return getApi('/jwt', AuthAPI)
                .then(function (response) {
                    return $q.when(response.token);
                }, function (error) {
                    return $q.reject(error);
                });
        }

        function getToken (callApi) {
            var token = $localStorage.jwtToken;
            if (!token && callApi) {
                this.getSamlUserToken().then(function (token) {
                    if (validTokenFormat(token)) {
                        saveToken(token);
                        return token;
                    } else {
                        return null
                    }
                });
            }
            return token;
        }

        function getTokenVals () {
            var token = parseJwt(getToken());
            return token;
        }

        function getUserAcf () {
            if (hasAcf()) {
                var token = getToken();
                var identity = parseJwt(token).Identity;
                var acf = angular.fromJson(identity[ACF_LOCATION_IN_IDENTITY]);
                return acf;
            } else {
                return '';
            }
        }

        function getUserIdentity () {
            var user = { };
            if (isAuthenticated()) {
                var token = parseJwt(getToken());
                var identity = token.Identity;
                var authorities = token.Authorities;
                user.user_id = identity[0];
                user.username = identity[1];
                user.auth_source = identity[2];
                user.full_name = identity[3];
                user.organization = identity[4];
                user.purpose_for_use = identity[5];
                user.role = identity[6];
                user.pulseUserId = identity[7];
                if (identity[ACF_LOCATION_IN_IDENTITY]) {
                    user.acf = identity[ACF_LOCATION_IN_IDENTITY];
                }
                user.authorities = authorities;
            }
            return user;
        }

        function getUserName () {
            if (isAuthenticated()) {
                var token = getToken();
                var identity = parseJwt(token).Identity;
                return identity[3];
            } else {
                return '';
            }
        }

        function hasAcf () {
            if (isAuthenticated()) {
                var token = getToken();
                var identity = parseJwt(token).Identity;
                if (identity[ACF_LOCATION_IN_IDENTITY] && angular.fromJson(identity[ACF_LOCATION_IN_IDENTITY]) && angular.isString(angular.fromJson(identity[ACF_LOCATION_IN_IDENTITY]).name)) {
                    return true;
                }
                else {
                    return false;
                }
            } else {
                return false;
            }
        }

        function hasRole (roles) {
            var authorities = parseJwt(getToken()).Authorities;
            return roles.reduce(function (acc, role) {
                return acc || (authorities.indexOf(role) > -1);
            }, false);
        }

        function isAuthenticated () {
            var token, valid;
            token = getToken();
            if (token) {
                var params = parseJwt(token);
                if (params) {
                    valid = Math.round(new Date().getTime() / 1000) <= params.exp;
                }
                else {
                    valid = false;
                }
                if (!valid) {
                    clearToken();
                }
            } else {
                valid = false;
            }
            return valid;
        }

        function logout () {
            clearToken();
            $window.location.replace(AuthAPI + '/saml/logout');
        }

        function refreshToken () {
            var userAcf = getUserAcf();
            return getAcf(userAcf.id)
                .then(function (result){
                    return postApi('/jwt/keepalive', result, AuthAPI)
                        .then(function (response) {
                            if (validTokenFormat(response.token)) {
                                saveToken(response.token);
                                return $q.when(response.token);
                            } else {
                                return $q.when(null);
                            }
                        }, function (error) {
                            return $q.reject(error);
                        });
                });
        }

        function saveToken (token) {
            $localStorage.jwtToken = token;
        }

        ////////////////////////////////////////////////////////////////////

        function enhancedGet (endpoint) {
            return $http.get(API + endpoint)
                .then(function (response) {
                    return $q.when(response.data);
                }, function (response) {
                    if (response.data.error && response.data.error.match(/ACF.*does not exist!/)) {
                        service.clearToken();
                        $window.location.replace('#/');
                    }
                    return $q.reject(response);
                });
        }

        function getApi (endpoint, api) {
            return $http.get(api + endpoint)
                .then(function (response) {
                    return response.data;
                }, function (response) {
                    return $q.reject(response);
                });
        }

        function parseJwt (token) {
            if (validTokenFormat(token)) {
                var base64 = token.split('.')[1].replace('-','+').replace('_','/');
                return angular.fromJson($window.atob(base64));
            } else {
                return null;
            }
        }

        function postApi (endpoint, postObject, api) {
            if (api === null || angular.isUndefined(api)) {
                api = API;
            }
            return $http.post(api + endpoint, postObject)
                .then(function (response) {
                    return response.data;
                }, function (response) {
                    return $q.reject(response);
                });
        }

        function validTokenFormat (token) {
            return (angular.isString(token) && token.match(/.*\..*\..*/));
        }
    }
})();
