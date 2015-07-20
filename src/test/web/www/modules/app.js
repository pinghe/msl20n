define(['msl20n'], function(avalon) {
    'use strict';


    var vmmodel = avalon.define({
            $id: "mainctrl",
            $skipArray: ["l20n"],
            data: {
                testNumber: 4,
                objectsNum: 3,
            },
            currentLocale: 'pl',
            changeLocale: function(newLocale) {
                vmmodel.currentLocale = newLocale;
                avalon.requestLocales(newLocale);
            },
            l20nI18nId: "objectsWithCount",
            l20n: {
                ctxid: "test", // 可以不设置，默认是 document.location.host
                initLocale: 'pl', //页面初始打开时默认语言，未设置则为浏览器当前语言
                manifestResource: "modules/locales/l20n.json", //加载国际化资源文件，必须设置
            },
        })
        // $scope.$watch('data.objectsNum', function(newValue) {
        // avalon.updatedata(parseInt(newValue, 10) || 0);
        // });
        // avalon.requestLocales(vmmodel.l20n);
    vmmodel.data.$watch('objectsNum', function(newValue, oldValue) {
        avalon.updateL20nData({
            objectsNum: newValue
        })
    })
    avalon.scan();

    avalon.log("加载avalon完毕，开始构建根VM与加载其他模块");

});


// /**
//  * Author Michał Gołębiowski <michal.golebiowski@laboratorium.ee>
//  * Author Mikołaj Dądela <mikolaj.dadela@laboratorium.ee>
//  * Author Patryk Hes <patryk.hes@laboratorium.ee>
//  * Part of CBN Polona - National Library of Poland
//  * © 2012, 2013 Laboratorium EE
//  */

// (function() {
//     'use strict';

//     angular.module('testApp', ['ui.l20n'])
//         .config(['uiL20nServiceProvider', function(uiL20nServiceProvider) {
//             uiL20nServiceProvider.initlocale = 'en-US';
//         }])
//         .service('testAppService', [function() {
//             this.l20nId = 'objectsWithCount';
//             this.data = {
//                 objectsNum: 102,
//                 testNumber: 0,
//             };

//         }])
//         .controller('testAppCtrl', ['$scope', 'documentL10n', 'uiL20nService', 'testAppService', function($scope, documentL10n, uiL20nService, testAppService) {


//             function setObjectsNum(number) {
//                 uiL20nService.updateData({
//                     objectsNum: number,
//                 });
//             };

//             //             $rootScope.locale = function() { return documentL10n.supportedLocales[0];};
//             $scope.locale = function() {
//                 return document.documentElement.lang;
//             };

//             $scope.changeLocale = function(newLocale) {
//                 uiL20nService.changeLocale(newLocale);
//             };


//             $scope.$watch('data.objectsNum', function(newValue) {
//                 setObjectsNum(parseInt(newValue, 10) || 0);
//             });
//             documentL10n.ready(function() {
//                 setObjectsNum(parseInt(testAppService.data.objectsNum, 10) || 0);
//             });
//         }])
//         // .run(['$rootScope', 'testAppCtrl', 'documentL10n', 'uiL20nService', 'testAppService', function($rootScope, $scope, documentL10n, uiL20nService, testAppService) {

//     //     documentL10n.ready(function() {
//     //         setObjectsNum(parseInt(testAppService.data.objectsNum, 10) || 0);
//     //     });
//     // }]);
// })();
