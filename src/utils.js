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

const goodButtonTexts = [
  'Save $${cost}',
  'Save ${time} of my life',
  'Alternate dopamine hit',
  'Reduce carbon footprint',
  'Fight your programming',
  'Save for a rainy day',
];
const badButtonTexts = [
  'Spend $${cost}',
  'Spend ${time} of my life',
  'Propagate consumerism',
  'Succumb',
  'It\'s a rainy day',
];
const goodEmoji = [
  "👍",
  "🌱",
  "🪴",
  "🌲",
];
const badEmoji = [
  "👎",
  "🤡",
  "🤡🤳",
  "🤦‍♂️",
  "🤦‍♀️",
  "💸",
  "🥀",
  "🧐",
  "🤨",
  "😳",
  "😥",
  "😨",
  "🥺",
];
const minimumCountdown = 60;
const secondsInHour = 3600;
const secondsInDay = 86400;
const secondsInWeek = 604800;
const secondsInYear = 31557600;
const secondsInDecade = 315576000;
const secondsInCentury = 3155760000;
const timePeriods = [
  // { singular: "century", plural: "centuries", length: secondsInCentury },
  // { singular: "decade",  plural: "decades", length: secondsInDecade },
  // { singular: "year",    plural: "years", length: secondsInYear },
  // { singular: "week",    plural: "weeks", length: secondsInWeek },
  // { singular: "day",     plural: "days", length: secondsInDay },
  { singular: "hour",    plural: "hours", length: secondsInHour },
  { singular: "minute",  plural: "minutes", length: 60 },
  { singular: "second",  plural: "seconds", length: 1 }
];

function pluralize(timePeriod, value) {
  const description = value === 1 ? timePeriod.singular : timePeriod.plural;
  return `${value} ${description}`;
};

function buildTimeDescription(seconds) {
  const segments = timePeriods.reduce(function (result, timePeriod) {
    if (seconds > timePeriod.length) {
      const times = Math.floor(result.remaining / timePeriod.length);
      const remaining = result.remaining % timePeriod.length;
      const description = pluralize(timePeriod, times);
      result.remaining = remaining;
      result.descriptions.push(description);
    }
    return result;
  }, {
    remaining: seconds,
    descriptions: []
  }).descriptions;

  const length = segments.length;
  if (length === 0) { return '0 seconds'; }
  if (length === 1) { return segments[0]; }
  return segments.slice(0, -1).join(', ') + ' and ' + segments[length - 1];
};

const settingsAttributes = [
  'hoursPerWeek',
  'salary',
  'salaryTime',
  'savedMoney',
  'savedTime',
  'shareCommunity',
  'history',
  'onboarded'
];
const emptySettings = {
  hoursPerWeek: 40,
  salary: 40000,
  salaryTime: "year",
  savedMoney: 0,
  savedTime: 0,
  shareCommunity: false,
  spendingHistory: [],
  savingsHistory: [],
  onboarded: false,
  views: 0,
};

async function getSettings() {
  const persistedSettings = await browser.storage.local.get(settingsAttributes);
  return Object.assign({}, emptySettings, persistedSettings);
};

function resetSettings() {
  return browser.storage.local.clear();
};

function saveSettings(newSettings) {
  return browser.storage.local.set(newSettings);
}

function random(array) {
  return array[Math.floor(Math.random() * array.length)];
};

function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function parseCurrency(text) {
  try {
    return parseFloat(text.replace(/\$/g, "").replace(/,/g, ""));
  } catch {
    return null;
  }
};