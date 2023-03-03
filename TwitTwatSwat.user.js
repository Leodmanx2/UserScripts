// ==UserScript==
// @name         TwitTwatSwat
// @namespace    http://tampermonkey.net/
// @version      1.1
// @downloadURL  https://bitbucket.org/leodmanx2/userscripts/raw/HEAD/TwitTwatSwat.user.js
// @description  Hides tweets from bad Twitter users in conjunction with the Bot Sentinel extension
// @author       Chris MacLeod
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
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

const hide_bad_users = () => {
	document.querySelectorAll(".Disruptive, .Problematic").forEach((post) => {
		post.closest("article").style.setProperty("display", "none", "important");
	});
};

setInterval(hide_bad_users, 1000);
})();
