# msl20n
基于 mozilla l20n 国际化组件封装的 avalon 国际化插件

# l20n 简介及设计考虑
l20n 是 mozilla 开发的一个国际化组件，相比其它国际化组件，更具灵活性，国际化内容可以根据屏幕大小等决定呈现的内容。

1. 首先调用 getcontext(id) 获取 context 实例，全局唯一。封装到 avalon 考虑对应 vm 可设定独立的 context，适应多语言同时呈现的情况
1. 设定该 context 的国际化资源文件，通过 manifest 文件设定

  ```JavaScript
  {
    "locales": [
        "en-US",
        "pl",
        "zh-CN"
    ],
    "default_locale": "en-US",
    "resources": [
        "./{{locale}}.l20n"
    ]
  }
  ```
1. 在整个页面完成后，通过 requestLocales 进行语言切换
1. ms-widget 设定 data-l20n-id 对应国际化资源文件 key


[sdgsdg](http://sdg.com)

[sdgsd](http://sdgdsg "sdgsdg===")
