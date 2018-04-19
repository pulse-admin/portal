(function () {
    'use strict';

    describe('search.aiPatientSearch', function () {
        var $compile, $log, $q, $rootScope, Mock, el, mock, networkService, vm;

        mock = {patientSearch: {results: [{id: 2, givenName: 'Joe', familyName: 'Rogan'}, {id: 3, givenName: 'Sue', familyName: 'Samson'}]}};
        mock.badRequest = {
            status: 400,
            error: 'Bad Request',
            message: 'One of the following search parameters was blank or improperly formed: Name, Date of Birth, Gender',
        };
        mock.dob = {
            year: 1999,
            month: '03',
            day: '19',
        };
        mock.query = {}
        mock.query.patientNames = [{
            givenName: ['bob'],
            familyName: 'jones',
            nameType: {code: 'L'},
        }];
        mock.query.dobParts = mock.dob;
        mock.query.gender = 'M';
        mock.baseQuery = {
            addresses: [{ lines: []}],
            dobParts: {},
            patientNames: [{givenName: [], nameType: { code: 'L', description: 'Legal Name'} }],
        };

        beforeEach(function () {
            module('pulse.mock', 'portal', function ($provide) {
                $provide.decorator('networkService', function ($delegate) {
                    $delegate.searchForPatient = jasmine.createSpy('networkService.searchForPatient');
                    return $delegate;
                });
            });
            inject(function (_$compile_, _$log_, _$q_, _$rootScope_, _Mock_, _networkService_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $log = _$log_;
                $q = _$q_;
                Mock = _Mock_;
                networkService = _networkService_;
                networkService.searchForPatient.and.returnValue($q.when(mock.patientSearch));

                el = angular.element('<ai-patient-search></ai-patient-search>');

                $compile(el)($rootScope.$new());
                $rootScope.$digest();
                vm = el.isolateScope().vm;

                vm.queryForm = {
                    $error: { required: [1, 2], invalid: [3], notAnError: 4 },
                    $setDirty: function () {
                        this.$dirty = true;
                        this.$pristine = false;
                    },
                    $setPristine: function () { this.$pristine = true; },
                    $setUntouched: function () { this.$untouched = true; },
                };
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

        it('should know how many errors the queryForm has', function () {
            expect(vm.errorCount()).toBe(3);
        });

        it('should have a function to query for patients', function () {
            expect(vm.searchForPatient).toBeDefined();
        });

        it('should populate the patientNames ', function () {
            expect(vm.query.patientNames).toBeDefined();
        });

        it('should a dob object to search with', function () {
            expect(vm.query.dobParts).toBeDefined();
            expect(vm.query.dobParts).toEqual(mock.baseQuery.dobParts);
        });

        it('should have an address object to search with', function () {
            expect(vm.query.addresses).toBeDefined();
            expect(vm.query.addresses).toEqual(mock.baseQuery.addresses);
        });

        describe('submitting the search form', function () {
            beforeEach(function () {
                vm.query = angular.copy(mock.query);
                vm.queryForm.$setDirty();
            });

            it('should call networkService.searchForPatient on query', function () {
                vm.searchForPatient();
                expect(networkService.searchForPatient).toHaveBeenCalled();
            });

            it('should clear the query fields on a search', function () {
                vm.searchForPatient();
                el.isolateScope().$digest();
                expect(vm.query).toEqual(mock.baseQuery);
            });

            it('should wipe the form on a search', function () {
                vm.searchForPatient();
                el.isolateScope().$digest();
                expect(vm.queryForm.$pristine).toBe(true);
            });

            it('should hide errors on a search', function () {
                vm.searchForPatient();
                el.isolateScope().$digest();
                expect(vm.showFormErrors).toBe(false);
            });

            it('should set the addresses to blank on a search', function () {
                vm.query.addresses = [{},{}];
                vm.searchForPatient();
                el.isolateScope().$digest();
                expect(vm.query.addresses).toEqual(mock.baseQuery.addresses);
            });

            it('should tell the controller that a search was performed', function () {
                spyOn(vm,'triggerHandlers');
                vm.searchForPatient();
                el.isolateScope().$digest();
                expect(vm.triggerHandlers).toHaveBeenCalled();
            });

            it('should compile the date of birth fields on search', function () {
                var compiled = angular.copy(vm.query);
                compiled.dob = '19990319'
                vm.searchForPatient();
                expect(networkService.searchForPatient).toHaveBeenCalledWith(compiled);
            });

            it('should show an error if the search is bad', function () {
                networkService.searchForPatient.and.returnValue($q.reject({data: mock.badRequest}));
                vm.searchForPatient();
                el.isolateScope().$digest();
                expect(vm.errorMessage).toBe(mock.badRequest.message);
            });
        });

        describe('requerying', function () {
            it('should listen for a requery broadcast and call the requery function with it', function () {
                spyOn(vm, 'requery');
                $rootScope.$broadcast('requery', {terms: Mock.queries[0].terms});
                $rootScope.$digest();
                expect(vm.requery).toHaveBeenCalledWith(Mock.queries[0].terms);
            });

            it('should fill in the query with the values from the previous search', function () {
                vm.requery(Mock.queries[0].terms);
                expect(vm.query).toEqual({
                    addresses: [{
                        lines: [],
                        city: null,
                        state: null,
                        zipcode: null,
                    }],
                    dobParts: {
                        year: 1312,
                        month: '01',
                        day: '17',
                    },
                    gender: 'M',
                    patientNames: [{
                        givenName: ['Bob'],
                        familyName: 'Jones',
                        nameType: { code: 'L', description: 'Legal Name'},
                    }],
                    ssn: '123-12-1234',
                    telephone: null,
                });
            });
        });

        it('should only search if the form is valid', function () {
            vm.queryForm.$invalid = true;
            vm.searchForPatient();
            expect(networkService.searchForPatient).not.toHaveBeenCalled();

            vm.queryForm.$invalid = false;
            vm.searchForPatient();
            expect(networkService.searchForPatient).toHaveBeenCalled();
        });
    });
})();
