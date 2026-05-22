// student.js — Student Dashboard Logic

// ──────────────────────────────────────────────
// Course data keyed by level
// ──────────────────────────────────────────────
const courseData = {
  100: [
    { name: "Introduction to Computer Science", code: "CSC 101", lecturer: "Dr. James Adeyemi" },
    { name: "Mathematics for Computing", code: "CSC 103", lecturer: "Prof. Grace Nwosu" },
    { name: "Communication Skills I", code: "ABUAD-COM 101", lecturer: "Dr. Blessing Okeke" },
    { name: "General Physics", code: "PHY 101", lecturer: "Dr. Samuel Brown" },
    { name: "Introduction to Programming", code: "CSC 105", lecturer: "Prof. Emily Davis" },
  ],
  200: [
    { name: "Data Structures and Algorithms", code: "CSC 201", lecturer: "Dr. Michael Roberts" },
    { name: "Discrete Mathematics", code: "CSC 203", lecturer: "Prof. Patricia Green" },
    { name: "Computer Organization", code: "CSC 205", lecturer: "Dr. Christopher Adams" },
    { name: "Communication Skills II", code: "ABUAD-COM 201", lecturer: "Dr. Rachel Moore" },
    { name: "Object-Oriented Programming", code: "CSC 207", lecturer: "Prof. Thomas Wilson" },
  ],
  300: [
    { name: "Database Management Systems", code: "CSC 301", lecturer: "Dr. Elizabeth Johnson" },
    { name: "Operating Systems", code: "CSC 303", lecturer: "Prof. Daniel Carter" },
    { name: "Software Engineering", code: "CSC 305", lecturer: "Dr. Angela White" },
    { name: "Computer Networks I", code: "CSC 307", lecturer: "Prof. Kevin Martinez" },
    { name: "Artificial Intelligence", code: "CSC 309", lecturer: "Dr. Olivia Thompson" },
  ],
  400: [
    { name: "Computer Networks/Communication", code: "CSC 402", lecturer: "Dr. Patricia Brown" },
    { name: "Optimization Techniques", code: "CSC 404", lecturer: "Prof. Elizabeth Adams" },
    { name: "Human-Computer Interaction", code: "CSC 406", lecturer: "Prof. Thomas Moore" },
    { name: "Project Management", code: "CSC 408", lecturer: "Dr. Rachel Green" },
    { name: "Computer System Performance Evaluation", code: "CSC 410", lecturer: "Dr. Christopher Davis" },
    { name: "Communication Skills", code: "ABUAD-COM 412", lecturer: "Dr. Grace Adeyemi" },
    { name: "Entrepreneurship Studies", code: "ABUAD-COM 414", lecturer: "Prof. Daniel Okeke" },
    { name: "Modelling and Simulation", code: "CSC 416", lecturer: "Dr. Samuel Oladele" },
    { name: "Information System Security", code: "CSC 418", lecturer: "Dr. Michael Roberts" },
    { name: "Research Methodology", code: "ABUAD-COM 416", lecturer: "Dr. Blessing Nwosu" },
  ],
  500: [
    { name: "Advanced Software Engineering", code: "CSC 501", lecturer: "Prof. Victor Eze" },
    { name: "Machine Learning", code: "CSC 503", lecturer: "Dr. Linda Obi" },
    { name: "Cloud Computing", code: "CSC 505", lecturer: "Dr. Andrew Chukwu" },
    { name: "Final Year Project", code: "CSC 599", lecturer: "Prof. Ngozi Ihejirika" },
  ],
};

// ──────────────────────────────────────────────
// Read user info from sessionStorage / localStorage
// ──────────────────────────────────────────────
const studentName = sessionStorage.getItem("studentName") || localStorage.getItem("studentName") || "Student";
const studentLevel = parseInt(sessionStorage.getItem("studentLevel") || localStorage.getItem("studentLevel") || "400", 10);

// Update nav subtitle
const navSubtitle = document.getElementById("nav-subtitle");
if (navSubtitle) navSubtitle.textContent = `Student Portal · ${studentLevel} Level`;

// Update welcome banner
const welcomeName = document.getElementById("welcome-name");
const welcomeSub  = document.getElementById("welcome-sub");
const welcomeBadge = document.getElementById("welcome-badge");

if (welcomeName)  welcomeName.textContent  = `Welcome, ${studentName || "Student"}`;
if (welcomeSub)   welcomeSub.textContent   = `${studentLevel} Level · Your feedback is anonymous and helps improve teaching quality`;
if (welcomeBadge) welcomeBadge.textContent = `${studentLevel} Level`;

// ──────────────────────────────────────────────
// Star rating component
// ──────────────────────────────────────────────
function createStarRating(courseIndex, type) {
  const key   = `rating_${studentLevel}_${courseIndex}_${type}`;
  const saved = parseInt(localStorage.getItem(key) || "0", 10);

  const wrapper = document.createElement("div");
  wrapper.className = "star-group";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", i <= saved ? "currentColor" : "none");
    star.setAttribute("stroke", "currentColor");
    star.setAttribute("stroke-width", "1.5");
    star.classList.add("star");
    if (i <= saved) star.classList.add("filled");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("d", "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z");
    star.appendChild(path);

    // Stop click/hover bubbling to the card toggle
    star.addEventListener("click", (e) => e.stopPropagation());

    star.addEventListener("mouseenter", () => highlightStars(wrapper, i));
    star.addEventListener("mouseleave", () => resetStars(wrapper, key));
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      localStorage.setItem(key, i);
      resetStars(wrapper, key);
    });

    wrapper.appendChild(star);
  }
  return wrapper;
}

function highlightStars(group, upTo) {
  group.querySelectorAll(".star").forEach((s, idx) => {
    s.setAttribute("fill", idx < upTo ? "currentColor" : "none");
    s.classList.toggle("filled", idx < upTo);
  });
}

function resetStars(group, key) {
  const saved = parseInt(localStorage.getItem(key) || "0", 10);
  group.querySelectorAll(".star").forEach((s, idx) => {
    s.setAttribute("fill", idx < saved ? "currentColor" : "none");
    s.classList.toggle("filled", idx < saved);
  });
}

// ──────────────────────────────────────────────
// Render course cards
// ──────────────────────────────────────────────
const courses = courseData[studentLevel] || courseData[400];
const list    = document.getElementById("courses-list");

courses.forEach((course, idx) => {
  const commentKey = `comment_${studentLevel}_${idx}`;
  const savedComment = localStorage.getItem(commentKey) || "";

  // ── Card shell ──
  const card = document.createElement("div");
  card.className = "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md";

  // ── Clickable header area ──
  const header = document.createElement("div");
  header.className = "card-header px-6 pt-5 pb-4";

  // Title row: name + chevron + badge
  const titleRow = document.createElement("div");
  titleRow.className = "flex items-start justify-between";

  const titleBlock = document.createElement("div");
  const title = document.createElement("p");
  title.className = "card-title font-semibold text-gray-900 text-base transition-colors duration-150";
  title.textContent = course.name;
  const code = document.createElement("p");
  code.className = "text-sm text-blue-600 mt-0.5";
  code.textContent = course.code;
  titleBlock.appendChild(title);
  titleBlock.appendChild(code);

  // Right side: badge + chevron
  const rightGroup = document.createElement("div");
  rightGroup.className = "flex items-center gap-2 ml-4 flex-shrink-0";

  const badge = document.createElement("span");
  badge.className = "text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-3 py-1";
  badge.textContent = `${studentLevel} Level`;

  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.setAttribute("fill", "none");
  chevron.setAttribute("stroke", "currentColor");
  chevron.setAttribute("stroke-width", "2");
  chevron.classList.add("chevron", "w-4", "h-4", "flex-shrink-0", "mt-0.5");
  const chevPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  chevPath.setAttribute("stroke-linecap", "round");
  chevPath.setAttribute("stroke-linejoin", "round");
  chevPath.setAttribute("d", "M19 9l-7 7-7-7");
  chevron.appendChild(chevPath);

  rightGroup.appendChild(badge);
  rightGroup.appendChild(chevron);

  titleRow.appendChild(titleBlock);
  titleRow.appendChild(rightGroup);

  // Lecturer row
  const lecturerRow = document.createElement("div");
  lecturerRow.className = "flex items-center gap-1.5 text-sm text-gray-500 mt-2";
  lecturerRow.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
    <span>${course.lecturer}</span>
  `;

  header.appendChild(titleRow);
  header.appendChild(lecturerRow);

  // ── Expandable body (ratings + comment) ──
  const body = document.createElement("div");
  body.className = "comment-section";

  const bodyInner = document.createElement("div");
  bodyInner.className = "px-6 pb-5";

  // Divider
  const divider = document.createElement("hr");
  divider.className = "border-gray-100 mb-4";

  // Rate the Course
  const courseRatingLabel = document.createElement("div");
  courseRatingLabel.className = "flex items-center gap-1.5 text-sm text-gray-600 font-medium mb-2";
  courseRatingLabel.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
    </svg>
    Rate the Course:
  `;
  const courseStars = createStarRating(idx, "course");

  // Rate the Lecturer
  const lecturerRatingLabel = document.createElement("div");
  lecturerRatingLabel.className = "flex items-center gap-1.5 text-sm text-gray-600 font-medium mt-4 mb-2";
  lecturerRatingLabel.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
    Rate the Lecturer:
  `;
  const lecturerStars = createStarRating(idx, "lecturer");

  // Comment textarea
  const commentWrap = document.createElement("div");
  commentWrap.className = "mt-4";

  const textarea = document.createElement("textarea");
  textarea.className = "comment-textarea";
  textarea.placeholder = "Add your comments (optional and anonymous)...";
  textarea.value = savedComment;
  textarea.addEventListener("click", (e) => e.stopPropagation());
  textarea.addEventListener("input", () => {
    localStorage.setItem(commentKey, textarea.value);
  });

  commentWrap.appendChild(textarea);

  bodyInner.appendChild(divider);
  bodyInner.appendChild(courseRatingLabel);
  bodyInner.appendChild(courseStars);
  bodyInner.appendChild(lecturerRatingLabel);
  bodyInner.appendChild(lecturerStars);
  bodyInner.appendChild(commentWrap);
  body.appendChild(bodyInner);

  // ── Assemble card ──
  card.appendChild(header);
  card.appendChild(body);
  list.appendChild(card);

  // ── Toggle expand on header click ──
  let expanded = false;
  header.addEventListener("click", () => {
    expanded = !expanded;
    body.classList.toggle("expanded", expanded);
    chevron.classList.toggle("open", expanded);
  });
});

// ──────────────────────────────────────────────
// Submit Feedback button — sends real POST to /api/feedback
// ──────────────────────────────────────────────
document.getElementById("submit-feedback-btn")?.addEventListener("click", async () => {
  const btn = document.getElementById("submit-feedback-btn");

  // Collect all feedbacks that have at least one rating
  const feedbacks = courses
    .map((course, idx) => ({
      courseCode:     course.code,
      courseName:     course.name,
      courseRating:   parseInt(localStorage.getItem(`rating_${studentLevel}_${idx}_course`)   || "0"),
      lecturerRating: parseInt(localStorage.getItem(`rating_${studentLevel}_${idx}_lecturer`) || "0"),
      comment:        localStorage.getItem(`comment_${studentLevel}_${idx}`) || "",
    }))
    .filter(fb => fb.courseRating > 0 || fb.lecturerRating > 0);

  if (feedbacks.length === 0) {
    alert("Please rate at least one course before submitting.");
    return;
  }

  // Loading state
  btn.disabled = true;
  btn.innerHTML = `
    <svg class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
    Submitting...
  `;

  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentLevel, feedbacks }),
    });

    if (!res.ok) throw new Error("Server error");

    // Success state
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
      Feedback Submitted!
    `;
    btn.classList.remove("bg-blue-600", "hover:bg-blue-700");
    btn.classList.add("bg-green-600", "cursor-default");

    // Reset after 3 seconds
    setTimeout(() => {
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Submit Feedback
      `;
      btn.classList.add("bg-blue-600", "hover:bg-blue-700");
      btn.classList.remove("bg-green-600", "cursor-default");
      btn.disabled = false;
    }, 3000);

  } catch (err) {
    // Error state
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      Submission Failed — Retry
    `;
    btn.classList.remove("bg-blue-600", "hover:bg-blue-700");
    btn.classList.add("bg-red-500", "hover:bg-red-600");
    btn.disabled = false;

    setTimeout(() => {
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Submit Feedback
      `;
      btn.classList.add("bg-blue-600", "hover:bg-blue-700");
      btn.classList.remove("bg-red-500", "hover:bg-red-600");
    }, 4000);
  }
});
