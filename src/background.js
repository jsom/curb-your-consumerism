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

const cache = {};

browser.runtime.onInstalled.addListener(async function (details) {
  if (await isOnboarded()) { return; }
  browser.tabs.create({ url: "settings.html" });
});

browser.browserAction.onClicked.addListener(async function(activeTab) {
  const page = await launchPage();
  console.log("browserAction", page);
  browser.tabs.create({ url: page });
});

browser.tabs.onRemoved.addListener(function (tabId) {
  delete cache[tabId];
});

browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status !== "complete") { return; }
  browser.tabs.sendMessage(tabId, { type: "URL_UPDATED" }).catch(() => {});
});

browser.runtime.onConnect.addListener(function (port) {
  if (!port.sender.tab) { return; }
  const tabId = port.sender.tab.id;
  console.log("onConnect", tabId);

  const response = cache[tabId] || {};
  console.log("onConnect posting", tabId, response);
  port.postMessage(response);
});

browser.runtime.onMessage.addListener(async function (message, sender) {
  console.log("onMessage", message);
  const tabId = sender.tab.id;
  const oldCache = cache[tabId];
  const currentTime = Date.now();
  const COOLDOWN = 100000;
  if (oldCache && (oldCache.url == sender.url || currentTime - oldCache.time < COOLDOWN)) {
    console.log({
      currentTime,
      oldTime: oldCache.time,
      result: currentTime - oldCache.time < COOLDOWN
    });
    return;
  }

  cache[tabId] = {
    price: message.price,
    url: sender.url,
    time: Date.now()
  };

  browser.tabs.update(tabId, {
    url: await launchPage()
  });

  return { status: "ok" };
});

async function launchPage() {
  return (await isOnboarded()) ? 'show.html' : 'settings.html';
};

async function isOnboarded() {
  const settings = await browser.storage.local.get(["onboarded"]);
  return settings.onboarded || false;
};
