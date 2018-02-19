(function () {
    'use strict';

    describe('the ACF widget', function () {
        var $compile, $location, $log, $q, $rootScope, Mock, authService, el, mock, networkService, vm;
        mock = {};
        mock.newAcf = {
            identifier: 'New-01',
            name: 'Fairgrounds',
            phoneNumber: '555-1895',
            address: {
                lines: ['133 Smith Gardn'],
                city: 'Albany',
                state: 'CA',
                zipcode: '94602',
                country: null,
            },
        };
        mock.badRequest = {
            status: 400,
            error: 'ACF identitifer is required.',
        };

        beforeEach(function () {
            module('portal', 'pulse.mock', function ($provide) {
                $provide.decorator('authService', function ($delegate) {
                    $delegate.getUserAcf = jasmine.createSpy('getUserAcf');
                    $delegate.hasAcf = jasmine.createSpy('hasAcf');
                    $delegate.hasRole = jasmine.createSpy('hasRole');
                    return $delegate;
                });
                $provide.decorator('networkService', function ($delegate) {
                    $delegate.createAcf = jasmine.createSpy('createAcf');
                    $delegate.editAcf = jasmine.createSpy('editAcf');
                    $delegate.getAcfs = jasmine.createSpy('getAcfs');
                    $delegate.setAcf = jasmine.createSpy('setAcf');
                    return $delegate;
                });
                $provide.constant('acfWritesAllowed', true);
            });

            inject(function (_$compile_, _$location_, _$log_, _$q_, _$rootScope_, _Mock_, _authService_, _networkService_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $log = _$log_;
                $q = _$q_;
                $location = _$location_;
                Mock = _Mock_;
                authService = _authService_;
                authService.getUserAcf.and.returnValue(Mock.acfs[0]);
                authService.hasAcf.and.returnValue(true);
                authService.hasRole.and.returnValue(true);
                networkService = _networkService_;
                networkService.createAcf.and.returnValue($q.when({response: angular.extend(mock.newAcf, {id: 4})}));
                networkService.editAcf.and.returnValue($q.when(Mock.acfs[1]));
                networkService.getAcfs.and.returnValue($q.when(Mock.acfs));
                networkService.setAcf.and.returnValue($q.when({}));

                el = angular.element('<ai-acf mode="select"></ai-acf>');

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

        it('should be compiled', function () {
            expect(el.html()).not.toEqual(null);
        });

        it('should have isolate scope object with instanciate members', function () {
            expect(vm).toEqual(jasmine.any(Object));
        });

        it('should have a function to get active ACFs', function () {
            expect(vm.getAcfs).toBeDefined();
        });

        it('should call networkService.getAcfs on load', function () {
            expect(networkService.getAcfs).toHaveBeenCalled();
            expect(vm.acfs.length).toBe(4);
        });

        it('should set acfs to an empty array if the server fails', function () {
            networkService.getAcfs.and.returnValue($q.reject({}));
            vm.getAcfs();
            el.isolateScope().$digest();
            expect(networkService.getAcfs).toHaveBeenCalled();
            expect(vm.acfs.length).toBe(0);
        });

        it('should have a function to submit the active ACF', function () {
            expect(vm.acfSubmit).toBeDefined();
        });

        it('should call networkService.createAcf if one is in the acf.identifier field', function () {
            vm.acf = angular.copy(mock.newAcf);
            vm.mode = 'enter';
            vm.acfSubmit();
            expect(networkService.createAcf).toHaveBeenCalled();
        });

        it('should not call networkService.createAcf if there isn\'t one in the acf.identifier field', function () {
            vm.acf = {};
            vm.mode = 'enter';
            vm.acfSubmit();
            expect(networkService.createAcf).not.toHaveBeenCalled();
        });

        it('should call networkService.setAcf if there is one selected', function () {
            vm.selectAcf = vm.acfs[0];
            vm.acfSubmit();
            expect(networkService.setAcf).toHaveBeenCalled();
        });

        it('should not call networkService.setAcf if an acf isnt\'t selected', function () {
            vm.selectAcf = null;
            vm.acfSubmit();
            expect(networkService.setAcf).not.toHaveBeenCalled();
        });

        it('should show an error if create goes wrong', function () {
            vm.acf = angular.copy(mock.newAcf);
            vm.mode = 'enter';
            networkService.createAcf.and.returnValue($q.reject({data: mock.badRequest}));
            vm.acfSubmit();
            el.isolateScope().$digest();
            expect(vm.errorMessage).toBe(mock.badRequest.error);
        });

        it('should call setAcf after createAcf', function () {
            vm.acf = angular.copy(mock.newAcf);
            vm.mode = 'enter';
            vm.acfSubmit();
            el.isolateScope().$digest();
            expect(networkService.setAcf).toHaveBeenCalled();
        });

        it('should know if the user has an ACF', function () {
            expect(vm.hasAcf).toBeDefined();
            expect(vm.hasAcf()).toBeTruthy();
        });

        it('should have a function to get the user\`s ACF', function () {
            expect(vm.getUserAcf).toBeDefined();
        });

        it('should call authService.getUserAcf on load', function () {
            expect(authService.getUserAcf).toHaveBeenCalled();
            expect(vm.acf).toBe(Mock.acfs[0]);
        });

        it('should set acf to a blank-ish acf object if the user doesn\'t have an ACF', function () {
            authService.getUserAcf.and.returnValue('');
            vm.getUserAcf();
            expect(vm.acf).toEqual({address: {lines: ['']}});
        });

        it('should not call the networkService is the user isn\'t authenticated', function () {
            var callCount = authService.getUserAcf.calls.count();
            authService.hasAcf.and.returnValue(false)
            vm.getUserAcf();
            expect(authService.getUserAcf.calls.count()).toBe(callCount);
        });

        describe('address object on load', function () {
            var baseAcf;
            var plusAcf;

            beforeEach(function () {
                baseAcf = angular.copy(Mock.acfs[0]);
                delete baseAcf.address;
                plusAcf = angular.copy(baseAcf);
                plusAcf.address = {lines: ['']};
            });

            it('should add an address object if the acf is null', function () {
                authService.getUserAcf.and.returnValue(null);
                vm.getUserAcf();
                expect(vm.acf).toEqual({address: {lines: ['']}});
            });

            it('should add an address object if it doesn\'t have one', function () {
                authService.getUserAcf.and.returnValue(baseAcf);
                vm.getUserAcf();
                expect(vm.acf).toEqual(plusAcf);
            });

            it('should add an address object if the address is null', function () {
                baseAcf.address = null;
                authService.getUserAcf.and.returnValue(baseAcf);
                vm.getUserAcf();
                expect(vm.acf).toEqual(plusAcf);
            });

            it('should put a lines object in the acf address if it doesn\'t have one', function () {
                baseAcf.address = {};
                authService.getUserAcf.and.returnValue(baseAcf);
                vm.getUserAcf();
                expect(vm.acf).toEqual(plusAcf);
            });
        });

        it('should have a function to edit the current ACF', function () {
            expect(vm.editAcf).toBeDefined();
        });

        it('should call networkService.editAcf when one is edited', function () {
            vm.editAcf();
            expect(networkService.editAcf).toHaveBeenCalledWith(Mock.acfs[0]);
        });

        it('should turn off editing after editAcf is called', function () {
            vm.mode = 'edit';
            vm.editAcf();
            expect(vm.mode).toBe('view');
        });

        it('should set the local acf to the edited acf', function () {
            vm.editAcf();
            el.isolateScope().$digest();
            expect(vm.acf).toBe(Mock.acfs[1]);
        });

        it('should have a function to cancel editing', function () {
            expect(vm.cancelEditing).toBeDefined();
        });

        it('should call authService.getUserAcf on cancel', function () {
            vm.cancelEditing();
            expect(authService.getUserAcf).toHaveBeenCalled();
        });

        it('should have a function to submit the form on enter', function () {
            expect(vm.submitForm).toBeDefined();
        });

        it('should call the edit form function on enter if user has acf', function () {
            vm.queryForm.$invalid = false;
            vm.mode = 'edit';
            spyOn(vm, 'editAcf');
            vm.submitForm();
            expect(vm.editAcf).toHaveBeenCalled();
        });

        it('should call acfSubmit on enter if the user has no acf', function () {
            vm.queryForm.$invalid = false;
            authService.hasAcf.and.returnValue(false);
            spyOn(vm, 'acfSubmit');
            vm.submitForm();
            el.isolateScope().$digest();
            expect(vm.acfSubmit).toHaveBeenCalled();
        });

        it('should not allow submitForm to be called if the form is invalid', function () {
            spyOn(vm, 'editAcf');
            vm.queryForm.$invalid = true;
            vm.mode = 'edit';
            vm.submitForm()
            expect(vm.editAcf).not.toHaveBeenCalled();
        });

        it('should remove empty lines from the address on "create"', function () {
            var tweakedAcf = angular.copy(mock.newAcf);
            vm.acf = angular.copy(mock.newAcf);
            vm.acf.address.lines.push('');
            vm.mode = 'enter';
            vm.acfSubmit();
            expect(networkService.createAcf).toHaveBeenCalledWith(tweakedAcf);
        });

        it('should not send an empty array of lines on "create"', function () {
            var tweakedAcf = angular.copy(mock.newAcf);
            tweakedAcf.address.lines = ['123 Main St'];
            delete tweakedAcf.address.lines
            vm.acf = angular.copy(mock.newAcf);
            vm.acf.address.lines.push('');
            vm.acf.address.lines[0] = '';
            vm.mode = 'enter';
            vm.acfSubmit();
            expect(networkService.createAcf).toHaveBeenCalledWith(tweakedAcf);
        });

        it('should redirect the user to /search on acf creation', function () {
            vm.acf = angular.copy(mock.newAcf);
            vm.mode = 'enter';
            spyOn($location, 'path');

            vm.acfSubmit();
            el.isolateScope().$digest();

            expect($location.path).toHaveBeenCalledWith('/search');
        });

        it('should redirect the user to /search on acf selection', function () {
            vm.selectAcf = vm.acfs[0];
            spyOn($location, 'path');

            vm.acfSubmit();
            el.isolateScope().$digest();

            expect($location.path).toHaveBeenCalledWith('/search');
        });

        it('should know what mode the user is in', function () {
            expect(vm.mode).toBe('select');
        });

        it('should switch to "enter" if there are no ACFs', function () {
            networkService.getAcfs.and.returnValue($q.when([]));
            $compile(el)($rootScope.$new());
            $rootScope.$digest();
            vm = el.isolateScope().vm;
            expect(vm.mode).toBe('enter');
        });

        it('should switch to "enter" if getAcfs fails', function () {
            networkService.getAcfs.and.returnValue($q.reject({}));
            $compile(el)($rootScope.$new());
            $rootScope.$digest();
            vm = el.isolateScope().vm;
            expect(vm.mode).toBe('enter');
        });

        it('should not switch to "enter" if mode is "display"', function () {
            el = angular.element('<ai-acf mode="display"></ai-acf>');
            networkService.getAcfs.and.returnValue($q.when([]));
            $compile(el)($rootScope.$new());
            $rootScope.$digest();
            vm = el.isolateScope().vm;
            expect(vm.mode).toBe('display');
            networkService.getAcfs.and.returnValue($q.reject({}));
            $compile(el)($rootScope.$new());
            $rootScope.$digest();
            vm = el.isolateScope().vm;
            expect(vm.mode).toBe('display');
        });

        it('should know if the entered new ACF identifier matches one that already exists', function () {
            vm.acf = angular.copy(mock.newAcf);
            expect(vm.validIdentifier()).toBe(true);
        });

        it('should know if the entered new ACF identifier matches one that already exists', function () {
            vm.acf = angular.copy(Mock.acfs[1]);
            expect(vm.validIdentifier()).toBe(false);
        });

        it('should compose an ACF if !acfWritesAllowed', function () {
            vm.acfWritesAllowed = false;
            vm.acfs = Mock.acfs;
            vm.selectAcfPrefix = 'Alameda';
            vm.selectAcfSuffix = '01';
            vm.findAcf();
            expect(vm.selectAcf).toEqual(Mock.acfs[1]);
        });

        it('should not compose an ACF if acfWritesAllowed', function () {
            vm.findAcf();
            expect(vm.selectAcf).toBeUndefined();
        });

        it('should have a way to get the name of an ACF from the identifier', function () {
            expect(vm.getName(Mock.acfs[0].identifier)).toBe(Mock.acfs[0].name);
        });

        it('should return "" is the identifier is invalid', function () {
            expect(vm.getName('fake ID')).toBe('');
        });
    });
})();
