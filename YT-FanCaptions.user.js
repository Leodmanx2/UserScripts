// ==UserScript==
// @name         YT-FanCaptions
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extracts cpations from YouTube's live chat and lists them below the video.
// @author       Chris MacLeod
// @match        https://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const translationDiv = document.createElement("div");
    translationDiv.id = "translation";
    translationDiv.style.fontSize = "1.5em";
    translationDiv.style.padding = "10px";
    translationDiv.style.background = "#eee";
    translationDiv.style.overflowY = "scroll";
    translationDiv.style.height = "10ex";

    window.addEventListener("message", (event) => {
        const data = event.data;
        if(data.type !== "messageChunk") {return;}

        for (var i = data.messages.length - 1; i >= 0; i--) {
            const message = data.messages[i];

            const match = /^[\[\(]?(英訳\/)?ENG?[\]\):\-\}]+/i.test(message.message);
            if(match) {
                const paragraph = document.createElement("p");
                paragraph.textContent = message.message;
                translationDiv.insertBefore(paragraph, translationDiv.firstElementChild);
            }
        }
    });

     const loadguard = setInterval(function() {
         const primary = document.getElementById("primary-inner");
         if(primary) {
             primary.insertBefore(translationDiv, primary.firstElementChild.nextSibling);
             clearInterval(loadguard);
         }
     }, 100);
})();
