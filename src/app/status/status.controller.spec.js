(function () {
    'use strict';

    describe('portal.status', function (){
        var $log, $q, mock, networkService, scope, vm;

        mock = {
            data: {'rows': [{'c': [{'v': '20170223'},{'v': 0}]},{'c': [{'v': '20170224'},{'v': 0}]},{'c': [{'v': '20170225'},{'v': 0}]},{'c': [{'v': '20170226'},{'v': 0}]},{'c': [{'v': '20170227'},{'v': 0}]},{'c': [{'v': '20170228'},{'v': 0}]},{'c': [{'v': '20170301'},{'v': 0}]},{'c': [{'v': '20170302'},{'v': 0}]},{'c': [{'v': '20170303'},{'v': 0}]},{'c': [{'v': '20170304'},{'v': 0}]},{'c': [{'v': '20170305'},{'v': 0}]},{'c': [{'v': '20170306'},{'v': 0}]},{'c': [{'v': '20170307'},{'v': 0}]},{'c': [{'v': '20170308'},{'v': 1}]}],'cols': [{'type': 'string','id': 'ga: date','label': 'ga: date'},{'type': 'number','id': 'ga: sessions','label': 'ga: sessions'}]},
        };
        beforeEach(function () {
            module('portal', function ($provide) {
                $provide.decorator('networkService', function ($delegate) {
                    $delegate.getAnalytics = jasmine.createSpy('getAnalytics');
                    return $delegate;
                });
            });

            inject(function ($controller, _$log_, _$q_, $rootScope, _networkService_) {
                $log = _$log_;
                $q = _$q_;
                networkService = _networkService_;
                networkService.getAnalytics.and.returnValue($q.when(mock.data));

                scope = $rootScope.$new();
                vm = $controller('StatusController');
                scope.$digest();
            });
        });

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                //console.debug("\n Debug: " + $log.debug.logs.join("\n Debug: "));
            }
        });

        it('should exist', function () {
            expect(vm).toBeDefined()
        });

        it('should have an about', function () {
            expect(vm.about).toEqual('status');
        });
    });
})();
