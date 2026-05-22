// teacher.js — Lecturer Feedback Dashboard (API-driven)

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Render a read-only star row for a given numeric rating */
function renderStars(rating) {
  const wrap = document.createElement("div");
  wrap.className = "star-display";

  for (let i = 1; i <= 5; i++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("stroke-width", "1.5");
    svg.classList.add("star-icon");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("d", "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z");
    svg.appendChild(path);

    if (i <= Math.floor(rating)) {
      svg.setAttribute("fill", "currentColor");
      svg.setAttribute("stroke", "currentColor");
      svg.classList.add("filled");
    } else {
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.classList.add("empty");
    }
    wrap.appendChild(svg);
  }
  return wrap;
}

/** Compute aggregate stats for an array of feedback items */
function computeStats(items) {
  if (!items.length) return { avgCourse: 0, avgLecturer: 0, totalResponses: 0 };
  const avgCourse      = items.reduce((s, f) => s + f.courseRating,   0) / items.length;
  const avgLecturer    = items.reduce((s, f) => s + f.lecturerRating, 0) / items.length;
  const totalResponses = items.reduce((s, f) => s + f.responses,      0);
  return { avgCourse, avgLecturer, totalResponses };
}

// ──────────────────────────────────────────────
// Show / hide loading skeleton
// ──────────────────────────────────────────────
function showLoading() {
  document.getElementById("stats-row").innerHTML = `
    ${[1,2,3].map(() => `
      <div class="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 animate-pulse">
        <div class="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    `).join("")}
  `;
  document.getElementById("feedback-list").innerHTML = `
    ${[1,2,3].map(() => `
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-1/4 mb-5"></div>
        <div class="grid grid-cols-2 gap-4">
          <div class="h-12 bg-gray-100 rounded-xl"></div>
          <div class="h-12 bg-gray-100 rounded-xl"></div>
        </div>
        <div class="mt-4 flex flex-col gap-2">
          <div class="h-8 bg-gray-100 rounded-lg"></div>
          <div class="h-8 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    `).join("")}
  `;
}

function showError(message) {
  document.getElementById("stats-row").innerHTML = "";
  document.getElementById("feedback-list").innerHTML = `
    <div class="bg-red-50 border border-red-200 rounded-2xl px-6 py-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
      </svg>
      <p class="text-sm text-red-700 font-medium">${message}</p>
      <button onclick="loadFeedback()" class="mt-4 text-sm text-red-600 underline hover:text-red-800">Try again</button>
    </div>
  `;
}

function showEmpty() {
  document.getElementById("feedback-list").innerHTML = `
    <div class="bg-white border border-gray-200 rounded-2xl px-6 py-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
      </svg>
      <p class="text-gray-400 text-sm font-medium">No feedback submitted yet</p>
      <p class="text-gray-300 text-xs mt-1">Feedback will appear here once students submit their ratings</p>
    </div>
  `;
}

// ──────────────────────────────────────────────
// Render stat cards
// ──────────────────────────────────────────────
function renderStats(items) {
  const statsRow = document.getElementById("stats-row");
  statsRow.innerHTML = "";

  const { avgCourse, avgLecturer, totalResponses } = computeStats(items);

  const defs = [
    { label: "Average Course Rating",   value: items.length ? avgCourse.toFixed(1)   : "—", rating: items.length ? avgCourse   : null, sub: null },
    { label: "Average Lecturer Rating", value: items.length ? avgLecturer.toFixed(1) : "—", rating: items.length ? avgLecturer : null, sub: null },
    { label: "Total Responses",         value: totalResponses, rating: null, sub: `across ${items.length} course${items.length !== 1 ? "s" : ""}` },
  ];

  defs.forEach(d => {
    const card = document.createElement("div");
    card.className = "stat-card bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4";

    const label = document.createElement("p");
    label.className = "text-xs text-gray-500 mb-1";
    label.textContent = d.label;

    const valueRow = document.createElement("div");
    valueRow.className = "flex items-center gap-3 mt-1";

    const val = document.createElement("p");
    val.className = "text-3xl font-bold text-gray-900";
    val.textContent = d.value;
    valueRow.appendChild(val);

    if (d.rating !== null) valueRow.appendChild(renderStars(d.rating));

    card.appendChild(label);
    card.appendChild(valueRow);

    if (d.sub) {
      const sub = document.createElement("p");
      sub.className = "text-xs text-gray-400 mt-1";
      sub.textContent = d.sub;
      card.appendChild(sub);
    }

    statsRow.appendChild(card);
  });
}

// ──────────────────────────────────────────────
// Render feedback cards
// ──────────────────────────────────────────────
function renderFeedback(items) {
  const list = document.getElementById("feedback-list");
  list.innerHTML = "";

  if (!items.length) { showEmpty(); return; }

  items.forEach(course => {
    const card = document.createElement("div");
    card.className = "course-card bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5";

    // Header
    const headerRow = document.createElement("div");
    headerRow.className = "flex items-start justify-between mb-1";

    const titleBlock = document.createElement("div");
    const title = document.createElement("p");
    title.className = "font-semibold text-gray-900 text-base";
    title.textContent = course.name;
    const meta = document.createElement("p");
    meta.className = "text-sm text-gray-400 mt-0.5";
    meta.textContent = `${course.code} · ${course.level} Level`;
    titleBlock.appendChild(title);
    titleBlock.appendChild(meta);

    const rightGroup = document.createElement("div");
    rightGroup.className = "flex items-center gap-2 ml-4 flex-shrink-0";

    if (course.trending) {
      const trendIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      trendIcon.setAttribute("viewBox", "0 0 24 24");
      trendIcon.setAttribute("fill", "none");
      trendIcon.setAttribute("stroke", "#22c55e");
      trendIcon.setAttribute("stroke-width", "2.5");
      trendIcon.setAttribute("width", "16");
      trendIcon.setAttribute("height", "16");
      const tp = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tp.setAttribute("stroke-linecap", "round");
      tp.setAttribute("stroke-linejoin", "round");
      tp.setAttribute("d", "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941");
      trendIcon.appendChild(tp);
      rightGroup.appendChild(trendIcon);
    }

    const badge = document.createElement("span");
    badge.className = "text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-3 py-1";
    badge.textContent = `${course.responses} response${course.responses !== 1 ? "s" : ""}`;
    rightGroup.appendChild(badge);

    headerRow.appendChild(titleBlock);
    headerRow.appendChild(rightGroup);

    // Ratings grid
    const ratingsGrid = document.createElement("div");
    ratingsGrid.className = "grid grid-cols-2 gap-4 mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100";

    [
      { label: "Course Rating",   rating: course.courseRating },
      { label: "Lecturer Rating", rating: course.lecturerRating },
    ].forEach(({ label, rating }) => {
      const cell = document.createElement("div");
      const lbl  = document.createElement("p");
      lbl.className = "text-xs text-gray-400 mb-1";
      lbl.textContent = label;
      const row  = document.createElement("div");
      row.className = "flex items-center gap-2";
      const val  = document.createElement("span");
      val.className = "text-lg font-bold text-gray-900";
      val.textContent = rating > 0 ? rating.toFixed(1) : "—";
      row.appendChild(val);
      if (rating > 0) row.appendChild(renderStars(rating));
      cell.appendChild(lbl);
      cell.appendChild(row);
      ratingsGrid.appendChild(cell);
    });

    // Comments
    const commentsSection = document.createElement("div");
    commentsSection.className = "mt-4";

    const commentsLabel = document.createElement("p");
    commentsLabel.className = "text-sm text-gray-500 font-medium mb-2";
    commentsLabel.textContent = "Student Comments:";
    commentsSection.appendChild(commentsLabel);

    if (course.comments && course.comments.length) {
      const commentsList = document.createElement("div");
      commentsList.className = "flex flex-col gap-2";
      course.comments.forEach(c => {
        const pill = document.createElement("div");
        pill.className = "comment-pill";
        pill.textContent = `"${c}"`;
        commentsList.appendChild(pill);
      });
      commentsSection.appendChild(commentsList);
    } else {
      const none = document.createElement("p");
      none.className = "text-xs text-gray-400 italic";
      none.textContent = "No comments submitted yet.";
      commentsSection.appendChild(none);
    }

    card.appendChild(headerRow);
    card.appendChild(ratingsGrid);
    card.appendChild(commentsSection);
    list.appendChild(card);
  });
}

// ──────────────────────────────────────────────
// Fetch feedback from API
// ──────────────────────────────────────────────
let allFeedback = [];
let allLecturers = [];
let activeLecturerId = '';

async function loadLecturers() {
  try {
    const res = await fetch('/api/lecturers-public');
    if (!res.ok) return;
    allLecturers = await res.json();

    const select = document.getElementById('lecturer-select');
    if (!select) return;

    const current = select.value;
    select.innerHTML = '<option value="">(Select Lecturer)</option>';
    allLecturers.forEach((lecturer) => {
      const option = document.createElement('option');
      option.value = lecturer.id;
      option.textContent = lecturer.name;
      select.appendChild(option);
    });
    select.value = current || activeLecturerId;
  } catch (error) {
    console.error('Failed to load lecturers:', error);
  }
}

async function loadFeedback() {
  showLoading();

  try {
    const res = await fetch("/api/feedback");
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);

    allFeedback = await res.json();
    console.log(`✅ Loaded ${allFeedback.length} course(s) with feedback from API`);

    await loadLecturers();
    applyFilter();

  } catch (err) {
    console.error("Failed to load feedback:", err);
    showError("Could not load feedback data. Is the server running?");
  }
}

// ──────────────────────────────────────────────
// Filter logic
// ──────────────────────────────────────────────
function applyFilter() {
  const val      = document.getElementById("level-filter").value;
  const lecturerVal = document.getElementById('lecturer-select')?.value || activeLecturerId;
  let filtered = val === "all"
    ? allFeedback
    : allFeedback.filter(f => f.level === parseInt(val));

  if (lecturerVal) {
    filtered = filtered.filter((f) => String(f.lecturerId || '') === String(lecturerVal));
  }

  renderStats(filtered);
  renderFeedback(filtered);
}

document.getElementById("level-filter").addEventListener("change", applyFilter);
document.getElementById('lecturer-select')?.addEventListener('change', (e) => {
  activeLecturerId = e.target.value;
  applyFilter();
});
document.getElementById('clear-lecturer')?.addEventListener('click', () => {
  activeLecturerId = '';
  const select = document.getElementById('lecturer-select');
  if (select) select.value = '';
  applyFilter();
});

// ──────────────────────────────────────────────
// Initial load
// ──────────────────────────────────────────────
loadFeedback();
