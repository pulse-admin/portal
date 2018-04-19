(function () {
    'use strict';

    angular
        .module('portal.search')
        .controller('PatientEditController', PatientEditController);

    /** @ngInject */
    function PatientEditController ($filter, $log, $uibModalInstance, networkService, patient) {
        var vm = this;

        vm.cancel = cancel;
        vm.editPatient = editPatient;

        activate();

        ////////////////////////////////////////////////////////////////////

        function activate () {
            vm.patient = angular.copy(patient);
            vm.patient.dateOfBirthParts = {
                year: vm.patient.dateOfBirth.substring(0,4),
                month: vm.patient.dateOfBirth.substring(4,6),
                day: vm.patient.dateOfBirth.substring(6,8),
            };
        }

        function cancel () {
            $uibModalInstance.dismiss('editing cancelled');
        }

        function editPatient () {
            vm.patient.dateOfBirth = vm.patient.dateOfBirthParts.year + vm.patient.dateOfBirthParts.month + vm.patient.dateOfBirthParts.day;
            networkService.editPatient(vm.patient).then(function () {
                $uibModalInstance.close(vm.patient)
            }, function (error) {
                vm.errorMessage = error.data.error;
            });
        }
    }
})();
