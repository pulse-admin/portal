(function () {
    'use strict';

    describe('search.aiPatientReview', function () {
        var $compile, $log, $q, $rootScope, $timeout, $uibModal, Mock, actualOptions, el, mock, networkService, utilService, vm;

        mock = {};
        mock.name = {
            nameType: { code: 'M', description: 'Maiden Name' },
            familyName: 'Jones',
            givenName: ['Bob'],
        };

        beforeEach(function () {
            module('pulse.mock','portal', function ($provide) {
                $provide.decorator('networkService', function ($delegate) {
                    $delegate.cancelQueryEndpoint = jasmine.createSpy('cancelQueryEndpoint');
                    $delegate.clearQuery = jasmine.createSpy('clearQuery');
                    $delegate.getQueries = jasmine.createSpy('getQueries');
                    $delegate.requeryEndpoint = jasmine.createSpy('requeryEndpoint');
                    $delegate.searchForPatient = jasmine.createSpy('networkService.searchForPatient');
                    $delegate.stagePatient = jasmine.createSpy('stagePatient');
                    return $delegate;
                });
            });
            inject(function (_$compile_, _$log_, _$q_, _$rootScope_, _$timeout_, _$uibModal_, _Mock_, _networkService_, _utilService_) {
                // Get local versions
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $timeout = _$timeout_;
                $log = _$log_;
                $uibModal = _$uibModal_;
                $q = _$q_;
                Mock = _Mock_;

                // Configure based on injects
                spyOn($uibModal, 'open').and.callFake(function (options) {
                    actualOptions = options;
                    return Mock.fakeModal;
                });
                networkService = _networkService_;
                networkService.cancelQueryEndpoint.and.returnValue($q.when({}));
                networkService.clearQuery.and.returnValue($q.when({}));
                networkService.getQueries.and.returnValue($q.when(Mock.queries))
                networkService.requeryEndpoint.and.returnValue($q.when(Mock.queries));
                networkService.searchForPatient.and.returnValue($q.when({}));
                networkService.stagePatient.and.returnValue($q.when({}));
                utilService = _utilService_;
                mock.fakeModalOptions = Mock.fakeModalOptions;
                mock.fakeModalOptions.templateUrl = 'app/search/components/patient_stage/patient_stage.html';
                mock.fakeModalOptions.controller = 'PatientStageController';

                // Prep element
                el = angular.element('<ai-patient-review></ai-patient-review>');

                // Compile
                $compile(el)($rootScope.$new());
                $rootScope.$digest();
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

        describe('finding queries', function () {

            it('should have a function to find a user\'s queries', function () {
                expect(vm.getQueries).toBeDefined();
            });

            it('should get queries for a user at login', function () {
                expect(networkService.getQueries).toHaveBeenCalled();
                expect(vm.patientQueries.length).toBe(Mock.queries.length);
            });

            it('should know how many patientRecords were found for a query', function () {
                expect(vm.getRecordCount).toBeDefined();
                expect(vm.getRecordCount(vm.patientQueries[0])).toBe(4);
            });

            it('should handle an undefined query', function () {
                expect(vm.getRecordCount(undefined)).toBe(0);
            });

            it('should put the recordCount into the query at load', function () {
                expect(vm.patientQueries[0].recordCount).toBe(4);
                expect(vm.patientQueries[1].recordCount).toBe(3);
            });

            it('should know how many endpoints are complete for a query', function () {
                expect(vm.countComplete).toBeDefined();
                expect(vm.countComplete(vm.patientQueries[0])).toBe(5);
                expect(vm.countComplete(vm.patientQueries[1])).toBe(3);
            });

            it('should call utilService to display names', function () {
                spyOn(utilService, 'displayNames');
                expect(vm.displayNames).toBeDefined();
                vm.displayNames([mock.name]);
                expect(utilService.displayNames).toHaveBeenCalledWith([mock.name],'<br />');
            });

            describe('refreshing', function () {

                var activeProducts;

                beforeEach(function () {
                    activeProducts = angular.copy(Mock.queries);
                });

                it('should not refresh if there is already a refresh pending', function () {
                    activeProducts[0].status = 'Complete';
                    networkService.getQueries.and.returnValue($q.when(activeProducts));
                    vm.getQueries();
                    el.isolateScope().$digest();
                    expect(networkService.getQueries.calls.count()).toBe(1);
                    vm.getQueries();
                    el.isolateScope().$digest();
                    expect(networkService.getQueries.calls.count()).toBe(1);
                });

                it('should refresh the queries if there is one marked "Active"', function () {
                    expect(networkService.getQueries.calls.count()).toBe(1);
                    $timeout.flush();
                    expect(networkService.getQueries.calls.count()).toBe(2);
                    $timeout.flush();
                    expect(networkService.getQueries.calls.count()).toBe(3);

                    activeProducts[0].status = 'Complete';
                    activeProducts[1].status = 'Complete';
                    networkService.getQueries.and.returnValue($q.when(activeProducts));
                    $timeout.flush();
                    expect(networkService.getQueries.calls.count()).toBe(4);
                    $timeout.flush();
                    expect(networkService.getQueries.calls.count()).toBe(4);
                });

                it('should set "activeQuery" to true immediately upon starting a query', function () {
                    expect(vm.activeQuery).toBe(true);
                    activeProducts[0].status = 'Complete';
                    activeProducts[1].status = 'Complete';
                    networkService.getQueries.and.returnValue($q.when(activeProducts));
                    $timeout.flush();
                    expect(vm.activeQuery).toBe(false);
                    vm.getQueries();
                    expect(vm.activeQuery).toBe(true);
                    el.isolateScope().$digest();
                    expect(vm.activeQuery).toBe(false);
                });
            });
        });

        describe('clearing queries', function () {

            beforeEach(function () {
                vm.patientQueries = angular.copy(Mock.queries);
                vm.displayedQueries = angular.copy(Mock.queries);
            });

            it('should have a way to clear patient queries', function () {
                expect(vm.patientQueries.length).toBe(Mock.queries.length);
                networkService.getQueries.and.returnValue($q.when(angular.copy(Mock.queries).slice(1)));

                vm.clearQuery(vm.patientQueries[0]);
                el.isolateScope().$digest();
                expect(vm.patientQueries.length).toBe(Mock.queries.length - 1);
            });

            it('should remove a cleared query from the display Queue', function () {
                expect(vm.displayedQueries.length).toBe(Mock.queries.length);
                vm.clearQuery(vm.patientQueries[0]);
                expect(vm.displayedQueries.length).toBe(Mock.queries.length - 1);
            });

            it('should do nothing if the query isn\'t found', function () {
                expect(vm.patientQueries.length).toBe(Mock.queries.length);
                var fakeQuery = angular.copy(vm.patientQueries[0]);
                fakeQuery.id = 'fake';
                vm.clearQuery(fakeQuery);
                expect(vm.patientQueries.length).toBe(Mock.queries.length);
            });

            it('should call networkService.clearQuery', function () {
                var id = vm.patientQueries[0].id;
                vm.clearQuery(vm.patientQueries[0]);
                expect(networkService.clearQuery).toHaveBeenCalledWith(id);
            });

            it('should have a way to cancel an endpoint\'s query', function () {
                expect(vm.patientQueries[0].endpointStatuses.length).toBe(5);
                networkService.getQueries.and.returnValue($q.when((angular.copy(Mock.queries)[0].endpointStatuses.splice(0,1))));

                vm.cancelQueryEndpoint(vm.patientQueries[0].endpointStatuses[0]);
                el.isolateScope().$digest();
                expect(vm.patientQueries[0].endpointStatuses.length).toBe(5);
            });

            it('should call networkService.cancelEndpointQuery', function () {
                vm.cancelQueryEndpoint(vm.patientQueries[0].endpointStatuses[0]);
                expect(networkService.cancelQueryEndpoint).toHaveBeenCalledWith(vm.patientQueries[0].id, vm.patientQueries[0].endpointStatuses[0].endpoint.id);
            });

            it('should set the endpoint status to "pending" when clearing', function () {
                vm.cancelQueryEndpoint(vm.patientQueries[0].endpointStatuses[0]);
                expect(vm.patientQueries[0].endpointStatuses[0].isClearing).toBe(true);
            });
        });

        describe('staging patients', function () {

            it('should have a function to stage patients', function () {
                expect(vm.stagePatient).toBeDefined();
            });

            it('should create a modal instance when a patient is to be staged', function () {
                expect(vm.stagePatientInstance).toBeUndefined();
                vm.stagePatient(vm.patientQueries[0]);
                expect(vm.stagePatientInstance).toBeDefined();
                expect($uibModal.open).toHaveBeenCalledWith(mock.fakeModalOptions);
                expect(actualOptions.resolve.query()).toEqual(vm.patientQueries[0]);
            });

            it('should tell the controller that a patient was staged', function () {
                spyOn(vm,'triggerHandlers');
                vm.stagePatient(vm.patientQueries[0]);
                vm.stagePatientInstance.close();
                expect(vm.triggerHandlers).toHaveBeenCalled();
            });

            it('should not trigger the controller if the modal is dismissed', function () {
                spyOn(vm,'triggerHandlers');
                vm.stagePatient(vm.patientQueries[0]);
                vm.stagePatientInstance.dismiss();
                expect(vm.triggerHandlers).not.toHaveBeenCalled();
            });

            it('should refresh the queries if the modal was dismissed with a cleared query', function () {
                spyOn(vm, 'getQueries');
                vm.stagePatient(vm.patientQueries[0]);
                vm.stagePatientInstance.dismiss('query cleared');
                expect(vm.getQueries).toHaveBeenCalled();
            });
        });

        describe('requerying', function () {

            beforeEach(function () {
                vm.patientQueries = angular.copy(Mock.queries);
            });

            it('should have a function for requery', function () {
                expect(vm.requery).toBeDefined();
            });

            it('should broadcast the query when called', function () {
                spyOn($rootScope, '$broadcast');
                vm.requery(Mock.queries[0]);
                expect($rootScope.$broadcast).toHaveBeenCalledWith('requery', {terms: Mock.queries[0].terms});
            });

            it('should have a function to requery individual organizations', function () {
                expect(vm.requeryEndpoint).toBeDefined();
            });

            it('should call networkService.requeryEndpoint when requeried', function () {
                vm.requeryEndpoint(Mock.queries[0].endpointStatuses[0]);
                expect(networkService.requeryEndpoint).toHaveBeenCalledWith(1,7);
            });

            it('should refresh local queries when requeried', function () {
                spyOn(vm,'getQueries');
                vm.requeryEndpoint(Mock.queries[0].endpointStatuses[0]);
                el.isolateScope().$digest();
                expect(vm.getQueries).toHaveBeenCalled();
            });
        });
    });
})();
