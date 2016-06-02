(function() {
    'use strict';

    describe('main.aiPatientSearch', function() {
        var vm, el, $log, $q, commonService, mock;
        mock = {patientSearch: {results: [{id:2, firstName: 'Joe', lastName: 'Rogan'}, {id:3, firstName: 'Sue', lastName: 'Samson'}]}};

        beforeEach(function () {
            module('portal', function ($provide) {
                $provide.decorator('commonService', function ($delegate) {
                    $delegate.queryPatient = jasmine.createSpy();
                    return $delegate;
                });
            });
            inject(function($compile, $rootScope, _$log_, _$q_, _commonService_) {
                $log = _$log_;
                $q = _$q_;
                commonService = _commonService_;
                commonService.queryPatient.and.returnValue($q.when(mock.patientSearch));

                el = angular.element('<ai-patient-search patient-results="[{query: {firstName: \'Bob\'}, results: [{id: 1, firstName: \'Bob\', lastName: \'Smith\'}]}]"></ai-patient-search>');

                $compile(el)($rootScope.$new());
                $rootScope.$digest();
                vm = el.isolateScope().vm;

                vm.queryForm = {$error: { required: [1, 2], invalid: [3], notAnError: 4 }};
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
            expect(vm.patientResults.length).toBe(1);
        });

        it('should know how many errors the queryForm has', function () {
            expect(vm.errorCount()).toBe(3);
        });

        it('should have a function to query for patients', function () {
            expect(vm.queryPatient).toBeDefined();
        });

        it('should call commonService.queryPatient on query', function () {
            vm.queryPatient();
            expect(commonService.queryPatient).toHaveBeenCalled();
        });

        it('should append the results of queryPatient to patientResults', function () {
            vm.queryPatient();
            el.isolateScope().$digest();
            expect(vm.patientResults.length).toBe(2);
        });
    });
})();