(function () {
    'use strict';

    angular
        .module('portal.search')
        .controller('PatientStageController', PatientStageController);

    /** @ngInject */
    function PatientStageController ($filter, $log, $uibModal, $uibModalInstance, networkService, query, utilService) {
        var vm = this;

        vm.cancel = cancel;
        vm.clearQuery = clearQuery;
        vm.convertDobString = utilService.convertDobString;
        vm.displayNames = displayNames;
        vm.friendlyFullName = friendlyFullName;
        vm.isStageable = isStageable;
        vm.prepopulate = prepopulate;
        vm.selectAll = selectAll;
        vm.stagePatient = stagePatient;
        vm.viewRecordDetails = viewRecordDetails;

        activate();

        ////////////////////////////////////////////////////////////////////

        function activate () {
            vm.query = query;
            vm.queryForm = {};
            vm.prepopulate();
        }

        function cancel () {
            $uibModalInstance.dismiss('staging cancelled');
        }

        function clearQuery () {
            networkService.clearQuery(vm.query.id).then(function () {
                $uibModalInstance.dismiss('query cleared');
            });
        }

        function displayNames (names) {
            return utilService.displayNames(names, '<br />');
        }

        function friendlyFullName (name) {
            return utilService.friendlyFullName(name);
        }

        function isStageable () {
            if (vm.query && vm.query.endpointStatuses) {
                for (var i = 0; i < vm.query.endpointStatuses.length; i++) {
                    for (var j = 0; j < vm.query.endpointStatuses[i].results.length; j++) {
                        if (vm.query.endpointStatuses[i].results[j].selected) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        function prepopulate () {
            vm.patient = {
                dateOfBirth: vm.query.terms.dob,
                dateOfBirthParts: {
                    year: vm.query.terms.dob.substring(0,4),
                    month: vm.query.terms.dob.substring(4,6),
                    day: vm.query.terms.dob.substring(6,8),
                },
                dateOfBirthString: vm.convertDobString(vm.query.terms.dob),
                fullName: vm.friendlyFullName(vm.query.terms.patientNames[0]),
                gender: vm.query.terms.gender,
                ssn: vm.query.terms.ssn,
            };
        }

        function selectAll (endpoint) {
            for (var i = 0; i < endpoint.results.length; i++) {
                endpoint.results[i].selected = !endpoint.results[i].selected;
            }
        }

        function stagePatient () {
            if (vm.isStageable()) {
                vm.patient.dateOfBirth = vm.patient.dateOfBirthParts.year + vm.patient.dateOfBirthParts.month + vm.patient.dateOfBirthParts.day;
                var newPatient = {
                    patientRecordIds: [],
                    patient: vm.patient,
                    id: vm.query.id,
                };
                for (var i = 0; i < vm.query.endpointStatuses.length; i++) {
                    for (var j = 0; j < vm.query.endpointStatuses[i].results.length; j++) {
                        if (vm.query.endpointStatuses[i].results[j].selected) {
                            newPatient.patientRecordIds.push(vm.query.endpointStatuses[i].results[j].id);
                        }
                    }
                }
                networkService.stagePatient(newPatient).then(function () {
                    $uibModalInstance.close()
                }, function (error) {
                    vm.errorMessage = error.data.error;
                });
            }
        }

        function viewRecordDetails (record) {
            vm.viewRecordDetailsInstance = $uibModal.open({
                templateUrl: 'app/search/components/patient_stage_details/patient_stage_details.html',
                controller: 'PatientStageDetailsController',
                controllerAs: 'vm',
                animation: false,
                backdrop: 'static',
                keyboard: false,
                size: 'md',
                resolve: {
                    record: function () { return record; },
                },
            });
            vm.viewRecordDetailsInstance.result.then(function (response) {
                $log.info(response);
            }, function (result) {
                $log.info(result)
            });
        }
    }
})();
