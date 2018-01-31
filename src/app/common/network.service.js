(function () {
    'use strict';

    angular
        .module('portal.common')
        .factory('networkService', networkService);

    /** @ngInject */
    function networkService ($http, $localStorage, $log, $q, $window, API, AuthAPI, GAAPI) {
        var service = {
            cacheDocument: cacheDocument,
            cancelDocument: cancelDocument,
            cancelDocumentQueryEndpoint: cancelDocumentQueryEndpoint,
            cancelQueryEndpoint: cancelQueryEndpoint,
            clearQuery: clearQuery,
            clearToken: clearToken,
            createAcf: createAcf,
            dischargePatient: dischargePatient,
            editAcf: editAcf,
            editPatient: editPatient,
            getAcf: getAcf,
            getAcfs: getAcfs,
            getAnalytics: getAnalytics,
            getDocument: getDocument,
            getEndpointStatistics: getEndpointStatistics,
            getQueries: getQueries,
            getPatientsAtAcf: getPatientsAtAcf,
            queryEndpoints: queryEndpoints,
            requeryDocumentQueryEndpoint: requeryDocumentQueryEndpoint,
            requeryEndpoint: requeryEndpoint,
            saveToken: saveToken,
            searchForPatient: searchForPatient,
            searchForPatientDocuments: searchForPatientDocuments,
            setAcf: setAcf,
            stagePatient: stagePatient,
        }
        return service;

        ////////////////////////////////////////////////////////////////////

        function cacheDocument (patientId, documentId) {
            return enhancedGet('/patients/' + patientId + '/documents/' + documentId);
        }

        function cancelDocument (patientId, documentId) {
            return enhancedPost('/patients/' + patientId + '/documents/' + documentId + '/cancel', {});
        }

        function cancelDocumentQueryEndpoint (patientId, endpointId) {
            return enhancedPost('/patients/' + patientId + '/endpoints/' + endpointId + '/cancel', {});
        }

        function cancelQueryEndpoint (queryId, endpointId) {
            return enhancedPost('/queries/' + queryId + '/endpoint/' + endpointId + '/cancel', {});
        }

        function clearQuery (queryId) {
            return enhancedPost('/queries/' + queryId + '/delete', {});
        }

        function clearToken () {
            delete($localStorage.jwtToken);
        }

        function createAcf (newAcf) {
            return enhancedPost('/acfs/create', newAcf);
        }

        function dischargePatient (patientId) {
            return enhancedPost('/patients/' + patientId + '/delete', {});
        }

        function getAcf (acfId) {
            return angular.fromJson(enhancedGet('/acfs/' + acfId ));
        }

        function editAcf (anAcf) {
            return postApi('/acfs/' + anAcf.id + '/edit', anAcf)
                .then(function (response) {
                    service.setAcf(response);
                    return $q.when(response);
                }, function (error) {
                    return $q.reject(error);
                });
        }

        function editPatient (patient) {
            return enhancedPost('/patients/' + patient.id + '/edit', patient);
        }

        function getAcfs () {
            return enhancedGet('/acfs');
        }

        function getAnalytics (id) {
            return $http.get(GAAPI + '/query?id=' + id + '&format=data-table')
                .then(function (response) {
                    return response.data;
                }, function (response) {
                    return $q.reject(response);
                });
        }

        function getDocument (patientId, documentId) {
            return enhancedGet('/patients/' + patientId + '/documents/' + documentId + '?cacheOnly=false');
        }

        function getEndpointStatistics () {
            return enhancedGet('/endpoints/statistics');
        }

        function getQueries () {
            return enhancedGet('/queries');
        }

        function getPatientsAtAcf () {
            return enhancedGet('/patients');
        }

        function queryEndpoints () {
            return enhancedGet('/endpoints');
        }

        function requeryDocumentQueryEndpoint (patientId, endpointId) {
            return enhancedPost('/patients/' + patientId + '/endpoints/' + endpointId + '/requery', {});
        }

        function requeryEndpoint (queryId, endpointId) {
            return enhancedPost('/queries/' + queryId + '/endpoint/' + endpointId + '/requery', {});
        }

        function saveToken (token) {
            $localStorage.jwtToken = token;
        }

        function searchForPatient (queryObj) {
            return enhancedPost('/search', queryObj);
        }

        function searchForPatientDocuments (patientId) {
            return enhancedGet('/patients/' + patientId + '/documents');
        }

        function setAcf (acf) {
            return postApi('/jwt/setAcf', acf, AuthAPI)
                .then(function (response) {
                    saveToken(response.token);
                    return $q.when(response.token);
                }, function (error) {
                    return $q.reject(error);
                });
        }

        function stagePatient (patient) {
            return enhancedPost('/queries/' + patient.id + '/stage', patient);
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

        function enhancedPost (endpoint, postObject) {
            return $http.post(API + endpoint, postObject)
                .then(function (response) {
                    return $q.when(response.data);
                }, function (response) {
                    return $q.reject(response);
                });
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
    }
})();
