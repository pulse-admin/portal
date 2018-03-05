(function () {
    'use strict';

    describe('the Utility services', function () {

        var $log, utilService;

        beforeEach(module('portal.common', 'portal.constants'));

        beforeEach(inject(function (_$log_, _utilService_) {
            $log = _$log_;
            utilService = _utilService_;
        }));

        afterEach(function () {
            if ($log.debug.logs.length > 0) {
                /* eslint-disable no-console,angular/log */
                console.log('Debug:\n' + $log.debug.logs.map(function (o) { return angular.toJson(o); }).join('\n'));
                /* eslint-enable no-console,angular/log */
            }
        });

        it('should have a function to assemble names', function () {
            expect(utilService.displayName).toBeDefined();
        });

        it('should display names correctly', function () {
            var name = {
                givenName: ['John', 'Andrew'],
                familyName: 'Smith',
                nameType: {code: 'L', description: 'Legal Name'},
            };
            expect(utilService.displayName(name)).toBe('John Andrew Smith');
            name.prefix = 'Mr';
            expect(utilService.displayName(name)).toBe('Mr John Andrew Smith');
            name.suffix = 'III';
            expect(utilService.displayName(name)).toBe('Mr John Andrew Smith III');
            name.profSuffix = 'DDS';
            expect(utilService.displayName(name)).toBe('Mr John Andrew Smith III, DDS');
            name.nameAssembly = {code: 'F'};
            expect(utilService.displayName(name)).toBe('Mr Smith John Andrew III, DDS');
            name.nameType = {code: 'D'};
            expect(utilService.displayName(name)).toBe('Mr Smith John Andrew III, DDS');
        });

        it('should display a message on names with missing required elements', function () {
            var name = {};
            expect(utilService.displayName(name)).toBe('');
            name.givenName = ['John', 'Andrew'];
            expect(utilService.displayName(name)).toBe('John Andrew');
            name.givenName = [];
            expect(utilService.displayName(name)).toBe('');
            name.familyName = 'Smith';
            expect(utilService.displayName(name)).toBe('Smith');
        });

        it('should have a function to join names', function () {
            expect(utilService.displayNames).toBeDefined();
        });

        it('should display names correctly', function () {
            var names = [{
                givenName: ['John', 'Andrew'],
                familyName: 'Smith',
                nameType: {code: 'L', description: 'Legal Name'},
            },{
                givenName: ['Sue', 'Mary'],
                familyName: 'Smith',
                nameType: {code: 'L', description: 'Legal Name'},
            }];
            expect(utilService.displayNames(names, '-')).toBe('John Andrew Smith-Sue Mary Smith');
        });

        it('should display names correctly', function () {
            var names = undefined;
            expect(utilService.displayNames(names, '-')).toBe('');
        });

        it('should have a function to get a friendly full name', function () {
            expect(utilService.friendlyFullName).toBeDefined();
        });

        it('should return a friendly full name', function () {
            var name = {
                givenName: ['John', 'Andrew'],
                familyName: 'Smith',
                nameType: {code: 'L', description: 'Legal Name'},
            };
            expect(utilService.friendlyFullName(name)).toEqual('John Andrew Smith');
        });

        it('should convert DOB as string to date', function () {
            var dob = '19990319';
            expect(utilService.convertDobString(dob)).toBe('03/19/1999');
        });

        it('should provide name assemblies', function () {
            expect(utilService.getNameAssemblies().length).toBe(2);
        });

        it('should provide name representations', function () {
            expect(utilService.getNameRepresentations().length).toBe(3);
        });

        it('should provide name types', function () {
            expect(utilService.getNameTypes().length).toBe(11);
        });
    });
})();
