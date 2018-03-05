(function () {
    'use strict';

    angular
        .module('portal')
        .controller('StatusController', StatusController);

    /** @ngInject */
    function StatusController ($log, networkService) {
        var vm = this;

        activate();

        ////////////////////////////////////////////////////////////////////

        function activate () {
            vm.about = 'status';
            $log.info(vm.about);
            getAnalytics();
        }

        ////////////////////////////////////////////////////////////////////

        function getAnalytics () {
            vm.browserVariety = {
                type: 'PieChart',
                options: { is3D: true, title: 'Visitors by browser (last 7 days)' },
            };
            vm.countries = {
                type: 'PieChart',
                options: { is3D: true, title: 'Visitors by country (last 7 days)' },
            };
            vm.states = {
                type: 'PieChart',
                options: { is3D: true, title: 'Visitors by state (last 7 days)' },
            };
            vm.cities = {
                type: 'PieChart',
                options: { is3D: true, title: 'Visitors by city (last 7 days)' },
            };
            vm.traffic = {
                type: 'LineChart',
                options: {
                    legend: { position: 'none' },
                    title: 'Visitors for the last 14 days',
                },
            };
            vm.worldMap = {
                type: 'GeoChart',
                options: { },
            };
            vm.stateMap = {
                type: 'GeoChart',
                options: { region: 'US', resolution: 'provinces'},
            };
            vm.caMap = {
                type: 'GeoChart',
                options: { region: 'US-CA', displayMode: 'markers', resolution: 'provinces' },
            }
            networkService.getAnalytics('ag5zfnB1bHNlLTE2MDkxNnIVCxIIQXBpUXVlcnkYgICAgPiWlQoM')
                .then(function (data) {
                    vm.browserVariety.data = data;
                });
            networkService.getAnalytics('ag5zfnB1bHNlLTE2MDkxNnIVCxIIQXBpUXVlcnkYgICAgNrjhgoM')
                .then(function (data) {
                    vm.countries.data = data;
                    vm.worldMap.data = data;
                });
            networkService.getAnalytics('ag5zfnB1bHNlLTE2MDkxNnIVCxIIQXBpUXVlcnkYgICAgO2xgwoM')
                .then(function (data) {
                    vm.states.data = data;
                    vm.stateMap.data = data;
                });
            networkService.getAnalytics('ag5zfnB1bHNlLTE2MDkxNnIVCxIIQXBpUXVlcnkYgICAgLyhggoM')
                .then(function (data) {
                    vm.cities.data = data;
                    vm.caMap.data = data;
                });
            networkService.getAnalytics('ag5zfnB1bHNlLTE2MDkxNnIVCxIIQXBpUXVlcnkYgICAgICAgAoM')
                .then(function (data) {
                    data.cols[0].type = 'date';
                    var date;
                    for (var i = 0; i < data.rows.length; i++) {
                        date = data.rows[i].c[0].v;
                        if (date && date.length === 8) {
                            data.rows[i].c[0].v = new Date(date.substring(0,4),
                                                           parseInt(date.substring(4,6)) - 1,
                                                           date.substring(6,8));
                        }
                    }
                    vm.traffic.data = data;
                });
        }
    }
})();
