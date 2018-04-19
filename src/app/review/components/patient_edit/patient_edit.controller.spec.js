(function () {
    'use strict';

    describe('review.aiPatientEdit', function () {
        var $log, $q, $uibModal, mock, networkService, scope, vm;

        mock = {
            badRequest: {
                status: 500,
                error: 'org.hibernate.exception.DataException: could not execute statement; nested exception is javax.persistence.PersistenceException: org.hibernate.exception.DataException: could not execute statement',
            },
            fakeModal: {
                result: {
                    then: function (confirmCallback, cancelCallback) {
                        this.confirmCallBack = confirmCallback;
                        this.cancelCallback = cancelCallback;
                    }},
                close: function (item) { this.result.confirmCallBack(item); },
                dismiss: function (type) { this.result.cancelCallback(type); },
            },
            modalInstance: {
                close: jasmine.createSpy('close'),
                dismiss: jasmine.createSpy('dismiss'),
            },
            name: {
                nameType: { code: 'M', description: 'Maiden Name' },
                familyName: 'Jones',
                givenName: ['Bob'],
            },
            patient: {
                dateOfBirth: '19900323',
                fullName: 'John Doe',
                friendlyName: 'John',
                gender: 'M',
                ssn: '123-12-1234',
            },
        };

        beforeEach(function () {
            module('portal', function ($provide) {
                $provide.decorator('networkService', function ($delegate) {
                    $delegate.editPatient = jasmine.createSpy('editPatient');
                    return $delegate;
                });
            });
            inject(function ($controller, _$log_, _$q_, $rootScope, _$uibModal_, _networkService_) {
                $log = _$log_;
                $uibModal = _$uibModal_;
                spyOn($uibModal, 'open').and.returnValue(mock.fakeModal);
                $q = _$q_;
                networkService = _networkService_;
                networkService.editPatient.and.returnValue($q.when({}));

                scope = $rootScope.$new();
                vm = $controller('PatientEditController', {
                    $scope: scope,
                    $uibModalInstance: mock.modalInstance,
                    patient: mock.patient,
                });
                scope.$digest();
            });
        });

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                //console.debug("\n Debug: " + $log.debug.logs.join("\n Debug: "));
            }
        });

        it('should exist', function () {
            expect(vm).toBeDefined();
        });

        describe('setup', function () {
            it('should get the parts of the DOB', function () {
                expect(vm.patient.dateOfBirthParts).toEqual({ year: '1990', month: '03', day: '23' });
            });
        });

        describe('editing a patient', function () {
            it('should close the modal after editing the patient', function () {
                vm.editPatient();
                scope.$digest();
                expect(mock.modalInstance.close).toHaveBeenCalledWith(vm.patient);
            });

            it('should have an error message if the saving doesn\'t go well', function () {
                networkService.editPatient.and.returnValue($q.reject({data: {error: 'error'}}));
                vm.editPatient();
                scope.$digest();
                expect(vm.errorMessage).toEqual('error');
            });

            it('should combine the DOB when saving', function () {
                vm.patient.dateOfBirthParts = { year: '2001', month: '12', day: '26' };
                vm.editPatient();
                expect(vm.patient.dateOfBirth).toBe('20011226');
            });
        });

        describe('housekeeping', function () {
            it('should have a way to close the modal', function () {
                expect(vm.cancel).toBeDefined();
                vm.cancel();
                expect(mock.modalInstance.dismiss).toHaveBeenCalled();
            });
        });
    });
})();
