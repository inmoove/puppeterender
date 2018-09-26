/* jshint esversion: 6 */
const puppeteer = require('puppeteer');
const cacheManager = require('cache-manager');
const fsStore = require('cache-manager-fs');

/**
 * Log if DEBUG flag was passed
 * @param {Boolean} DEBUG
 * @param {string} msg
 */
const logger = (DEBUG, msg) =>
	DEBUG ? console.info(msg) : null;

/**
 * A default set of user agent patterns for bots/crawlers that do not perform
 * well with pages that require JavaScript.
 */
const botUserAgents = [
	'W3C_Validator',
	'baiduspider',
	'bingbot',
	'embedly',
	'facebookexternalhit',
	'linkedinbo',
	'outbrain',
	'pinterest',
	'quora link preview',
	'rogerbo',
	'showyoubot',
	'slackbot',
	'twitterbot',
	'vkShare',
	'Validator.nu/LV',
	'googlebot',
	'yahoo',
	'bingbot',
	'rogerbot',
	'linkedinbot',
	'embedly',
	'quora link preview',
	'pinterest/0.',
	'developers.google.com/+/web/snippet',
	'redditbot',
	'Applebot',
	'WhatsApp',
	'flipboard',
	'tumblr',
	'bitlybot',
	'SkypeUriPreview',
	'nuzzel',
	'Discordbot',
	'Google Page Speed',
	'Qwantify',
	'pinterestbot',
	'Bitrix link preview',
	'XING-contenttabreceiver'
];

module.exports.botUserAgents = botUserAgents;

/* eslint-disable no-multi-spaces */

/**
 * A default set of file extensions for static assets that do not need to be
 * proxied.
 */
const staticFileExtensions = [
	'ai',  'avi',  'css', 'dat',  'dmg', 'doc',     'doc',  'exe', 'flv',
	'gif', 'ico',  'iso', 'jpeg', 'jpg', 'js',      'less', 'm4a', 'm4v',
	'mov', 'mp3',  'mp4', 'mpeg', 'mpg', 'pdf',     'png',  'ppt', 'psd',
	'rar', 'rss',  'svg', 'swf',  'tif', 'torrent', 'ttf',  'txt', 'wav',
	'wmv', 'woff', 'xls', 'xml',  'zip'
];

const puppeterender = async (url, timeout) => {
	const browser = await puppeteer.launch({args: ['--headless', '--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.goto(url, {waitUntil: 'networkidle0'});
	await page.waitFor(timeout);
	const content = await page.content();
	await browser.close();
	return content;
};

const cache = {};

module.exports.makeMiddleware = options => {
	const DEBUG = options.debug || false;
	const timeout = options.timeout || 30000; // ms
	const useCache = Boolean(options.useCache || true);
	const cache = cacheManager.caching({
		store: options.cacheStore || fsStore, //'memory'
		options: {
			ttl: (options.cacheTTL || (3600 * 60 * 24 * 365)) * 1000 /* seconds */,
			maxsize: options.cacheMaxSize || 0 /* max size in bytes on disk */,
			path: options.cachePath || 'diskcache',
			preventfill: Boolean(options.cachePreventFill || false)
		}
	});

	const userAgentPattern = options.userAgentPattern || new RegExp(botUserAgents.join('|'), 'i');
	const excludeUrlPattern = options.excludeUrlPattern || new RegExp(`\\.(${staticFileExtensions.join('|')})$`, 'i');

	return function (req, res, next) {
		if (!userAgentPattern.test(req.headers['user-agent']) || excludeUrlPattern.test(req.path)) {
			return next();
		}

		logger(DEBUG, `[puppeterender middleware] User Agent: ${req.headers['user-agent']}`);
		const incomingUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		const reload = false;
		logger(DEBUG, `[puppeterender middleware] puppeterize url: ${incomingUrl}`);

		if (useCache) {
			cache.get(incomingUrl, (err, result) => {
				if (!err && result) {
					if (reload) {
						cache.del(req.prerender.url, (err, result) => {
							return next();
						});
					} else {
						logger(DEBUG, `[puppeterender middleware] Cache hit for ${incomingUrl}.`);
						res.set('Puppeterender', 'true');
						res.send(cache[incomingUrl].data);
						return;
					}
				} else {
					return next();
				}
			});
		} else {
			puppeterender(incomingUrl, timeout)
				.then(content => { // eslint-disable-line promise/prefer-await-to-then
					cache.set(incomingUrl, content);
					logger(DEBUG, `[puppeterender middleware] Cache warmed for ${incomingUrl}.`);
					res.set('puppeterender', 'true');
					res.send(content);
				})
				.catch(err => {
					console.error(`[puppeterender middleware] error fetching ${incomingUrl}`, err);
					return next();
				});
		}
	};
};
