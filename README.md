# i18n-interpolator

使用JavaScript实现的i18n转自然语言，可以在前端使用，前端渲染

```javascript
import Interpolator from "./interpolator.js";

const username = "Alice";
const I18nEnabledMessage = '<h1>${i18n("GREETING", {name: "' + username + '"})}</h1>';

const interpolator = new Interpolator({
    'default': {
        "GREETING": "你好, ${name}"
    },
    'en-US': {
        "GREETING": "Hello, ${name}"
    },
});

["zh-CN", "en-US"].forEach((targetLanguage) => {
    interpolator.setLanguage(targetLanguage);
    console.log(interpolator.interpolate({
        html: I18nEnabledMessage,
    }));
})


// Output:
// { html: '<h1>你好, Alice</h1>' }
// { html: '<h1>Hello, Alice</h1>' }
```
