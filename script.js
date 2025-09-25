const activityData = {
  transport: {
    "car-petrol": { name: "Car (Petrol)", unit: "km", co2PerUnit: 0.21 },
    "car-diesel": { name: "Car (Diesel)", unit: "km", co2PerUnit: 0.17 },
    bus: { name: "Bus", unit: "km", co2PerUnit: 0.08 },
    train: { name: "Train", unit: "km", co2PerUnit: 0.04 },
    "flight-domestic": {
      name: "Flight (Domestic)",
      unit: "km",
      co2PerUnit: 0.25,
    },
    "flight-international": {
      name: "Flight (International)",
      unit: "km",
      co2PerUnit: 0.15,
    },
    motorcycle: { name: "Motorcycle", unit: "km", co2PerUnit: 0.12 },
  },
  food: {
    beef: { name: "Beef", unit: "kg", co2PerUnit: 27.0 },
    pork: { name: "Pork", unit: "kg", co2PerUnit: 12.1 },
    chicken: { name: "Chicken", unit: "kg", co2PerUnit: 6.9 },
    fish: { name: "Fish", unit: "kg", co2PerUnit: 6.1 },
    dairy: { name: "Dairy Products", unit: "kg", co2PerUnit: 3.2 },
    vegetables: { name: "Vegetables", unit: "kg", co2PerUnit: 2.0 },
    rice: { name: "Rice", unit: "kg", co2PerUnit: 2.7 },
    bread: { name: "Bread", unit: "kg", co2PerUnit: 0.9 },
  },
  energy: {
    electricity: { name: "Electricity", unit: "kWh", co2PerUnit: 0.5 },
    "natural-gas": { name: "Natural Gas", unit: "kWh", co2PerUnit: 0.2 },
    "heating-oil": { name: "Heating Oil", unit: "liters", co2PerUnit: 2.5 },
    coal: { name: "Coal", unit: "kg", co2PerUnit: 2.4 },
    wood: { name: "Wood Burning", unit: "kg", co2PerUnit: 1.8 },
  },
};

let activitiesListArray = [];
let catChart;
let currentFilter = "all";

let catSelect = document.getElementById("category");
let actSelect = document.getElementById("activity");
let amtInput = document.getElementById("amount");
let unitText = document.getElementById("unit-label");
let form = document.getElementById("activity-form");
let actList = document.getElementById("activities-list");

const API_URL = "http://localhost:3001/api";
const jwt = localStorage.getItem("jwt");

if (!jwt) {
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
  addEventListeners();
  fetchAndRenderActivities();
  fetchAndRenderSummary();
  fetchAndRenderCommunityAverage();
  fetchAndRenderWeeklySummary();
  fetchAndRenderLeaderboard();
  fetchAndRenderWeeklyGoal();
  setupWebSocketForTips();
});
async function fetchAndRenderWeeklyGoal() {
  try {
    const res = await fetch(`${API_URL}/insights/weekly`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    const data = await res.json();
    const goalDiv = document.getElementById('weekly-goal');
goalDiv.innerHTML = `<h3><span class="material-symbols-rounded">flag</span> Weekly Goal</h3>
  <div class="goal-tip">${data.tip}</div>
      <div>Target: Reduce ${data.targetReduction} kg CO₂ in ${data.category || ''}</div>
      <div>Current: ${data.total ? data.total.toFixed(1) : 0} kg CO₂</div>`;
  } catch (err) {
    document.getElementById('weekly-goal').innerHTML = '<h3>Weekly Goal</h3><div>Unable to load tip.</div>';
  }
}

function setupWebSocketForTips() {
  if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
    script.onload = connectSocket;
    document.body.appendChild(script);
  } else {
    connectSocket();
  }
}

function connectSocket() {
  const socket = io('http://localhost:3001');
  socket.on('weeklyTip', (goal) => {
    document.getElementById('weekly-goal').innerHTML = `<h3>Weekly Goal</h3>
      <div>${goal.tip}</div>
      <div>Target: Reduce ${goal.targetReduction} kg CO₂ in ${goal.category || ''}</div>
      <div>Current: ${goal.total ? goal.total.toFixed(1) : 0} kg CO₂</div>`;
  });
}

function addEventListeners() {
  catSelect.addEventListener("change", catChanged);
  form.addEventListener("submit", formSubmitted);

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));

      this.classList.add("active");

      currentFilter = this.dataset.filter;
      renderActivitiesList();
    });
  });
}

function catChanged() {
  let selectedCat = catSelect.value;
  actSelect.innerHTML = "<option value=''>Select Activity</option>";
  actSelect.disabled = true;
  amtInput.disabled = true;
  unitText.textContent = "";

  if (selectedCat) {
    let acts = activityData[selectedCat];
    for (let key in acts) {
      let opt = document.createElement("option");
      opt.value = key;
      opt.textContent = acts[key].name;
      actSelect.appendChild(opt);
    }
    actSelect.disabled = false;

    actSelect.addEventListener("change", function () {
      let actKey = actSelect.value;
      if (actKey) {
        unitText.textContent = activityData[selectedCat][actKey].unit;
        amtInput.disabled = false;
      } else {
        unitText.textContent = "";
        amtInput.disabled = true;
      }
    });
  }
}

async function formSubmitted(e) {
  e.preventDefault();
  let cat = catSelect.value;
  let actKey = actSelect.value;
  let amt = parseFloat(amtInput.value);
  if (!cat || !actKey || isNaN(amt)) {
    alert("Fill all fields");
    return;
  }
  let actInfo = activityData[cat][actKey];
  let newAct = {
    category: cat,
    name: actInfo.name,
    amount: amt,
    unit: actInfo.unit,
    co2Emissions: amt * actInfo.co2PerUnit,
    timestamp: new Date().toISOString(),
  };
  try {
    await fetch(`${API_URL}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(newAct),
    });
    form.reset();
    amtInput.disabled = true;
    actSelect.disabled = true;
    unitText.textContent = "";
    fetchAndRenderActivities();
    fetchAndRenderSummary();
    fetchAndRenderWeeklySummary();
    fetchAndRenderCommunityAverage();
    fetchAndRenderLeaderboard();
  } catch (err) {
    alert("Failed to add activity");
  }
}

async function fetchAndRenderActivities() {
  try {
    const res = await fetch(`${API_URL}/activities`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    let data = await res.json();
    activitiesListArray = Array.isArray(data) ? data.filter(a => a.timestamp && typeof a.co2Emissions === 'number') : [];
    renderActivitiesList();
    updateCategoryPieChart();
    fetchAndRenderSummary();
  } catch (err) {
    actList.innerHTML = '<p class="no-activities">Failed to load activities.</p>';
    activitiesListArray = [];
    fetchAndRenderSummary();
  }
}

function renderActivitiesList() {
  let filtered = activitiesListArray;
  if (currentFilter !== "all") {
    filtered = activitiesListArray.filter((act) => act.category === currentFilter);
  }
  if (filtered.length === 0) {
    actList.innerHTML = "<p class='no-activities'>No activities logged yet. Start by adding your first activity above!</p>";
    return;
  }
  actList.innerHTML = "";
  const template = document.getElementById("activity-item-template");
  filtered.forEach(function (act) {
    const clone = template.content.cloneNode(true);
    clone.querySelector(".activity-info").textContent = `${act.name} - ${act.amount} ${act.unit} - ${act.co2Emissions.toFixed(2)} kg CO2`;
    const delBtn = clone.querySelector(".delete-btn");
    delBtn.onclick = function () {
      deleteActivity(act._id);
    };
    actList.appendChild(clone);
  });
}

async function deleteActivity(id) {
  try {
    const res = await fetch(`${API_URL}/activities/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    });
    fetchAndRenderActivities();
    fetchAndRenderSummary();
    fetchAndRenderWeeklySummary();
    fetchAndRenderCommunityAverage();
    fetchAndRenderLeaderboard();
  } catch (err) {
    console.error('Error deleting activity:', err);
    alert("Failed to delete activity");
  }
}

async function fetchAndRenderSummary() {
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6); // includes today
  let todayTotal = 0;
  let weekTotal = 0;
  activitiesListArray.forEach(function (act) {
    const actDate = new Date(act.timestamp);
    if (
      actDate.getFullYear() === todayYear &&
      actDate.getMonth() === todayMonth &&
      actDate.getDate() === todayDate
    ) {
      todayTotal += act.co2Emissions;
    }
    if (actDate >= weekAgo && actDate <= now) {
      weekTotal += act.co2Emissions;
    }
  });
  document.getElementById("daily-total").textContent = todayTotal.toFixed(1) + " kg CO2";
  document.getElementById("weekly-total").textContent = weekTotal.toFixed(1) + " kg CO2";
  document.getElementById("activity-count").textContent = activitiesListArray.length;
}

async function fetchAndRenderCommunityAverage() {
  try {
    const res = await fetch(`${API_URL}/activities/community-average`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const data = await res.json();
    let avgDiv = document.getElementById('community-average');
    if (!avgDiv) {
      avgDiv = document.createElement('div');
      avgDiv.id = 'community-average';
      document.querySelector('.summary-section').appendChild(avgDiv);
    }
    avgDiv.innerHTML = `<h3>Community Average</h3><span>${data.average.toFixed(1)} kg CO2</span>`;
  } catch (err) {}
}

async function fetchAndRenderWeeklySummary() {
  try {
    const res = await fetch(`${API_URL}/activities/weekly`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const data = await res.json();
    let streakDiv = document.getElementById('weekly-streak');
    if (!streakDiv) {
      streakDiv = document.createElement('div');
      streakDiv.id = 'weekly-streak';
      document.querySelector('.summary-section').appendChild(streakDiv);
    }
    const days = new Set(data.map(a => new Date(a.timestamp).toDateString()));
    streakDiv.innerHTML = `<h3>Weekly Streak</h3><span>${days.size} days active</span>`;
  } catch (err) {}
}

async function fetchAndRenderLeaderboard() {
  try {
    const res = await fetch(`${API_URL}/activities/leaderboard`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const data = await res.json();
    let lbDiv = document.getElementById('leaderboard');
    if (!lbDiv) {
      lbDiv = document.createElement('div');
      lbDiv.id = 'leaderboard';
      document.querySelector('.summary-section').appendChild(lbDiv);
    }
    lbDiv.innerHTML = `<h3>Leaderboard (Lowest CO2)</h3>` +
      data.map((u, i) => `<div>${i+1}. ${u.username}: ${u.total.toFixed(1)} kg CO2</div>`).join('');
  } catch (err) {}
}

function updateChartsOnLoad() {
  updateCategoryPieChart();
}

function updateCategoryPieChart() {
  let ctx = document.getElementById("category-chart").getContext("2d");

  let categoryTotals = {};
  activitiesListArray.forEach(function (act) {
    if (!categoryTotals[act.category]) {
      categoryTotals[act.category] = 0;
    }
    categoryTotals[act.category] += act.co2Emissions;
  });

  let labels = Object.keys(categoryTotals);
  let data = Object.values(categoryTotals);

  let colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

  if (catChart) {
    catChart.destroy();
  }

  catChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.slice(0, labels.length),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

