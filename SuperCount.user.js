// ==UserScript==
// @name         SuperCount
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Counts YouTube Super Chat amounts
// @author       Chris MacLeod
// @match        https://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    // This is a map of three letter currency codes used by exchangeratesapi
    // to their corresponding symbols used by YouTube.
    // TODO: Confirm at least the following symbols
    // [BGN] Bulgaria
    // [HRK] Croatia
    // [PLN] Poland
    // [RON] Romania
    // [SGD] Singapore
    // [ZAR] South Africa
    // [SEK] Sweden
    // [CHF] Switzerland
    const symbolMap = new Map();
    symbolMap.set("USD", "$");
    symbolMap.set("CAD", "CA$");
    symbolMap.set("HKD", "HK$");
    symbolMap.set("GBP", "£");
    symbolMap.set("BRL", "R$");
    symbolMap.set("JPY", "¥");
    symbolMap.set("EUR", "€");
    symbolMap.set("NZD", "NZ$");
    symbolMap.set("MXN", "MX$");
    symbolMap.set("AUD", "A$");
    symbolMap.set("TWD", "NT$");
    symbolMap.set("KRW", "₩");

    // These are initial data that we may fall back on in case exchangeratesapi
    // does not offer an exchange rate or the request for new data fails.
    // These rates were obtained August 29, 2020 at 2:54 PM EST.
    // See footnote 1
    const rates = new Map();
    rates.set("CA$", 0.0124037005);
    rates.set("HK$", 0.0736462238);
    rates.set("£", 0.0071351782);
    rates.set("RON", 0.0385955818);
    rates.set("SEK", 0.0818270994);
    rates.set("IDR", 138.2141319084);
    rates.set("INR", 0.6955299466);
    rates.set("R$", 0.0523231518);
    rates.set("RUB", 0.7067948002);
    rates.set("HRK", 0.060032698);
    rates.set("¥", 1.0);
    rates.set("THB", 0.2958050881);
    rates.set("CHF", 0.0085796315);
    rates.set("€", 0.0079751176);
    rates.set("MYR", 0.0395821038);
    rates.set("BGN", 0.0155977351);
    rates.set("TRY", 0.0695238855);
    rates.set("CNY", 0.0651957891);
    rates.set("NOK", 0.0834994816);
    rates.set("NZ$", 0.014134301);
    rates.set("ZAR", 0.1585684664);
    rates.set("$", 0.0095023527);
    rates.set("MX$", 0.2079033416);
    rates.set("SGD", 0.012915703);
    rates.set("A$", 0.0129324508);
    rates.set("ILS", 0.031966664);
    rates.set("KRW", 11.2229045378);
    rates.set("PLN", 0.0350275142);

    // The following are not provided by exchangeratesapi:
    rates.set("NT$", 0.28);
    rates.set("CLP", 7.40);
    rates.set("PYG", 0.015);
    rates.set("PEN", 0.034);
    rates.set("PHP", 0.46);
    rates.set("ARS", 0.7);
    rates.set("CRC", 5.61);
    rates.set("COP", 34.65);
    rates.set("NIO", 0.33);

    const setRate = function(key, value) {
        const symbol = symbolMap.get(key);
        if(symbol) {
            rates.set(symbol, value);
        } else {
            rates.set(key, value);
        }
    }

    // Fetch latest exchange rates
    const request = new XMLHttpRequest();
    request.open("GET", "https://api.exchangeratesapi.io/latest?base=JPY");
    request.responseType = "json";
    request.onload = function() {
        Object.keys(request.response.rates).forEach((key) => {
            setRate(key, request.response.rates[key]);
        });
    };
    request.send();

    // toYen parses the value of a string that looks like "C$1,000.10" and
    // returns its equivalent value in yen.
    const toYen = function(text) {
        const match = text.match(/([^\d.,\s]+)+(.*)/);
        const symbol = match[1];
        const value = match[2].replace(/,/g, "");
        if(!rates.has(symbol)) {
            console.error("no exchange rate for " + symbol);
            return 0;
        }
        const multiplier = rates.get(symbol);
        return parseFloat(value, 10) / multiplier;
    };

    let total = 0;

    const counterDiv = document.createElement("div");
    counterDiv.id = "totalAmount";
    counterDiv.style.color = "gray";
    counterDiv.innerHTML = "¥0 (¥0)";

    const translationDiv = document.createElement("div");
    translationDiv.id = "translation";
    translationDiv.style.fontSize = "1.5em";
    translationDiv.style.padding = "10px";
    translationDiv.style.background = "#eee";

    // Web components are loaded asynchronously with Javascript but there appears to be no
    // "finished loading" event to listen to for the elements we need to build on.
    // Consequently, we have to keep polling for them until they are loaded.
    // TODO: Monitor for elements being removed and re-insterted due to responsive layout changes
    const loadguard = setInterval(function() {
        const frame = document.getElementById("chatframe");
        if(!frame) {return;}

        const chatMessages = frame.contentDocument.querySelector("div#items.yt-live-chat-item-list-renderer");
        if(!chatMessages) {return;}

        clearInterval(loadguard);

        const primary = document.getElementById("primary-inner");
        primary.insertBefore(translationDiv, primary.firstElementChild.nextSibling);

        const sidebar = document.getElementById("secondary");
        sidebar.insertBefore(counterDiv, sidebar.firstChild);

        const callback = function(mutationsList, observer) {
            mutationsList.forEach((mutation) => {mutation.addedNodes.forEach((node) => {
                const purchaseNode = node.querySelector("#purchase-amount"); // See footnote 2
                if (purchaseNode != null) {
                    const jpy = toYen(purchaseNode.textContent);
                    total = total + jpy;
                    counterDiv.innerHTML = "¥" + Math.trunc(total) + " (¥" + Math.trunc(total * 0.315) + ")";
                }
                const messageNode = node.querySelector("#message"); // See footnote 2
                if (messageNode != null) {
                    const text = messageNode.textContent;
                    const match = /^[\[\(]ENG?[\]\)]/i.test(text);
                    if(!match) match = /^(英訳\/)?ENG?:/i.test(text);
                    if(match) {
                        const paragraph = document.createElement("p");
                        paragraph.textContent = messageNode.textContent;
                        translationDiv.insertBefore(paragraph, translationDiv.firstElementChild);
                        if(translationDiv.childNodes.length > 3) {
                            translationDiv.removeChild(translationDiv.lastChild);
                        }
                    }
                }
            });});
        };

        const observer = new MutationObserver(callback);
        observer.observe(chatMessages, {childList : true});
    }, 100);
})();

// Footnotes -------------------------------------------------------------
//
// [1] This script uses exchangeratesapi for currency exchange rates.
// exchangeratesapi pulls data from the European Central Bank's website.
// The ECB only provides information on 28 currencies. YouTube supports 68
// countries as of writing. currencylayer offers rates for many more
// currencies, if you're willing to pay for it. I am not.
//
// [2] Nodes have no getElementById function because each ID is supposed to
// be unique within the document. However, YouTube's chat message component
// reuses IDs. This would be fine if the component hid the elements with
// duplicate IDs in a shadow DOM, but it doesn't. The Polymer library that
// YouTube is built with doesn't care one bit about duplicate IDs, but
// rendering the page correctly now relies on undefined behaviour and we
// have to use the possibly O(n) querySelector instead of the O(1)
// getElementById.
