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

(async () => {
  const salaryInput = document.getElementById("salary");
  const salaryTimeInput = document.getElementById("salary-time");
  const validSalaryTimes = ["year", "week", "hour"];
  const hoursPerWeekInput = document.getElementById("hours-per-week");
  const shareCommunityInput = document.getElementById("share-community");
  const saveSettingsButton = document.getElementById("save-settings");
  const settings = await getSettings();
  salaryInput.value = settings.salary;
  salaryTimeInput.value = settings.salaryTime;
  hoursPerWeekInput.value = settings.hoursPerWeek;
  shareCommunityInput.checked = settings.shareCommunity;

  const focusHandler = function (e) {
    e.target.select();
  };
  salaryInput.addEventListener("focus", focusHandler);
  hoursPerWeekInput.addEventListener("focus", focusHandler);

  saveSettingsButton.addEventListener("click", async (e) => {
    e.preventDefault();

    const salary = parseCurrency(salaryInput.value);
    const salaryTime = validSalaryTimes.includes(salaryTimeInput.value) ? salaryTimeInput.value : "year";
    const hoursPerWeek = parseCurrency(hoursPerWeekInput.value);
    const shareCommunity = shareCommunityInput.checked;

    await saveSettings({ salary, salaryTime, hoursPerWeek, shareCommunity, onboarded: true });

    window.location.href = settings.onboarded ? "show.html" : "https://www.curbyourconsumerism.app/welcome";
  });

  // TODO
  // resetSavingsButton.onClick = () => {
  //   chrome.storage.local.set({
  //     savedTime: 0,
  //     savedMoney: 0,
  //     savingsHistory: [],
  //     spendingHistory: []
  //   }, window.close);
  // };
})();
