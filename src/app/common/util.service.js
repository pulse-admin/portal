(function () {
    'use strict';

    angular
        .module('portal.common')
        .factory('utilService', utilService);

    /** @ngInject */
    function utilService ($filter) {
        var service = {
            convertDobString: convertDobString,
            displayName: displayName,
            displayNames: displayNames,
            friendlyFullName: friendlyFullName,
            getNameAssemblies: getNameAssemblies,
            getNameRepresentations: getNameRepresentations,
            getNameTypes: getNameTypes,
        }
        return service;

        ////////////////////////////////////////////////////////////////////

        function convertDobString (dob) {
            var pattern = /(\d{4})(\d{2})(\d{2})(.*)/;
            var dateUnix = new Date(dob.replace(pattern, '$1-$2-$3')).getTime();
            return $filter('date')(dateUnix, 'MM/dd/yyyy', 'utc');
        }

        function displayName (name) {
            var ret = '';
            if (angular.isArray(name.givenName)) {
                ret += name.givenName.join(' ');
            }
            if (name.familyName) {
                if (name.nameAssembly && name.nameAssembly.code === 'F') {
                    ret = name.familyName + ' ' + ret;
                } else {
                    ret += ' ' + name.familyName;
                }
            }
            if (name.prefix) {
                ret = name.prefix + ' ' + ret;
            }
            if (name.suffix) {
                ret += ' ' + name.suffix;
            }
            if (name.profSuffix) {
                ret += ', ' + name.profSuffix;
            }
            return ret.trim();
        }

        function displayNames (array, separator) {
            if (angular.isArray(array)) {
                var ret = array.map(this.displayName);
                return ret.join(separator);
            } else {
                return '';
            }
        }

        function friendlyFullName (name) {
            return this.displayName(name).split('(')[0].trim();
        }

        function getNameAssemblies () {
            return [
                { code: 'F', description: 'Prefix Family Middle Given Suffix' },
                { code: 'G', description: 'Prefix Given Middle Family Suffix' },
            ];
        }

        function getNameRepresentations () {
            return [
                { code: 'A', description: 'Alphabetic (i.e. Default or some single-byte)' },
                { code: 'I', description: 'Ideographic (i.e. Kanji)' },
                { code: 'P', description: 'Phonetic (i.e. ASCII, Katakana, Hiragana, etc.)'},
            ];
        }

        function getNameTypes () {
            return [
                { code: 'A', description: 'Alias Name' },
                { code: 'B', description: 'Name at Birth' },
                { code: 'C', description: 'Adopted Name' },
                { code: 'D', description: 'Display Name' },
                { code: 'I', description: 'Licensing Name' },
                { code: 'L', description: 'Legal Name' },
                { code: 'M', description: 'Maiden Name' },
                { code: 'N', description: 'Nickname /"Call me" Name/Street Name' },
                { code: 'S', description: 'Coded Pseudo-Name to ensure anonymity' },
                { code: 'T', description: 'Indigenous/Tribal/Community Name' },
                { code: 'U', description: 'Unspecified' },
            ];
        }
    }
})();
