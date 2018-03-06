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
                    }
                    //$location.path('/search');
                }
                if (vm.mode === 'view') {
                    vm.acf = authService.getUserAcf();
                }
            }

            function createAcf () {
                var liferayAcf = Object.keys(authService.getUserIdentity().orgs).filter(function (org) { return org.substring(0,6) !== 'pulse-'; })[0];
                var liferayState = Object.keys(authService.getUserIdentity().orgs).filter(function (org) { return org.substring(0,6) === 'pulse-'; })[0];
                var acf = {
                    liferayAcfId: authService.getUserIdentity().orgs[liferayAcf],
                    liferayStateId: authService.getUserIdentity().orgs[liferayState],
                    identifier: liferayAcf,
                    name: liferayAcf,
                }
                networkService.createAcf(acf).then(function (response) {
                    networkService.setAcf(response);
                });
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
                        //$location.path('/search');
                    });
                } else {
                    var org = Object.keys(authService.getUserIdentity().orgs).filter(function (org) { return org.substring(0,6) !== 'pulse-'; })[0];
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
