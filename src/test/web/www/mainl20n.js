/**
 * Created by mengzhx on 2015-07-14.
 */
'use strict';

require.config({ //第一块，配置
    baseUrl: './modules/',
    paths: {
        'main': '../mainl20n',
        'avalon': "../vendor/avalon/avalon.modern",
        // l20n: '../vendor/l20n/l20n',
        // 'l20n': '../../../../test/web/www/vendor/l20n/l20n',
        'l20n': '../vendor/l20n',
        'l20n/platform': '../vendor/l20n/client/l20n/platform',
        'msl20n': '../../../../main/web/www/modules/avalon.widget.l20n'
    },
    // deps: ['./app']
});

require(["l20n/l20n", "l20n/platform/io", "l20n/l20n/Intl"], function(L20n, io, Intl) {
    // absolute URLs start with a slash or contain a colon (for schema)
    var reAbsolute = /^\/|:/;
    var rtlLocales = ['ar', 'fa', 'he', 'ps', 'ur'];

    function loadManifest(url) {
        io.load(url, function(err, text) {
            var manifest = parseManifest(text, url);
            setupCtxFromManifest(manifest);
        });
    }

    function parseManifest(text, url) {
        var manifest = JSON.parse(text);
        manifest.resources = manifest.resources.map(
            relativeToManifest.bind(this, url));
        return manifest;
    }

    function setDocumentLanguage(loc) {
        document.documentElement.lang = loc;
        document.documentElement.dir =
            rtlLocales.indexOf(loc) === -1 ? 'ltr' : 'rtl';
    }

    function setupCtxFromManifest(manifest) {
        // register available locales
        ctx.registerLocales(manifest.default_locale, manifest.locales);
        ctx.registerLocaleNegotiator(function(available, requested, defLoc) {
            // lazy-require Intl
            var fallbackChain = Intl.Intl.prioritizeLocales(available, requested, defLoc);
            setDocumentLanguage(fallbackChain[0]);
            return fallbackChain;
        });

        // add resources
        var re = /{{\s*locale\s*}}/;
        manifest.resources.forEach(function(uri) {
            if (re.test(uri)) {
                ctx.linkResource(uri.replace.bind(uri, re));
            } else {
                ctx.linkResource(uri);
            }
        });

        // For now we just take navigator.language, but we'd prefer to get a list 
        // of locales that the user can read sorted by user's preference, see:
        //   https://bugzilla.mozilla.org/show_bug.cgi?id=889335
        // For IE we use navigator.browserLanguage, see:
        //   http://msdn.microsoft.com/en-us/library/ie/ms533542%28v=vs.85%29.aspx
        // ctx.requestLocales(navigator.language || navigator.browserLanguage);
        ctx.requestLocales('en-US');

        return manifest;
    }

    function relativeToManifest(manifestUrl, url) {
        if (reAbsolute.test(url)) {
            return url;
        }
        var dirs = manifestUrl.split('/')
            .slice(0, -1)
            .concat(url.split('/'))
            .filter(function(elem) {
                return elem !== '.';
            });
        return dirs.join('/');
    }


    var ctx = L20n.getContext('ctxid');
    ctx.addEventListener('ready', function() {
        var node = document.querySelector('[data-l10n-id=testp]');
        var entity = ctx.getEntitySync('testp');
        node.textContent = entity.value;
        node.classList.remove('hidden');
    })
    loadManifest('modules/locales/l20n.json')
    // ctx.linkResource('modules/locales/l20n.json');
    ctx.requestLocales('zh-CN');
})
