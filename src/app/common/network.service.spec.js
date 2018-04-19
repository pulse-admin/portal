(function () {
    'use strict';

    describe('the Network services', function () {

        var $httpBackend, $log, $window, API, AuthAPI, mock, networkService, requestHandler;

        requestHandler = {};
        mock = {};
        mock.acfs = [{id: 1, name: 'ACF 1', address: {}}, {id: 2, name: 'ACF 2', address: {}}];
        mock.newAcf = {name: 'New ACF'};
        mock.stagePatient = { patientRecords: [0,1], id: 1, patient: { givenName: 'Joe', familyName: 'Watson' } };
        mock.patient = { id: 1, fullName: 'John Doe', friendlyName: 'John', gender: 'M', dateOfBirth: 1484629200000 };

        beforeEach(module('portal.common', 'portal.constants'));

        beforeEach(inject(function (_$httpBackend_, $localStorage, _$log_, _$window_, _API_, _AuthAPI_, _networkService_) {
            networkService = _networkService_;
            $httpBackend = _$httpBackend_;
            $log = _$log_;
            $window = _$window_;
            API = _API_;
            AuthAPI = _AuthAPI_;

            spyOn($window.location, 'replace');
            requestHandler.cacheDocument = $httpBackend.whenGET(API + '/patients/3/documents/2').respond(200, true);
            requestHandler.cancelDocument = $httpBackend.whenPOST(API + '/patients/3/documents/2/cancel').respond(200, true);
            requestHandler.cancelDocumentQueryEndpoint = $httpBackend.whenPOST(API + '/patients/3/endpoints/2/cancel', {}).respond(200, true);
            requestHandler.cancelQueryEndpoint = $httpBackend.whenPOST(API + '/queries/1/endpoint/2/cancel', {}).respond(200, true);
            requestHandler.clearQuery = $httpBackend.whenPOST(API + '/queries/1/delete', {}).respond(200, true);
            requestHandler.createAcf = $httpBackend.whenPOST(API + '/acfs/create', mock.newAcf).respond(200, mock.newAcf);
            requestHandler.dischargePatient = $httpBackend.whenPOST(API + '/patients/1/delete', {}).respond(200, true);
            requestHandler.editAcf = $httpBackend.whenPOST(API + '/acfs/1/edit', mock.newAcf).respond(200, {acf: mock.newAcf});
            requestHandler.editPatient = $httpBackend.whenPOST(API + '/patients/1/edit', mock.patient).respond(200, {acf: mock.patient});
            requestHandler.getAcfs = $httpBackend.whenGET(API + '/acfs').respond(200, {results: mock.acfs});
            requestHandler.getAcf = $httpBackend.whenGET(API + '/acfs/1').respond(200, mock.acfs[0]);
            requestHandler.getDocument = $httpBackend.whenGET(API + '/patients/3/documents/2?cacheOnly=false').respond(200, mock.fakeDocument);
            requestHandler.getEndpoints = $httpBackend.whenGET(API + '/endpoints').respond(200, {results: mock.endpoints});
            requestHandler.getEndpointStatistics = $httpBackend.whenGET(API + '/endpoints/statistics').respond(200, {results: mock.endpoints});
            requestHandler.getQueries = $httpBackend.whenGET(API + '/queries').respond(200, {results: mock.patientQueryResponse});
            requestHandler.getPatientsAtAcf = $httpBackend.whenGET(API + '/patients').respond(200, {results: mock.patientQueryResponse});
            requestHandler.getRestQueryPatientDocuments = $httpBackend.whenGET(API + '/patients/3/documents').respond(200, {results: mock.patientDocuments});
            requestHandler.requeryDocumentQueryEndpoint = $httpBackend.whenPOST(API + '/patients/3/endpoints/4/requery', {}).respond(200, true);
            requestHandler.requeryEndpoint = $httpBackend.whenPOST(API + '/queries/3/endpoint/4/requery', {}).respond(200, {results: mock.patientQueryResponse});
            requestHandler.setAcf = $httpBackend.whenPOST(AuthAPI + '/jwt/setAcf', {}).respond(200, {token: mock.token});
            requestHandler.stagePatient = $httpBackend.whenPOST(API + '/queries/1/stage', mock.stagePatient).respond(200, {});
        }));

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                /* eslint-disable no-console,angular/log */
                console.log('Debug:\n' + $log.debug.logs.map(function (o) { return angular.toJson(o); }).join('\n'));
                /* eslint-enable no-console,angular/log */
            }
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('when calling /rest endpoints', function () {
            it('should call /patients', function () {
                $httpBackend.expectPOST(API + '/search', {}).respond(200, {results: mock.patientQueryResponse});
                networkService.searchForPatient({});
                $httpBackend.flush();
            });

            it('should reject a call that doesn\'t return an object', function () {
                $httpBackend.expectPOST(API + '/search', {}).respond(401, {error: 'a rejection'});
                networkService.searchForPatient({}).then(function (response) {
                    expect(response).toEqual('a rejection');
                });
                $httpBackend.flush();
            });

            it('should call /queries', function () {
                networkService.getQueries();
                $httpBackend.flush();
                requestHandler.getQueries.respond(401, {error: 'test'});
                networkService.getQueries().then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should call /queries/id/delete', function () {
                networkService.clearQuery(1);
                $httpBackend.flush();
                requestHandler.clearQuery.respond(401, {error: 'test'});
                networkService.clearQuery(1).then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should call /queries/queryid/endpoint/endpointmapid/cancel', function () {
                networkService.cancelQueryEndpoint(1,2);
                $httpBackend.flush();
                requestHandler.cancelQueryEndpoint.respond(401, {error: 'test'});
                networkService.cancelQueryEndpoint(1,2).then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should call /patients/id/delete', function () {
                networkService.dischargePatient(1);
                $httpBackend.flush();
                requestHandler.dischargePatient.respond(401, {error: 'test'});
                networkService.dischargePatient(1).then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should call /query/patientDocuments', function () {
                networkService.searchForPatientDocuments(3);
                $httpBackend.flush();
                requestHandler.getRestQueryPatientDocuments.respond(401, {error: 'test'});
                networkService.searchForPatientDocuments(3).then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should return data of a document', function () {
                networkService.getDocument(3,2);
                $httpBackend.flush();
                requestHandler.getDocument.respond(401, {error: 'test'});
                networkService.getDocument(3,2).then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should cache documents', function () {
                networkService.cacheDocument(3,2);
                $httpBackend.flush();
                requestHandler.cacheDocument.respond(401, {error: 'test'});
                networkService.cacheDocument(3,2).then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should cancel querying of documents', function () {
                networkService.cancelDocument(3,2);
                $httpBackend.flush();
                requestHandler.cancelDocument.respond(401, {error: 'test'});
                networkService.cancelDocument(3,2).then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should cancel querying of document lists', function () {
                networkService.cancelDocumentQueryEndpoint(3,2);
                $httpBackend.flush();
                requestHandler.cancelDocumentQueryEndpoint.respond(401, {error: 'test'});
                networkService.cancelDocumentQueryEndpoint(3,2).then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should call /endpoints', function () {
                networkService.queryEndpoints();
                $httpBackend.flush();
                requestHandler.getEndpoints.respond(401, {error: 'test'});
                networkService.queryEndpoints().then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should call /endpoints/statistics', function () {
                networkService.getEndpointStatistics();
                $httpBackend.flush();
                requestHandler.getEndpointStatistics.respond(401, {error: 'test'});
                networkService.getEndpointStatistics().then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should call /acfs', function () {
                networkService.getAcfs();
                $httpBackend.flush();
                requestHandler.getAcfs.respond(401, {error: 'test'});
                networkService.getAcfs().then(function (response) {
                    expect(response.message).toEqual('test');
                });
                $httpBackend.flush();
            });

            it('should clear the token if an error comes back saying the ACF doesn\'t exist', function () {
                spyOn(networkService, 'clearToken');
                requestHandler.getAcfs.respond(401, {error: 'ACF something does not exist!'});
                networkService.getAcfs();
                $httpBackend.flush();
                expect(networkService.clearToken).toHaveBeenCalled();
            });

            it('should redirect the user if an error comes back saying the ACF doesn\'t exist', function () {
                requestHandler.getAcfs.respond(401, {error: 'ACF something does not exist!'});
                networkService.getAcfs();
                $httpBackend.flush();
                expect($window.location.replace).toHaveBeenCalledWith('#/');
            });

            it('should call /acfs/set', function () {
                networkService.setAcf({});
                $httpBackend.flush();
                requestHandler.setAcf.respond(401, {error: 'a rejection'});
                networkService.setAcf({}).then(function (response) {
                    expect(response).toEqual('a rejection');
                });
                $httpBackend.flush();
            });

            it('should call /acfs/create', function () {
                networkService.createAcf(mock.newAcf);
                $httpBackend.flush();
                requestHandler.createAcf.respond(401, {error: 'a rejection'});
                networkService.createAcf(mock.newAcf).then(function (response) {
                    expect(response).toEqual('a rejection');
                });
                $httpBackend.flush();
            });

            it('should call /acfs/{{id}}/edit', function () {
                mock.newAcf.id = 1;
                $httpBackend.expectPOST(AuthAPI + '/jwt/setAcf', {acf: mock.newAcf}).respond(200, {});
                networkService.editAcf(mock.newAcf);
                $httpBackend.flush();
                requestHandler.editAcf.respond(401, {error: 'a rejection'});
                networkService.editAcf(mock.newAcf).then(function (response) {
                    expect(response).toEqual('a rejection');
                });
                $httpBackend.flush();
            });

            it('should call /acfs/{{id}}', function () {
                networkService.getAcf(1).then(function (response){
                    expect(response).toEqual(mock.acfs[0]);
                });
                $httpBackend.flush();
            });

            it('should call setAcf after calling acfs/edit', function () {
                spyOn(networkService, 'setAcf');
                mock.newAcf.id = 1;
                networkService.editAcf(mock.newAcf);
                $httpBackend.flush();
                expect(networkService.setAcf).toHaveBeenCalled();
            });

            it('should call /queries/{{id}}/stage', function () {
                networkService.stagePatient(mock.stagePatient);
                $httpBackend.flush();
                requestHandler.stagePatient.respond(401, {error: 'a rejection'});
                networkService.stagePatient(mock.stagePatient).then(function (response) {
                    expect(response).toEqual('a rejection');
                });
                $httpBackend.flush();
            });

            it('should call /patients', function () {
                expect(networkService.getPatientsAtAcf).toBeDefined();
                networkService.getPatientsAtAcf();
                $httpBackend.flush();
                requestHandler.getPatientsAtAcf.respond(401, {error: 'a rejection'});
                networkService.getPatientsAtAcf().then(function (response) {
                    expect(response).toEqual('a rejection');
                });
                $httpBackend.flush();
            });

            it('should call /patients/{{id}}/edit', function () {
                expect(networkService.editPatient).toBeDefined();
                networkService.editPatient(mock.patient);
                $httpBackend.flush();
                requestHandler.editPatient.respond(401, {error: 'a rejection'});
                networkService.editPatient(mock.patient).then(function (response) {
                    expect(response).toEqual('a rejection');
                });
                $httpBackend.flush();
            });

            it('should call /queries/{queryId}/endpoint/{endpointId}/requery', function () {
                networkService.requeryEndpoint(3,4);
                $httpBackend.flush();
                requestHandler.requeryEndpoint.respond(401, {error: 'a rejection'});
                networkService.requeryEndpoint(3,4).then(function (response) {
                    expect(response).toEqual('a rejection');
                });
                $httpBackend.flush();
            });

            it('should call /patients/{queryId}/endpoints/{endpointId}/requery', function () {
                networkService.requeryDocumentQueryEndpoint(3,4);
                $httpBackend.flush();
                requestHandler.requeryDocumentQueryEndpoint.respond(401, {error: 'a rejection'});
                networkService.requeryDocumentQueryEndpoint(3,4).then(function (response) {
                    expect(response).toEqual('a rejection');
                });
                $httpBackend.flush();
            });
        });
    });
})();
