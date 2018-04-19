(function () {
    'use strict';

    describe('review.aiAcfPatientList', function () {
        var $log, $q, $timeout, $uibModal, Mock, actualOptions, authService, el, mock, networkService, scope, utilService, vm;
        mock = {
            fakeDocument: {contents: '<document><made><of>XML</of></made></document>'},
            userAcf: {'id': 277,'identifier': 'Humboldt-02','name': 'Community College','phoneNumber': '555-1912','address': {'id': null,'lines': ['92 Tenth Stn'],'city': 'Mckinleyville','state': 'CA','zipcode': '95501','country': null},'lastRead': 1489156161065},
        };
        mock.fakeModal = {
            result: {
                then: function (confirmCallback, cancelCallback) {
                    this.confirmCallBack = confirmCallback;
                    this.cancelCallback = cancelCallback;
                }},
            close: function (item) { this.result.confirmCallBack(item); },
            dismiss: function (type) { this.result.cancelCallback(type); },
        };
        mock.fakeModalOptions = {
            templateUrl: 'app/review/components/patient_edit/patient_edit.html',
            controller: 'PatientEditController',
            controllerAs: 'vm',
            animation: false,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            resolve: {
                patient: jasmine.any(Function),
            },
        };
        beforeEach(function () {
            module('pulse.mock', 'portal', function ($provide) {
                $provide.decorator('authService', function ($delegate) {
                    $delegate.getUserAcf = jasmine.createSpy('getUserAcf');
                    return $delegate;
                });
                $provide.decorator('networkService', function ($delegate) {
                    $delegate.cacheDocument = jasmine.createSpy('cacheDocument');
                    $delegate.cancelDocument = jasmine.createSpy('cancelDocument');
                    $delegate.cancelDocumentQueryEndpoint = jasmine.createSpy('cancelDocumentQueryEndpoint');
                    $delegate.dischargePatient = jasmine.createSpy('dischargePatient');
                    $delegate.getDocument = jasmine.createSpy('getDocument');
                    $delegate.getPatientsAtAcf = jasmine.createSpy('getPatientsAtAcf');
                    $delegate.requeryDocumentQueryEndpoint = jasmine.createSpy('requeryDocumentQueryEndpoint');
                    return $delegate;
                });
                $provide.decorator('utilService', function ($delegate) {
                    $delegate.convertDobString = jasmine.createSpy('convertDobString');
                    $delegate.displayName = jasmine.createSpy('displayName');
                    return $delegate;
                });
            });
            inject(function ($compile, _$log_, _$q_, $rootScope, _$timeout_, _$uibModal_, _Mock_, _authService_, _networkService_, _utilService_) {
                $log = _$log_;
                $timeout = _$timeout_;
                $q = _$q_;
                $uibModal = _$uibModal_;
                Mock = _Mock_;
                Mock.patients[0].endpointMaps[1].documentsQueryStatus = 'Active';
                mock.documentList = []
                    .concat(Mock.patients[0].endpointMaps[0].documents)
                    .concat(Mock.patients[0].endpointMaps[1].documents)
                    .concat(Mock.patients[0].endpointMaps[2].documents)
                    .concat(Mock.patients[0].endpointMaps[3].documents);
                for (var i = 0; i < mock.documentList.length; i++) {
                    mock.documentList[i].organization = Mock.patients[0].endpointMaps[0].endpoint.managingOrganization;
                }
                spyOn($uibModal, 'open').and.callFake(function (options) {
                    actualOptions = options;
                    return mock.fakeModal;
                });
                authService = _authService_;
                authService.getUserAcf.and.returnValue(mock.userAcf);
                networkService = _networkService_;
                networkService.cacheDocument.and.returnValue($q.when({data: ''}));
                networkService.cancelDocument.and.returnValue($q.when({data: ''}));
                networkService.cancelDocumentQueryEndpoint.and.returnValue($q.when({}));
                networkService.dischargePatient.and.returnValue($q.when({}));
                networkService.getDocument.and.returnValue($q.when(angular.copy(Mock.patients[0].endpointMaps[0].documents[0])));
                networkService.getPatientsAtAcf.and.returnValue($q.when(angular.copy(Mock.patients)));
                networkService.requeryDocumentQueryEndpoint.and.returnValue($q.when({}));
                utilService = _utilService_;
                utilService.convertDobString.and.returnValue('fake');
                utilService.displayName.and.returnValue(Mock.patients[0].givenName + ' ' + Mock.patients[0].familyName);

                el = angular.element('<ai-acf-patient-list></ai-acf-patient-list>');

                scope = $rootScope.$new();
                $compile(el)(scope);
                scope.$digest();
                vm = el.isolateScope().vm;
                scope.vm = vm;
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
            expect(vm.patients.length).toBe(2);
        });

        describe('caching a document', function () {
            it('should have a way to cache a document', function () {
                var cachedDocPatients = angular.copy(Mock.patients);
                cachedDocPatients[0].endpointMaps[0].documents[0].cached = true;
                networkService.getPatientsAtAcf.and.returnValue($q.when(cachedDocPatients));

                expect(vm.patients[0].endpointMaps[0].documents[0].cached).toBe(false);
                expect(vm.cacheDocument).toBeDefined();

                vm.cacheDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();

                expect(networkService.cacheDocument).toHaveBeenCalledWith(1, '5');
                expect(vm.patients[0].endpointMaps[0].documents[0].cached).toBe(true);
            });

            it('should refresh the info when a document is request to be cached', function () {
                spyOn(vm,'getPatientsAtAcf');
                vm.cacheDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();
                expect(vm.getPatientsAtAcf).toHaveBeenCalled();
            });

            it('should not refresh if a refresh is already in progress', function () {
                var initCount = networkService.getPatientsAtAcf.calls.count();
                vm.cacheDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                vm.cacheDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(initCount + 1);
            });

            it('should know when a document is actively being cached', function () {
                var cachedDocPatients = angular.copy(Mock.patients);
                cachedDocPatients[0].endpointMaps[0].documents[0].status = 'Active';
                networkService.getPatientsAtAcf.and.returnValue($q.when(cachedDocPatients));

                vm.cacheDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();
                expect(vm.patients[0].documentStatus).toEqual({total: 6, cached: 0, active: 1});
            });

            it('should not try to cache the same document twice', function () {
                var cachedDocPatients = angular.copy(Mock.patients);
                cachedDocPatients[0].endpointMaps[0].documents[0].cached = true;
                networkService.getPatientsAtAcf.and.returnValue($q.when(cachedDocPatients));

                vm.cacheDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();

                vm.cacheDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();
                expect(networkService.cacheDocument.calls.count()).toBe(1);
            });

            it('should have a way to cancel caching a document', function () {
                expect(vm.cancelDocument).toBeDefined();

                vm.cacheDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();

                vm.cancelDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();

                expect(networkService.cancelDocument).toHaveBeenCalledWith(1, '5');
            });

            it('should not cancel caching an inactive document', function () {
                expect(vm.cancelDocument).toBeDefined();

                vm.cancelDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();

                expect(networkService.cancelDocument).not.toHaveBeenCalled();
            });

            it('should have a way to get a document', function () {
                var patient = vm.patients[0];
                var returnedDocument = angular.copy(Mock.patients[0].endpointMaps[0].documents[0]);
                returnedDocument.status = 'Active';
                networkService.getDocument.and.returnValue($q.when(returnedDocument));

                vm.cacheDocument(patient, patient.endpointMaps[0].documents[0]);
                el.isolateScope().$digest();

                vm.getDocument(patient, patient.endpointMaps[0].documents[0]);
                el.isolateScope().$digest();

                expect(networkService.getDocument).toHaveBeenCalledWith(1, '5');
                expect(vm.activeDocument).toEqual(patient.endpointMaps[0].documents[0]);
            });

            it('should re-call the service because we\'re not caching the document on the front end', function () {
                var patient = vm.patients[0];
                var initCount = networkService.getDocument.calls.count();
                vm.getDocument(patient, patient.endpointMaps[0].documents[0]);
                el.isolateScope().$digest();

                vm.getDocument(patient, patient.endpointMaps[0].documents[0]);
                el.isolateScope().$digest();
                expect(networkService.getDocument.calls.count()).toBe(initCount + 2);
            });

            it('should requery for document contents', function () {
                vm.patients[1].endpointMaps[0].documents[0].status = 'Cancelled';
                vm.requeryDocument(vm.patients[1], vm.patients[1].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();
                expect(networkService.cacheDocument).toHaveBeenCalledWith(2, '8');
            });

            it('should not requery for unless the document was cancelled or failed', function () {
                var initCount = networkService.cacheDocument.calls.count();
                vm.patients[1].endpointMaps[0].documents[0].status = 'Cancelled';
                vm.requeryDocument(vm.patients[1], vm.patients[1].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();
                expect(networkService.cacheDocument).toHaveBeenCalledWith(2, '8');
                expect(networkService.cacheDocument.calls.count()).toBe(initCount + 1);

                vm.patients[1].endpointMaps[0].documents[0].status = 'Active';
                vm.requeryDocument(vm.patients[1], vm.patients[1].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();
                expect(networkService.cacheDocument.calls.count()).toBe(initCount + 1);
            });

            it('should set the document isRequerying flag to true when requerying', function () {
                vm.patients[1].endpointMaps[0].documents[0].status = 'Cancelled';
                vm.requeryDocument(vm.patients[1], vm.patients[1].endpointMaps[0].documents[0]);
                expect(vm.patients[1].endpointMaps[0].documents[0].isRequerying).toBe(true);
            });

            it('should know how many documents a patient has', function () {
                var cachedDocPatients = angular.copy(Mock.patients);
                cachedDocPatients[0].endpointMaps[0].documents[0].cached = true;
                networkService.getPatientsAtAcf.and.returnValue($q.when(cachedDocPatients));

                vm.cacheDocument(vm.patients[0], vm.patients[0].endpointMaps[0].documents[0]);
                el.isolateScope().$digest();
                expect(vm.patients[0].documentStatus).toEqual({total: 6, cached: 1, active: 0});
            });

            it('should know how many document queries are active', function () {
                expect(vm.countActive).toBeDefined();
                expect(vm.countActive(vm.patients[0])).toBe(1);
                vm.patients[0].endpointMaps[1].documentsQueryStatus = 'Complete';
                expect(vm.countActive(vm.patients[0])).toBe(0);
            });

            it('should combine the documents for a patient', function () {
                expect(vm.patients[0].documents.length).toBe(mock.documentList.length);
                expect(vm.patients[0].documents[0]).toEqual(mock.documentList[0]);
            });

            it('should know if a patient\'s documents are cached', function () {
                var patient = vm.patients[0];
                expect(patient.documentStatus).toEqual({total: 6, cached: 0, active: 0});
            });

            it('should clear active documents on deactivation', function () {
                vm.activatePatient(vm.patients[0]);
                vm.deactivatePatient();
                vm.activeDocument = {document: 'text'};
                vm.deactivatePatient();

                expect(vm.activeDocument).toBe(undefined);
            });
        });

        describe('document list query activity', function () {
            it('should call networkService.cancelDocumentQueryEndpoint', function () {
                vm.cancelDocumentQueryEndpoint(vm.patients[1], vm.patients[1].endpointMaps[2]);
                el.isolateScope().$digest();
                expect(networkService.cancelDocumentQueryEndpoint).toHaveBeenCalledWith(vm.patients[1].id, vm.patients[1].endpointMaps[2].endpoint.id);
            });

            it('should not call networkService.cancelDocumentQueryEndpoint if the status is not Active', function () {
                vm.cancelDocumentQueryEndpoint(vm.patients[1], vm.patients[1].endpointMaps[0]);
                el.isolateScope().$digest();
                expect(networkService.cancelDocumentQueryEndpoint).not.toHaveBeenCalled();
            });

            it('should set the endpoint isClearing flag to true when clearing', function () {
                vm.cancelDocumentQueryEndpoint(vm.patients[1], vm.patients[1].endpointMaps[2]);
                expect(vm.patients[1].endpointMaps[2].isClearing).toBe(true);
            });

            it('should have a function to requery individual endpoints', function () {
                expect(vm.requeryDocumentQueryEndpoint).toBeDefined();
            });

            it('should call networkService.requeryDocumentQueryEndpoint when requeried', function () {
                vm.patients = markAll(angular.copy(vm.patients), 'Failed');
                vm.requeryDocumentQueryEndpoint(vm.patients[1], vm.patients[1].endpointMaps[1]);
                el.isolateScope().$digest();
                expect(networkService.requeryDocumentQueryEndpoint).toHaveBeenCalledWith(vm.patients[1].id, vm.patients[1].endpointMaps[1].endpoint.id);
            });

            it('should not call networkService.requeryDocumentQueryEndpoint if status is not "Failed" or "Cancelled"', function () {
                vm.requeryDocumentQueryEndpoint(vm.patients[1], vm.patients[1].endpointMaps[0]);
                el.isolateScope().$digest();
                expect(networkService.requeryDocumentQueryEndpoint).not.toHaveBeenCalled();

                vm.patients[1].endpointMaps[0].status = 'Cancelled';
                vm.requeryDocumentQueryEndpoint(vm.patients[1], vm.patients[1].endpointMaps[0]);
                el.isolateScope().$digest();
                expect(networkService.requeryDocumentQueryEndpoint).not.toHaveBeenCalled();
            });

            it('should set the endpoint "isRequerying" to true when requerying', function () {
                vm.patients = markAll(angular.copy(vm.patients), 'Failed');
                vm.requeryDocumentQueryEndpoint(vm.patients[1], vm.patients[1].endpointMaps[1]);
                expect(vm.patients[1].endpointMaps[1].isRequerying).toBe(true);
            });

            it('should refresh local queries when requeried', function () {
                spyOn(vm,'getPatientsAtAcf');
                vm.patients = markAll(angular.copy(vm.patients), 'Failed');
                vm.requeryDocumentQueryEndpoint(vm.patients[1], vm.patients[1].endpointMaps[1]);
                el.isolateScope().$digest();
                expect(vm.getPatientsAtAcf).toHaveBeenCalled();
            });
        });

        it('should have a way to discharge patients', function () {
            // given a patient in the queue
            expect(vm.patients.length).toBe(2);
            var result = angular.copy(Mock.patients);
            result.splice(0,1);

            networkService.getPatientsAtAcf.and.returnValue($q.when(result));
            // when first result is cleared
            vm.dischargePatient(vm.patients[0]);
            el.isolateScope().$digest();

            // then expect to have one less patient in the queue
            expect(vm.patients.length).toBe(1);
        });

        it('should call networkService.dischargePatient on discharge', function () {
            vm.dischargePatient(vm.patients[0]);
            expect(networkService.dischargePatient).toHaveBeenCalledWith(Mock.patients[0].id);
        });

        it('should know the user\'s ACF', function () {
            expect(vm.getUserAcf).toBeDefined();
            expect(vm.getUserAcf()).toEqual(mock.userAcf);
        });

        it('should have a function to get patients', function () {
            expect(vm.getPatientsAtAcf).toBeDefined();
            vm.getPatientsAtAcf();
            expect(networkService.getPatientsAtAcf).toHaveBeenCalled();
        });

        it('should call "getPatientsAtAcf" on load', function () {
            expect(networkService.getPatientsAtAcf).toHaveBeenCalled();
        });

        it('should update the activePatient if there is one on "getPatientsAtAcf"', function () {
            vm.getPatientsAtAcf();
            el.isolateScope().$digest();
            expect(vm.activePatient).toBe(null);
            vm.activePatient = vm.patients[1];
            vm.getPatientsAtAcf();
            el.isolateScope().$digest();
            expect(vm.activePatient).toEqual(vm.patients[1]);
        });

        it('should have a function to turn yyyymmdd into a parseable date', function () {
            expect(vm.translateDate).toBeDefined();
            expect(vm.translateDate(20080515)).toBe('2008-05-15');
        });

        it('should know what the panel title should be', function () {
            expect(vm.panelTitle).toBe('2 Active Patients at ' + mock.userAcf.identifier);
        });

        it('should have a way to activate a patient', function () {
            expect(vm.activatePatient).toBeDefined();
        });

        it('should change the title when a patient is activated', function () {
            vm.activatePatient(vm.patients[1]);
            expect(vm.panelTitle).toBe('Patient: Robert Jones (Bob)');
        });

        it('should handle a missing friendly name', function () {
            vm.patients[1].friendlyName = null;
            vm.activatePatient(vm.patients[1]);
            expect(vm.panelTitle).toBe('Patient: Robert Jones');
        });

        it('should set the active patient when activated', function () {
            expect(vm.activePatient).toBeNull();
            vm.activatePatient(vm.patients[0]);
            expect(vm.activePatient.id).toEqual(Mock.patients[0].id);
        });

        it('should have a way to deactivate the patient', function () {
            expect(vm.deactivatePatient).toBeDefined();
        });

        it('should deactive a patient', function () {
            vm.activatePatient(vm.patients[0]);
            vm.deactivatePatient();
            expect(vm.activePatient).toBeNull();
        });

        it('should refresh the patient list on deactivation', function () {
            vm.deactivatePatient();
            el.isolateScope().$digest();
            expect(networkService.getPatientsAtAcf).toHaveBeenCalled();
        });

        it('should reset the title on deactivation', function () {
            vm.activatePatient(vm.patients[0]);
            vm.deactivatePatient();
            expect(vm.panelTitle).toBe('2 Active Patients at ' + mock.userAcf.identifier);
        });

        it('should change the title when the number of patients changes', function () {
            networkService.getPatientsAtAcf.and.returnValue($q.when([Mock.patients[1]]));
            // when first result is cleared
            vm.dischargePatient(vm.patients[0]);
            el.isolateScope().$digest();

            // then expect to have one less patient in the queue
            expect(vm.panelTitle).toBe('1 Active Patient at ' + mock.userAcf.identifier);
        });

        it('should deactivate a patient when a patient is discharged', function () {
            spyOn(vm,'deactivatePatient');
            vm.dischargePatient(vm.patients[0]);
            el.isolateScope().$digest();
            expect(vm.deactivatePatient).toHaveBeenCalled();
        });

        it('should have an ID for each patient', function () {
            expect(vm.getPatientId(vm.patients[0])).toBe('patient-id-Jane_Doe');
        });

        describe('refreshing', function () {
            beforeEach(function () {
                vm.patients[1].endpointMaps[2].documentsQueryStatus = 'Successful';
            });

            it('should refresh the queries if there is one marked "Active"', function () {
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(1);
                $timeout.flush();
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(2);
            });

            it('should stop refreshing the queries if all are marked "Complete"', function () {
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(1);
                $timeout.flush(vm.TIMEOUT_MILLIS);
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(2);
                $timeout.flush(vm.TIMEOUT_MILLIS);
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(3);
                $timeout.flush(vm.TIMEOUT_MILLIS);
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(4);
                $timeout.flush(vm.TIMEOUT_MILLIS);
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(5);

                var completePatients = markAll(angular.copy(vm.patients), 'Successful');
                networkService.getPatientsAtAcf.and.returnValue($q.when(completePatients));
                $timeout.flush(vm.TIMEOUT_MILLIS);
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(6);
                $timeout.flush(vm.TIMEOUT_MILLIS);
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(6);
            });

            it('should refresh patients on a longer timescale when all are complete', function () {
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(1);
                var completePatients = markAll(angular.copy(vm.patients), 'Successful');
                networkService.getPatientsAtAcf.and.returnValue($q.when(completePatients));
                $timeout.flush(vm.TIMEOUT_MILLIS);
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(2);
                $timeout.flush(vm.TIMEOUT_MILLIS * 10);
                expect(networkService.getPatientsAtAcf.calls.count()).toBe(3);
            });
        });

        describe('editing patients', function () {
            it('should have a function to edit patients', function () {
                expect(vm.editPatient).toBeDefined();
            });

            it('should create a modal instance when a patient is edited', function () {
                expect(vm.editPatientInstance).toBeUndefined();
                vm.editPatient(vm.patients[0]);
                expect(vm.editPatientInstance).toBeDefined();
                expect($uibModal.open).toHaveBeenCalledWith(mock.fakeModalOptions);
                expect(actualOptions.resolve.patient()).toEqual(vm.patients[0]);
            });

            it('should refresh the patient list if one was edited', function () {
                spyOn(vm,'getPatientsAtAcf');
                vm.editPatient(vm.patients[0]);
                vm.editPatientInstance.close();
                expect(vm.getPatientsAtAcf).toHaveBeenCalled();
            });

            it('should set the activePatient to the edited one if there is an activePatient', function () {
                vm.activatePatient(vm.patients[0]);
                vm.editPatient(vm.patients[0]);
                vm.editPatientInstance.close(vm.patients[1]);
                expect(vm.activePatient).toEqual(vm.patients[1]);
            });

            it('should set the activePatient to the edited one if there is an activePatient', function () {
                vm.editPatient(vm.patients[0]);
                vm.editPatientInstance.close(vm.patients[1]);
                expect(vm.activePatient).toBe(null);
            });

            it('should not trigger the controller if the modal is dismissed', function () {
                spyOn(vm,'getPatientsAtAcf');
                vm.editPatient(vm.patients[0]);
                vm.editPatientInstance.dismiss();
                expect(vm.getPatientsAtAcf).not.toHaveBeenCalled();
            });
        });
    });

    ////////////////////////////////////////////////////////////////////

    function markAll (patients, status) {
        for (var i = 0; i < patients.length; i++) {
            for (var j = 0; j < patients[i].endpointMaps.length; j++) {
                patients[i].endpointMaps[j].documentsQueryStatus = status;
            }
        }
        return patients;
    }
})();
