/**
 * Created by mengzhx on 2015-01-04.
 */
'use strict';

require.config({//第一块，配置
    baseUrl: './modules/',
    paths: {
        main: '../main',
        avalon: "../vendor/avalon/avalon.mobile",
        l20n: '../vendor/l20n/l20n',
        msl20n: '../../../../main/web/www/modules/avalon.l20n'
    },
    deps: ['./app']
});