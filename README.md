# puppeterender

> ExpressJs middleware for rendering PWA to bots using Puppeteer

This is a middleware for ExpressJs that uses Puppeter for render the page requested by "indexing" bots (and not).

This is a fork of the [pupperender](https://github.com/LasaleFamine/pupperender) and [rendertron-middleware](https://www.npmjs.com/package/rendertron-middleware) but using [Puppeter](https://github.com/GoogleChrome/puppeteer) instead of [Rendertron](https://github.com/GoogleChrome/rendertron/), without needing another server to render the app. I have made some changes for my personal use (like removing the inject ShadyDOM option).

## Install

> NOTE: *Node >= 8.x is required.*

```
$ npm i https://github.com/inmoove/puppeterender
```

## Usage

```js
const express = require('express');
const pupperender = require('pupperender');

const app = express();

app.use(pupperender.makeMiddleware({}));

app.use(express.static('files'));
app.listen(8080);
```

## Configuration

Like [rendertron-middleware](https://www.npmjs.com/package/rendertron-middleware) I decided to expose a  `makeMiddleware` function that takes a configuration object with the following
properties:

| Property | Default | Description |
| -------- | ------- | ----------- |
| `userAgentPattern` | A set of known bots that benefit from pre-rendering. [Full list.](https://github.com/LasaleFamine/pupperender/blob/master/src/index.js) | RegExp for matching requests by User-Agent header. |
| `excludeUrlPattern` | A set of known static file extensions. [Full list.](https://github.com/LasaleFamine/pupperender/blob/master/src/index.js) | RegExp for excluding requests by the path component of the URL. |
| `timeout` | `11000` | Millisecond timeout for waiting the page to load. Used by Puppeter. See also the [Puppeter waitFor()](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforselectororfunctionortimeout-options-args) |
| `debug` | `false` | DEBUG flag to show some logs |
| `useCache` | `false` | If the puppeterized content should be cached to speed up subsequent requests. |
| `cacheTTL` | `3600` | Seconds until cached content is disregarded and puppeterized again. Only considered when `useCache` is `true`. |


## License

MIT © [LasaleFamine](https://godev.space)
