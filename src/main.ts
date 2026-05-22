// src/main.ts
let currentRole: 'student' | 'teacher' = 'student';

function toggleLevelField(isStudent: boolean): void {
  const levelField  = document.getElementById('level-field')  as HTMLElement;
  const footerNote  = document.getElementById('footer-note')  as HTMLElement;
  const levelSelect = document.getElementById('level')         as HTMLSelectElement;

  if (isStudent) {
    levelField.style.display  = 'block';
    levelField.style.opacity  = '1';
    footerNote.textContent    = 'Students can only view and rate courses for their current level';
  } else {
    levelField.style.display  = 'none';
    levelField.style.opacity  = '0';
    levelSelect.value         = '';   // clear any previously selected level
    footerNote.textContent    = 'Teachers can view all submitted feedback across all levels';
  }
}

function selectRole(roleIndex: number): void {
  currentRole = roleIndex === 0 ? 'student' : 'teacher';

  const studentBtn = document.getElementById('student-btn') as HTMLButtonElement;
  const teacherBtn = document.getElementById('teacher-btn') as HTMLButtonElement;

  if (currentRole === 'student') {
    studentBtn.classList.add('border-blue-600', 'bg-blue-50');
    studentBtn.classList.remove('border-gray-200');
    (studentBtn.querySelector('span') as HTMLElement).classList.add('text-blue-700');
    (studentBtn.querySelector('span') as HTMLElement).classList.remove('text-gray-600');
    (studentBtn.querySelector('svg') as SVGElement).classList.add('text-blue-600');
    (studentBtn.querySelector('svg') as SVGElement).classList.remove('text-gray-400');

    teacherBtn.classList.remove('border-blue-600', 'bg-blue-50');
    teacherBtn.classList.add('border-gray-200');
    (teacherBtn.querySelector('span') as HTMLElement).classList.remove('text-blue-700');
    (teacherBtn.querySelector('span') as HTMLElement).classList.add('text-gray-600');
    (teacherBtn.querySelector('svg') as SVGElement).classList.remove('text-blue-600');
    (teacherBtn.querySelector('svg') as SVGElement).classList.add('text-gray-400');
  } else {
    teacherBtn.classList.add('border-blue-600', 'bg-blue-50');
    teacherBtn.classList.remove('border-gray-200');
    (teacherBtn.querySelector('span') as HTMLElement).classList.add('text-blue-700');
    (teacherBtn.querySelector('span') as HTMLElement).classList.remove('text-gray-600');
    (teacherBtn.querySelector('svg') as SVGElement).classList.add('text-blue-600');
    (teacherBtn.querySelector('svg') as SVGElement).classList.remove('text-gray-400');

    studentBtn.classList.remove('border-blue-600', 'bg-blue-50');
    studentBtn.classList.add('border-gray-200');
    (studentBtn.querySelector('span') as HTMLElement).classList.remove('text-blue-700');
    (studentBtn.querySelector('span') as HTMLElement).classList.add('text-gray-600');
    (studentBtn.querySelector('svg') as SVGElement).classList.remove('text-blue-600');
    (studentBtn.querySelector('svg') as SVGElement).classList.add('text-gray-400');
  }

  toggleLevelField(currentRole === 'student');
}

// Make selectRole globally accessible (called from onclick in HTML)
(window as any).selectRole = selectRole;

// Form submission
document.getElementById('login-form')?.addEventListener('submit', (e: Event) => {
  e.preventDefault();

  const name  = (document.getElementById('name')  as HTMLInputElement).value.trim()  || 'Student';
  const level = (document.getElementById('level') as HTMLSelectElement).value;

  if (currentRole === 'student' && !level) {
    alert('Please select your level');
    return;
  }

  // Persist for dashboard use
  sessionStorage.setItem('studentName',  name);
  sessionStorage.setItem('studentLevel', level);
  localStorage.setItem('studentName',    name);
  localStorage.setItem('studentLevel',   level);

  // Route based on role
  if (currentRole === 'student') {
    window.location.href = '/student-dashboard.html';
  } else {
    window.location.href = '/teacher-dashboard.html';
  }
});

// Initialize default selection
selectRole(0);