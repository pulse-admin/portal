(function () {
    'use strict';

    describe('the ACF widget', function () {
        var $compile, $location, $log, $q, $rootScope, $uibModal, Mock, actualOptions, authService, el, mock, networkService, vm;

        mock = {};
        mock.fakeModalOptions = {
            templateUrl: 'app/components/acf/acf_edit.html',
            controller: 'AcfEditController',
            controllerAs: 'vm',
            animation: false,
            backdrop: 'static',
            keyboard: false,
            size: 'md',
            resolve: {
                acf: jasmine.any(Function),
            },
        };

        beforeEach(function () {
            module('portal', 'pulse.mock', function ($provide) {
                $provide.decorator('authService', function ($delegate) {
                    $delegate.getUserAcf = jasmine.createSpy('getUserAcf');
                    $delegate.getUserIdentity = jasmine.createSpy('getUserIdentity');
                    $delegate.hasAcf = jasmine.createSpy('hasAcf');
                    $delegate.hasRole = jasmine.createSpy('hasRole');
                    return $delegate;
                });
                $provide.decorator('networkService', function ($delegate) {
                    $delegate.createAcf = jasmine.createSpy('createAcf');
                    $delegate.getAcfs = jasmine.createSpy('getAcfs');
                    $delegate.setAcf = jasmine.createSpy('setAcf');
                    return $delegate;
                });
            });

            inject(function (_$compile_, _$location_, _$log_, _$q_, _$rootScope_, _$uibModal_, _Mock_, _authService_, _networkService_) {
                $compile = _$compile_;
                $location = _$location_;
                $log = _$log_;
                $q = _$q_;
                $rootScope = _$rootScope_;
                $uibModal = _$uibModal_;
                Mock = _Mock_;
                spyOn($uibModal, 'open').and.callFake(function (options) {
                    actualOptions = options;
                    return Mock.fakeModal;
                });
                authService = _authService_;
                authService.getUserAcf.and.returnValue(Mock.acfs[0]);
                authService.getUserIdentity.and.returnValue({orgs: {
                    'pulse-tx': 3,
                    'acf-2': 1,
                }});
                authService.hasAcf.and.returnValue(true);
                authService.hasRole.and.returnValue(true);
                networkService = _networkService_;
                networkService.createAcf.and.returnValue($q.when({response: {}}));
                networkService.getAcfs.and.returnValue($q.when(Mock.acfs));
                networkService.setAcf.and.returnValue($q.when({}));

                el = angular.element('<ai-acf mode="manage"></ai-acf>');

                $compile(el)($rootScope.$new());
                $rootScope.$digest();
                vm = el.isolateScope().vm;
            });
        });

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                /* eslint-disable no-console,angular/log */
                console.log('Debug:\n' + $log.debug.logs.map(function (o) { return angular.toJson(o); }).join('\n'));
                /* eslint-enable no-console,angular/log */
            }
        });

        describe('directive', function () {
            it('should be compiled', function () {
                expect(el.html()).not.toEqual(null);
            });
        });

        describe('controller', function () {
            it('should have isolate scope object with instanciate members', function () {
                expect(vm).toEqual(jasmine.any(Object));
                expect(vm.mode).toBe('manage');
            });

            it('should get active ACFs on load', function () {
                expect(networkService.getAcfs).toHaveBeenCalled();
                expect(vm.acfs.length).toBe(4);
            });

            describe('when managing ACFs', function () {
                describe('to edit an ACF', function () {
                    it('should have a function to edit an ACF', function () {
                        expect(vm.editAcf).toBeDefined();
                    });

                    it('should create a modal instance when an ACF is edited', function () {
                        expect(vm.modalInstnace).toBeUndefined();
                        vm.editAcf({id: 1});
                        expect(vm.modalInstance).toBeDefined();
                        expect($uibModal.open).toHaveBeenCalledWith(mock.fakeModalOptions);
                        expect(actualOptions.resolve.acf()).toEqual({id: 1});
                    });
                });
            });

            describe('when selecting an ACF', function () {
                var roles = {
                    'ROLE_ADMIN': false,
                    'ROLE_PROVIDER': true,
                };

                beforeEach(function () {
                    authService.hasRole.and.callFake(function (role) { return roles[role]; });

                    spyOn($location, 'path');

                    el = angular.element('<ai-acf mode="select"></ai-acf>');

                    $compile(el)($rootScope.$new());
                    $rootScope.$digest();
                    vm = el.isolateScope().vm;
                });

                it('should create an ACF if one doesn\'t exist', function () {
                    expect(networkService.createAcf).toHaveBeenCalledWith({
                        liferayAcfId: 1,
                        liferayStateId: 3,
                        identifier: 'acf-2',
                        name: 'acf-2',
                    });
                });

                it('should set the user to an ACF if it matches', function () {
                    authService.getUserIdentity.and.returnValue({orgs: {
                        'Alameda-01': 3,
                    }});
                    vm.selectAcf();
                    expect(networkService.setAcf).toHaveBeenCalledWith(Mock.acfs[1]);
                });

                xit('should redirect the user to search', function () {
                    expect($location.path).toHaveBeenCalledWith('/search');
                });

                xit('should redirect the user to search if an ACF is passed in', function () {
                    vm.selectAcf(Mock.acfs[1]);
                    expect(networkService.setAcf).toHaveBeenCalledWith(Mock.acfs[1]);
                    expect($location.path).toHaveBeenCalledWith('/search');
                });
            });
        });
    });
})();
