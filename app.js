const ACTIVITY_LABELS = {
  "1.2": "Sedentary",
  "1.375": "Light exercise",
  "1.55": "Moderate exercise",
  "1.725": "Heavy exercise",
  "1.9": "Athlete",
};

const FOOD_PRESETS = {
  breakfast: {
    items: ["eggs", "oats", "berries", "Greek yogurt"],
    calories: 520,
    protein: 34,
    carbs: 54,
    fats: 17,
    fiber: 9,
    sugar: 18,
    sodium: 430,
  },
  lunch: {
    items: ["grilled chicken", "brown rice", "leafy greens", "avocado"],
    calories: 690,
    protein: 48,
    carbs: 66,
    fats: 24,
    fiber: 11,
    sugar: 9,
    sodium: 760,
  },
  dinner: {
    items: ["salmon", "sweet potato", "broccoli", "olive oil"],
    calories: 760,
    protein: 52,
    carbs: 58,
    fats: 34,
    fiber: 12,
    sugar: 11,
    sodium: 680,
  },
  snack: {
    items: ["protein smoothie", "banana", "almond butter"],
    calories: 360,
    protein: 26,
    carbs: 38,
    fats: 12,
    fiber: 6,
    sugar: 22,
    sodium: 220,
  },
};

const state = {
  participants: [],
  meals: [],
  selectedParticipantId: null,
  selectedMealType: "breakfast",
  selectedOverrideMealId: null,
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  loadState();
  bindEvents();
  renderIcons();
  renderAll();
});

function cacheElements() {
  [
    "participantSwitch",
    "seedDemo",
    "participantForm",
    "resetForm",
    "summaryReport",
    "mealImages",
    "analyzeMeal",
    "uploadStatus",
    "latestMealAnalysis",
    "mealHistory",
    "dashboardContent",
    "progressMonitor",
    "generateWeeklySummary",
    "weeklySummary",
    "progressFilter",
    "exportReports",
    "adminTable",
    "overridePanel",
    "toast",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll(".meal-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMealType = button.dataset.mealType;
      document.querySelectorAll(".meal-tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
    });
  });

  els.participantSwitch.addEventListener("change", (event) => {
    state.selectedParticipantId = event.target.value;
    saveState();
    renderAll();
  });

  els.participantForm.addEventListener("submit", handleParticipantSubmit);
  els.resetForm.addEventListener("click", () => els.participantForm.reset());
  els.seedDemo.addEventListener("click", seedDemoData);
  els.analyzeMeal.addEventListener("click", handleMealAnalysis);
  els.generateWeeklySummary.addEventListener("click", renderWeeklySummary);
  els.progressFilter.addEventListener("change", renderAdmin);
  els.exportReports.addEventListener("click", exportReports);
}

function loadState() {
  const saved = localStorage.getItem("formaFlowState");
  if (saved) {
    Object.assign(state, JSON.parse(saved));
  }
}

function saveState() {
  localStorage.setItem("formaFlowState", JSON.stringify(state));
}

function switchView(view) {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });
}

function handleParticipantSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const participant = buildParticipant(data);
  const existingIndex = state.participants.findIndex((item) => item.name.toLowerCase() === participant.name.toLowerCase());

  if (existingIndex >= 0) {
    participant.id = state.participants[existingIndex].id;
    participant.createdAt = state.participants[existingIndex].createdAt;
    state.participants[existingIndex] = participant;
  } else {
    state.participants.push(participant);
  }

  state.selectedParticipantId = participant.id;
  saveState();
  renderAll();
  showToast("Participant report generated.");
}

function buildParticipant(data) {
  const age = Number(data.age);
  const height = Number(data.height);
  const weight = Number(data.weight);
  const bodyFat = Number(data.bodyFat);
  const muscle = Number(data.muscle);
  const bmr = calculateBmr(data.gender, weight, height, age);
  const tdee = Math.round(bmr * Number(data.activity));
  const target = calculateTarget(data.goal, tdee, weight);

  return {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    age,
    gender: data.gender,
    height,
    weight,
    activity: data.activity,
    activityLabel: ACTIVITY_LABELS[data.activity],
    goal: data.goal,
    bodyFat,
    muscle,
    bmi: calculateBmi(weight, height),
    bmr: Math.round(bmr),
    tdee,
    bodyFatMass: round(weight * (bodyFat / 100), 1),
    muscleMass: round(weight * (muscle / 100), 1),
    calorieTarget: target.calories,
    proteinTarget: target.protein,
    calorieAdjustment: target.adjustment,
    timeline: target.timeline,
    createdAt: new Date().toISOString(),
    progress: generateProgress(data.goal, weight, bodyFat, muscle),
  };
}

function calculateBmi(weight, heightCm) {
  const heightM = heightCm / 100;
  return round(weight / (heightM * heightM), 1);
}

function calculateBmr(gender, weight, height, age) {
  return gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
}

function calculateTarget(goal, tdee, weight) {
  if (goal === "fat-loss") {
    return {
      calories: Math.max(1200, Math.round(tdee - 450)),
      protein: Math.round(weight * 1.9),
      adjustment: "450 kcal daily deficit",
      timeline: "8 weeks to target 5% body fat reduction",
    };
  }

  if (goal === "muscle-gain") {
    return {
      calories: Math.round(tdee + 250),
      protein: Math.round(weight * 2),
      adjustment: "250 kcal daily surplus",
      timeline: "8 weeks to target 2.5% lean mass gain",
    };
  }

  return {
    calories: Math.round(tdee),
    protein: Math.round(weight * 1.7),
    adjustment: "Maintenance calories",
    timeline: "8 weeks for composition stability and habit consistency",
  };
}

function generateProgress(goal, weight, bodyFat, muscle) {
  const days = Array.from({ length: 8 }, (_, index) => index);
  return days.map((week) => {
    const fatShift = goal === "fat-loss" ? -0.62 * week : goal === "muscle-gain" ? -0.12 * week : -0.05 * week;
    const muscleShift = goal === "muscle-gain" ? 0.32 * week : goal === "fat-loss" ? 0.05 * week : 0.08 * week;
    const weightShift = goal === "fat-loss" ? -0.45 * week : goal === "muscle-gain" ? 0.18 * week : 0;
    return {
      week,
      weight: round(weight + weightShift, 1),
      bodyFat: round(Math.max(4, bodyFat + fatShift), 1),
      muscle: round(Math.min(75, muscle + muscleShift), 1),
    };
  });
}

async function handleMealAnalysis() {
  const participant = getSelectedParticipant();
  const files = Array.from(els.mealImages.files || []);
  if (!participant) {
    showToast("Create or select a participant first.");
    return;
  }
  if (!files.length) {
    showToast("Add at least one meal image.");
    return;
  }

  els.uploadStatus.textContent = "Analyzing meal images...";
  const images = await Promise.all(files.map(fileToDataUrl));
  const meal = analyzeMeal(participant.id, state.selectedMealType, files, images);
  state.meals.unshift(meal);
  els.mealImages.value = "";
  state.selectedOverrideMealId = meal.id;
  saveState();
  renderAll();
  showToast("AI-estimated meal analysis complete.");
}

function analyzeMeal(participantId, mealType, files, images) {
  const preset = { ...FOOD_PRESETS[mealType] };
  const variance = Math.min(1.35, Math.max(0.75, 0.9 + files.length * 0.11));
  const sodiumFlag = preset.sodium > 700;
  const proteinStrong = preset.protein >= 30;
  const fiberStrong = preset.fiber >= 8;
  const score = Math.round(72 + (proteinStrong ? 10 : 0) + (fiberStrong ? 8 : 0) - (sodiumFlag ? 8 : 0) - (preset.sugar > 20 ? 5 : 0));

  return {
    id: crypto.randomUUID(),
    participantId,
    mealType,
    images,
    timestamp: new Date().toISOString(),
    items: preset.items,
    portion: files.length > 1 ? "Multiple portions or shared plate detected" : "Single standard serving estimated",
    calories: Math.round(preset.calories * variance),
    protein: Math.round(preset.protein * variance),
    carbs: Math.round(preset.carbs * variance),
    fats: Math.round(preset.fats * variance),
    fiber: Math.round(preset.fiber * variance),
    sugar: Math.round(preset.sugar * variance),
    sodium: Math.round(preset.sodium * variance),
    score: clamp(score, 0, 100),
    indicators: [
      proteinStrong ? "High-protein choice" : "Protein could improve",
      fiberStrong ? "Good fiber density" : "Add more plants",
      sodiumFlag ? "Watch sodium" : "Sodium looks moderate",
    ],
    explanation: "AI-estimated nutritional values based on visible foods, typical serving sizes, and meal context. Use this as coaching guidance, not medical diagnosis.",
    suggestions: "Prioritize a palm-sized lean protein, add colorful vegetables, and keep sauces or fried toppings portion-controlled. Hydrate before the next meal.",
    dietitianNote: "From a professional dietitian perspective, this meal can fit the plan when portion size matches the daily target and protein is distributed evenly across the day.",
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderAll() {
  ensureSelectedParticipant();
  renderParticipantSwitch();
  renderReport();
  renderMeals();
  renderDashboard();
  renderProgress();
  renderAdmin();
}

function ensureSelectedParticipant() {
  if (!state.selectedParticipantId && state.participants.length) {
    state.selectedParticipantId = state.participants[0].id;
  }
  if (state.selectedParticipantId && !state.participants.some((item) => item.id === state.selectedParticipantId)) {
    state.selectedParticipantId = state.participants[0]?.id || null;
  }
}

function renderParticipantSwitch() {
  if (!state.participants.length) {
    els.participantSwitch.innerHTML = '<option value="">No participants yet</option>';
    return;
  }

  els.participantSwitch.innerHTML = state.participants
    .map((participant) => `<option value="${participant.id}" ${participant.id === state.selectedParticipantId ? "selected" : ""}>${escapeHtml(participant.name)}</option>`)
    .join("");
}

function renderReport() {
  const participant = getSelectedParticipant();
  if (!participant) return;
  const goalLabel = formatGoal(participant.goal);
  const readiness = participant.goal === "maintenance" ? 84 : participant.goal === "fat-loss" ? 88 : 86;

  els.summaryReport.innerHTML = `
    <div class="report-card">
      <div class="report-hero">
        <div>
          <p class="eyebrow">Participant summary report</p>
          <h2>${escapeHtml(participant.name)}</h2>
          <p>${goalLabel} plan with ${participant.activityLabel.toLowerCase()} activity. ${participant.timeline}.</p>
        </div>
        <div class="score-ring" style="--score: ${readiness}%">${readiness}</div>
      </div>
      <div class="metric-grid">
        ${metric("BMI", participant.bmi)}
        ${metric("BMR", `${participant.bmr} kcal`)}
        ${metric("TDEE", `${participant.tdee} kcal`)}
        ${metric("Target", `${participant.calorieTarget} kcal`)}
        ${metric("Protein", `${participant.proteinTarget} g`)}
        ${metric("Body fat mass", `${participant.bodyFatMass} kg`)}
        ${metric("Muscle mass", `${participant.muscleMass} kg`)}
        ${metric("Adjustment", participant.calorieAdjustment)}
      </div>
      <div class="recommendation-grid">
        ${recommendation("Fitness suggestion", getFitnessSuggestion(participant))}
        ${recommendation("Diet suggestion", getDietSuggestion(participant))}
        ${recommendation("Target timeline", participant.timeline)}
        ${recommendation("Coach automation", "Daily meal upload reminders, weekly progress summaries, and underperformance alerts are ready for push, email, or WhatsApp workflows.")}
      </div>
      <div class="disclaimer">Educational coaching guidance only. This platform does not diagnose, treat, or replace medical advice. Meal analysis displays AI-estimated nutritional values.</div>
    </div>
  `;
  renderIcons();
}

function renderMeals() {
  const participant = getSelectedParticipant();
  const meals = getParticipantMeals();
  els.uploadStatus.textContent = participant
    ? `Ready for ${participant.name}. Uploads are timestamped automatically.`
    : "Select a participant and add images to begin.";

  const latest = meals[0];
  els.latestMealAnalysis.innerHTML = latest ? renderMealAnalysis(latest) : `
    <span class="icon xl" data-icon="utensils"></span>
    <h2>No meal analyzed yet</h2>
    <p>Upload breakfast, lunch, dinner, or snack images to generate estimated nutrition and coachable feedback.</p>
  `;

  els.mealHistory.innerHTML = meals.length ? meals.map(renderMealCard).join("") : `
    <div class="empty-state">
      <span class="icon xl" data-icon="calendar"></span>
      <h2>No upload history</h2>
      <p>Meal records will appear here with timestamps, scores, and AI-estimated nutrients.</p>
    </div>
  `;
  renderIcons();
}

function renderMealAnalysis(meal) {
  return `
    <div class="analysis-header">
      <div>
        <p class="eyebrow">AI-estimated nutritional values</p>
        <h2>${capitalize(meal.mealType)} score: ${meal.score}/100</h2>
      </div>
      <span class="pill">${formatDateTime(meal.timestamp)}</span>
    </div>
    <div class="food-tags">${meal.items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>
    <div class="nutrition-grid">
      ${nutrition("Calories", `${meal.calories} kcal`)}
      ${nutrition("Protein", `${meal.protein} g`)}
      ${nutrition("Carbs", `${meal.carbs} g`)}
      ${nutrition("Fats", `${meal.fats} g`)}
      ${nutrition("Fiber", `${meal.fiber} g`)}
      ${nutrition("Sugar", `${meal.sugar} g`)}
      ${nutrition("Sodium", `${meal.sodium} mg`)}
      ${nutrition("Portion", meal.portion)}
    </div>
    <div class="indicator-list">${meal.indicators.map((indicator) => `<span class="indicator ${indicatorClass(indicator)}">${escapeHtml(indicator)}</span>`).join("")}</div>
    <p>${escapeHtml(meal.explanation)}</p>
    <p><strong>Improvement suggestions:</strong> ${escapeHtml(meal.suggestions)}</p>
    <p><strong>Dietitian perspective:</strong> ${escapeHtml(meal.dietitianNote)}</p>
  `;
}

function renderMealCard(meal) {
  return `
    <article class="meal-card">
      <img src="${meal.images[0]}" alt="${meal.mealType} upload" />
      <div class="meal-card-body">
        <span class="timeline-meta">${formatDateTime(meal.timestamp)}</span>
        <strong>${capitalize(meal.mealType)} · ${meal.calories} kcal</strong>
        <span class="muted">${meal.protein}g protein · score ${meal.score}/100</span>
        <button class="mini-button" type="button" onclick="selectOverrideMeal('${meal.id}')">Review analysis</button>
      </div>
    </article>
  `;
}

function renderDashboard() {
  const participant = getSelectedParticipant();
  if (!participant) {
    els.dashboardContent.innerHTML = renderNoParticipant();
    return;
  }

  const meals = getParticipantMeals();
  const todayMeals = meals.filter((meal) => isToday(meal.timestamp));
  const totals = sumMeals(todayMeals);
  const caloriesRemaining = participant.calorieTarget - totals.calories;
  const proteinProgress = participant.proteinTarget ? clamp((totals.protein / participant.proteinTarget) * 100, 0, 130) : 0;
  const caloriesProgress = participant.calorieTarget ? clamp((totals.calories / participant.calorieTarget) * 100, 0, 130) : 0;
  const mealScore = todayMeals.length ? Math.round(average(todayMeals.map((meal) => meal.score))) : 0;
  const consistency = calculateConsistency(meals);

  els.dashboardContent.innerHTML = `
    <div class="dashboard-grid">
      <div class="panel span-3">${kpi("Daily calories", `${totals.calories} kcal`, `${Math.max(0, caloriesRemaining)} kcal remaining`, caloriesProgress)}</div>
      <div class="panel span-3">${kpi("Protein progress", `${totals.protein} g`, `${participant.proteinTarget} g target`, proteinProgress)}</div>
      <div class="panel span-3">${kpi("Meal quality", `${mealScore || "-"} / 100`, `${todayMeals.length} meals today`, mealScore)}</div>
      <div class="panel span-3">${kpi("Upload consistency", `${consistency}%`, "Last 7 days", consistency)}</div>
      <div class="panel span-4">
        <div class="panel-heading"><div><p class="eyebrow">Macro breakdown</p><h2>Carbs, fats, protein</h2></div></div>
        <div class="macro-bars">
          ${macroRow("Protein", totals.protein, participant.proteinTarget, "var(--green)")}
          ${macroRow("Carbs", totals.carbs, Math.round(participant.calorieTarget * 0.42 / 4), "var(--teal)")}
          ${macroRow("Fats", totals.fats, Math.round(participant.calorieTarget * 0.28 / 9), "var(--coral)")}
        </div>
      </div>
      <div class="panel span-4">
        <div class="panel-heading"><div><p class="eyebrow">Hydration tracker</p><h2>Water intake</h2></div><span class="pill">6 / 8 cups</span></div>
        <div class="hydration">${Array.from({ length: 8 }, (_, index) => `<div class="water-cup" style="--level:${index < 6 ? 78 : 8}%"></div>`).join("")}</div>
      </div>
      <div class="panel span-4">
        <div class="panel-heading"><div><p class="eyebrow">Daily recommendation</p><h2>Nutrition focus</h2></div></div>
        <p>${getDailyRecommendation(participant, totals)}</p>
        <div class="disclaimer">AI-estimated nutritional values. Recommendations are educational and coach-oriented.</div>
      </div>
      <div class="panel span-6">
        <div class="panel-heading"><div><p class="eyebrow">Weight trend</p><h2>8-week projection</h2></div></div>
        <div class="chart">${lineChart(participant.progress, "weight", "kg", "var(--blue)")}</div>
      </div>
      <div class="panel span-6">
        <div class="panel-heading"><div><p class="eyebrow">Body composition</p><h2>Fat and muscle trend</h2></div></div>
        <div class="chart">${dualLineChart(participant.progress)}</div>
      </div>
    </div>
  `;
}

function renderProgress() {
  const participant = getSelectedParticipant();
  if (!participant) {
    els.progressMonitor.innerHTML = renderNoParticipant();
    return;
  }

  const status = getTrackStatus(participant);
  const progressPoint = participant.progress.at(-1);
  const targetMetric = participant.goal === "muscle-gain"
    ? `${round(progressPoint.muscle - participant.muscle, 1)}% projected muscle gain`
    : participant.goal === "fat-loss"
      ? `${round(participant.bodyFat - progressPoint.bodyFat, 1)}% projected body fat reduction`
      : "Stable body composition projected";

  els.progressMonitor.innerHTML = `
    <div class="progress-card">
      <div class="track-status ${status.attention ? "attention" : ""}">
        <strong>${status.title}</strong>
        <span>${status.copy}</span>
      </div>
      ${metric("Target movement", targetMetric)}
      ${metric("Automatic calorie adjustment", getCalorieAdjustment(participant))}
      ${recommendation("Motivational insight", getMotivationalInsight(participant, status.attention))}
      ${recommendation("Underperformance alert", status.attention ? "Coach review recommended: upload consistency or calorie adherence needs attention." : "No underperformance alert. Maintain consistent meal uploads and progressive training.")}
    </div>
  `;
}

function renderWeeklySummary() {
  const participant = getSelectedParticipant();
  if (!participant) {
    showToast("Create or select a participant first.");
    return;
  }
  const meals = getParticipantMeals();
  const consistency = calculateConsistency(meals);
  const avgScore = meals.length ? Math.round(average(meals.slice(0, 7).map((meal) => meal.score))) : 0;
  const status = getTrackStatus(participant);

  els.weeklySummary.innerHTML = `
    <strong>AI-generated weekly progress summary</strong>
    <p>${participant.name} is ${status.attention ? "slightly behind the ideal pace" : "tracking well"} for ${formatGoal(participant.goal).toLowerCase()}. Upload consistency is ${consistency}% and recent meal quality averages ${avgScore || "-"} / 100.</p>
    <p>Next-week focus: keep protein near ${participant.proteinTarget}g daily, add vegetables to two meals, and adjust calories by ${status.attention ? "100-150 kcal based on adherence" : "0-100 kcal only if progress stalls"}.</p>
  `;
  showToast("Weekly summary generated.");
}

function renderAdmin() {
  const filter = els.progressFilter.value;
  const rows = state.participants.filter((participant) => {
    if (filter === "all") return true;
    const attention = getTrackStatus(participant).attention;
    return filter === "attention" ? attention : !attention;
  });

  els.adminTable.innerHTML = rows.length ? `
    <table>
      <thead>
        <tr>
          <th>Participant</th>
          <th>Goal</th>
          <th>Calories</th>
          <th>Protein</th>
          <th>Meals</th>
          <th>Engagement</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((participant) => {
          const mealCount = state.meals.filter((meal) => meal.participantId === participant.id).length;
          const status = getTrackStatus(participant);
          return `
            <tr>
              <td><strong>${escapeHtml(participant.name)}</strong><br><span class="muted">${participant.age} · ${participant.gender}</span></td>
              <td>${formatGoal(participant.goal)}</td>
              <td>${participant.calorieTarget} kcal</td>
              <td>${participant.proteinTarget} g</td>
              <td>${mealCount}</td>
              <td>${calculateConsistency(state.meals.filter((meal) => meal.participantId === participant.id))}%</td>
              <td><span class="indicator ${status.attention ? "warn" : "good"}">${status.attention ? "Needs attention" : "On track"}</span></td>
              <td><button class="mini-button" type="button" onclick="selectParticipant('${participant.id}')">Open</button></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  ` : renderNoParticipant("No matching participants");

  renderOverridePanel();
}

function renderOverridePanel() {
  const meal = state.meals.find((item) => item.id === state.selectedOverrideMealId) || getParticipantMeals()[0];
  if (!meal) {
    els.overridePanel.innerHTML = renderNoParticipant("No meal analysis to review yet");
    return;
  }
  state.selectedOverrideMealId = meal.id;
  els.overridePanel.innerHTML = `
    <div class="analysis-card">
      ${renderMealAnalysis(meal)}
      <form class="override-form" onsubmit="saveOverride(event, '${meal.id}')">
        <label>Calories<input name="calories" type="number" value="${meal.calories}" /></label>
        <label>Protein<input name="protein" type="number" value="${meal.protein}" /></label>
        <label>Carbs<input name="carbs" type="number" value="${meal.carbs}" /></label>
        <label>Fats<input name="fats" type="number" value="${meal.fats}" /></label>
        <label>Coach note<textarea name="dietitianNote" rows="3">${escapeHtml(meal.dietitianNote)}</textarea></label>
        <label>Improvement suggestion<textarea name="suggestions" rows="3">${escapeHtml(meal.suggestions)}</textarea></label>
        <button class="button primary" type="submit"><span class="icon" data-icon="check"></span>Save override</button>
      </form>
    </div>
  `;
  renderIcons();
}

window.selectParticipant = (id) => {
  state.selectedParticipantId = id;
  saveState();
  renderAll();
  switchView("onboarding");
  showToast("Participant opened.");
};

window.selectOverrideMeal = (id) => {
  state.selectedOverrideMealId = id;
  saveState();
  renderAdmin();
  switchView("admin");
};

window.saveOverride = (event, id) => {
  event.preventDefault();
  const meal = state.meals.find((item) => item.id === id);
  if (!meal) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  ["calories", "protein", "carbs", "fats"].forEach((key) => {
    meal[key] = Number(data[key]);
  });
  meal.dietitianNote = data.dietitianNote;
  meal.suggestions = data.suggestions;
  meal.overridden = true;
  saveState();
  renderAll();
  showToast("Coach override saved.");
};

function exportReports() {
  const payload = {
    exportedAt: new Date().toISOString(),
    participants: state.participants,
    meals: state.meals.map((meal) => ({ ...meal, images: [`${meal.images.length} image(s) stored in browser`] })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "forma-flow-reports.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Reports exported.");
}

function seedDemoData() {
  const demo = buildParticipant({
    name: "Ariana Lee",
    age: 32,
    gender: "female",
    height: 168,
    weight: 72,
    activity: "1.55",
    goal: "fat-loss",
    bodyFat: 28,
    muscle: 34,
  });
  demo.id = "demo-ariana";
  state.participants = [demo];
  state.selectedParticipantId = demo.id;
  state.meals = [
    demoMeal(demo.id, "lunch", -2),
    demoMeal(demo.id, "breakfast", -1),
    demoMeal(demo.id, "dinner", 0),
  ];
  state.selectedOverrideMealId = state.meals[0].id;
  saveState();
  renderAll();
  showToast("Demo participant and meals loaded.");
}

function demoMeal(participantId, mealType, offsetDays) {
  const preset = FOOD_PRESETS[mealType];
  return {
    id: crypto.randomUUID(),
    participantId,
    mealType,
    images: [placeholderMealImage(mealType)],
    timestamp: new Date(Date.now() + offsetDays * 86400000).toISOString(),
    items: preset.items,
    portion: "Single standard serving estimated",
    calories: preset.calories,
    protein: preset.protein,
    carbs: preset.carbs,
    fats: preset.fats,
    fiber: preset.fiber,
    sugar: preset.sugar,
    sodium: preset.sodium,
    score: mealType === "dinner" ? 90 : mealType === "lunch" ? 86 : 82,
    indicators: ["High-protein choice", "Good fiber density", preset.sodium > 700 ? "Watch sodium" : "Sodium looks moderate"],
    explanation: "AI-estimated nutritional values based on visible foods, typical serving sizes, and meal context. Use this as coaching guidance, not medical diagnosis.",
    suggestions: "Keep protein consistent and add vegetables when the plate looks low in color or fiber.",
    dietitianNote: "This meal supports the plan when portion size stays aligned to the daily calorie target.",
  };
}

function placeholderMealImage(mealType) {
  const color = { breakfast: "#f1ad2b", lunch: "#11a36a", dinner: "#4666e5", snack: "#ee6c4d" }[mealType];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
      <rect width="640" height="400" fill="#f5f8f6"/>
      <circle cx="320" cy="200" r="132" fill="#ffffff" stroke="#dfe7e2" stroke-width="12"/>
      <path d="M230 205c42-78 136-92 184-21 31 47-11 105-84 105-69 0-126-37-100-84z" fill="${color}"/>
      <circle cx="281" cy="166" r="34" fill="#c9ef52"/>
      <circle cx="377" cy="230" r="42" fill="#18201d" opacity=".16"/>
      <text x="320" y="350" text-anchor="middle" font-family="Arial" font-weight="700" font-size="28" fill="#18201d">${capitalize(mealType)}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function getSelectedParticipant() {
  return state.participants.find((participant) => participant.id === state.selectedParticipantId) || null;
}

function getParticipantMeals() {
  return state.meals
    .filter((meal) => meal.participantId === state.selectedParticipantId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function sumMeals(meals) {
  return meals.reduce((totals, meal) => {
    ["calories", "protein", "carbs", "fats", "fiber", "sugar", "sodium"].forEach((key) => {
      totals[key] += Number(meal[key]) || 0;
    });
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 });
}

function getTrackStatus(participant) {
  const meals = state.meals.filter((meal) => meal.participantId === participant.id);
  const consistency = calculateConsistency(meals);
  const attention = consistency < 45 || (meals.length > 0 && average(meals.slice(0, 5).map((meal) => meal.score)) < 68);
  return {
    attention,
    title: attention ? "Needs coach attention" : "On track for the 8-week goal",
    copy: attention
      ? "Meal upload consistency or food quality is below the target rhythm. Trigger a reminder and consider a small calorie adjustment after coach review."
      : "Current trend, meal quality, and upload consistency support the planned body composition target.",
  };
}

function getCalorieAdjustment(participant) {
  const status = getTrackStatus(participant);
  if (!status.attention) return "Maintain current target for the next 7 days";
  if (participant.goal === "fat-loss") return "Reduce target by 100 kcal or increase daily steps after adherence review";
  if (participant.goal === "muscle-gain") return "Increase target by 100 kcal if weight and strength are flat";
  return "Hold calories and improve upload consistency first";
}

function getFitnessSuggestion(participant) {
  if (participant.goal === "fat-loss") {
    return "Use 3 strength sessions, 2 zone-2 cardio sessions, and a daily step target to protect muscle while reducing fat.";
  }
  if (participant.goal === "muscle-gain") {
    return "Prioritize progressive overload across compound lifts, 3-5 sessions weekly, and planned recovery days.";
  }
  return "Keep a balanced strength and cardio routine with weekly progression and recovery monitoring.";
}

function getDietSuggestion(participant) {
  if (participant.goal === "fat-loss") {
    return `Aim for ${participant.calorieTarget} kcal with ${participant.proteinTarget}g protein, high-fiber carbs, and portion-controlled fats.`;
  }
  if (participant.goal === "muscle-gain") {
    return `Aim for ${participant.calorieTarget} kcal with ${participant.proteinTarget}g protein, carb timing around training, and steady hydration.`;
  }
  return `Aim for ${participant.calorieTarget} kcal with ${participant.proteinTarget}g protein and consistent meal timing.`;
}

function getDailyRecommendation(participant, totals) {
  if (!totals.calories) return "No meals logged today. Start with a protein-forward meal upload to activate the daily coaching loop.";
  if (totals.protein < participant.proteinTarget * 0.55) {
    return "Protein is behind pace today. Add a lean protein serving at the next meal and keep calories close to target.";
  }
  if (totals.calories > participant.calorieTarget) {
    return "Calories are above target. Keep the next meal lighter, hydrate, and choose vegetables plus lean protein.";
  }
  return "Great pace today. Keep meals balanced and avoid pushing calories too low before the final meal.";
}

function getMotivationalInsight(participant, attention) {
  if (attention) {
    return "One consistent week can change the trajectory. Focus on uploading every meal and hitting the protein anchor before optimizing details.";
  }
  return `${participant.name.split(" ")[0]} has a clear path: repeat the meals that score well, keep training consistent, and review progress weekly.`;
}

function calculateConsistency(meals) {
  if (!meals.length) return 0;
  const activeDays = new Set(meals.map((meal) => new Date(meal.timestamp).toDateString()));
  return Math.round(clamp((activeDays.size / 7) * 100, 0, 100));
}

function lineChart(points, key, suffix, color) {
  const width = 620;
  const height = 250;
  const values = points.map((point) => point[key]);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const coords = points.map((point, index) => {
    const x = 34 + index * ((width - 68) / (points.length - 1));
    const y = height - 34 - ((point[key] - min) / (max - min)) * (height - 68);
    return [x, y, point[key]];
  });
  const d = coords.map(([x, y], index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ");
  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${key} trend chart">
      ${gridLines(width, height)}
      <path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      ${coords.map(([x, y, value]) => `<circle cx="${x}" cy="${y}" r="5" fill="${color}"/><text x="${x}" y="${y - 12}" text-anchor="middle">${value}${suffix}</text>`).join("")}
      ${points.map((point, index) => `<text x="${coords[index][0]}" y="238" text-anchor="middle">W${point.week}</text>`).join("")}
    </svg>
  `;
}

function dualLineChart(points) {
  const fat = linePath(points, "bodyFat", 250);
  const muscle = linePath(points, "muscle", 250);
  return `
    <svg viewBox="0 0 620 250" role="img" aria-label="body fat and muscle trend chart">
      ${gridLines(620, 250)}
      <path d="${fat.d}" fill="none" stroke="var(--coral)" stroke-width="4" stroke-linecap="round"/>
      <path d="${muscle.d}" fill="none" stroke="var(--green)" stroke-width="4" stroke-linecap="round"/>
      ${fat.coords.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--coral)"/>`).join("")}
      ${muscle.coords.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--green)"/>`).join("")}
      <text x="34" y="24">Body fat %</text>
      <text x="130" y="24" fill="var(--green)">Muscle %</text>
      ${points.map((point, index) => `<text x="${fat.coords[index][0]}" y="238" text-anchor="middle">W${point.week}</text>`).join("")}
    </svg>
  `;
}

function linePath(points, key, height) {
  const values = points.flatMap((point) => [point.bodyFat, point.muscle]);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const coords = points.map((point, index) => {
    const x = 34 + index * ((620 - 68) / (points.length - 1));
    const y = height - 34 - ((point[key] - min) / (max - min)) * (height - 68);
    return [x, y];
  });
  return { coords, d: coords.map(([x, y], index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ") };
}

function gridLines(width, height) {
  return Array.from({ length: 4 }, (_, index) => {
    const y = 34 + index * ((height - 68) / 3);
    return `<line x1="34" x2="${width - 34}" y1="${y}" y2="${y}" stroke="#dfe7e2" stroke-width="1"/>`;
  }).join("");
}

function kpi(title, value, subcopy, progress) {
  return `
    <div class="metric-card">
      <span>${title}</span>
      <strong>${value}</strong>
      <p class="muted">${subcopy}</p>
      <div class="progress-bar"><div class="progress-fill" style="--progress:${clamp(progress, 0, 100)}%"></div></div>
    </div>
  `;
}

function macroRow(label, value, target, color) {
  const progress = target ? clamp((value / target) * 100, 0, 100) : 0;
  return `
    <div class="macro-row">
      <strong>${label}</strong>
      <div class="progress-bar"><div class="progress-fill" style="--progress:${progress}%; background:${color}"></div></div>
      <span>${value}g</span>
    </div>
  `;
}

function metric(label, value) {
  return `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function nutrition(label, value) {
  return `<div class="nutrition-item"><span>${label}</span><strong>${value}</strong></div>`;
}

function recommendation(title, copy) {
  return `<div class="recommendation"><strong>${title}</strong><br>${escapeHtml(copy)}</div>`;
}

function renderNoParticipant(copy = "Create a participant to activate this workspace.") {
  return `
    <div class="empty-state">
      <span class="icon xl" data-icon="user"></span>
      <h2>${escapeHtml(copy)}</h2>
      <p>Use the onboarding form to generate a report, targets, dashboards, and admin monitoring.</p>
    </div>
  `;
}

function formatGoal(goal) {
  return {
    "fat-loss": "Fat loss",
    "muscle-gain": "Muscle gain",
    maintenance: "Maintenance",
  }[goal];
}

function indicatorClass(text) {
  if (/watch|could|add/i.test(text)) return "warn";
  if (/moderate|good|high/i.test(text)) return "good";
  return "bad";
}

function isToday(timestamp) {
  return new Date(timestamp).toDateString() === new Date().toDateString();
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function renderIcons() {
  const icons = {
    user: '<svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24"><path d="M8 4h8"/><path d="M9 2h6v4H9z"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>',
    utensils: '<svg viewBox="0 0 24 24"><path d="M4 3v7a4 4 0 0 0 8 0V3"/><path d="M8 3v18"/><path d="M18 3v18"/><path d="M15 3h3a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
  };

  document.querySelectorAll(".icon").forEach((node) => {
    const icon = icons[node.dataset.icon];
    if (icon && node.innerHTML.trim() === "") node.innerHTML = icon;
  });
}
