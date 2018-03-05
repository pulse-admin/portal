(function () {
    'use strict';

    angular
        .module('portal')
        .controller('AcfEditController', AcfEditController);

    /** @ngInject */
    function AcfEditController ($filter, $log, $uibModalInstance, acf, networkService) {
        var vm = this;

        vm.cancel = cancel;
        vm.save = save;

        activate();

        ////////////////////////////////////////////////////////////////////

        function activate () {
            vm.acf = acf;
            if (!vm.acf.address) {
                vm.acf.address = {};
            }
            if (!vm.acf.address.lines) {
                vm.acf.address.lines = [''];
            }
        }

        function cancel () {
            $uibModalInstance.dismiss('staging cancelled');
        }

        function save () {
            networkService.editAcf(vm.acf).then(function () {
                $uibModalInstance.close(vm.acf);
            }, function (error) {
                vm.errorMessage = error.data.error;
            });
        }
    }
})();
