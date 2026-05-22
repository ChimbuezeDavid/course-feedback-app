"use strict";
// src/main.ts
let currentRole = 'student';
function toggleLevelField(isStudent) {
    const levelField = document.getElementById('level-field');
    const footerNote = document.getElementById('footer-note');
    const levelSelect = document.getElementById('level');
    if (isStudent) {
        levelField.style.display = 'block';
        levelField.style.opacity = '1';
        footerNote.textContent = 'Students can only view and rate courses for their current level';
    }
    else {
        levelField.style.display = 'none';
        levelField.style.opacity = '0';
        levelSelect.value = ''; // clear any previously selected level
        footerNote.textContent = 'Teachers can view all submitted feedback across all levels';
    }
}
function selectRole(roleIndex) {
    currentRole = roleIndex === 0 ? 'student' : 'teacher';
    const studentBtn = document.getElementById('student-btn');
    const teacherBtn = document.getElementById('teacher-btn');
    if (currentRole === 'student') {
        studentBtn.classList.add('border-blue-600', 'bg-blue-50');
        studentBtn.classList.remove('border-gray-200');
        studentBtn.querySelector('span').classList.add('text-blue-700');
        studentBtn.querySelector('span').classList.remove('text-gray-600');
        studentBtn.querySelector('svg').classList.add('text-blue-600');
        studentBtn.querySelector('svg').classList.remove('text-gray-400');
        teacherBtn.classList.remove('border-blue-600', 'bg-blue-50');
        teacherBtn.classList.add('border-gray-200');
        teacherBtn.querySelector('span').classList.remove('text-blue-700');
        teacherBtn.querySelector('span').classList.add('text-gray-600');
        teacherBtn.querySelector('svg').classList.remove('text-blue-600');
        teacherBtn.querySelector('svg').classList.add('text-gray-400');
    }
    else {
        teacherBtn.classList.add('border-blue-600', 'bg-blue-50');
        teacherBtn.classList.remove('border-gray-200');
        teacherBtn.querySelector('span').classList.add('text-blue-700');
        teacherBtn.querySelector('span').classList.remove('text-gray-600');
        teacherBtn.querySelector('svg').classList.add('text-blue-600');
        teacherBtn.querySelector('svg').classList.remove('text-gray-400');
        studentBtn.classList.remove('border-blue-600', 'bg-blue-50');
        studentBtn.classList.add('border-gray-200');
        studentBtn.querySelector('span').classList.remove('text-blue-700');
        studentBtn.querySelector('span').classList.add('text-gray-600');
        studentBtn.querySelector('svg').classList.remove('text-blue-600');
        studentBtn.querySelector('svg').classList.add('text-gray-400');
    }
    toggleLevelField(currentRole === 'student');
}
// Make selectRole globally accessible (called from onclick in HTML)
window.selectRole = selectRole;
// Form submission
document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim() || 'Student';
    const level = document.getElementById('level').value;
    if (currentRole === 'student' && !level) {
        alert('Please select your level');
        return;
    }
    // Persist for dashboard use
    sessionStorage.setItem('studentName', name);
    sessionStorage.setItem('studentLevel', level);
    localStorage.setItem('studentName', name);
    localStorage.setItem('studentLevel', level);
    // Route based on role
    if (currentRole === 'student') {
        window.location.href = '/student-dashboard.html';
    }
    else {
        window.location.href = '/teacher-dashboard.html';
    }
});
// Initialize default selection
selectRole(0);
