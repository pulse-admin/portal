(function () {
    'use strict';

    angular
        .module('portal.search')
        .directive('aiPatientSearch', aiPatientSearch);

    /** @ngInject */
    function aiPatientSearch () {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/search/components/patient_search/patient_search.html',
            scope: { },
            controller: PatientSearchController,
            controllerAs: 'vm',
            bindToController: { triggerHandlers: '&' },
        };

        return directive;

        /** @ngInject */
        function PatientSearchController ($log, $scope, networkService) {
            var vm = this;

            vm.errorCount = errorCount;
            vm.requery = requery;
            vm.searchForPatient = searchForPatient;

            activate();

            ////////////////////////////////////////////////////////////////////

            function activate () {
                vm.baseQuery = {
                    addresses: [{ lines: []}],
                    dobParts: {},
                    patientNames: [{givenName: [], nameType: { code: 'L', description: 'Legal Name'} }],
                };
                vm.query = angular.copy(vm.baseQuery);
                $scope.$on('requery', function (e, args) {
                    vm.requery(args.terms);
                });
            }

            function errorCount () {
                var count = 0,
                    errors = vm.queryForm.$error;

                angular.forEach(errors, function (val) {
                    if (angular.isArray(val)) {
                        count += val.length;
                    }
                });
                return count;
            }

            function requery (terms) {
                vm.query = {
                    addresses: terms.addresses,
                    dobParts: {
                        year: parseInt(terms.dob.substring(0, 4)),
                        month: terms.dob.substring(4, 6),
                        day: terms.dob.substring(6, 8),
                    },
                    gender: terms.gender,
                    patientNames: [{
                        givenName: [terms.patientNames[0].givenName[0]],
                        familyName: terms.patientNames[0].familyName,
                        nameType: { code: 'L', description: 'Legal Name'},
                    }],
                    ssn: terms.ssn,
                    telephone: terms.telephone,
                };
            }

            function searchForPatient () {
                if (!vm.queryForm.$invalid) {
                    vm.query.dob = vm.query.dobParts.year + vm.query.dobParts.month + vm.query.dobParts.day;

                    var queryObj = {query: angular.copy(vm.query)};
                    networkService.searchForPatient(queryObj.query).then(function () {
                        vm.triggerHandlers();
                        vm.query = angular.copy(vm.baseQuery);

                        vm.queryForm.$setPristine();
                        vm.queryForm.$setUntouched();
                        vm.showFormErrors = false;
                    }, function (error) {
                        vm.errorMessage = error.data.message;
                    });
                }
            }
        }
    }
})();
