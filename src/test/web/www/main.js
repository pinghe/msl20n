/**
 * Created by mengzhx on 2015-07-14.
 */
'use strict';

require.config({ //第一块，配置
    baseUrl: './modules/',
    paths: {
        'main': '../main',
        'avalon': "../vendor/avalon/avalon.modern",
        'l20n': '../vendor/l20n/l20n',
        // 'l20n': '../../../../test/web/www/vendor/l20n/l20n',
        'l20n/platform': 'client/l20n/platform'
        'msl20n': '../../../../main/web/www/modules/avalon.widget.l20n'
    },
    // deps: ['./app']
});

require(["app"], function() {
    console.log("APP 加载完毕")
})
