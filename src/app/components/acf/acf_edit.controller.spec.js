(function () {
    'use strict';

    describe('the ACF edit controller', function () {
        var $ctrl, $log, $q, Mock, mock, networkService, scope, vm;

        beforeEach(function () {
            module('pulse.mock', 'portal', function ($provide) {
                $provide.decorator('networkService', function ($delegate) {
                    $delegate.editAcf = jasmine.createSpy('editAcf');
                    return $delegate;
                });
            });

            inject(function (_$controller_, _$log_, _$q_, $rootScope, _Mock_, _networkService_) {
                $ctrl = _$controller_;
                $log = _$log_;
                $q = _$q_;
                Mock = _Mock_;

                networkService = _networkService_;
                networkService.editAcf.and.returnValue($q.when({}));

                mock = {
                    acf: {
                        identifier: 'id',
                        name: 'a name',
                        address: {
                            lines: [1, 2],
                        },
                    },
                };
                scope = $rootScope.$new();
                vm = $ctrl('AcfEditController', {
                    $scope: scope,
                    $uibModalInstance: Mock.modalInstance,
                    acf: mock.acf,
                });
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

        it('should exist', function () {
            expect(vm).toBeDefined();
        });

        it('should have a way to close the modal', function () {
            expect(vm.cancel).toBeDefined();
            vm.cancel();
            expect(Mock.modalInstance.dismiss).toHaveBeenCalled();
        });

        it('should call networkService when saving', function () {
            vm.save();
            scope.$digest();
            expect(networkService.editAcf).toHaveBeenCalled();
        });

        it('should close the modal after saving', function () {
            vm.save();
            scope.$digest();
            expect(Mock.modalInstance.close).toHaveBeenCalledWith(vm.acf);
        });

        it('should show error messages if save failed', function () {
            networkService.editAcf.and.returnValue($q.reject({data: {error: 'an error'}}));
            vm.save();
            scope.$digest();
            expect(vm.errorMessage).toBe('an error');
        });

        describe('regarding the address', function () {
            it('should create an acf address on load if not given one', function () {
                vm = $ctrl('AcfEditController', {
                    $scope: scope,
                    $uibModalInstance: Mock.modalInstance,
                    acf: { },

                });
                scope.$digest();
                expect(vm.acf).toEqual({address: {lines: ['']}});
            });
        });
    });
})();
