(function () {
    'use strict';

    angular
        .module('portal.search')
        .directive('aiPatientReview', aiPatientReview);

    /** @ngInject */
    function aiPatientReview () {
        var directive = {
            bindToController: {
                triggerHandlers: '&',
            },
            controller: PatientReviewController,
            controllerAs: 'vm',
            restrict: 'E',
            scope: { registerHandler: '&' },
            templateUrl: 'app/search/components/patient_review/patient_review.html',
            link: function (scope, element, attr, ctrl) {
                var handler = scope.registerHandler({
                    handler: function () {
                        ctrl.getQueries();
                    },
                });
                scope.$on('$destroy', handler);
            },
        };

        return directive;

        /** @ngInject */
        function PatientReviewController ($log, $rootScope, $scope, $timeout, $uibModal, QueryQueryTimeout, networkService, utilService) {
            var vm = this;

            vm.cancelQueryEndpoint = cancelQueryEndpoint;
            vm.clearQuery = clearQuery;
            vm.convertDobString = utilService.convertDobString;
            vm.countComplete = countComplete;
            vm.displayName = utilService.displayName;
            vm.displayNames = displayNames;
            vm.getQueries = getQueries;
            vm.getRecordCount = getRecordCount;
            vm.requery = requery;
            vm.requeryEndpoint = requeryEndpoint;
            vm.stagePatient = stagePatient;

            vm.TIMEOUT_MILLIS = QueryQueryTimeout * 1000;

            activate();

            ////////////////////////////////////////////////////////////////////

            function activate () {
                vm.getQueries();
            }

            function cancelQueryEndpoint (endpointStatus) {
                endpointStatus.isClearing = true;
                networkService.cancelQueryEndpoint(endpointStatus.queryId, endpointStatus.endpoint.id);
            }

            function clearQuery (query) {
                shallowClearQuery(query);
                networkService.clearQuery(query.id).then(function () {
                    vm.getQueries();
                });
            }

            function countComplete (query) {
                var count = 0;
                for (var i = 0; i < query.endpointStatuses.length; i++) {
                    if (query.endpointStatuses[i].status !== 'Active') {
                        count += 1;
                    }
                }
                return count;
            }

            function displayNames (names) {
                return utilService.displayNames(names, '<br />');
            }

            function getQueries () {
                if (!vm.activeQuery) {
                    getQueryHelper();
                }
            }

            function getRecordCount (query) {
                var recordCount = 0;
                if (query) {
                    for (var i = 0; i < query.endpointStatuses.length; i++) {
                        recordCount += query.endpointStatuses[i].results.length;
                    }
                }
                return recordCount;
            }

            function requery (query) {
                $rootScope.$broadcast('requery', {terms: query.terms});
            }

            function requeryEndpoint (endpoint) {
                endpoint.isRequerying = true;
                networkService.requeryEndpoint(endpoint.queryId, endpoint.endpoint.id).then(function () {
                    vm.getQueries();
                });
            }

            function stagePatient (query) {
                vm.stagePatientInstance = $uibModal.open({
                    templateUrl: 'app/search/components/patient_stage/patient_stage.html',
                    controller: 'PatientStageController',
                    controllerAs: 'vm',
                    animation: false,
                    backdrop: 'static',
                    keyboard: false,
                    size: 'lg',
                    resolve: {
                        query: function () { return query; },
                    },
                });
                vm.stagePatientInstance.result.then(function () {
                    vm.triggerHandlers();
                    vm.getQueries();
                }, function (result) {
                    if (result === 'query cleared') {
                        shallowClearQuery(query);
                        vm.getQueries();
                    }
                    $log.debug('dismissed', result);
                });
            }

            ////////////////////////////////////////////////////////////////////

            function getQueryHelper () {
                vm.activeQuery = true;
                networkService.getQueries().then(function (response) {
                    var stillActive = false;
                    vm.patientQueries = response;
                    for (var i = 0; i < vm.patientQueries.length; i++) {
                        vm.patientQueries[i].recordCount = vm.getRecordCount(vm.patientQueries[i]);
                        stillActive = stillActive || (vm.patientQueries[i].status === 'Active');
                    }
                    vm.activeQuery = stillActive;
                    if (stillActive) {
                        vm.timeout = $timeout(getQueryHelper, vm.TIMEOUT_MILLIS);
                    }
                });
            }

            function shallowClearQuery (query) {
                var i;
                for (i = 0; i < vm.patientQueries.length; i++) {
                    if (query.id === vm.patientQueries[i].id) {
                        vm.patientQueries.splice(i,1);
                        break;
                    }
                }
                for (i = 0; i < vm.displayedQueries.length; i++) {
                    if (query.id === vm.displayedQueries[i].id) {
                        vm.displayedQueries.splice(i,1);
                        break;
                    }
                }
            }
        }
    }
})();
