// admin.js — Admin Course Management Dashboard

let adminKey = null;
let allCourses = [];
let editingCode = null;
let allLecturers = [];
let editingLecturerId = null;

// ──────────────────────────────────────────────
// Authentication
// ──────────────────────────────────────────────

function verifyAdminKey() {
  const input = document.getElementById('admin-key-input');
  const key = input.value.trim();

  if (!key) {
    showToast('Please enter an admin key', 'error');
    return;
  }

  adminKey = key;
  sessionStorage.setItem('adminKey', key);

  // Hide auth modal, show dashboard
  document.getElementById('auth-modal').classList.remove('active');
  document.getElementById('dashboard').style.display = 'block';

  loadAll();
}

function logout() {
  adminKey = null;
  sessionStorage.removeItem('adminKey');
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('auth-modal').classList.add('active');
  document.getElementById('admin-key-input').value = '';
  allCourses = [];
  editingCode = null;
}

// Check if admin key is in session
window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('adminKey');
  if (saved) {
    adminKey = saved;
    document.getElementById('auth-modal').classList.remove('active');
    document.getElementById('dashboard').style.display = 'block';
    loadAll();
  }
});

// ──────────────────────────────────────────────
// API Calls
// ──────────────────────────────────────────────

async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${adminKey}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`/api/admin${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
}

async function loadAll() {
  try {
    await Promise.all([loadLecturers(), loadCourses()]);
  } catch (error) {
    console.error('Failed to load admin data:', error);
  }
}

async function loadCourses() {
  try {
    allCourses = await apiCall('GET', '/courses');
    renderTable(allCourses);
    populateLecturerSelect();
  } catch (error) {
    console.error('Failed to load courses:', error);
  }
}

async function loadLecturers() {
  try {
    allLecturers = await apiCall('GET', '/lecturers');
    renderLecturerTable(allLecturers);
    populateLecturerSelect();
  } catch (error) {
    console.error('Failed to load lecturers:', error);
  }
}

// ──────────────────────────────────────────────
// UI Rendering
// ──────────────────────────────────────────────

function renderTable(courses) {
  const tbody = document.getElementById('courses-table-body');

  if (!courses || courses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-12 text-gray-400">
          No courses found. <button onclick="openAddModal()" class="text-blue-600 underline">Add one</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = courses
    .sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.code.localeCompare(b.code);
    })
    .map(course => `
      <tr>
        <td><strong>${course.code}</strong></td>
        <td>${course.name}</td>
        <td>${course.lecturerName || course.lecturer || '<em>Unassigned</em>'}</td>
        <td><span class="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">${course.level}</span></td>
        <td>
          <div class="flex gap-2">
            <button class="btn-sm btn-edit" onclick="openEditModal('${course.code}')">Edit</button>
            <button class="btn-sm btn-edit" onclick="openEditModal('${course.code}')">Assign</button>
            ${course.lecturerId ? `<button class="btn-sm btn-delete" onclick="unassignCourse('${course.code}')">Unassign</button>` : ''}
            <button class="btn-sm btn-delete" onclick="openDeleteModal('${course.code}', '${course.name}')">Delete</button>
          </div>
        </td>
      </tr>
    `)
    .join('');
}

function renderLecturerTable(lecturers) {
  const tbody = document.getElementById('lecturers-table-body');

  if (!lecturers || lecturers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-12 text-gray-400">
          No lecturers found. <button onclick="openLecturerModal()" class="text-blue-600 underline">Add one</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lecturers
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((lecturer) => `
      <tr>
        <td><strong>${lecturer.name}</strong></td>
        <td>${lecturer.email || '-'}</td>
        <td><span class="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">${lecturer.role}</span></td>
        <td>
          <div class="flex gap-2">
            <button class="btn-sm btn-edit" onclick="openLecturerModal('${lecturer.id}')">Edit</button>
            <button class="btn-sm btn-edit" onclick="viewLecturerCourses('${lecturer.id}')">View Courses</button>
            <button class="btn-sm btn-delete" onclick="deleteLecturer('${lecturer.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `)
    .join('');
}

function populateLecturerSelect() {
  const select = document.getElementById('course-lecturer');
  if (!select) return;

  const current = select.value;
  select.innerHTML = '<option value="">Select Lecturer</option>';
  allLecturers
    .filter((lecturer) => lecturer.role === 'lecturer')
    .forEach((lecturer) => {
      const option = document.createElement('option');
      option.value = lecturer.id;
      option.textContent = lecturer.name;
      select.appendChild(option);
    });

  if (current) {
    select.value = current;
  }
}

function viewLecturerCourses(lecturerId) {
  const lecturer = allLecturers.find(l => l.id === lecturerId);
  if (!lecturer) {
    showToast('Lecturer not found', 'error');
    return;
  }

  const assigned = allCourses.filter(c => c.lecturerId === lecturerId);
  const body = document.getElementById('view-courses-body');
  const title = document.getElementById('view-courses-title');
  title.textContent = `Courses assigned to ${lecturer.name}`;

  if (!assigned.length) {
    body.innerHTML = `<p class="text-sm text-gray-600">No courses are currently assigned to ${lecturer.name}.</p>`;
    openModal('view-courses-modal');
    return;
  }

  body.innerHTML = `
    <div class="space-y-3">
      ${assigned.map(c => `
        <div class="p-3 bg-white rounded-lg border border-gray-100 flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold">${c.code} — ${c.name}</div>
            <div class="text-xs text-gray-500">Level ${c.level}</div>
          </div>
          <div>
            <button class="btn-sm btn-edit" onclick="openEditModal('${c.code}')">Reassign</button>
            <button class="btn-sm btn-delete" onclick="unassignCourse('${c.code}')">Unassign</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  openModal('view-courses-modal');
}

// ──────────────────────────────────────────────
// Modals
// ──────────────────────────────────────────────

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function openAddModal() {
  editingCode = null;
  document.getElementById('modal-title').textContent = 'Add Course';
  document.getElementById('save-btn').textContent = 'Add Course';
  document.getElementById('course-code').value = '';
  document.getElementById('course-name').value = '';
  document.getElementById('course-lecturer').value = '';
  document.getElementById('course-level').value = '';
  document.getElementById('course-code').disabled = false;
  populateLecturerSelect();
  openModal('course-modal');
}

function openEditModal(code) {
  const course = allCourses.find(c => c.code === code);
  if (!course) return;

  editingCode = code;
  document.getElementById('modal-title').textContent = 'Edit Course';
  document.getElementById('save-btn').textContent = 'Update Course';
  document.getElementById('course-code').value = course.code;
  document.getElementById('course-name').value = course.name;
  document.getElementById('course-lecturer').value = course.lecturerId || '';
  document.getElementById('course-level').value = course.level;
  document.getElementById('course-code').disabled = true;
  populateLecturerSelect();
  openModal('course-modal');
}

function openDeleteModal(code, name) {
  editingCode = code;
  document.getElementById('delete-course-name').textContent = name;
  openModal('delete-modal');
}

// ──────────────────────────────────────────────
// Course Operations
// ──────────────────────────────────────────────

async function saveCourse() {
  const code = document.getElementById('course-code').value.trim();
  const name = document.getElementById('course-name').value.trim();
  const lecturerId = document.getElementById('course-lecturer').value.trim();
  const level = document.getElementById('course-level').value.trim();

  if (!code || !name || !lecturerId || !level) {
    showToast('Please fill in all fields and assign a lecturer', 'error');
    return;
  }

  try {
    if (editingCode) {
      // Update existing course
      await apiCall('PUT', `/courses/${editingCode}`, {
        code,
        name,
        lecturerId,
        level: parseInt(level),
      });
      showToast('Course updated successfully', 'success');
    } else {
      // Add new course
      await apiCall('POST', '/courses', {
        code,
        name,
        lecturerId,
        level: parseInt(level),
      });
      showToast('Course added successfully', 'success');
    }

    closeModal('course-modal');
    await loadCourses();
  } catch (error) {
    console.error('Failed to save course:', error);
  }
}

async function confirmDelete() {
  if (!editingCode) return;

  try {
    await apiCall('DELETE', `/courses/${editingCode}`);
    showToast('Course deleted successfully', 'success');
    closeModal('delete-modal');
    await loadCourses();
  } catch (error) {
    console.error('Failed to delete course:', error);
  }
}

// ──────────────────────────────────────────────
// Lecturer Operations
// ──────────────────────────────────────────────

function openLecturerModal(id = null) {
  editingLecturerId = id;
  const title = document.getElementById('lecturer-modal-title');
  const saveBtn = document.getElementById('lecturer-save-btn');
  const nameInput = document.getElementById('lecturer-name');
  const emailInput = document.getElementById('lecturer-email');

  if (id) {
    const lecturer = allLecturers.find(l => l.id === id);
    if (!lecturer) return;
    title.textContent = 'Edit Lecturer';
    saveBtn.textContent = 'Update Lecturer';
    nameInput.value = lecturer.name;
    emailInput.value = lecturer.email || '';
  } else {
    title.textContent = 'Add Lecturer';
    saveBtn.textContent = 'Add Lecturer';
    nameInput.value = '';
    emailInput.value = '';
  }

  openModal('lecturer-modal');
}

async function saveLecturer() {
  const name = document.getElementById('lecturer-name').value.trim();
  const email = document.getElementById('lecturer-email').value.trim();

  if (!name) {
    showToast('Lecturer name is required', 'error');
    return;
  }

  try {
    if (editingLecturerId) {
      await apiCall('PUT', `/lecturers/${editingLecturerId}`, { name, email });
      showToast('Lecturer updated successfully', 'success');
    } else {
      await apiCall('POST', '/lecturers', { name, email });
      showToast('Lecturer added successfully', 'success');
    }

    closeModal('lecturer-modal');
    await loadLecturers();
    await loadCourses();
  } catch (error) {
    console.error('Failed to save lecturer:', error);
  }
}

async function deleteLecturer(id) {
  const lecturer = allLecturers.find(l => l.id === id);
  if (!lecturer) return;

  const assigned = allCourses.filter(c => c.lecturerId === id);
  if (assigned.length > 0) {
    alert(`Lecturer ${lecturer.name} is assigned to ${assigned.length} course(s). Please reassign or remove assignments before deleting.`);
    return;
  }

  const confirmed = confirm(`Delete lecturer ${lecturer.name}?`);
  if (!confirmed) return;

  try {
    await apiCall('DELETE', `/lecturers/${id}`);
    showToast('Lecturer deleted successfully', 'success');
    await loadLecturers();
    await loadCourses();
  } catch (error) {
    console.error('Failed to delete lecturer:', error);
  }
}

async function unassignCourse(code) {
  const confirmed = confirm(`Unassign lecturer from course ${code}?`);
  if (!confirmed) return;

  try {
    await apiCall('PUT', `/courses/${code}`, { lecturerId: '' });
    showToast('Course unassigned successfully', 'success');
    await loadCourses();
    await loadLecturers();
  } catch (error) {
    console.error('Failed to unassign course:', error);
  }
}

function filterByLevel() {
  const level = document.getElementById('level-filter').value;
  const filtered = level
    ? allCourses.filter(c => c.level === parseInt(level))
    : allCourses;
  renderTable(filtered);
}

// ──────────────────────────────────────────────
// Toast Notifications
// ──────────────────────────────────────────────

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
