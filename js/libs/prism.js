/* PrismJS 1.19.0
https://prismjs.com/download.html#themes=prism-twilight&languages=markup+css+clike+javascript+bash+git+java+javadoclike+jq+markup-templating+php+python+sass+scss+sql+typescript&plugins=line-numbers */
var _self =
	typeof window !== "undefined"
		? window // if in browser
		: typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope
		? self // if in worker
		: {}; // if in node js

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function(_self) {
	// Private helper vars
	var lang = /\blang(?:uage)?-([\w-]+)\b/i;
	var uniqueId = 0;

	var _ = {
		manual: _self.Prism && _self.Prism.manual,
		disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
		util: {
			encode: function encode(tokens) {
				if (tokens instanceof Token) {
					return new Token(tokens.type, encode(tokens.content), tokens.alias);
				} else if (Array.isArray(tokens)) {
					return tokens.map(encode);
				} else {
					return tokens
						.replace(/&/g, "&amp;")
						.replace(/</g, "&lt;")
						.replace(/\u00a0/g, " ");
				}
			},

			type: function(o) {
				return Object.prototype.toString.call(o).slice(8, -1);
			},

			objId: function(obj) {
				if (!obj["__id"]) {
					Object.defineProperty(obj, "__id", { value: ++uniqueId });
				}
				return obj["__id"];
			},

			// Deep clone a language definition (e.g. to extend it)
			clone: function deepClone(o, visited) {
				var clone,
					id,
					type = _.util.type(o);
				visited = visited || {};

				switch (type) {
					case "Object":
						id = _.util.objId(o);
						if (visited[id]) {
							return visited[id];
						}
						clone = {};
						visited[id] = clone;

						for (var key in o) {
							if (o.hasOwnProperty(key)) {
								clone[key] = deepClone(o[key], visited);
							}
						}

						return clone;

					case "Array":
						id = _.util.objId(o);
						if (visited[id]) {
							return visited[id];
						}
						clone = [];
						visited[id] = clone;

						o.forEach(function(v, i) {
							clone[i] = deepClone(v, visited);
						});

						return clone;

					default:
						return o;
				}
			},

			/**
			 * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
			 *
			 * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
			 *
			 * @param {Element} element
			 * @returns {string}
			 */
			getLanguage: function(element) {
				while (element && !lang.test(element.className)) {
					element = element.parentElement;
				}
				if (element) {
					return (element.className.match(lang) || [, "none"])[1].toLowerCase();
				}
				return "none";
			},

			/**
			 * Returns the script element that is currently executing.
			 *
			 * This does __not__ work for line script element.
			 *
			 * @returns {HTMLScriptElement | null}
			 */
			currentScript: function() {
				if (typeof document === "undefined") {
					return null;
				}
				if ("currentScript" in document) {
					return document.currentScript;
				}

				// IE11 workaround
				// we'll get the src of the current script by parsing IE11's error stack trace
				// this will not work for inline scripts

				try {
					throw new Error();
				} catch (err) {
					// Get file src url from stack. Specifically works with the format of stack traces in IE.
					// A stack will look like this:
					//
					// Error
					//    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
					//    at Global code (http://localhost/components/prism-core.js:606:1)

					var src = (/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(err.stack) || [])[1];
					if (src) {
						var scripts = document.getElementsByTagName("script");
						for (var i in scripts) {
							if (scripts[i].src == src) {
								return scripts[i];
							}
						}
					}
					return null;
				}
			}
		},

		languages: {
			extend: function(id, redef) {
				var lang = _.util.clone(_.languages[id]);

				for (var key in redef) {
					lang[key] = redef[key];
				}

				return lang;
			},

			/**
			 * Insert a token before another token in a language literal
			 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
			 * we cannot just provide an object, we need an object and a key.
			 * @param inside The key (or language id) of the parent
			 * @param before The key to insert before.
			 * @param insert Object with the key/value pairs to insert
			 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
			 */
			insertBefore: function(inside, before, insert, root) {
				root = root || _.languages;
				var grammar = root[inside];
				var ret = {};

				for (var token in grammar) {
					if (grammar.hasOwnProperty(token)) {
						if (token == before) {
							for (var newToken in insert) {
								if (insert.hasOwnProperty(newToken)) {
									ret[newToken] = insert[newToken];
								}
							}
						}

						// Do not insert token which also occur in insert. See #1525
						if (!insert.hasOwnProperty(token)) {
							ret[token] = grammar[token];
						}
					}
				}

				var old = root[inside];
				root[inside] = ret;

				// Update references in other language definitions
				_.languages.DFS(_.languages, function(key, value) {
					if (value === old && key != inside) {
						this[key] = ret;
					}
				});

				return ret;
			},

			// Traverse a language definition with Depth First Search
			DFS: function DFS(o, callback, type, visited) {
				visited = visited || {};

				var objId = _.util.objId;

				for (var i in o) {
					if (o.hasOwnProperty(i)) {
						callback.call(o, i, o[i], type || i);

						var property = o[i],
							propertyType = _.util.type(property);

						if (propertyType === "Object" && !visited[objId(property)]) {
							visited[objId(property)] = true;
							DFS(property, callback, null, visited);
						} else if (propertyType === "Array" && !visited[objId(property)]) {
							visited[objId(property)] = true;
							DFS(property, callback, i, visited);
						}
					}
				}
			}
		},
		plugins: {},

		highlightAll: function(async, callback) {
			_.highlightAllUnder(document, async, callback);
		},

		highlightAllUnder: function(container, async, callback) {
			var env = {
				callback: callback,
				container: container,
				selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
			};

			_.hooks.run("before-highlightall", env);

			env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

			_.hooks.run("before-all-elements-highlight", env);

			for (var i = 0, element; (element = env.elements[i++]); ) {
				_.highlightElement(element, async === true, env.callback);
			}
		},

		highlightElement: function(element, async, callback) {
			// Find language
			var language = _.util.getLanguage(element);
			var grammar = _.languages[language];

			// Set language on the element, if not present
			element.className = element.className.replace(lang, "").replace(/\s+/g, " ") + " language-" + language;

			// Set language on the parent, for styling
			var parent = element.parentNode;
			if (parent && parent.nodeName.toLowerCase() === "pre") {
				parent.className = parent.className.replace(lang, "").replace(/\s+/g, " ") + " language-" + language;
			}

			var code = element.textContent;

			var env = {
				element: element,
				language: language,
				grammar: grammar,
				code: code
			};

			function insertHighlightedCode(highlightedCode) {
				env.highlightedCode = highlightedCode;

				_.hooks.run("before-insert", env);

				env.element.innerHTML = env.highlightedCode;

				_.hooks.run("after-highlight", env);
				_.hooks.run("complete", env);
				callback && callback.call(env.element);
			}

			_.hooks.run("before-sanity-check", env);

			if (!env.code) {
				_.hooks.run("complete", env);
				callback && callback.call(env.element);
				return;
			}

			_.hooks.run("before-highlight", env);

			if (!env.grammar) {
				insertHighlightedCode(_.util.encode(env.code));
				return;
			}

			if (async && _self.Worker) {
				var worker = new Worker(_.filename);

				worker.onmessage = function(evt) {
					insertHighlightedCode(evt.data);
				};

				worker.postMessage(
					JSON.stringify({
						language: env.language,
						code: env.code,
						immediateClose: true
					})
				);
			} else {
				insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
			}
		},

		highlight: function(text, grammar, language) {
			var env = {
				code: text,
				grammar: grammar,
				language: language
			};
			_.hooks.run("before-tokenize", env);
			env.tokens = _.tokenize(env.code, env.grammar);
			_.hooks.run("after-tokenize", env);
			return Token.stringify(_.util.encode(env.tokens), env.language);
		},

		matchGrammar: function(text, strarr, grammar, index, startPos, oneshot, target) {
			for (var token in grammar) {
				if (!grammar.hasOwnProperty(token) || !grammar[token]) {
					continue;
				}

				var patterns = grammar[token];
				patterns = Array.isArray(patterns) ? patterns : [patterns];

				for (var j = 0; j < patterns.length; ++j) {
					if (target && target == token + "," + j) {
						return;
					}

					var pattern = patterns[j],
						inside = pattern.inside,
						lookbehind = !!pattern.lookbehind,
						greedy = !!pattern.greedy,
						lookbehindLength = 0,
						alias = pattern.alias;

					if (greedy && !pattern.pattern.global) {
						// Without the global flag, lastIndex won't work
						var flags = pattern.pattern.toString().match(/[imsuy]*$/)[0];
						pattern.pattern = RegExp(pattern.pattern.source, flags + "g");
					}

					pattern = pattern.pattern || pattern;

					// Don’t cache length as it changes during the loop
					for (var i = index, pos = startPos; i < strarr.length; pos += strarr[i].length, ++i) {
						var str = strarr[i];

						if (strarr.length > text.length) {
							// Something went terribly wrong, ABORT, ABORT!
							return;
						}

						if (str instanceof Token) {
							continue;
						}

						if (greedy && i != strarr.length - 1) {
							pattern.lastIndex = pos;
							var match = pattern.exec(text);
							if (!match) {
								break;
							}

							var from = match.index + (lookbehind && match[1] ? match[1].length : 0),
								to = match.index + match[0].length,
								k = i,
								p = pos;

							for (var len = strarr.length; k < len && (p < to || (!strarr[k].type && !strarr[k - 1].greedy)); ++k) {
								p += strarr[k].length;
								// Move the index i to the element in strarr that is closest to from
								if (from >= p) {
									++i;
									pos = p;
								}
							}

							// If strarr[i] is a Token, then the match starts inside another Token, which is invalid
							if (strarr[i] instanceof Token) {
								continue;
							}

							// Number of tokens to delete and replace with the new match
							delNum = k - i;
							str = text.slice(pos, p);
							match.index -= pos;
						} else {
							pattern.lastIndex = 0;

							var match = pattern.exec(str),
								delNum = 1;
						}

						if (!match) {
							if (oneshot) {
								break;
							}

							continue;
						}

						if (lookbehind) {
							lookbehindLength = match[1] ? match[1].length : 0;
						}

						var from = match.index + lookbehindLength,
							match = match[0].slice(lookbehindLength),
							to = from + match.length,
							before = str.slice(0, from),
							after = str.slice(to);

						var args = [i, delNum];

						if (before) {
							++i;
							pos += before.length;
							args.push(before);
						}

						var wrapped = new Token(token, inside ? _.tokenize(match, inside) : match, alias, match, greedy);

						args.push(wrapped);

						if (after) {
							args.push(after);
						}

						Array.prototype.splice.apply(strarr, args);

						if (delNum != 1) _.matchGrammar(text, strarr, grammar, i, pos, true, token + "," + j);

						if (oneshot) break;
					}
				}
			}
		},

		tokenize: function(text, grammar) {
			var strarr = [text];

			var rest = grammar.rest;

			if (rest) {
				for (var token in rest) {
					grammar[token] = rest[token];
				}

				delete grammar.rest;
			}

			_.matchGrammar(text, strarr, grammar, 0, 0, false);

			return strarr;
		},

		hooks: {
			all: {},

			add: function(name, callback) {
				var hooks = _.hooks.all;

				hooks[name] = hooks[name] || [];

				hooks[name].push(callback);
			},

			run: function(name, env) {
				var callbacks = _.hooks.all[name];

				if (!callbacks || !callbacks.length) {
					return;
				}

				for (var i = 0, callback; (callback = callbacks[i++]); ) {
					callback(env);
				}
			}
		},

		Token: Token
	};

	_self.Prism = _;

	function Token(type, content, alias, matchedStr, greedy) {
		this.type = type;
		this.content = content;
		this.alias = alias;
		// Copy of the full string this token was created from
		this.length = (matchedStr || "").length | 0;
		this.greedy = !!greedy;
	}

	Token.stringify = function stringify(o, language) {
		if (typeof o == "string") {
			return o;
		}
		if (Array.isArray(o)) {
			var s = "";
			o.forEach(function(e) {
				s += stringify(e, language);
			});
			return s;
		}

		var env = {
			type: o.type,
			content: stringify(o.content, language),
			tag: "span",
			classes: ["token", o.type],
			attributes: {},
			language: language
		};

		var aliases = o.alias;
		if (aliases) {
			if (Array.isArray(aliases)) {
				Array.prototype.push.apply(env.classes, aliases);
			} else {
				env.classes.push(aliases);
			}
		}

		_.hooks.run("wrap", env);

		var attributes = "";
		for (var name in env.attributes) {
			attributes += " " + name + '="' + (env.attributes[name] || "").replace(/"/g, "&quot;") + '"';
		}

		return "<" + env.tag + ' class="' + env.classes.join(" ") + '"' + attributes + ">" + env.content + "</" + env.tag + ">";
	};

	if (!_self.document) {
		if (!_self.addEventListener) {
			// in Node.js
			return _;
		}

		if (!_.disableWorkerMessageHandler) {
			// In worker
			_self.addEventListener(
				"message",
				function(evt) {
					var message = JSON.parse(evt.data),
						lang = message.language,
						code = message.code,
						immediateClose = message.immediateClose;

					_self.postMessage(_.highlight(code, _.languages[lang], lang));
					if (immediateClose) {
						_self.close();
					}
				},
				false
			);
		}

		return _;
	}

	//Get current script and highlight
	var script = _.util.currentScript();

	if (script) {
		_.filename = script.src;

		if (script.hasAttribute("data-manual")) {
			_.manual = true;
		}
	}

	function highlightAutomaticallyCallback() {
		if (!_.manual) {
			_.highlightAll();
		}
	}

	if (!_.manual) {
		// If the document state is "loading", then we'll use DOMContentLoaded.
		// If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
		// DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
		// might take longer one animation frame to execute which can create a race condition where only some plugins have
		// been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
		// See https://github.com/PrismJS/prism/issues/2102
		var readyState = document.readyState;
		if (readyState === "loading" || (readyState === "interactive" && script && script.defer)) {
			document.addEventListener("DOMContentLoaded", highlightAutomaticallyCallback);
		} else {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(highlightAutomaticallyCallback);
			} else {
				window.setTimeout(highlightAutomaticallyCallback, 16);
			}
		}
	}

	return _;
})(_self);

if (typeof module !== "undefined" && module.exports) {
	module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== "undefined") {
	global.Prism = Prism;
}
Prism.languages.markup = {
	comment: /<!--[\s\S]*?-->/,
	prolog: /<\?[\s\S]+?\?>/,
	doctype: {
		pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:(?!<!--)[^"'\]]|"[^"]*"|'[^']*'|<!--[\s\S]*?-->)*\]\s*)?>/i,
		greedy: true
	},
	cdata: /<!\[CDATA\[[\s\S]*?]]>/i,
	tag: {
		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/i,
		greedy: true,
		inside: {
			tag: {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					punctuation: /^<\/?/,
					namespace: /^[^\s>\/:]+:/
				}
			},
			"attr-value": {
				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
				inside: {
					punctuation: [
						/^=/,
						{
							pattern: /^(\s*)["']|["']$/,
							lookbehind: true
						}
					]
				}
			},
			punctuation: /\/?>/,
			"attr-name": {
				pattern: /[^\s>\/]+/,
				inside: {
					namespace: /^[^\s>\/:]+:/
				}
			}
		}
	},
	entity: /&#?[\da-z]{1,8};/i
};

Prism.languages.markup["tag"].inside["attr-value"].inside["entity"] = Prism.languages.markup["entity"];

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add("wrap", function(env) {
	if (env.type === "entity") {
		env.attributes["title"] = env.content.replace(/&amp;/, "&");
	}
});

Object.defineProperty(Prism.languages.markup.tag, "addInlined", {
	/**
	 * Adds an inlined language to markup.
	 *
	 * An example of an inlined language is CSS with `<style>` tags.
	 *
	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
	 * case insensitive.
	 * @param {string} lang The language key.
	 * @example
	 * addInlined('style', 'css');
	 */
	value: function addInlined(tagName, lang) {
		var includedCdataInside = {};
		includedCdataInside["language-" + lang] = {
			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
			lookbehind: true,
			inside: Prism.languages[lang]
		};
		includedCdataInside["cdata"] = /^<!\[CDATA\[|\]\]>$/i;

		var inside = {
			"included-cdata": {
				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
				inside: includedCdataInside
			}
		};
		inside["language-" + lang] = {
			pattern: /[\s\S]+/,
			inside: Prism.languages[lang]
		};

		var def = {};
		def[tagName] = {
			pattern: RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[[\s\S]*?\]\]>\s*|[\s\S])*?(?=<\/__>)/.source.replace(/__/g, tagName), "i"),
			lookbehind: true,
			greedy: true,
			inside: inside
		};

		Prism.languages.insertBefore("markup", "cdata", def);
	}
});

Prism.languages.xml = Prism.languages.extend("markup", {});
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

(function(Prism) {
	var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;

	Prism.languages.css = {
		comment: /\/\*[\s\S]*?\*\//,
		atrule: {
			pattern: /@[\w-]+[\s\S]*?(?:;|(?=\s*\{))/,
			inside: {
				rule: /^@[\w-]+/,
				"selector-function-argument": {
					pattern: /(\bselector\s*\((?!\s*\))\s*)(?:[^()]|\((?:[^()]|\([^()]*\))*\))+?(?=\s*\))/,
					lookbehind: true,
					alias: "selector"
				}
				// See rest below
			}
		},
		url: {
			pattern: RegExp("url\\((?:" + string.source + "|[^\n\r()]*)\\)", "i"),
			inside: {
				function: /^url/i,
				punctuation: /^\(|\)$/
			}
		},
		selector: RegExp("[^{}\\s](?:[^{};\"']|" + string.source + ")*?(?=\\s*\\{)"),
		string: {
			pattern: string,
			greedy: true
		},
		property: /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
		important: /!important\b/i,
		function: /[-a-z0-9]+(?=\()/i,
		punctuation: /[(){};:,]/
	};

	Prism.languages.css["atrule"].inside.rest = Prism.languages.css;

	var markup = Prism.languages.markup;
	if (markup) {
		markup.tag.addInlined("style", "css");

		Prism.languages.insertBefore(
			"inside",
			"attr-value",
			{
				"style-attr": {
					pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
					inside: {
						"attr-name": {
							pattern: /^\s*style/i,
							inside: markup.tag.inside
						},
						punctuation: /^\s*=\s*['"]|['"]\s*$/,
						"attr-value": {
							pattern: /.+/i,
							inside: Prism.languages.css
						}
					},
					alias: "language-css"
				}
			},
			markup.tag
		);
	}
})(Prism);

Prism.languages.clike = {
	comment: [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	string: {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	"class-name": {
		pattern: /(\b(?:class|interface|extends|implements|trait|instanceof|new)\s+|\bcatch\s+\()[\w.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /[.\\]/
		}
	},
	keyword: /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	boolean: /\b(?:true|false)\b/,
	function: /\w+(?=\()/,
	number: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
	operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
	punctuation: /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend("clike", {
	"class-name": [
		Prism.languages.clike["class-name"],
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
			lookbehind: true
		}
	],
	keyword: [
		{
			pattern: /((?:^|})\s*)(?:catch|finally)\b/,
			lookbehind: true
		},
		{
			pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
			lookbehind: true
		}
	],
	number: /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	function: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
	operator: /--|\+\+|\*\*=?|=>|&&|\|\||[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?[.?]?|[~:]/
});

Prism.languages.javascript["class-name"][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore("javascript", "keyword", {
	regex: {
		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=(?:\s|\/\*[\s\S]*?\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
		lookbehind: true,
		greedy: true
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	"function-variable": {
		pattern: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
		alias: "function"
	},
	parameter: [
		{
			pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
			inside: Prism.languages.javascript
		},
		{
			pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		}
	],
	constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore("javascript", "string", {
	"template-string": {
		pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
		greedy: true,
		inside: {
			"template-punctuation": {
				pattern: /^`|`$/,
				alias: "string"
			},
			interpolation: {
				pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
				lookbehind: true,
				inside: {
					"interpolation-punctuation": {
						pattern: /^\${|}$/,
						alias: "punctuation"
					},
					rest: Prism.languages.javascript
				}
			},
			string: /[\s\S]+/
		}
	}
});

if (Prism.languages.markup) {
	Prism.languages.markup.tag.addInlined("script", "javascript");
}

Prism.languages.js = Prism.languages.javascript;

(function(Prism) {
	// $ set | grep '^[A-Z][^[:space:]]*=' | cut -d= -f1 | tr '\n' '|'
	// + LC_ALL, RANDOM, REPLY, SECONDS.
	// + make sure PS1..4 are here as they are not always set,
	// - some useless things.
	var envVars =
		"\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b";
	var insideString = {
		environment: {
			pattern: RegExp("\\$" + envVars),
			alias: "constant"
		},
		variable: [
			// [0]: Arithmetic Environment
			{
				pattern: /\$?\(\([\s\S]+?\)\)/,
				greedy: true,
				inside: {
					// If there is a $ sign at the beginning highlight $(( and )) as variable
					variable: [
						{
							pattern: /(^\$\(\([\s\S]+)\)\)/,
							lookbehind: true
						},
						/^\$\(\(/
					],
					number: /\b0x[\dA-Fa-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee]-?\d+)?/,
					// Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
					operator: /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
					// If there is no $ sign at the beginning highlight (( and )) as punctuation
					punctuation: /\(\(?|\)\)?|,|;/
				}
			},
			// [1]: Command Substitution
			{
				pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
				greedy: true,
				inside: {
					variable: /^\$\(|^`|\)$|`$/
				}
			},
			// [2]: Brace expansion
			{
				pattern: /\$\{[^}]+\}/,
				greedy: true,
				inside: {
					operator: /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
					punctuation: /[\[\]]/,
					environment: {
						pattern: RegExp("(\\{)" + envVars),
						lookbehind: true,
						alias: "constant"
					}
				}
			},
			/\$(?:\w+|[#?*!@$])/
		],
		// Escape sequences from echo and printf's manuals, and escaped quotes.
		entity: /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})/
	};

	Prism.languages.bash = {
		shebang: {
			pattern: /^#!\s*\/.*/,
			alias: "important"
		},
		comment: {
			pattern: /(^|[^"{\\$])#.*/,
			lookbehind: true
		},
		"function-name": [
			// a) function foo {
			// b) foo() {
			// c) function foo() {
			// but not “foo {”
			{
				// a) and c)
				pattern: /(\bfunction\s+)\w+(?=(?:\s*\(?:\s*\))?\s*\{)/,
				lookbehind: true,
				alias: "function"
			},
			{
				// b)
				pattern: /\b\w+(?=\s*\(\s*\)\s*\{)/,
				alias: "function"
			}
		],
		// Highlight variable names as variables in for and select beginnings.
		"for-or-select": {
			pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
			alias: "variable",
			lookbehind: true
		},
		// Highlight variable names as variables in the left-hand part
		// of assignments (“=” and “+=”).
		"assign-left": {
			pattern: /(^|[\s;|&]|[<>]\()\w+(?=\+?=)/,
			inside: {
				environment: {
					pattern: RegExp("(^|[\\s;|&]|[<>]\\()" + envVars),
					lookbehind: true,
					alias: "constant"
				}
			},
			alias: "variable",
			lookbehind: true
		},
		string: [
			// Support for Here-documents https://en.wikipedia.org/wiki/Here_document
			{
				pattern: /((?:^|[^<])<<-?\s*)(\w+?)\s*(?:\r?\n|\r)[\s\S]*?(?:\r?\n|\r)\2/,
				lookbehind: true,
				greedy: true,
				inside: insideString
			},
			// Here-document with quotes around the tag
			// → No expansion (so no “inside”).
			{
				pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s*(?:\r?\n|\r)[\s\S]*?(?:\r?\n|\r)\3/,
				lookbehind: true,
				greedy: true
			},
			// “Normal” string
			{
				pattern: /(["'])(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/,
				greedy: true,
				inside: insideString
			}
		],
		environment: {
			pattern: RegExp("\\$?" + envVars),
			alias: "constant"
		},
		variable: insideString.variable,
		function: {
			pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|aptitude|apt-cache|apt-get|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
			lookbehind: true
		},
		keyword: {
			pattern: /(^|[\s;|&]|[<>]\()(?:if|then|else|elif|fi|for|while|in|case|esac|function|select|do|done|until)(?=$|[)\s;|&])/,
			lookbehind: true
		},
		// https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
		builtin: {
			pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|break|cd|continue|eval|exec|exit|export|getopts|hash|pwd|readonly|return|shift|test|times|trap|umask|unset|alias|bind|builtin|caller|command|declare|echo|enable|help|let|local|logout|mapfile|printf|read|readarray|source|type|typeset|ulimit|unalias|set|shopt)(?=$|[)\s;|&])/,
			lookbehind: true,
			// Alias added to make those easier to distinguish from strings.
			alias: "class-name"
		},
		boolean: {
			pattern: /(^|[\s;|&]|[<>]\()(?:true|false)(?=$|[)\s;|&])/,
			lookbehind: true
		},
		"file-descriptor": {
			pattern: /\B&\d\b/,
			alias: "important"
		},
		operator: {
			// Lots of redirections here, but not just that.
			pattern: /\d?<>|>\||\+=|==?|!=?|=~|<<[<-]?|[&\d]?>>|\d?[<>]&?|&[>&]?|\|[&|]?|<=?|>=?/,
			inside: {
				"file-descriptor": {
					pattern: /^\d/,
					alias: "important"
				}
			}
		},
		punctuation: /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
		number: {
			pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
			lookbehind: true
		}
	};

	/* Patterns in command substitution. */
	var toBeCopied = [
		"comment",
		"function-name",
		"for-or-select",
		"assign-left",
		"string",
		"environment",
		"function",
		"keyword",
		"builtin",
		"boolean",
		"file-descriptor",
		"operator",
		"punctuation",
		"number"
	];
	var inside = insideString.variable[1].inside;
	for (var i = 0; i < toBeCopied.length; i++) {
		inside[toBeCopied[i]] = Prism.languages.bash[toBeCopied[i]];
	}

	Prism.languages.shell = Prism.languages.bash;
})(Prism);

Prism.languages.git = {
	/*
	 * A simple one line comment like in a git status command
	 * For instance:
	 * $ git status
	 * # On branch infinite-scroll
	 * # Your branch and 'origin/sharedBranches/frontendTeam/infinite-scroll' have diverged,
	 * # and have 1 and 2 different commits each, respectively.
	 * nothing to commit (working directory clean)
	 */
	comment: /^#.*/m,

	/*
	 * Regexp to match the changed lines in a git diff output. Check the example below.
	 */
	deleted: /^[-–].*/m,
	inserted: /^\+.*/m,

	/*
	 * a string (double and simple quote)
	 */
	string: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/m,

	/*
	 * a git command. It starts with a random prompt finishing by a $, then "git" then some other parameters
	 * For instance:
	 * $ git add file.txt
	 */
	command: {
		pattern: /^.*\$ git .*$/m,
		inside: {
			/*
			 * A git command can contain a parameter starting by a single or a double dash followed by a string
			 * For instance:
			 * $ git diff --cached
			 * $ git log -p
			 */
			parameter: /\s--?\w+/m
		}
	},

	/*
	 * Coordinates displayed in a git diff command
	 * For instance:
	 * $ git diff
	 * diff --git file.txt file.txt
	 * index 6214953..1d54a52 100644
	 * --- file.txt
	 * +++ file.txt
	 * @@ -1 +1,2 @@
	 * -Here's my tetx file
	 * +Here's my text file
	 * +And this is the second line
	 */
	coord: /^@@.*@@$/m,

	/*
	 * Match a "commit [SHA1]" line in a git log output.
	 * For instance:
	 * $ git log
	 * commit a11a14ef7e26f2ca62d4b35eac455ce636d0dc09
	 * Author: lgiraudel
	 * Date:   Mon Feb 17 11:18:34 2014 +0100
	 *
	 *     Add of a new line
	 */
	commit_sha1: /^commit \w{40}$/m
};

(function(Prism) {
	var keywords = /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|null|open|opens|package|private|protected|provides|public|record|requires|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/;

	// based on the java naming conventions
	var className = /\b[A-Z](?:\w*[a-z]\w*)?\b/;

	Prism.languages.java = Prism.languages.extend("clike", {
		"class-name": [
			className,

			// variables and parameters
			// this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
			/\b[A-Z]\w*(?=\s+\w+\s*[;,=())])/
		],
		keyword: keywords,
		function: [
			Prism.languages.clike.function,
			{
				pattern: /(\:\:)[a-z_]\w*/,
				lookbehind: true
			}
		],
		number: /\b0b[01][01_]*L?\b|\b0x[\da-f_]*\.?[\da-f_p+-]+\b|(?:\b\d[\d_]*\.?[\d_]*|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
		operator: {
			pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
			lookbehind: true
		}
	});

	Prism.languages.insertBefore("java", "string", {
		"triple-quoted-string": {
			// http://openjdk.java.net/jeps/355#Description
			pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
			greedy: true,
			alias: "string"
		}
	});

	Prism.languages.insertBefore("java", "class-name", {
		annotation: {
			alias: "punctuation",
			pattern: /(^|[^.])@\w+/,
			lookbehind: true
		},
		namespace: {
			pattern: /(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)[a-z]\w*(?:\.[a-z]\w*)+/,
			lookbehind: true,
			inside: {
				punctuation: /\./
			}
		},
		generics: {
			pattern: /<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<[\w\s,.&?]*>)*>)*>)*>/,
			inside: {
				"class-name": className,
				keyword: keywords,
				punctuation: /[<>(),.:]/,
				operator: /[?&|]/
			}
		}
	});
})(Prism);

(function(Prism) {
	/**
	 * Returns the placeholder for the given language id and index.
	 *
	 * @param {string} language
	 * @param {string|number} index
	 * @returns {string}
	 */
	function getPlaceholder(language, index) {
		return "___" + language.toUpperCase() + index + "___";
	}

	Object.defineProperties((Prism.languages["markup-templating"] = {}), {
		buildPlaceholders: {
			/**
			 * Tokenize all inline templating expressions matching `placeholderPattern`.
			 *
			 * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
			 * `true` will be replaced.
			 *
			 * @param {object} env The environment of the `before-tokenize` hook.
			 * @param {string} language The language id.
			 * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
			 * @param {(match: string) => boolean} [replaceFilter]
			 */
			value: function(env, language, placeholderPattern, replaceFilter) {
				if (env.language !== language) {
					return;
				}

				var tokenStack = (env.tokenStack = []);

				env.code = env.code.replace(placeholderPattern, function(match) {
					if (typeof replaceFilter === "function" && !replaceFilter(match)) {
						return match;
					}
					var i = tokenStack.length;
					var placeholder;

					// Check for existing strings
					while (env.code.indexOf((placeholder = getPlaceholder(language, i))) !== -1) ++i;

					// Create a sparse array
					tokenStack[i] = match;

					return placeholder;
				});

				// Switch the grammar to markup
				env.grammar = Prism.languages.markup;
			}
		},
		tokenizePlaceholders: {
			/**
			 * Replace placeholders with proper tokens after tokenizing.
			 *
			 * @param {object} env The environment of the `after-tokenize` hook.
			 * @param {string} language The language id.
			 */
			value: function(env, language) {
				if (env.language !== language || !env.tokenStack) {
					return;
				}

				// Switch the grammar back
				env.grammar = Prism.languages[language];

				var j = 0;
				var keys = Object.keys(env.tokenStack);

				function walkTokens(tokens) {
					for (var i = 0; i < tokens.length; i++) {
						// all placeholders are replaced already
						if (j >= keys.length) {
							break;
						}

						var token = tokens[i];
						if (typeof token === "string" || (token.content && typeof token.content === "string")) {
							var k = keys[j];
							var t = env.tokenStack[k];
							var s = typeof token === "string" ? token : token.content;
							var placeholder = getPlaceholder(language, k);

							var index = s.indexOf(placeholder);
							if (index > -1) {
								++j;

								var before = s.substring(0, index);
								var middle = new Prism.Token(language, Prism.tokenize(t, env.grammar), "language-" + language, t);
								var after = s.substring(index + placeholder.length);

								var replacement = [];
								if (before) {
									replacement.push.apply(replacement, walkTokens([before]));
								}
								replacement.push(middle);
								if (after) {
									replacement.push.apply(replacement, walkTokens([after]));
								}

								if (typeof token === "string") {
									tokens.splice.apply(tokens, [i, 1].concat(replacement));
								} else {
									token.content = replacement;
								}
							}
						} else if (token.content /* && typeof token.content !== 'string' */) {
							walkTokens(token.content);
						}
					}

					return tokens;
				}

				walkTokens(env.tokens);
			}
		}
	});
})(Prism);

/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 *
 * Supports the following:
 * 		- Extends clike syntax
 * 		- Support for PHP 5.3+ (namespaces, traits, generators, etc)
 * 		- Smarter constant and function matching
 *
 * Adds the following new token classes:
 * 		constant, delimiter, variable, function, package
 */
(function(Prism) {
	Prism.languages.php = Prism.languages.extend("clike", {
		keyword: /\b(?:__halt_compiler|abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|namespace|new|or|parent|print|private|protected|public|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/i,
		boolean: {
			pattern: /\b(?:false|true)\b/i,
			alias: "constant"
		},
		constant: [/\b[A-Z_][A-Z0-9_]*\b/, /\b(?:null)\b/i],
		comment: {
			pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
			lookbehind: true
		}
	});

	Prism.languages.insertBefore("php", "string", {
		"shell-comment": {
			pattern: /(^|[^\\])#.*/,
			lookbehind: true,
			alias: "comment"
		}
	});

	Prism.languages.insertBefore("php", "comment", {
		delimiter: {
			pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i,
			alias: "important"
		}
	});

	Prism.languages.insertBefore("php", "keyword", {
		variable: /\$+(?:\w+\b|(?={))/i,
		package: {
			pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
			lookbehind: true,
			inside: {
				punctuation: /\\/
			}
		}
	});

	// Must be defined after the function pattern
	Prism.languages.insertBefore("php", "operator", {
		property: {
			pattern: /(->)[\w]+/,
			lookbehind: true
		}
	});

	var string_interpolation = {
		pattern: /{\$(?:{(?:{[^{}]+}|[^{}]+)}|[^{}])+}|(^|[^\\{])\$+(?:\w+(?:\[.+?]|->\w+)*)/,
		lookbehind: true,
		inside: Prism.languages.php
	};

	Prism.languages.insertBefore("php", "string", {
		"nowdoc-string": {
			pattern: /<<<'([^']+)'(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\1;/,
			greedy: true,
			alias: "string",
			inside: {
				delimiter: {
					pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
					alias: "symbol",
					inside: {
						punctuation: /^<<<'?|[';]$/
					}
				}
			}
		},
		"heredoc-string": {
			pattern: /<<<(?:"([^"]+)"(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\1;|([a-z_]\w*)(?:\r\n?|\n)(?:.*(?:\r\n?|\n))*?\2;)/i,
			greedy: true,
			alias: "string",
			inside: {
				delimiter: {
					pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
					alias: "symbol",
					inside: {
						punctuation: /^<<<"?|[";]$/
					}
				},
				interpolation: string_interpolation // See below
			}
		},
		"single-quoted-string": {
			pattern: /'(?:\\[\s\S]|[^\\'])*'/,
			greedy: true,
			alias: "string"
		},
		"double-quoted-string": {
			pattern: /"(?:\\[\s\S]|[^\\"])*"/,
			greedy: true,
			alias: "string",
			inside: {
				interpolation: string_interpolation // See below
			}
		}
	});
	// The different types of PHP strings "replace" the C-like standard string
	delete Prism.languages.php["string"];

	Prism.hooks.add("before-tokenize", function(env) {
		if (!/<\?/.test(env.code)) {
			return;
		}

		var phpPattern = /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#)(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|\/\*[\s\S]*?(?:\*\/|$))*?(?:\?>|$)/gi;
		Prism.languages["markup-templating"].buildPlaceholders(env, "php", phpPattern);
	});

	Prism.hooks.add("after-tokenize", function(env) {
		Prism.languages["markup-templating"].tokenizePlaceholders(env, "php");
	});
})(Prism);

(function(Prism) {
	var javaDocLike = (Prism.languages.javadoclike = {
		parameter: {
			pattern: /(^\s*(?:\/{3}|\*|\/\*\*)\s*@(?:param|arg|arguments)\s+)\w+/m,
			lookbehind: true
		},
		keyword: {
			// keywords are the first word in a line preceded be an `@` or surrounded by curly braces.
			// @word, {@word}
			pattern: /(^\s*(?:\/{3}|\*|\/\*\*)\s*|\{)@[a-z][a-zA-Z-]+\b/m,
			lookbehind: true
		},
		punctuation: /[{}]/
	});

	/**
	 * Adds doc comment support to the given language and calls a given callback on each doc comment pattern.
	 *
	 * @param {string} lang the language add doc comment support to.
	 * @param {(pattern: {inside: {rest: undefined}}) => void} callback the function called with each doc comment pattern as argument.
	 */
	function docCommentSupport(lang, callback) {
		var tokenName = "doc-comment";

		var grammar = Prism.languages[lang];
		if (!grammar) {
			return;
		}
		var token = grammar[tokenName];

		if (!token) {
			// add doc comment: /** */
			var definition = {};
			definition[tokenName] = {
				pattern: /(^|[^\\])\/\*\*[^/][\s\S]*?(?:\*\/|$)/,
				lookbehind: true,
				alias: "comment"
			};

			grammar = Prism.languages.insertBefore(lang, "comment", definition);
			token = grammar[tokenName];
		}

		if (token instanceof RegExp) {
			// convert regex to object
			token = grammar[tokenName] = { pattern: token };
		}

		if (Array.isArray(token)) {
			for (var i = 0, l = token.length; i < l; i++) {
				if (token[i] instanceof RegExp) {
					token[i] = { pattern: token[i] };
				}
				callback(token[i]);
			}
		} else {
			callback(token);
		}
	}

	/**
	 * Adds doc-comment support to the given languages for the given documentation language.
	 *
	 * @param {string[]|string} languages
	 * @param {Object} docLanguage
	 */
	function addSupport(languages, docLanguage) {
		if (typeof languages === "string") {
			languages = [languages];
		}

		languages.forEach(function(lang) {
			docCommentSupport(lang, function(pattern) {
				if (!pattern.inside) {
					pattern.inside = {};
				}
				pattern.inside.rest = docLanguage;
			});
		});
	}

	Object.defineProperty(javaDocLike, "addSupport", { value: addSupport });

	javaDocLike.addSupport(["java", "javascript", "php"], javaDocLike);
})(Prism);

(function(Prism) {
	var interpolation = /\\\((?:[^()]|\([^()]*\))*\)/.source;
	var string = RegExp(/"(?:[^"\r\n\\]|\\[^\r\n(]|__)*"/.source.replace(/__/g, interpolation));
	var stringInterpolation = {
		interpolation: {
			pattern: RegExp(/((?:^|[^\\])(?:\\{2})*)/.source + interpolation),
			lookbehind: true,
			inside: {
				content: {
					pattern: /^(\\\()[\s\S]+(?=\)$)/,
					lookbehind: true,
					inside: null // see below
				},
				punctuation: /^\\\(|\)$/
			}
		}
	};

	var jq = (Prism.languages.jq = {
		comment: /#.*/,
		property: {
			pattern: RegExp(string.source + /(?=\s*:(?!:))/.source),
			greedy: true,
			inside: stringInterpolation
		},
		string: {
			pattern: string,
			greedy: true,
			inside: stringInterpolation
		},

		function: {
			pattern: /(\bdef\s+)[a-z_]\w+/i,
			lookbehind: true
		},

		variable: /\B\$\w+/,
		"property-literal": {
			pattern: /[a-z_]\w*(?=\s*:(?!:))/i,
			alias: "property"
		},
		keyword: /\b(?:as|break|catch|def|elif|else|end|foreach|if|import|include|label|module|modulemeta|null|reduce|then|try|while)\b/,
		boolean: /\b(?:true|false)\b/,
		number: /(?:\b\d+\.|\B\.)?\d+(?:[eE][+-]?\d+)?\b/,

		operator: [
			{
				pattern: /\|=?/,
				alias: "pipe"
			},
			/\.\.|[!=<>]?=|\?\/\/|\/\/=?|[-+*/%]=?|[<>?]|\b(?:and|or|not)\b/
		],
		"c-style-function": {
			pattern: /\b[a-z_]\w*(?=\s*\()/i,
			alias: "function"
		},
		punctuation: /::|[()\[\]{},:;]|\.(?=\s*[\[\w$])/,
		dot: {
			pattern: /\./,
			alias: "important"
		}
	});

	stringInterpolation.interpolation.inside.content.inside = jq;
})(Prism);

Prism.languages.python = {
	comment: {
		pattern: /(^|[^\\])#.*/,
		lookbehind: true
	},
	"string-interpolation": {
		pattern: /(?:f|rf|fr)(?:("""|''')[\s\S]+?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
		greedy: true,
		inside: {
			interpolation: {
				// "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
				pattern: /((?:^|[^{])(?:{{)*){(?!{)(?:[^{}]|{(?!{)(?:[^{}]|{(?!{)(?:[^{}])+})+})+}/,
				lookbehind: true,
				inside: {
					"format-spec": {
						pattern: /(:)[^:(){}]+(?=}$)/,
						lookbehind: true
					},
					"conversion-option": {
						pattern: /![sra](?=[:}]$)/,
						alias: "punctuation"
					},
					rest: null
				}
			},
			string: /[\s\S]+/
		}
	},
	"triple-quoted-string": {
		pattern: /(?:[rub]|rb|br)?("""|''')[\s\S]+?\1/i,
		greedy: true,
		alias: "string"
	},
	string: {
		pattern: /(?:[rub]|rb|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
		greedy: true
	},
	function: {
		pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
		lookbehind: true
	},
	"class-name": {
		pattern: /(\bclass\s+)\w+/i,
		lookbehind: true
	},
	decorator: {
		pattern: /(^\s*)@\w+(?:\.\w+)*/im,
		lookbehind: true,
		alias: ["annotation", "punctuation"],
		inside: {
			punctuation: /\./
		}
	},
	keyword: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
	builtin: /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
	boolean: /\b(?:True|False|None)\b/,
	number: /(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
	operator: /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
	punctuation: /[{}[\];(),.:]/
};

Prism.languages.python["string-interpolation"].inside["interpolation"].inside.rest = Prism.languages.python;

Prism.languages.py = Prism.languages.python;

(function(Prism) {
	Prism.languages.sass = Prism.languages.extend("css", {
		// Sass comments don't need to be closed, only indented
		comment: {
			pattern: /^([ \t]*)\/[\/*].*(?:(?:\r?\n|\r)\1[ \t]+.+)*/m,
			lookbehind: true
		}
	});

	Prism.languages.insertBefore("sass", "atrule", {
		// We want to consume the whole line
		"atrule-line": {
			// Includes support for = and + shortcuts
			pattern: /^(?:[ \t]*)[@+=].+/m,
			inside: {
				atrule: /(?:@[\w-]+|[+=])/m
			}
		}
	});
	delete Prism.languages.sass.atrule;

	var variable = /\$[-\w]+|#\{\$[-\w]+\}/;
	var operator = [
		/[+*\/%]|[=!]=|<=?|>=?|\b(?:and|or|not)\b/,
		{
			pattern: /(\s+)-(?=\s)/,
			lookbehind: true
		}
	];

	Prism.languages.insertBefore("sass", "property", {
		// We want to consume the whole line
		"variable-line": {
			pattern: /^[ \t]*\$.+/m,
			inside: {
				punctuation: /:/,
				variable: variable,
				operator: operator
			}
		},
		// We want to consume the whole line
		"property-line": {
			pattern: /^[ \t]*(?:[^:\s]+ *:.*|:[^:\s]+.*)/m,
			inside: {
				property: [
					/[^:\s]+(?=\s*:)/,
					{
						pattern: /(:)[^:\s]+/,
						lookbehind: true
					}
				],
				punctuation: /:/,
				variable: variable,
				operator: operator,
				important: Prism.languages.sass.important
			}
		}
	});
	delete Prism.languages.sass.property;
	delete Prism.languages.sass.important;

	// Now that whole lines for other patterns are consumed,
	// what's left should be selectors
	Prism.languages.insertBefore("sass", "punctuation", {
		selector: {
			pattern: /([ \t]*)\S(?:,?[^,\r\n]+)*(?:,(?:\r?\n|\r)\1[ \t]+\S(?:,?[^,\r\n]+)*)*/,
			lookbehind: true
		}
	});
})(Prism);
Prism.languages.scss = Prism.languages.extend("css", {
	comment: {
		pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
		lookbehind: true
	},
	atrule: {
		pattern: /@[\w-]+(?:\([^()]+\)|[^(])*?(?=\s+[{;])/,
		inside: {
			rule: /@[\w-]+/
			// See rest below
		}
	},
	// url, compassified
	url: /(?:[-a-z]+-)?url(?=\()/i,
	// CSS selector regex is not appropriate for Sass
	// since there can be lot more things (var, @ directive, nesting..)
	// a selector must start at the end of a property or after a brace (end of other rules or nesting)
	// it can contain some characters that aren't used for defining rules or end of selector, & (parent selector), or interpolated variable
	// the end of a selector is found when there is no rules in it ( {} or {\s}) or if there is a property (because an interpolated var
	// can "pass" as a selector- e.g: proper#{$erty})
	// this one was hard to do, so please be careful if you edit this one :)
	selector: {
		// Initial look-ahead is used to prevent matching of blank selectors
		pattern: /(?=\S)[^@;{}()]?(?:[^@;{}()]|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}]+[:{][^}]+))/m,
		inside: {
			parent: {
				pattern: /&/,
				alias: "important"
			},
			placeholder: /%[-\w]+/,
			variable: /\$[-\w]+|#\{\$[-\w]+\}/
		}
	},
	property: {
		pattern: /(?:[\w-]|\$[-\w]+|#\{\$[-\w]+\})+(?=\s*:)/,
		inside: {
			variable: /\$[-\w]+|#\{\$[-\w]+\}/
		}
	}
});

Prism.languages.insertBefore("scss", "atrule", {
	keyword: [
		/@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i,
		{
			pattern: /( +)(?:from|through)(?= )/,
			lookbehind: true
		}
	]
});

Prism.languages.insertBefore("scss", "important", {
	// var and interpolated vars
	variable: /\$[-\w]+|#\{\$[-\w]+\}/
});

Prism.languages.insertBefore("scss", "function", {
	placeholder: {
		pattern: /%[-\w]+/,
		alias: "selector"
	},
	statement: {
		pattern: /\B!(?:default|optional)\b/i,
		alias: "keyword"
	},
	boolean: /\b(?:true|false)\b/,
	null: {
		pattern: /\bnull\b/,
		alias: "keyword"
	},
	operator: {
		pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|or|not)(?=\s)/,
		lookbehind: true
	}
});

Prism.languages.scss["atrule"].inside.rest = Prism.languages.scss;

Prism.languages.sql = {
	comment: {
		pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
		lookbehind: true
	},
	variable: [
		{
			pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
			greedy: true
		},
		/@[\w.$]+/
	],
	string: {
		pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
		greedy: true,
		lookbehind: true
	},
	function: /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, // Should we highlight user defined functions too?
	keyword: /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURNS?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
	boolean: /\b(?:TRUE|FALSE|NULL)\b/i,
	number: /\b0x[\da-f]+\b|\b\d+\.?\d*|\B\.\d+\b/i,
	operator: /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|IN|LIKE|NOT|OR|IS|DIV|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
	punctuation: /[;[\]()`,.]/
};

Prism.languages.typescript = Prism.languages.extend("javascript", {
	// From JavaScript Prism keyword list and TypeScript language spec: https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#221-reserved-words
	keyword: /\b(?:abstract|as|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|undefined|var|void|while|with|yield)\b/,
	builtin: /\b(?:string|Function|any|number|boolean|Array|symbol|console|Promise|unknown|never)\b/
});

Prism.languages.ts = Prism.languages.typescript;

(function() {
	if (typeof self === "undefined" || !self.Prism || !self.document) {
		return;
	}

	/**
	 * Plugin name which is used as a class name for <pre> which is activating the plugin
	 * @type {String}
	 */
	var PLUGIN_NAME = "line-numbers";

	/**
	 * Regular expression used for determining line breaks
	 * @type {RegExp}
	 */
	var NEW_LINE_EXP = /\n(?!$)/g;

	/**
	 * Resizes line numbers spans according to height of line of code
	 * @param {Element} element <pre> element
	 */
	var _resizeElement = function(element) {
		var codeStyles = getStyles(element);
		var whiteSpace = codeStyles["white-space"];

		if (whiteSpace === "pre-wrap" || whiteSpace === "pre-line") {
			var codeElement = element.querySelector("code");
			var lineNumbersWrapper = element.querySelector(".line-numbers-rows");
			var lineNumberSizer = element.querySelector(".line-numbers-sizer");
			var codeLines = codeElement.textContent.split(NEW_LINE_EXP);

			if (!lineNumberSizer) {
				lineNumberSizer = document.createElement("span");
				lineNumberSizer.className = "line-numbers-sizer";

				codeElement.appendChild(lineNumberSizer);
			}

			lineNumberSizer.style.display = "block";

			codeLines.forEach(function(line, lineNumber) {
				lineNumberSizer.textContent = line || "\n";
				var lineSize = lineNumberSizer.getBoundingClientRect().height;
				lineNumbersWrapper.children[lineNumber].style.height = lineSize + "px";
			});

			lineNumberSizer.textContent = "";
			lineNumberSizer.style.display = "none";
		}
	};

	/**
	 * Returns style declarations for the element
	 * @param {Element} element
	 */
	var getStyles = function(element) {
		if (!element) {
			return null;
		}

		return window.getComputedStyle ? getComputedStyle(element) : element.currentStyle || null;
	};

	window.addEventListener("resize", function() {
		Array.prototype.forEach.call(document.querySelectorAll("pre." + PLUGIN_NAME), _resizeElement);
	});

	Prism.hooks.add("complete", function(env) {
		if (!env.code) {
			return;
		}

		var code = env.element;
		var pre = code.parentNode;

		// works only for <code> wrapped inside <pre> (not inline)
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return;
		}

		// Abort if line numbers already exists
		if (code.querySelector(".line-numbers-rows")) {
			return;
		}

		var addLineNumbers = false;
		var lineNumbersRegex = /(?:^|\s)line-numbers(?:\s|$)/;

		for (var element = code; element; element = element.parentNode) {
			if (lineNumbersRegex.test(element.className)) {
				addLineNumbers = true;
				break;
			}
		}

		// only add line numbers if <code> or one of its ancestors has the `line-numbers` class
		if (!addLineNumbers) {
			return;
		}

		// Remove the class 'line-numbers' from the <code>
		code.className = code.className.replace(lineNumbersRegex, " ");
		// Add the class 'line-numbers' to the <pre>
		if (!lineNumbersRegex.test(pre.className)) {
			pre.className += " line-numbers";
		}

		var match = env.code.match(NEW_LINE_EXP);
		var linesNum = match ? match.length + 1 : 1;
		var lineNumbersWrapper;

		var lines = new Array(linesNum + 1).join("<span></span>");

		lineNumbersWrapper = document.createElement("span");
		lineNumbersWrapper.setAttribute("aria-hidden", "true");
		lineNumbersWrapper.className = "line-numbers-rows";
		lineNumbersWrapper.innerHTML = lines;

		if (pre.hasAttribute("data-start")) {
			pre.style.counterReset = "linenumber " + (parseInt(pre.getAttribute("data-start"), 10) - 1);
		}

		env.element.appendChild(lineNumbersWrapper);

		_resizeElement(pre);

		Prism.hooks.run("line-numbers", env);
	});

	Prism.hooks.add("line-numbers", function(env) {
		env.plugins = env.plugins || {};
		env.plugins.lineNumbers = true;
	});

	/**
	 * Global exports
	 */
	Prism.plugins.lineNumbers = {
		/**
		 * Get node for provided line number
		 * @param {Element} element pre element
		 * @param {Number} number line number
		 * @return {Element|undefined}
		 */
		getLine: function(element, number) {
			if (element.tagName !== "PRE" || !element.classList.contains(PLUGIN_NAME)) {
				return;
			}

			var lineNumberRows = element.querySelector(".line-numbers-rows");
			var lineNumberStart = parseInt(element.getAttribute("data-start"), 10) || 1;
			var lineNumberEnd = lineNumberStart + (lineNumberRows.children.length - 1);

			if (number < lineNumberStart) {
				number = lineNumberStart;
			}
			if (number > lineNumberEnd) {
				number = lineNumberEnd;
			}

			var lineIndex = number - lineNumberStart;

			return lineNumberRows.children[lineIndex];
		}
	};
})();
