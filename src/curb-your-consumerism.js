/*
  Curb Your Consumerism
  Copyright (C) 2019  James Robert Somers

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const body = document.getElementsByTagName("body")[0];
const hrefRegex = /\/.*\/(buy\/spc\/handlers\/display)|\/.*(checkout)|\/.*(shopping-cart)|\/.*(co-cart)/gi;
const targetClasses = [
  ".grand-total-price",
  ".grand-total",
  "[data-automation-id='pos-grand-total-amount']",
  "[data-at='order_total']"
].join(", ");

const ELEMENT_NODE_TYPE = 1;
const TEXT_NODE_TYPE = 3;
const UNEXPANDABLE = /(script|style|svg|audio|canvas|figure|video|select|input|textarea)/i;
const ZERO_MATCH = {
  value: 0,
  fontSize: 0
};

function isVisible(node) {
  const style = window.getComputedStyle(node);
  return !style || style.getPropertyValue("display") !== "none";
};

function isTextNode(node) {
  return node && node.nodeType === TEXT_NODE_TYPE;
};

function isExpandable(node) {
  return node &&
    node.nodeType === ELEMENT_NODE_TYPE &&
    node.childNodes &&
    !UNEXPANDABLE.test(node.tagName) &&
    isVisible(node);
};

function parseCurrency(text) {
  try {
    return parseFloat(text.replace(/\$/g, "").replace(/,/g, ""));
  } catch {
    return null;
  }
};

function sendPriceMessage(price) {
  browser.runtime.sendMessage({ price });
}

const regex = /\$(\d{1,3})(,\d{1,3})*(\.\d{1,})?/gi;

function findMax(node) {
  if (isTextNode(node)) {
    const fontSize = getFontSize(node);

    const matches = Array.from(node.data.matchAll(regex))
      .map(match => match[0].replace(/(\$|,)/gi, ""))
      .filter(match => !isNaN(match))
      .map(parseCurrency);

    const max = Math.max(matches);

    return {
      value: max,
      fontSize: fontSize
    }
  } else if (isExpandable(node)) {
    const childMatches = Array.from(node.childNodes)
      .map(findMax)
      .filter(max => max.value > 0.0);

    return findMaxFromMatches(childMatches);
  }
  return ZERO_MATCH;
}

function findMaxFromMatches(matches) {
  return matches.reduce(compareMatches, ZERO_MATCH);
}

function compareMatches(currentMaxMatch, match) {
    const largerFontSize = match.fontSize > currentMaxMatch.fontSize && match.value > 1;
    const sameFontSizeLargerValue = match.fontSize == currentMaxMatch.fontSize && match.value >= currentMaxMatch.value;
    if (largerFontSize || sameFontSizeLargerValue) {
      return match;
    } else {
      return currentMaxMatch;
    }
}

function getFontSize(textNode) {
  const computedStyles = window.getComputedStyle(textNode.parentElement, null);

  const textDecoration = computedStyles.getPropertyValue("decoration");
  if (textDecoration.includes("line-through")) { return 0; }

  // TODO: Don't completely ignore %, relative or text based values for font-size
  const fontSize = computedStyles.getPropertyValue("font-size").replace(/[^0-9.]/g, "");
  try {
    return parseFloat(fontSize);
  } catch {
    return 0;
  }
}

const observer = new MutationObserver(findPrice);

function findBySelector() {
  const match = document.querySelector(targetClasses);
  if (match) {
    return parseCurrency(match.textContent);
  }
}

function findByScan() {
  const max = findMax(body);
  if (max && max.value > 1) {
    return max.value;
  }
}

function findPrice() {
  const result = findBySelector() || findByScan();
  if (result) {
    observer.disconnect();
    sendPriceMessage(result);
  }
}

function matchCheckout() {
  return window.location.href.match(hrefRegex) || document.title.includes("Checkout");
}

function handleUrlLoad() {
  if (matchCheckout()) {
    console.log("curb-your-consumerism.js: match", window.location.href);
    observer.observe(body, { childList: true, subtree: true });
  } else {
    observer.disconnect();
  }
}

(() => {
  handleUrlLoad();
  browser.runtime.onMessage.addListener(async message => {
    if (message.type === "URL_UPDATED") {
      handleUrlLoad();
    }
  });
})();
