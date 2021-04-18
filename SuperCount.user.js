// ==UserScript==
// @name         SuperCount
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Counts YouTube Super Chat amounts
// @author       Chris MacLeod
// @match        https://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    // This is a map of three letter currency codes used by the exhange
    // rate api to their corresponding symbols used by YouTube.
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
    symbolMap.set("$", "USD");
    symbolMap.set("CA$", "CAD");
    symbolMap.set("HK$", "HKD");
    symbolMap.set("£", "GBP");
    symbolMap.set("R$", "BRL");
    symbolMap.set("¥", "JPY");
    symbolMap.set("€", "EUR");
    symbolMap.set("NZ$", "NZD");
    symbolMap.set("MX$", "MXN");
    symbolMap.set("A$", "AUD");
    symbolMap.set("NT$", "TWD");
    symbolMap.set("₩", "KRW");

    // These are initial data that we may fall back on in case the api
    // does not offer an exchange rate or the request for new data fails.
    // These rates were obtained April 16, 2021 at 4:15 PM EST.
    const rates = new Map();
    rates.set("AED", 0.033755);
    rates.set("AFN", 0.713153);
    rates.set("ALL", 0.945881);
    rates.set("AMD", 4.771129);
    rates.set("ANG", 0.016491);
    rates.set("AOA", 5.952524);
    rates.set("ARS", 0.852213);
    rates.set("AUD", 0.011878);
    rates.set("AWG", 0.016542);
    rates.set("AZN", 0.015631);
    rates.set("BAM", 0.015021);
    rates.set("BBD", 0.01838);
    rates.set("BDT", 0.779002);
    rates.set("BGN", 0.015035);
    rates.set("BHD", 0.003464);
    rates.set("BIF", 17.941672);
    rates.set("BMD", 0.00919);
    rates.set("BND", 0.012266);
    rates.set("BOB", 0.063367);
    rates.set("BRL", 0.051614);
    rates.set("BSD", 0.00919);
    rates.set("BTC", 0);
    rates.set("BTN", 0.688552);
    rates.set("BWP", 0.100445);
    rates.set("BYN", 0.023965);
    rates.set("BZD", 0.018518);
    rates.set("CAD", 0.011523);
    rates.set("CDF", 18.361861);
    rates.set("CHF", 0.008476);
    rates.set("CLF", 0.000233);
    rates.set("CLP", 6.419297);
    rates.set("CNH", 0.060018);
    rates.set("CNY", 0.060006);
    rates.set("COP", 33.600761);
    rates.set("CRC", 5.632684);
    rates.set("CUC", 0.00919);
    rates.set("CUP", 0.236646);
    rates.set("CVE", 0.848937);
    rates.set("CZK", 0.199335);
    rates.set("DJF", 1.636301);
    rates.set("DKK", 0.05713);
    rates.set("DOP", 0.522832);
    rates.set("DZD", 1.215698);
    rates.set("EGP", 0.144068);
    rates.set("ERN", 0.13787);
    rates.set("ETB", 0.380149);
    rates.set("EUR", 0.007681);
    rates.set("FJD", 0.018623);
    rates.set("FKP", 0.006678);
    rates.set("GBP", 0.006678);
    rates.set("GEL", 0.031568);
    rates.set("GGP", 0.006678);
    rates.set("GHS", 0.053133);
    rates.set("GIP", 0.006678);
    rates.set("GMD", 0.469156);
    rates.set("GNF", 91.947157);
    rates.set("GTQ", 0.070901);
    rates.set("GYD", 1.922073);
    rates.set("HKD", 0.071392);
    rates.set("HNL", 0.221666);
    rates.set("HRK", 0.058079);
    rates.set("HTG", 0.750579);
    rates.set("HUF", 2.762137);
    rates.set("IDR", 133.984538);
    rates.set("ILS", 0.030152);
    rates.set("IMP", 0.006678);
    rates.set("INR", 0.68596);
    rates.set("IQD", 13.440551);
    rates.set("IRR", 386.950028);
    rates.set("ISK", 1.165307);
    rates.set("JEP", 0.006678);
    rates.set("JMD", 1.379902);
    rates.set("JOD", 0.006516);
    rates.set("JPY", 1);
    rates.set("KES", 0.984262);
    rates.set("KGS", 0.779229);
    rates.set("KHR", 37.183228);
    rates.set("KMF", 3.778518);
    rates.set("KPW", 8.271109);
    rates.set("KRW", 10.259446);
    rates.set("KWD", 0.002771);
    rates.set("KYD", 0.007656);
    rates.set("KZT", 3.968331);
    rates.set("LAK", 86.593911);
    rates.set("LBP", 14.01464);
    rates.set("LKR", 1.846566);
    rates.set("LRD", 1.586674);
    rates.set("LSL", 0.133902);
    rates.set("LYD", 0.041493);
    rates.set("MAD", 0.082192);
    rates.set("MDL", 0.163395);
    rates.set("MGA", 34.846999);
    rates.set("MKD", 0.473158);
    rates.set("MMK", 12.95352);
    rates.set("MNT", 26.199437);
    rates.set("MOP", 0.073506);
    rates.set("MRO", 3.280871);
    rates.set("MRU", 0.330109);
    rates.set("MUR", 0.373119);
    rates.set("MVR", 0.141987);
    rates.set("MWK", 7.214281);
    rates.set("MXN", 0.183403);
    rates.set("MYR", 0.037928);
    rates.set("MZN", 0.510235);
    rates.set("NAD", 0.134635);
    rates.set("NGN", 3.501436);
    rates.set("NIO", 0.321602);
    rates.set("NOK", 0.077149);
    rates.set("NPR", 1.101681);
    rates.set("NZD", 0.012834);
    rates.set("OMR", 0.003538);
    rates.set("PAB", 0.00919);
    rates.set("PEN", 0.033323);
    rates.set("PGK", 0.03267);
    rates.set("PHP", 0.444525);
    rates.set("PKR", 1.403315);
    rates.set("PLN", 0.034972);
    rates.set("PYG", 57.867466);
    rates.set("QAR", 0.033461);
    rates.set("RON", 0.037842);
    rates.set("RSD", 0.902945);
    rates.set("RUB", 0.701313);
    rates.set("RWF", 9.189967);
    rates.set("SAR", 0.034472);
    rates.set("SBD", 0.073348);
    rates.set("SCR", 0.139736);
    rates.set("SDG", 3.496841);
    rates.set("SEK", 0.077705);
    rates.set("SGD", 0.01227);
    rates.set("SHP", 0.006678);
    rates.set("SLL", 93.93452);
    rates.set("SOS", 5.314539);
    rates.set("SRD", 0.130077);
    rates.set("SSP", 1.197105);
    rates.set("STD", 190.585355);
    rates.set("STN", 0.191155);
    rates.set("SVC", 0.080388);
    rates.set("SYP", 11.556599);
    rates.set("SZL", 0.133798);
    rates.set("THB", 0.287352);
    rates.set("TJS", 0.104749);
    rates.set("TMT", 0.032165);
    rates.set("TND", 0.025392);
    rates.set("TOP", 0.020833);
    rates.set("TRY", 0.073822);
    rates.set("TTD", 0.062491);
    rates.set("TWD", 0.260361);
    rates.set("TZS", 21.31189);
    rates.set("UAH", 0.256891);
    rates.set("UGX", 33.257075);
    rates.set("USD", 0.00919);
    rates.set("UYU", 0.405619);
    rates.set("UZS", 96.560597);
    rates.set("VES", 21871.425015);
    rates.set("VND", 212.01778);
    rates.set("VUV", 1.006727);
    rates.set("WST", 0.023268);
    rates.set("XAF", 5.038473);
    rates.set("XAG", 0.000355);
    rates.set("XAU", 0.000005);
    rates.set("XCD", 0.024837);
    rates.set("XDR", 0.006434);
    rates.set("XOF", 5.038473);
    rates.set("XPD", 0.000003);
    rates.set("XPF", 0.916599);
    rates.set("XPT", 0.000008);
    rates.set("YER", 2.300747);
    rates.set("ZAR", 0.130461);
    rates.set("ZMW", 0.203861);
    rates.set("ZWL", 2.959219);

    const specialNames = new Set();
    specialNames.add("Watame TL [EN]");

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
    request.open("GET", "https://api.exchangerate.host/latest?base=JPY");
    request.responseType = "json";
    request.onload = function() {
        if(request.status != 200) {
            return;
        }
        Object.keys(request.response.rates).forEach((key) => {
            setRate(key, request.response.rates[key]);
        });
    };
    request.send();

    // toYen parses the value of a string that looks like "C$1,000.10" and
    // returns its equivalent value in yen, or 0 if its value cannot be found.
    const toYen = function(text) {
        const match = text.match(/([^\d.,\s]+)+(.*)/);
        const symbol = match[1];
        const value = match[2].replace(/,/g, "");
        const rate = rates.get(symbol) || rates.get(symbolMap.get(symbol));
        if(!rate) {
            console.error("no rate for symbol " + symbol);
            return 0;
        }
        return parseFloat(value, 10) / rate;
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
    translationDiv.style.overflowY = "scroll";
    translationDiv.style.height = "20ex";

    // Web components are loaded asynchronously with Javascript but there appears to be no
    // "finished loading" event to listen to for the elements we need to build on.
    // Consequently, we have to keep polling for them until they are loaded.
    const loadguard = setInterval(function() {
        const messages = document.getElementById("chatframe")?.contentDocument?.querySelector("div#items.yt-live-chat-item-list-renderer");
        if(!messages) {return;}

        clearInterval(loadguard);

        const primary = document.getElementById("primary-inner");
        primary.insertBefore(translationDiv, primary.firstElementChild.nextSibling);

        const sidebar = document.getElementById("secondary");
        sidebar.insertBefore(counterDiv, sidebar.firstChild);

        const callback = function(mutationsList, observer) {
            mutationsList.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    const purchaseNode = node.querySelector("#purchase-amount"); // See footnote 1
                    if (purchaseNode != null) {
                        const jpy = toYen(purchaseNode.textContent);
                        total = total + jpy;
                        counterDiv.innerHTML = "¥" + Math.trunc(total) + " (¥" + Math.trunc(total * 0.315) + ")";
                    }
                    const messageNode = node.querySelector("#message"); // See footnote 1
                    if (messageNode != null) {
                        // Replace emoji images
                        let emojiList = messageNode.getElementsByClassName("emoji");
                        let index = emojiList.length - 1;
                        while(index >= 0) {
                            const emoji = emojiList.item(index);
                            if(emoji.src.endsWith(".svg")) {
                                emoji.replaceWith(emoji.alt);
                            }
                            --index;
                        }
                        // Extract translations
                        const author = node.querySelector("#author-name");
                        const isModerator = author.classList.contains("moderator");
                        const isOwner = author.classList.contains("owner");
                        const isSpecial = specialNames.has(author.textContent);
                        const text = messageNode.textContent;
                        let match = /^[\[\(]?(英訳\/)?ENG?[\]\):\-\}]+/i.test(text);
                        if(match || isModerator || isOwner || isSpecial) {
                            const paragraph = document.createElement("p");
                            paragraph.innerHTML = messageNode.innerHTML + " <span style=\"color:grey;font-size:0.75em\">(" + author.innerHTML + ")</span>";
                            translationDiv.insertBefore(paragraph, translationDiv.firstElementChild);
                        }
                    }
                });
            });
        };

        const observer = new MutationObserver(callback);
        observer.observe(messages, {childList : true});
    }, 100);
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
