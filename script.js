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

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Loaded");
  loadActivitiesFromLocal();
  addEventListeners();
  updateSummaryInfo();
  updateChartsOnLoad();
});

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

function formSubmitted(e) {
  e.preventDefault();
  console.log("Form submitted!");

  let cat = catSelect.value;
  let actKey = actSelect.value;
  let amt = parseFloat(amtInput.value);

  if (!cat || !actKey || isNaN(amt)) {
    alert("Fill all fields");
    return;
  }

  let actInfo = activityData[cat][actKey];
  let co2 = amt * actInfo.co2PerUnit;

  let newAct = {
    id: Date.now(),
    category: cat,
    name: actInfo.name,
    amount: amt,
    unit: actInfo.unit,
    co2Emissions: co2,
    timestamp: new Date().toISOString(),
  };

  activitiesListArray.unshift(newAct);
  saveActivitiesToLocal();
  renderActivitiesList();
  updateSummaryInfo();
  updateChartsOnLoad();

  form.reset();
  amtInput.disabled = true;
  actSelect.disabled = true;
  unitText.textContent = "";
}

function renderActivitiesList() {
  let filtered = activitiesListArray;
  if (currentFilter !== "all") {
    filtered = activitiesListArray.filter(
      (act) => act.category === currentFilter
    );
  }

  if (filtered.length === 0) {
    actList.innerHTML =
      "<p class='no-activities'>No activities logged yet. Start by adding your first activity above!</p>";
    return;
  }

  actList.innerHTML = "";
  const template = document.getElementById("activity-item-template");

  filtered.forEach(function (act) {
    const clone = template.content.cloneNode(true);
    clone.querySelector(".activity-info").textContent = `${act.name} - ${
      act.amount
    } ${act.unit} - ${act.co2Emissions.toFixed(2)} kg CO2`;
    const delBtn = clone.querySelector(".delete-btn");
    delBtn.onclick = function () {
      deleteActivity(act.id);
    };
    actList.appendChild(clone);
  });
}

function deleteActivity(id) {
  activitiesListArray = activitiesListArray.filter((a) => a.id !== id);
  saveActivitiesToLocal();
  renderActivitiesList();
  updateSummaryInfo();
  updateChartsOnLoad();
}

function updateSummaryInfo() {
  let today = new Date().toDateString();
  let weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let todayTotal = 0;
  let weekTotal = 0;

  activitiesListArray.forEach(function (act) {
    let actDate = new Date(act.timestamp);
    if (actDate.toDateString() === today) {
      todayTotal += act.co2Emissions;
    }
    if (actDate >= weekAgo) {
      weekTotal += act.co2Emissions;
    }
  });

  document.getElementById("daily-total").textContent =
    todayTotal.toFixed(1) + " kg CO2";
  document.getElementById("weekly-total").textContent =
    weekTotal.toFixed(1) + " kg CO2";
  document.getElementById("activity-count").textContent =
    activitiesListArray.length;
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

function saveActivitiesToLocal() {
  localStorage.setItem(
    "carbonFootprintActivities",
    JSON.stringify(activitiesListArray)
  );
}

function loadActivitiesFromLocal() {
  let data = localStorage.getItem("carbonFootprintActivities");
  if (data) {
    activitiesListArray = JSON.parse(data);
    renderActivitiesList();
  }
}
