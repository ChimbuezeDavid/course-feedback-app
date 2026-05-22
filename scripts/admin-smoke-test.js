const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
const adminKey = process.env.ADMIN_KEY || 'admin123';

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${adminKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_error) {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data && data.error ? data.error : `Request failed: ${res.status}`);
  }

  return data;
}

(async () => {
  try {
    const lecturers = await request('/api/admin/lecturers');
    const courses = await request('/api/admin/courses');

    if (!lecturers.length) {
      throw new Error('No lecturers found. Add one in the admin dashboard first.');
    }

    const sampleLecturer = lecturers[0];

    const created = await request('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify({
        code: 'CSC-990',
        name: 'Admin Smoke Test',
        level: 500,
        lecturerId: sampleLecturer.id,
      }),
    });

    await request('/api/admin/courses/CSC-990', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Admin Smoke Test Updated',
      }),
    });

    await request('/api/admin/courses/CSC-990', {
      method: 'DELETE',
    });

    console.log('Admin smoke test passed:', {
      lecturers: lecturers.length,
      courses: courses.length,
      created: Boolean(created && created.success),
    });
  } catch (error) {
    console.error('Admin smoke test failed:', error.message);
    process.exit(1);
  }
})();
