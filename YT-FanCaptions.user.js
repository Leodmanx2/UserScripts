// ISC License
//
// Copyright 2020 Chris MacLeod
//
// Permission to use, copy, modify, and/or distribute this software
// for any purpose with or without fee is hereby granted, provided
// that the above copyright notice and this permission notice appear
// in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
// WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
// AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR
// CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
// NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
// CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

// ==UserScript==
// @name         YT-FanCaptions
// @namespace    https://chris-macleod.ca/
// @version      0.1
// @description  Extracts captions from YouTube's live chat and lists them below the video.
// @author       Chris MacLeod
// @match        https://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

// The SuperCount script monitors messages that appear in the chat box. This has
// two disadvantages. The first is that if a user is using "Top Chat" instead
// of "Live Chat" some CC messages may be filtered out. The second is that
// YouTube does a lot of processing and messages may appear in the chat about
// a second slower than the client received them. Not a big deal.
// This script mimics LiveTL by intercepting YouTube's API requests and
// subsequent responses.

// SuperCount continues to use the chat box method in part because we still
// have to observe the chatbox to undo YouTube's dumb SVG emoji replacement
// that causes chat to lag and mixing methods feels wasteful.

// Also, isn't it kind of scary how easy it is to intercept all a user's
// traffic and do whatever we want with it?

(function() {
"use strict";

const translationDiv = document.createElement("div");
translationDiv.id = "translation";
translationDiv.style.fontSize = "1.5em";
translationDiv.style.padding = "10px";
translationDiv.style.background = "#eee";
translationDiv.style.overflowY = "scroll";
translationDiv.style.height = "10ex";

// Web components are loaded asynchronously with Javascript but there appears to
// be no "finished loading" event to listen to for the elements we need to build
// on. Consequently, we have to keep polling for them until they are loaded.
// TODO: Monitor for elements being removed and re-insterted due to responsive
// layout changes
const loadguard = setInterval(function() {
	const frame = document.getElementById("chatframe");
	if(!frame) { return; }

	const primary = document.getElementById("primary-inner");
	if(!primary) { return; }

	clearInterval(loadguard);

	primary.insertBefore(translationDiv, primary.firstElementChild.nextSibling);

	const oldFetch = frame.contentWindow.fetch;
	frame.contentWindow.fetch = async (...args) => {
		const url = args[0].url || args[0];
		const result = await oldFetch(...args);
		if(url.startsWith(
		     "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat")) {
			const clone = await result.clone();
			const json = await clone.json();
			const actions = json.continuationContents.liveChatContinuation.actions;
			actions.forEach(action => {
				const item =
				  (action.addChatItemAction ||
				   action.replayChatItemAction?.actions[0]?.addChatItemAction)
				    ?.item;
				if(!item) { return; }

				let text = "";
				item.liveChatTextMessageRenderer.message.runs.forEach(run => {
					if(run.text) { text += run.text; }
				});

				let match = /^[\[\(]?(英訳\/)?ENG?[\]\):\-\}]+/i.test(text);
				if(match) {
					const paragraph = document.createElement("p");
					paragraph.textContent = text;
					translationDiv.insertBefore(paragraph,
					                            translationDiv.firstElementChild);
				}
			});
		}
		return result;
	}
}, 100);
})();
