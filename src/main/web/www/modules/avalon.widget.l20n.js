/**
 * @cnName avalon 封装 l20n 的国际化插件
 * @enName avalon l20n
 * @introduce
 *    <p></p>
 *  @updatetime 2015-07-12
 */
define(["l20n", "l20n/Intl", "l20n/platform/io", "avalon"], function(MSL20n, Intl, io, avalon) {

    var singletonCtxs = (function() {
        // {id1: {ctx: ctx1, currentLocale: <currentLocale>, previousLocale: <previousLocale>, manifestResource: <manifestResource>}, id2: {ctx: ctx2, currentLocale: <currentLocale>, , previousLocale: <previousLocale>, manifestResource: <manifestResource>}}
        var ctxArray = {};

        function init(ctxid, initLocale, manifestResource) {
            ctxArray[ctxid] = {};
            ctxArray[ctxid].ctx = MSL20n.getContext(ctxid);
            initparam(ctxid, initLocale, manifestResource);
            return ctxArray[ctxid];
        }

        function initparam(ctxid, initLocale, manifestResource) {
            ctxArray[ctxid].currentLocale = initLocale || navigator.language || navigator.browserLanguage
            if (manifestResource !== undefined) {
                ctxArray[ctxid].manifestResource = manifestResource
                loadManifest(ctxArray[ctxid])
            };

        }
        return {
            ctxArray: ctxArray,
            getInstance: function(ctxid, initLocale, manifestResource) {
                return ctxArray[ctxid] || init(ctxid, initLocale, manifestResource);
            }
        }
    })();

    var reAbsolute = /^\/|:/;
    var rtlLocales = ['ar', 'fa', 'he', 'ps', 'ur'];

    function loadManifest(ctxObj) {
        io.load(ctxObj.manifestResource, function(err, text) {
            var manifest = parseManifest(text, ctxObj.manifestResource);
            setupCtxFromManifest(ctxObj, manifest);
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

    function setupCtxFromManifest(ctxObj, manifest) {
        // register available locales
        ctxObj.ctx.registerLocales(manifest.default_locale, manifest.locales);
        ctxObj.ctx.registerLocaleNegotiator(function(available, requested, defLoc) {
            // lazy-require Intl
            var fallbackChain = Intl.Intl.prioritizeLocales(available, requested, defLoc);
            setDocumentLanguage(fallbackChain[0]);
            return fallbackChain;
        });

        // add resources
        var re = /{{\s*locale\s*}}/;
        manifest.resources.forEach(function(uri) {
            if (re.test(uri)) {
                ctxObj.ctx.linkResource(uri.replace.bind(uri, re));
            } else {
                ctxObj.ctx.linkResource(uri);
            }
        });

        // For now we just take navigator.language, but we'd prefer to get a list 
        // of locales that the user can read sorted by user's preference, see:
        //   https://bugzilla.mozilla.org/show_bug.cgi?id=889335
        // For IE we use navigator.browserLanguage, see:
        //   http://msdn.microsoft.com/en-us/library/ie/ms533542%28v=vs.85%29.aspx
        // ctx.requestLocales(navigator.language || navigator.browserLanguage);
        ctxObj.ctx.requestLocales(ctxObj.currentLocale);

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


    var widget = avalon.ui.l20n = function(element, data, vmodels) {
        var options = data.l20nOptions, //★★★取得配置项
            $element = avalon(element),
            l20nModel,
            msl20n;



        msl20n = singletonCtxs.getInstance(options.ctxid, options.initLocale, options.manifestResource);

        // function localizeCurrentNode() {
        //     // l20n cant handle localization of comment nodes, throwing an error in the process.
        //     // Do not pass comment nodes to l20n for localization.
        //     if (element[0].nodeType === Node.COMMENT_NODE) {
        //         return;
        //     }
        //     msl20n.ctx.localizeNode(element);
        // }

        // 因国际化标签很多，每个element对应一个 vm 不合适，这里不创建 vmodel
        l20nModel = {
            $init: function() {
                // document.addEventListener('uiL20n:dataupdated', localizeCurrentNode);

                avalon.scan(element, vmodels)
                msl20n.ctx.localize([options.id], function(l10n) {
                    //todo 检测 options.id 是 {{}} 和过滤器，则提取值填充，
                    element.textContent = l10n.entities[options.id].value;
                    element.classList.remove('hidden');
                });
            }
        }
        l20nModel.$init()
    }
    widget.version = '1.0.4' // 对应 l20n 版本号
    widget.defaults = { //默认配置项
        id: "", // 国际化节点id,必须设置,在ms-widget元素属性中设置。
        // global: false, //默认false，id 属于定义vm区域，true 全局，属于 ctxid = document.location.host
        // ctxid: "", // 可以不设置，默认是 document.location.host, 在所属vm的options对象中设置。应该不暴露出来，默认等于opt定义所在vm的id，如果设置了global，默认是 document.location.host
        // initLocale: navigator.language || navigator.browserLanguage, //页面初始打开时默认语言，未设置则为浏览器当前语言，在所属vm的options对象中设置
        // manifestResource: "", //加载国际化资源文件，必须设置， 在所属vm的options对象中设置
    }

    // vm.availableLocales = []
    avalon.requestLocales = function(l20nOpt) {
        if (avalon.type(l20nOpt) === 'string') {
            avalon.each(singletonCtxs.ctxArray, function(ctxid, msl20n) {
                setLocale(msl20n, {
                    initLocale: l20nOpt
                })
            })
        } else if (l20nOpt.ctxid === undefined) {
            avalon.each(singletonCtxs.ctxArray, function(ctxid, msl20n) {
                setLocale(msl20n, l20nOpt)
            })
        } else {
            var msl20n = singletonCtxs.getInstance(l20nOpt.ctxid, l20nOpt.initLocale, l20nOpt.manifestResource)
            setLocale(msl20n, l20nOpt)
        }

        function setLocale(msl20n, l20nOpt) {
            if (l20nOpt.initLocale === undefined) {
                msl20n.ctx.requestLocales()
            } else {
                msl20n.previousLocale = msl20n.currentLocale;

                if (l20nOpt.initLocale !== msl20n.previousLocale) {
                    msl20n.ctx.requestLocales(l20nOpt.initLocale);
                    msl20n.currentLocale = l20nOpt.initLocale;
                }
            }
        }
    };

    avalon.updateL20nData = function() {
        // var ctx = singleton(ctxid),
        //     event;

        // ctx.updateData.apply(msl20n.ctx, arguments);

        // event = document.createEvent('HTMLEvents');
        // event.initEvent('uiL20n:dataupdated', true, true);
        // document.dispatchEvent(event);
    };

    avalon.currentLocale = function(ctxid) {
        var ctx = singletonCtxs.getInstance(ctxid)
        return ctx.currentLocale;
    }

    // avalon.changeLocale = function(newLocale) {
    //     previousLocale = vm.currentLocale;
    //     vm.currentLocale = newLocale;

    //     if (vm.currentLocale !== previousLocale) {
    //         // localStorage.setItem(uiL20nServiceThis.localeStorageKey, locale);

    //         ctx.requestLocales(vm.currentLocale);

    //     }

    // }

    return avalon

})
