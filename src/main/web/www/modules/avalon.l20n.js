/**
 * @cnName avalon 封装 l20n 的国际化插件
 * @enName avalon l20n
 * @introduce
 *    <p></p>
 *  @updatetime 2015-07-12
 */
define(["l20n", "l20n/Intl", "l20n/platform/io", "avalon"], function(mzl20n, Intl, io, avalon) {
    'use strict';

    var rproxy = /(\$proxy\$[a-z]+)\d+$/
    var rstringLiteral = /(['"])(\\\1|.)+?\1/g
    var r11a = /\|\|/g

    var singletonCtxs = (function() {
        // {id1: {ctx: ctx1, currentLocale: <currentLocale>, previousLocale: <previousLocale>, manifestResource: <manifestResource>}, id2: {ctx: ctx2, currentLocale: <currentLocale>, , previousLocale: <previousLocale>, manifestResource: <manifestResource>}}
        var ctxArray = {};

        function init(ctxid, initLocale, manifestResource) {
            ctxArray[ctxid] = {};
            ctxArray[ctxid].ctx = mzl20n.getContext(ctxid);
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

    function getToken(value) {
        if (value.indexOf("|") > 0) {
            var scapegoat = value.replace(rstringLiteral, function(_) {
                return Array(_.length + 1).join("1") // jshint ignore:line
            })
            var index = scapegoat.replace(r11a, "\u1122\u3344").indexOf("|") //干掉所有短路或
            if (index > -1) {
                return {
                    filters: value.slice(index),
                    value: value.slice(0, index),
                    expr: true
                }
            }
        }
        return {
            value: value,
            filters: "",
            expr: true
        }
    }

    function scanExpr(str) {
        var tokens = [],
            openTag = '{{',
            closeTag = '}}',
            value, start = 0,
            stop
        do {
            stop = str.indexOf(openTag, start)
            if (stop === -1) {
                break
            }
            value = str.slice(start, stop)
            if (value) { // {{ 左边的文本
                tokens.push({
                    value: value,
                    filters: "",
                    expr: false
                })
            }
            start = stop + openTag.length
            stop = str.indexOf(closeTag, start)
            if (stop === -1) {
                break
            }
            value = str.slice(start, stop)
            if (value) { //处理{{ }}插值表达式
                tokens.push(getToken(value, start))
            }
            start = stop + closeTag.length
        } while (1)
        value = str.slice(start)
        if (value) { //}} 右边的文本
            tokens.push({
                value: value,
                expr: false,
                filters: ""
            })
        }
        return tokens
    }

    avalon.bindingHandlers.l20n = function(data, vmodels) {
        var el = data.element,
            msl20n, options, ctxid;
        vmodels.map(function(el) {
            if (el.$model.l20n) {
                ctxid = String(el.$id).replace(rproxy, "$1")
                options = el.$model.l20n

            }
            return el.$id
        })

        if (ctxid) {
            msl20n = singletonCtxs.getInstance(ctxid, options.initLocale, options.manifestResource);
            data.msl20n = msl20n;
            var l20nid = data.value;
            if (l20nid) {
                //debugger;
                var code;
                avalon.parseExprProxy(code, vmodels, data, scanExpr(l20nid));

                return;
            }


        }
    };

    // avalon 会在表达式计算的结果变化时（也可以认为是 View Model 里的属性产生变化时），触发此回调
    // val:也就是计算后的 css
    avalon.bindingExecutors.l20n = function(val, elem, data, vmodel) {
        console.log(data)
        if (data.oldVal === val) {
            return
        } else {
            data.oldVal = val
            data.msl20n.ctx.localize([val], function(l10n) {
                //todo 检测 options.id 是 {{}} 和过滤器，则提取值填充，
                elem.textContent = l10n.entities[val].value;
                elem.classList.remove('hidden');
            });
        }
        // if (data.oldVal == val) {
        //     return;
        // }
        // data.oldVa = val;
        // var styleElement = data.styleElement;
        // if (ie) {
        //     //setTimeout(function () {
        //     styleElement.cssText = val;
        //     //}, 0);
        // } else {
        //     //setTimeout(function () {
        //     styleElement.textContent = val;
        //     //}, 0);
        // }
        // var onchange = elem.onchange;
        // if (onchange)
        //     onchange.apply(elem, [val]);
    };


    avalon.l20nversion = '1.0.4' // 对应 l20n 版本号


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
