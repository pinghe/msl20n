define(['msl20n', 'l20n'], function(msl20n, l20n) {
    'use strict';

    msl20n.log("加载avalon完毕，开始构建根VM与加载其他模块");

    msl20n.define({
        $id: mainctrl,
        data: {
            testNumber: 0,
            objectsNum: 3,
        },
        l20nId: "objectsWithCount"
    })

});


/**
 * Author Michał Gołębiowski <michal.golebiowski@laboratorium.ee>
 * Author Mikołaj Dądela <mikolaj.dadela@laboratorium.ee>
 * Author Patryk Hes <patryk.hes@laboratorium.ee>
 * Part of CBN Polona - National Library of Poland
 * © 2012, 2013 Laboratorium EE
 */

(function() {
    'use strict';

    angular.module('testApp', ['ui.l20n'])
        .config(['uiL20nServiceProvider', function(uiL20nServiceProvider) {
            uiL20nServiceProvider.initlocale = 'en-US';
        }])
        .service('testAppService', [function() {
            this.l20nId = 'objectsWithCount';
            this.data = {
                objectsNum: 102,
                testNumber: 0,
            };

        }])
        .controller('testAppCtrl', ['$scope', 'documentL10n', 'uiL20nService', 'testAppService', function($scope, documentL10n, uiL20nService, testAppService) {


            function setObjectsNum(number) {
                uiL20nService.updateData({
                    objectsNum: number,
                });
            };

            //             $rootScope.locale = function() { return documentL10n.supportedLocales[0];};
            $scope.locale = function() {
                return document.documentElement.lang;
            };

            $scope.changeLocale = function(newLocale) {
                uiL20nService.changeLocale(newLocale);
            };


            $scope.$watch('data.objectsNum', function(newValue) {
                setObjectsNum(parseInt(newValue, 10) || 0);
            });
            documentL10n.ready(function() {
                setObjectsNum(parseInt(testAppService.data.objectsNum, 10) || 0);
            });
        }])
        // .run(['$rootScope', 'testAppCtrl', 'documentL10n', 'uiL20nService', 'testAppService', function($rootScope, $scope, documentL10n, uiL20nService, testAppService) {

    //     documentL10n.ready(function() {
    //         setObjectsNum(parseInt(testAppService.data.objectsNum, 10) || 0);
    //     });
    // }]);
})();
