/**
 * @cnName avalon 封装 l20n 的国际化插件
 * @enName l20n
 * @introduce
 *    <p></p>
 *  @updatetime 2015-07-12
 */
define(["L20n", "avalon"], function(MSL20n, avalon) {
    var widget = avalon.ui.l20n = function(element, data, vmodels) {
        var options = data.l20nOptions, //★★★取得配置项
            previousLocale;

        var vmodel = avalon.define(data.l20nId, function(vm) {
            avalon.mix(vm, options) //这视情况使用浅拷贝或深拷贝avalon.mix(true, vm, options)
            vm.$init = function() { //初始化组件的界面，最好定义此方法，让框架对它进行自动化配置
                avalon(element).addClass("ui-widget ui-widget-content ui-corner-all")

                var ctx = MSL20n.getContext(options.l20nctxid);

                    // ★★★设置动态模板，注意模块上所有占位符都以“MS_OPTION_XXX”形式实现
                ctx.linkResource(options.linkResource);
                ctx.localize(['hello', 'new'], function(l10n) {
                    var node = document.querySelector('[data-l10n-id=hello]');
                    node.textContent = l10n.entities.hello.value;
                    node.classList.remove('hidden');
                });
                var tablist = tabHTML
                    .replace("MS_OPTION_EVENT", vmodel.event)
                    .replace("MS_OPTION_REMOVABLE", vmodel.removable ? closeHTML : "")
                    //决定是重复利用已有的元素，还是通过ms-include-src引入新内部
                var contentType = options.contentType === "content" ? 0 : 1
                var panels = panelHTML.split("MS_OPTION_CONTENT")[contentType]
                element.innerHTML = vmodel.bottom ? panels + tablist : tablist + panels
                element.setAttribute("ms-class-1", "ui-tabs-collapsible:collapsible")
                element.setAttribute("ms-class-2", "tabs-bottom:bottom")
                avalon.scan(element, [vmodel].concat(vmodels))
                if (typeof vmodel.onInit === "function") {
                    vmodel.onInit.call(element, vmodel, options, vmodels)
                }

            }
            vm.$remove = function() { //清空构成UI的所有节点，最好定义此方法，让框架对它进行自动化销毁
                    element.innerHTML = ""
                }
                //其他属性与方法
            vm.availableLocales = []
            vm.currentLocale = ""
            vm.changeLocale = function() {
                previousLocale = currentLocale;
                uiL20nServiceThis.localeStorage = newLocale;

                if (uiL20nServiceThis.localeStorage !== previousLocale) {
                    // localStorage.setItem(uiL20nServiceThis.localeStorageKey, locale);

                    documentL10n.requestLocales(uiL20nServiceThis.localeStorage);

                    // Set the $rootScope property only if provided.
                    if (uiL20nServiceThis.rootScopeLocaleProperty) {
                        // The locale needs to be set on the `ready` event since `requestLocales`
                        // can be asynchronous. We can't just use `documentL10n.ready`, though
                        // as context once marked ready is never unmarked as such. :-(
                        // Thus, we have to register the handler before the `requestLocale`
                        // invocation; otherwise we have no way of knowing if the event already
                        // fired.
                        documentL10n.removeEventListener('ready', setRootScopeLocale);
                        documentL10n.addEventListener('ready', setRootScopeLocale);
                    }

                }

                function setRootScopeLocale() {
                    $timeout(function() {
                        documentL10n.removeEventListener('ready', setRootScopeLocale);
                        $rootScope[uiL20nServiceThis.rootScopeLocaleProperty] = uiL20nServiceThis.localeStorage;
                    });
                }
            }
            vm.updateData = function() {
                var event;

                MSL20n.updateData.apply(MSL20n, arguments);

                event = document.createEvent('HTMLEvents');
                event.initEvent('uiL20n:dataupdated', true, true);
                document.dispatchEvent(event);
            }
        })
        return vmodel //必须返回组件VM
    }
    widget.defaults = { //默认配置项
        l20nctxid: "", // 可以不设置，默认是 document.location.host
        l20nId: "", // 国际化节点id
        initlocale: navigator.language || navigator.browserLanguage, //页面初始打开时默认语言，未设置则为浏览器当前语言
        linkResource: "", //加载国际化资源文件，必须设置
        // event: "click", //切换面板的事件，移过(mouseenter)还是点击(click)
    }
    return avalon

})
