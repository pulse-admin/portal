(function () {
    'use strict';

    angular
        .module('portal')
        .directive('aiAcf', aiAcf);

    /** @ngInject */
    function aiAcf () {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/acf/acf.html',
            scope: {},
            controller: AcfController,
            controllerAs: 'vm',
            bindToController: {
                mode: '@',
            },
        };
        return directive;

        /** @ngInject */
        function AcfController ($log, $location, $uibModal, authService, networkService) {
            var vm = this;

            vm.createAcf = createAcf;
            vm.editAcf = editAcf;
            vm.getAcfs = getAcfs;
            vm.hasAcf = authService.hasAcf;
            vm.hasRole = authService.hasRole;
            vm.selectAcf = selectAcf;

            activate();

            ////////////////////////////////////////////////////////////////////

            function activate () {
                vm.getAcfs();
                if (vm.mode === 'select' && !vm.hasRole(['ROLE_ADMIN'])) {
                    if (!vm.selectAcf()) {
                        vm.createAcf();
                        vm.selectAcf();
                    }
                    $location.path('/search');
                }
            }

            function createAcf () {
                var org = authService.getUserIdentity().organization;
                var acf = {
                    identifier: org,
                    name: org,
                }
                networkService.createAcf(acf);
            }

            function editAcf (acf) {
                vm.modalInstance = $uibModal.open({
                    templateUrl: 'app/components/acf/acf_edit.html',
                    controller: 'AcfEditController',
                    controllerAs: 'vm',
                    animation: false,
                    backdrop: 'static',
                    keyboard: false,
                    size: 'md',
                    resolve: {
                        acf: function () { return acf; },
                    },
                });
            }

            function getAcfs () {
                vm.acfs = [];
                networkService.getAcfs().then(function (response) {
                    vm.acfs = vm.acfs.concat(response);
                });
            }

            function selectAcf (inputAcf) {
                if (inputAcf) {
                    networkService.setAcf(inputAcf).then(function () {
                        $location.path('/search');
                    });
                } else {
                    var org = authService.getUserIdentity().organization;
                    var acf = vm.acfs.filter(function (acf) { return acf.identifier === org; })[0];
                    if (acf) {
                        networkService.setAcf(acf);
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
    }
})();
