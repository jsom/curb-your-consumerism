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

const port = browser.runtime.connect({ name: 'Curb Your Consumerism' });
const priceEl = document.getElementById('price');
const calcContainer = document.getElementById('calc-container');
const loaderCountdown = document.getElementById('loader-countdown');
const promptContainer = document.getElementById('prompt-container');
const prompt = document.getElementById('prompt');
const quoteContainer = document.getElementById('quote-container');
const quote = document.getElementById('quote');
const quoteAuthorContainer = document.getElementById('quote-author-container');
const quoteAuthor = document.getElementById('quote-author');
const earningsEl = document.getElementById('earnings');

const eventForm = document.getElementById('event-form');
const formPriceInput = document.getElementById('event-form-amount');
const formUrlInput = document.getElementById('event-form-url');
const formSecondsInput = document.getElementById('event-form-seconds');
const formShareCommunityInput = document.getElementById('event-form-share-community');
const formSecondsWaitedInput = document.getElementById('event-form-seconds-waited');

const goodButtonEl = document.getElementById('good');
const badButtonEl = document.getElementById('bad');
const cancelButtonEl = document.getElementById('cancel');
const donateButtonEl = document.getElementById('donate');
const savedContainer = document.getElementById('saved-container');
const savedMoneyEl = document.getElementById('saved-money');
const savedTimeEl = document.getElementById('saved-time');

let countdownCounter = null;
let promptCounter = null;
let startTime = null;
let salaryPerMillisecond = null;
let savedMoney = 0;
let savedTime = 0;
let seconds = 0;
let url = null;
let price = null;
let goodButtonTextTemplate = null;
let badButtonTextTemplate = null;
let goodEmojiTemplate = null;
let badEmojiTemplate = null;
let donateUrl = null;

const baseUrl = 'https://www.curbyourconsumerism.app';
const promptsUrl = `${baseUrl}/prompts/random`;
const donateConfigUrl = `${baseUrl}/donate/config`;
const eventsUrl = `${baseUrl}/events.json`;

async function startCountdown(newPrice) {
  const settings = await getSettings();
  updateSavingsView(settings);

  price = newPrice || 10;
  priceEl.value = price;

  startTime = Date.now();

  const salaryPerHour = calculateSalaryPerHour(settings.salary, settings.salaryTime, settings.hoursPerWeek);
  salaryPerMillisecond = salaryPerHour / 3600000;
  const hours = price / salaryPerHour;
  seconds = Math.ceil(hours * 3600);

  const timeDescription = buildTimeDescription(seconds);
  calc.innerText = timeDescription;

  animationTime = Math.max(seconds, minimumCountdown);

  goodButtonEl.value = buildText(goodButtonTextTemplate, price, timeDescription, goodEmojiTemplate);
  badButtonEl.innerText = buildText(badButtonTextTemplate, price, timeDescription, badEmojiTemplate);

  clearInterval(countdownCounter);
  updateCountdown();
  countdownCounter = setInterval(updateCountdown, 1000);

  updateDonateButton(price, timeDescription);
};

function calculateSalaryPerHour(salary, salaryTime, hoursPerWeek) {
  switch (salaryTime) {
    case 'hour': return salary;
    case 'week': return salary / hoursPerWeek;
    default: return salary / 52 / hoursPerWeek;
  }
}

function buildText(template, price, timeDescription, emoji) {
  const text = template
    .replace("${cost}", price)
    .replace("${time}", timeDescription);
  if (emoji) {
    return text + " " + emoji;
  } else {
    return text;
  }
}

async function updateSavingsView(settings) {
  savedContainer.style.display = settings.savedMoney > 0 ? 'block' : 'none';
  savedMoneyEl.innerText = `$${settings.savedMoney.toFixed(2)}`;
  savedTimeEl.innerText = buildTimeDescription(settings.savedTime);
};

function updateCountdown() {
  const differenceInMilliseconds = Date.now() - startTime;
  const differenceInSeconds = Math.max(Math.round((Date.now() - startTime) / 1000), 0);
  const earned = Math.min(differenceInMilliseconds * salaryPerMillisecond, price);
  const earnedFormatted = (Math.ceil(earned * 100) / 100).toFixed(2);
  earningsEl.innerText = `${earnedFormatted} earned`;
  if (earned >= price) {
    clearInterval(countdownCounter);
    clearInterval(promptCounter);
    loaderCountdown.innerText = "Time to make a choice";
  } else {
    const remaining = animationTime - differenceInSeconds;
    loaderCountdown.innerText = `${buildTimeDescription(remaining)} remaining`;
  }
};

async function updatePrompt() {
  const response = await fetch(promptsUrl);
  const newPrompt = await response.json();

  if (newPrompt.author) {
    promptContainer.style.display = "none";
    prompt.innerText = "";

    quote.textContent = newPrompt.text;
    quoteContainer.style.display = "inline";
    quoteAuthor.innerText = newPrompt.author;
    quoteAuthorContainer.style.display = "inline";
  } else {
    prompt.innerText = newPrompt.text;
    promptContainer.style.display = "inline";

    quoteContainer.style.display = "none";
    quote.innerText = "";
    quoteAuthorContainer.style.display = "none";
    quoteAuthor.innerText = "";
  }
};

let donateConfig = {};
async function getDonateConfig() {
  const response = await fetch(donateConfigUrl);
  return await response.json();
}

async function updateDonateButton(price, timeDescription) {
  if (!donateConfig.buttonText) { return; }

  donateButtonEl.value = buildText(donateConfig.buttonText, price, timeDescription);
  donateUrl = donateConfig.url;
  donateButtonEl.style.display = "block";
};

function performSubmit(settings, price, seconds, differenceInSeconds) {
  if (settings.shareCommunity) {
    formPriceInput.value = price;
    formSecondsInput.value = seconds;
    formSecondsWaitedInput.value = differenceInSeconds;
    formUrlInput.value = url || null;
  } else {
    formPriceInput.value = null;
    formSecondsInput.value = null;
    formSecondsWaitedInput.value = null;
    formUrlInput.value = null;
  }
  formShareCommunityInput.value = settings.shareCommunity;
  eventForm.submit();
}

async function performSubmitFirefox(settings, price, seconds, differenceInSeconds) {
  // Firefox has a bug that hasn't been fixed in 3 years.
  // It sends form submits from web extensions as GET requests. ¯\_(ツ)_/¯
  // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1344465
  if (settings.shareCommunity) {
    const response = await fetch(eventsUrl, {
      method: 'POST',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: price,
        seconds: seconds,
        url: url
      })
    });
    const json = await response.json();
    window.location.href = json.path;
  } else {
    window.location.href = "https://www.curbyourconsumerism.app";
  }
}

async function isFirefox() {
  const browserInfo = browser.runtime.getBrowserInfo && await browser.runtime.getBrowserInfo();
  return browserInfo && browserInfo.name === "Firefox";
}

port.onMessage.addListener(async (message) => {
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    goodButtonEl.disabled = true;

    const settings = await getSettings();
    const savedMoney = settings.savedMoney + parseFloat(price);
    const savedTime = settings.savedTime + seconds;
    const savingsHistory = settings.savingsHistory;
    const views = settings.views + 1;

    savingsHistory.push({
      domain: getDomain(url),
      amount: price,
      seconds: seconds
    });

    await saveSettings({
      savedMoney: savedMoney,
      savedTime: savedTime,
      savingsHistory: savingsHistory,
      views: views,
    });

    const differenceInSeconds = Math.max(Math.round((Date.now() - startTime) / 1000), 0);

    try {
      if (await isFirefox()) {
        performSubmitFirefox(settings, price, seconds, differenceInSeconds);
      } else {
        performSubmit(settings, price, seconds, differenceInSeconds);
      }
    } finally {
      goodButtonEl.disabled = false;
    }
  });

  badButtonEl.addEventListener("click", async (e) => {
    e.preventDefault();

    const settings = await getSettings();
    const spendingHistory = settings.spendingHistory;

    spendingHistory.push({
      domain: getDomain(url),
      amount: price,
      seconds: seconds
    });

    await saveSettings({
      spendingHistory: spendingHistory
    });

    window.location.href = url;
  });

  donateButtonEl.addEventListener("click", async (e) => {
    e.preventDefault();

    window.location.href = donateUrl;
  });

  cancelButtonEl.addEventListener("click", (e) => {
    e.preventDefault();

    window.location.href = url;
  });

  url = message.url;

  if (!url) {
    badButtonEl.style.display = "none";
    cancelButtonEl.style.display = "none";
  }

  // Setup prompt
  updatePrompt();
  promptCounter = setInterval(updatePrompt, 60000);

  // Setup calculation
  const { views } = await getSettings();
  goodButtonTextTemplate = views < 5 ? goodButtonTexts[0] : random(goodButtonTexts);
  badButtonTextTemplate = views < 5 ? badButtonTexts[0] : random(badButtonTexts);
  goodEmojiTemplate = random(goodEmoji);
  badEmojiTemplate = random(badEmoji);

  donateConfig = await getDonateConfig();

  startCountdown(message.price);

  priceEl.addEventListener("keyup", (event) => {
    if (priceEl.value !== "") {
      startCountdown(priceEl.value);
    }
  });
});