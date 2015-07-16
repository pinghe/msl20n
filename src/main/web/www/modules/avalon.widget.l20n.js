﻿/**
 * @cnName avalon 封装 l20n 的国际化插件
 * @enName avalon l20n
 * @introduce
 *    <p></p>
 *  @updatetime 2015-07-12
 */
define(["l20n", "l20n/Intl", "l20n/platform/io", "avalon"], function(MSL20n, Intl, io, avalon) {

    var singleton = (function() {
        // {id1: {ctx: ctx1, currentLocale: <currentLocale>, previousLocale: <previousLocale>, manifestResource: <manifestResource>}, id2: {ctx: ctx2, currentLocale: <currentLocale>, , previousLocale: <previousLocale>, manifestResource: <manifestResource>}}
        var ctxArray = {};

        function init(ctxid, initlocale, manifestResource) {
            ctxArray[ctxid] = {};
            ctxArray[ctxid].ctx = MSL20n.getContext(ctxid);
            initparam(ctxid, initlocale, manifestResource);
            return ctxArray[ctxid];
        }

        function initparam(ctxid, initlocale, manifestResource) {
            ctxArray[ctxid].currentLocale = initlocale || navigator.language || navigator.browserLanguage
            if (manifestResource !== undefined) {
                ctxArray[ctxid].manifestResource = manifestResource
                loadManifest(ctxArray[ctxid])
            };

        }
        return {
            getInstance: function(ctxid, initlocale, manifestResource) {
                return ctxArray[ctxid] || init(ctxid, initlocale, manifestResource);
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
            msl20n;

        msl20n = singleton.getInstance(options.ctxid, options.initlocale, options.manifestResource);

        var vmodel = avalon.define(data.l20nId, function(vm) {
            avalon.mix(vm, options) //这视情况使用浅拷贝或深拷贝avalon.mix(true, vm, options)
            vm.$init = function() { //初始化组件的界面，最好定义此方法，让框架对它进行自动化配置
                    avalon(element).addClass("ui-widget ui-widget-content ui-corner-all")

                    // ★★★设置动态模板，注意模块上所有占位符都以“MS_OPTION_XXX”形式实现
                    // msl20n.ctx.localize([options.id], function(l10n) {
                    //     element.textContent = l10n.entities[options.id].value;
                    //     element.classList.remove('hidden');
                    // });
                    msl20n.ctx.addEventListener('ready', function() {
                        // element.textContent = msl20n.ctx.getSync(options.id);
                        avalon(element).classList.remove('hidden');
                    });

                    // 注册全局locale切换响应事件
                    //todo
                }
                // vm.$remove = function() { //清空构成UI的所有节点，最好定义此方法，让框架对它进行自动化销毁
                //     }
                //其他属性与方法
            vm.changeLocaleLocal = function(newLocale) {
                msl20n.previousLocale = msl20n.currentLocale;
                msl20n.currentLocale = newLocale;

                if (msl20n.currentLocale !== previousLocale) {
                    // localStorage.setItem(uiL20nServiceThis.localeStorageKey, locale);
                    msl20n.ctx.requestLocales(msl20n.currentLocale);
                }
            }
            vm.changeLocaleGlobal = function(newLocale) {
                msl20n.previousLocale = msl20n.currentLocale;
                msl20n.currentLocale = newLocale;

                if (msl20n.currentLocale !== previousLocale) {
                    // localStorage.setItem(uiL20nServiceThis.localeStorageKey, locale);

                    msl20n.ctx.requestLocales(msl20n.currentLocale);

                }

            }


        })
        return vmodel //必须返回组件VM
    }

    widget.defaults = { //默认配置项
        id: "", // 国际化节点id,必须设置,在ms-widget元素属性中设置
        // ctxid: "", // 可以不设置，默认是 document.location.host, 在所属vm的options对象中设置
        // initlocale: navigator.language || navigator.browserLanguage, //页面初始打开时默认语言，未设置则为浏览器当前语言，在所属vm的options对象中设置
        // manifestResource: "", //加载国际化资源文件，必须设置， 在所属vm的options对象中设置
    }

    // vm.availableLocales = []
    avalon.requestLocales = function(l20nOpt) {
        var msl20n = singleton.getInstance(l20nOpt.ctxid, l20nOpt.initlocale, l20nOpt.manifestResource)
        if (l20nOpt.initlocale === undefined) {
            msl20n.ctx.requestLocales()
        } else {
            msl20n.ctx.requestLocales(l20nOpt.initlocale)

        }
    };

    avalon.updateL20nData = function() {
        var ctx = singleton(ctxid),
            event;

        ctx.updateData.apply(msl20n.ctx, arguments);

        event = document.createEvent('HTMLEvents');
        event.initEvent('uiL20n:dataupdated', true, true);
        document.dispatchEvent(event);
    };

    avalon.currentLocale = function(ctxid) {
        var ctx = singleton(ctxid)
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