// ==UserScript==
// @name         YTCCMonitor
// @namespace    http://tampermonkey.net/
// @version      0.12.3
// @downloadURL  https://bitbucket.org/leodmanx2/userscripts/raw/HEAD/YTCCMonitor.user.js
// @description  Extracts viewer-provided English-language translations or captions to a space below the video
// @author       Chris MacLeod
// @match        https://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

// jshint esversion: 11
// jshint freeze: true
// jshint latedef: true
// jshint regexpu: true
// jshint unused: true
// jshint varstmt: true

(function() {
"use strict";

const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

const translationDiv = document.createElement("div");
translationDiv.id = "translation";
translationDiv.style.fontSize = "1.5em";
translationDiv.style.padding = "10px";
translationDiv.style.color = darkMode ? "white" : "gray";
translationDiv.style.background = darkMode ? "#212121" : "#eee";
translationDiv.style.overflowY = "scroll";
translationDiv.style.height = "20ex";

// YouTube replaces emoji characters with SVGs that will be huge unless given an appropriate scale
const style = document.createElement("style");
document.head.appendChild(style);
style.sheet.insertRule(
  `div#translation img.emoji {max-height: ${translationDiv.style.fontSize};}`);

const extractCaptions =
  (node) => {
	  const messageNode = node.querySelector("#message"); // See footnote 1
	  if(!messageNode) { return; }

	  const author = node.querySelector("#author-name");
	  // System notices also use the #message ID, so we make another check
	  // to see if this is actually a chat message.
	  // This is why ID duplication is bad.
	  if(!author) { return; }

	  const isModerator = author.classList.contains("moderator");
	  const isOwner = author.classList.contains("owner");
	  const isTranslation =
	    /^[\[\(\{]?(英訳[\\/ ])?ENG?([\\/ ]英訳)?[\]\):\}-]+/iu.test(
	      messageNode.textContent);

	  if(isTranslation || isModerator || isOwner) {
		  const paragraph = document.createElement("p");
		  paragraph.innerHTML =
		    `${messageNode.innerHTML} <span style="color:grey;font-size:0.75em">(${
				  author.innerHTML} @ ${new Date().toLocaleTimeString()})</span>`;
		  translationDiv.insertBefore(paragraph, translationDiv.firstElementChild);
	  }
  }

const chatMutationCallback = (mutationsList) => {
	mutationsList.forEach(
	  (mutation) => { mutation.addedNodes.forEach(extractCaptions); });
};

const chatObserver = new MutationObserver(chatMutationCallback);

const checkForChat = () => {
	const chatframe = document.getElementById("chatframe");
	if(!chatframe) { return; }

	const frameDocument = chatframe.contentDocument;
	if(!frameDocument) { return; }

	// Automatically switch to Live Chat mode
	let liveChatOption =
	  frameDocument.querySelectorAll("tp-yt-paper-listbox > a")[1];
	if(liveChatOption) {
		if(!frameDocument.liveChat) {
			liveChatOption.click();
			frameDocument.liveChat = true;
		}
	}

	// Start watching for new chat messages
	let messages =
	  frameDocument.querySelector("div#items.yt-live-chat-item-list-renderer");
	if(messages) {
		if(!messages.observing) {
			chatObserver.observe(messages, {childList : true});
			messages.observing = true;
		}
	}

	// Attach the translation div
	const primary = document.getElementById("primary-inner");
	if(primary) {
		if(primary.firstElementChild.nextSibling != translationDiv) {
			primary.insertBefore(translationDiv,
			                     primary.firstElementChild.nextSibling);
		}
	}
};

setInterval(checkForChat, 1000);
})();

// Footnotes -------------------------------------------------------------
//
// [1] Nodes have no getElementById function because each ID is supposed to
// be unique within the document. However, YouTube's chat message component
// reuses IDs. This would be fine if the component hid the elements with
// duplicate IDs in a shadow DOM, but it doesn't. The Polymer library that
// YouTube is built with doesn't care one bit about duplicate IDs, but
// rendering the page correctly now relies on undefined behaviour and we
// have to use the possibly O(n) querySelector instead of the O(1)
// getElementById.
