const http = require('http');
const fsp = require('fs/promises');
const path = require('path');
const { URL } = require('url');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'course_feedback_app';
const FEEDBACK_COLLECTION = 'feedback';
const COURSES_COLLECTION = 'courses';
const LECTURERS_COLLECTION = 'lecturers';
const PUBLIC_DIR = path.join(__dirname, 'public');
const LEVELS = [100, 200, 300, 400, 500];
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
const ROLE_LECTURER = 'lecturer';

let feedbackCollection = null;
let coursesCollection = null;
let lecturersCollection = null;

const DEFAULT_COURSE_CATALOG = {
  100: [
    { name: 'Introduction to Computer Science', code: 'CSC 101', lecturer: 'Dr. James Adeyemi' },
    { name: 'Mathematics for Computing', code: 'CSC 103', lecturer: 'Prof. Grace Nwosu' },
    { name: 'Communication Skills I', code: 'ABUAD-COM 101', lecturer: 'Dr. Blessing Okeke' },
    { name: 'General Physics', code: 'PHY 101', lecturer: 'Dr. Samuel Brown' },
    { name: 'Introduction to Programming', code: 'CSC 105', lecturer: 'Prof. Emily Davis' },
  ],
  200: [
    { name: 'Data Structures and Algorithms', code: 'CSC 201', lecturer: 'Dr. Michael Roberts' },
    { name: 'Discrete Mathematics', code: 'CSC 203', lecturer: 'Prof. Patricia Green' },
    { name: 'Computer Organization', code: 'CSC 205', lecturer: 'Dr. Christopher Adams' },
    { name: 'Communication Skills II', code: 'ABUAD-COM 201', lecturer: 'Dr. Rachel Moore' },
    { name: 'Object-Oriented Programming', code: 'CSC 207', lecturer: 'Prof. Thomas Wilson' },
  ],
  300: [
    { name: 'Database Management Systems', code: 'CSC 301', lecturer: 'Dr. Elizabeth Johnson' },
    { name: 'Operating Systems', code: 'CSC 303', lecturer: 'Prof. Daniel Carter' },
    { name: 'Software Engineering', code: 'CSC 305', lecturer: 'Dr. Angela White' },
    { name: 'Computer Networks I', code: 'CSC 307', lecturer: 'Prof. Kevin Martinez' },
    { name: 'Artificial Intelligence', code: 'CSC 309', lecturer: 'Dr. Olivia Thompson' },
  ],
  400: [
    { name: 'Computer Networks/Communication', code: 'CSC 402', lecturer: 'Dr. Patricia Brown' },
    { name: 'Optimization Techniques', code: 'CSC 404', lecturer: 'Prof. Elizabeth Adams' },
    { name: 'Human-Computer Interaction', code: 'CSC 406', lecturer: 'Prof. Thomas Moore' },
    { name: 'Project Management', code: 'CSC 408', lecturer: 'Dr. Rachel Green' },
    { name: 'Computer System Performance Evaluation', code: 'CSC 410', lecturer: 'Dr. Christopher Davis' },
    { name: 'Communication Skills', code: 'ABUAD-COM 412', lecturer: 'Dr. Grace Adeyemi' },
    { name: 'Entrepreneurship Studies', code: 'ABUAD-COM 414', lecturer: 'Prof. Daniel Okeke' },
    { name: 'Modelling and Simulation', code: 'CSC 416', lecturer: 'Dr. Samuel Oladele' },
    { name: 'Information System Security', code: 'CSC 418', lecturer: 'Dr. Michael Roberts' },
    { name: 'Research Methodology', code: 'ABUAD-COM 416', lecturer: 'Dr. Blessing Nwosu' },
  ],
  500: [
    { name: 'Advanced Software Engineering', code: 'CSC 501', lecturer: 'Prof. Victor Eze' },
    { name: 'Machine Learning', code: 'CSC 503', lecturer: 'Dr. Linda Obi' },
    { name: 'Cloud Computing', code: 'CSC 505', lecturer: 'Dr. Andrew Chukwu' },
    { name: 'Final Year Project', code: 'CSC 599', lecturer: 'Prof. Ngozi Ihejirika' },
  ],
};

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    feedbackCollection = db.collection(FEEDBACK_COLLECTION);
    coursesCollection = db.collection(COURSES_COLLECTION);
    lecturersCollection = db.collection(LECTURERS_COLLECTION);
    
    await feedbackCollection.createIndex({ code: 1 });
    await coursesCollection.createIndex({ code: 1 }, { unique: true });
    await lecturersCollection.createIndex({ name: 1 }, { unique: true });
    
    const lecturerMap = await seedLecturersIfEmpty();
    await seedCoursesIfEmpty(lecturerMap);
    await ensureCourseLecturerLinks(lecturerMap);
    
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function seedLecturersIfEmpty() {
  if (!lecturersCollection) return new Map();

  const count = await lecturersCollection.countDocuments();
  if (count > 0) {
    const existing = await lecturersCollection.find({}).toArray();
    return new Map(existing.map((lecturer) => [lecturer.name, lecturer]));
  }

  const names = new Set();
  for (const courses of Object.values(DEFAULT_COURSE_CATALOG)) {
    for (const course of courses) {
      if (course.lecturer) {
        names.add(course.lecturer);
      }
    }
  }

  const docs = Array.from(names).map((name) => ({
    name,
    role: ROLE_LECTURER,
    createdAt: new Date().toISOString(),
  }));

  if (docs.length > 0) {
    await lecturersCollection.insertMany(docs);
  }

  const inserted = await lecturersCollection.find({}).toArray();
  return new Map(inserted.map((lecturer) => [lecturer.name, lecturer]));
}

async function seedCoursesIfEmpty(lecturerMap) {
  if (!coursesCollection) return;

  const count = await coursesCollection.countDocuments();
  if (count > 0) {
    return;
  }

  console.log('Seeding default courses...');
  const docs = [];
  for (const [level, courses] of Object.entries(DEFAULT_COURSE_CATALOG)) {
    for (const course of courses) {
      const lecturer = lecturerMap.get(course.lecturer);
      docs.push({
        name: course.name,
        code: course.code,
        level: parseInt(level, 10),
        lecturerId: lecturer ? lecturer._id : null,
        lecturerName: lecturer ? lecturer.name : course.lecturer,
      });
    }
  }

  if (docs.length > 0) {
    await coursesCollection.insertMany(docs);
    console.log(`Seeded ${docs.length} courses`);
  }
}

async function ensureCourseLecturerLinks(lecturerMap) {
  if (!coursesCollection || !lecturersCollection) return;

  const cursor = coursesCollection.find({
    $or: [
      { lecturerId: { $exists: false } },
      { lecturerName: { $exists: false } },
    ],
  });

  for await (const course of cursor) {
    const name = course.lecturerName || course.lecturer;
    if (!name) {
      continue;
    }

    let lecturer = lecturerMap.get(name);
    if (!lecturer) {
      const insert = await lecturersCollection.insertOne({
        name,
        role: ROLE_LECTURER,
        createdAt: new Date().toISOString(),
      });
      lecturer = { _id: insert.insertedId, name, role: ROLE_LECTURER };
      lecturerMap.set(name, lecturer);
    }

    await coursesCollection.updateOne(
      { _id: course._id },
      {
        $set: {
          lecturerId: lecturer._id,
          lecturerName: lecturer.name,
        },
        $unset: { lecturer: '' },
      }
    );
  }
}

async function getAllCourses() {
  if (!coursesCollection) return [];
  return await coursesCollection.find({}).toArray();
}

async function getCoursesByLevel(level) {
  if (!coursesCollection) return [];
  return await coursesCollection.find({ level }).toArray();
}

async function getCourseByCode(courseCode) {
  if (!coursesCollection) return null;
  return await coursesCollection.findOne({ code: courseCode });
}

async function getAllLecturers() {
  if (!lecturersCollection) return [];
  return await lecturersCollection.find({}).toArray();
}

async function getLecturerById(id) {
  if (!lecturersCollection) return null;
  return await lecturersCollection.findOne({ _id: id });
}

async function getLecturerByName(name) {
  if (!lecturersCollection) return null;
  return await lecturersCollection.findOne({ name });
}

async function getFeedbackRecord(courseCode) {
  if (!feedbackCollection) return null;
  return await feedbackCollection.findOne({ code: courseCode });
}

async function saveFeedbackRecord(record) {
  if (!feedbackCollection) return;
  await feedbackCollection.updateOne(
    { code: record.code },
    { $set: record },
    { upsert: true }
  );
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, data, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(data);
}

function normalizeLevel(value) {
  const level = Number.parseInt(String(value), 10);
  return LEVELS.includes(level) ? level : null;
}

function roundRating(value) {
  return Math.round(value * 10) / 10;
}

function clampRating(value) {
  const rating = Number.parseInt(String(value), 10);
  if (!Number.isFinite(rating)) {
    return 0;
  }
  return Math.min(5, Math.max(0, rating));
}

function parseObjectId(value) {
  try {
    return new ObjectId(String(value));
  } catch (_error) {
    return null;
  }
}

function verifyAdminKey(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') && auth.slice(7) === ADMIN_KEY;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

async function aggregateFeedback() {
  if (!feedbackCollection) return [];
  
  const records = await feedbackCollection.find({}).toArray();
  const courses = coursesCollection ? await coursesCollection.find({}).toArray() : [];
  const lecturerMap = new Map(
    courses.map((course) => [course.code, { name: course.lecturerName || course.lecturer || 'Unassigned', id: course.lecturerId ? String(course.lecturerId) : null }])
  );
  
  return records
    .map((entry) => {
      const courseRatings = entry.ratings.filter((rating) => rating > 0);
      const lecturerRatings = entry.lecturerRatings.filter((rating) => rating > 0);

      const averageCourse = courseRatings.length
        ? courseRatings.reduce((sum, rating) => sum + rating, 0) / courseRatings.length
        : 0;

      const averageLecturer = lecturerRatings.length
        ? lecturerRatings.reduce((sum, rating) => sum + rating, 0) / lecturerRatings.length
        : 0;

      const lecturerInfo = lecturerMap.get(entry.code) || { name: 'Unassigned', id: null };
      return {
        name: entry.name,
        code: entry.code,
        level: entry.level,
        responses: entry.responses,
        courseRating: roundRating(averageCourse),
        lecturerRating: roundRating(averageLecturer),
        lecturer: lecturerInfo.name,
        lecturerId: lecturerInfo.id,
        trending: entry.responses >= 5,
        comments: entry.comments.filter((comment) => comment && comment.trim()),
        lastUpdatedAt: entry.lastUpdatedAt,
      };
    })
    .sort((left, right) => {
      if (left.level !== right.level) {
        return left.level - right.level;
      }

      return left.code.localeCompare(right.code);
    });
}

async function getFeedbackForLevel(level) {
  const all = await aggregateFeedback();
  return all.filter((entry) => entry.level === level);
}

async function upsertFeedbackRecord(studentLevel, feedback) {
  const course = await getCourseByCode(feedback.courseCode);

  if (!course) {
    return { error: `Unknown course code: ${feedback.courseCode}` };
  }

  if (course.name !== feedback.courseName) {
    return { error: `Course name mismatch for ${feedback.courseCode}` };
  }

  if (studentLevel !== course.level) {
    return { error: `Course ${feedback.courseCode} does not belong to level ${studentLevel}` };
  }

  const courseRating = clampRating(feedback.courseRating);
  const lecturerRating = clampRating(feedback.lecturerRating);
  const comment = typeof feedback.comment === 'string' ? feedback.comment.trim() : '';

  if (!feedbackCollection) {
    return { error: 'Database not initialized' };
  }

  const existing = await getFeedbackRecord(feedback.courseCode);
  
  if (!existing) {
    const record = {
      name: course.name,
      code: course.code,
      level: course.level,
      ratings: courseRating > 0 ? [courseRating] : [],
      lecturerRatings: lecturerRating > 0 ? [lecturerRating] : [],
      comments: comment ? [comment] : [],
      responses: 1,
      lastUpdatedAt: new Date().toISOString(),
    };
    await saveFeedbackRecord(record);
  } else {
    const updates = {};
    
    if (courseRating > 0) {
      updates.$push = updates.$push || {};
      updates.$push.ratings = courseRating;
    }
    
    if (lecturerRating > 0) {
      updates.$push = updates.$push || {};
      updates.$push.lecturerRatings = lecturerRating;
    }
    
    if (comment) {
      updates.$push = updates.$push || {};
      updates.$push.comments = comment;
    }
    
    updates.$inc = { responses: 1 };
    updates.$set = { lastUpdatedAt: new Date().toISOString() };
    
    await feedbackCollection.updateOne({ code: feedback.courseCode }, updates);
  }

  return { success: true };
}

async function handleApiRequest(req, res, url) {
  // Health check
  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJSON(res, 200, {
      ok: true,
      uptime: process.uptime(),
      levels: LEVELS,
    });
    return true;
  }

  // Get courses (public)
  if (req.method === 'GET' && url.pathname === '/api/courses') {
    const hasLevelFilter = url.searchParams.has('level');
    const level = hasLevelFilter ? normalizeLevel(url.searchParams.get('level')) : null;

    if (hasLevelFilter && level === null) {
      sendJSON(res, 400, { error: 'Invalid level filter' });
      return true;
    }

    try {
      const courses = level ? await getCoursesByLevel(level) : await getAllCourses();
      const result = courses.map((course) => {
        const { _id, lecturerName, lecturerId, ...rest } = course;
        return {
          ...rest,
          lecturer: lecturerName || course.lecturer || 'Unassigned',
          lecturerId: lecturerId ? String(lecturerId) : null,
        };
      });
      sendJSON(res, 200, result);
      return true;
    } catch (error) {
      sendJSON(res, 500, { error: 'Failed to retrieve courses' });
      return true;
    }
  }

  // Submit feedback
  if (req.method === 'POST' && url.pathname === '/api/feedback') {
    try {
      const body = await readBody(req);
      const studentLevel = normalizeLevel(body.studentLevel);

      if (studentLevel === null) {
        sendJSON(res, 400, { error: 'A valid studentLevel is required' });
        return true;
      }

      if (!Array.isArray(body.feedbacks) || body.feedbacks.length === 0) {
        sendJSON(res, 400, { error: 'No feedback provided' });
        return true;
      }

      const invalidFeedback = body.feedbacks.find((feedback) => {
        return !feedback || typeof feedback.courseCode !== 'string' || typeof feedback.courseName !== 'string';
      });

      if (invalidFeedback) {
        sendJSON(res, 400, { error: 'Each feedback item must include courseCode and courseName' });
        return true;
      }

      const nonEmptyFeedbacks = body.feedbacks.filter((feedback) => {
        const courseRating = clampRating(feedback.courseRating);
        const lecturerRating = clampRating(feedback.lecturerRating);
        const comment = typeof feedback.comment === 'string' ? feedback.comment.trim() : '';
        return courseRating > 0 || lecturerRating > 0 || comment.length > 0;
      });

      if (nonEmptyFeedbacks.length === 0) {
        sendJSON(res, 400, { error: 'Feedback must include at least one rating or comment' });
        return true;
      }

      for (const feedback of nonEmptyFeedbacks) {
        const result = await upsertFeedbackRecord(studentLevel, feedback);
        if (result.error) {
          sendJSON(res, 400, { error: result.error });
          return true;
        }
      }

      console.log(`Saved ${nonEmptyFeedbacks.length} feedback item(s) for ${studentLevel} level`);
      sendJSON(res, 200, {
        success: true,
        message: 'Feedback saved successfully',
        saved: nonEmptyFeedbacks.length,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error && error.message === 'Request body too large'
        ? 'Request body too large'
        : 'Invalid request body';

      sendJSON(res, 400, { error: message });
      return true;
    }
  }

  // Get feedback (public, aggregated)
  if (req.method === 'GET' && url.pathname === '/api/feedback') {
    const hasLevelFilter = url.searchParams.has('level');
    const level = hasLevelFilter ? normalizeLevel(url.searchParams.get('level')) : null;

    if (hasLevelFilter && level === null) {
      sendJSON(res, 400, { error: 'Invalid level filter' });
      return true;
    }

    try {
      const data = level ? await getFeedbackForLevel(level) : await aggregateFeedback();
      sendJSON(res, 200, data);
      return true;
    } catch (error) {
      sendJSON(res, 500, { error: 'Failed to retrieve feedback' });
      return true;
    }
  }

  // Admin routes
  if (url.pathname.startsWith('/api/admin/')) {
    if (!verifyAdminKey(req)) {
      sendJSON(res, 401, { error: 'Unauthorized: Invalid or missing admin key' });
      return true;
    }

    // GET admin/lecturers
    if (req.method === 'GET' && url.pathname === '/api/admin/lecturers') {
      try {
        const lecturers = await getAllLecturers();
        const result = lecturers.map((lecturer) => {
          const { _id, ...rest } = lecturer;
          return { id: _id.toString(), ...rest };
        });
        sendJSON(res, 200, result);
        return true;
      } catch (error) {
        sendJSON(res, 500, { error: 'Failed to retrieve lecturers' });
        return true;
      }
    }

    // POST admin/lecturers
    if (req.method === 'POST' && url.pathname === '/api/admin/lecturers') {
      try {
        const body = await readBody(req);
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';

        if (!name) {
          sendJSON(res, 400, { error: 'Lecturer name is required' });
          return true;
        }

        const existing = await getLecturerByName(name);
        if (existing) {
          sendJSON(res, 400, { error: `Lecturer ${name} already exists` });
          return true;
        }

        const result = await lecturersCollection.insertOne({
          name,
          email,
          role: ROLE_LECTURER,
          createdAt: new Date().toISOString(),
        });

        sendJSON(res, 201, { success: true, lecturerId: result.insertedId });
        return true;
      } catch (error) {
        sendJSON(res, 400, { error: error.message || 'Invalid request body' });
        return true;
      }
    }

    // PUT admin/lecturers/:id
    if (req.method === 'PUT' && url.pathname.startsWith('/api/admin/lecturers/')) {
      try {
        const idValue = url.pathname.split('/').pop();
        const lecturerId = parseObjectId(idValue);
        if (!lecturerId) {
          sendJSON(res, 400, { error: 'Invalid lecturer id' });
          return true;
        }

        const body = await readBody(req);
        const updates = {};
        if (body.name) updates.name = String(body.name).trim();
        if (body.email) updates.email = String(body.email).trim();

        if (!Object.keys(updates).length) {
          sendJSON(res, 400, { error: 'No updates provided' });
          return true;
        }

        const existing = await getLecturerById(lecturerId);
        if (!existing) {
          sendJSON(res, 404, { error: 'Lecturer not found' });
          return true;
        }

        await lecturersCollection.updateOne({ _id: lecturerId }, { $set: updates });

        if (updates.name) {
          await coursesCollection.updateMany(
            { lecturerId },
            { $set: { lecturerName: updates.name } }
          );
        }

        sendJSON(res, 200, { success: true, message: 'Lecturer updated' });
        return true;
      } catch (error) {
        sendJSON(res, 400, { error: error.message || 'Invalid request' });
        return true;
      }
    }

    // DELETE admin/lecturers/:id
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/lecturers/')) {
      try {
        const idValue = url.pathname.split('/').pop();
        const lecturerId = parseObjectId(idValue);
        if (!lecturerId) {
          sendJSON(res, 400, { error: 'Invalid lecturer id' });
          return true;
        }

        const existing = await getLecturerById(lecturerId);
        if (!existing) {
          sendJSON(res, 404, { error: 'Lecturer not found' });
          return true;
        }

        const assignedCount = await coursesCollection.countDocuments({ lecturerId });
        if (assignedCount > 0) {
          sendJSON(res, 400, { error: 'Lecturer is assigned to courses. Unassign first.' });
          return true;
        }

        await lecturersCollection.deleteOne({ _id: lecturerId });
        sendJSON(res, 200, { success: true, message: 'Lecturer deleted' });
        return true;
      } catch (error) {
        sendJSON(res, 500, { error: error.message || 'Failed to delete lecturer' });
        return true;
      }
    }

    // GET admin/courses
    if (req.method === 'GET' && url.pathname === '/api/admin/courses') {
      try {
        const courses = await getAllCourses();
        const result = courses.map((course) => {
          const { _id, lecturerName, lecturerId, ...rest } = course;
          return {
            ...rest,
            lecturerName: lecturerName || course.lecturer || 'Unassigned',
            lecturerId: lecturerId ? String(lecturerId) : null,
          };
        });
        sendJSON(res, 200, result);
        return true;
      } catch (error) {
        sendJSON(res, 500, { error: 'Failed to retrieve courses' });
        return true;
      }
    }

    // Public lecturers list (safe lightweight endpoint)
    if (req.method === 'GET' && url.pathname === '/api/lecturers-public') {
      try {
        const lecturers = await getAllLecturers();
        const result = lecturers.map(l => ({ id: l._id.toString(), name: l.name }));
        sendJSON(res, 200, result);
        return true;
      } catch (error) {
        sendJSON(res, 500, { error: 'Failed to retrieve lecturers' });
        return true;
      }
    }

    // POST admin/courses (add new)
    if (req.method === 'POST' && url.pathname === '/api/admin/courses') {
      try {
        const body = await readBody(req);

        if (!body.code || !body.name) {
          sendJSON(res, 400, { error: 'Course must have code and name' });
          return true;
        }

        const level = normalizeLevel(body.level);
        if (!level) {
          sendJSON(res, 400, { error: 'Invalid level (must be 100-500)' });
          return true;
        }

        const existing = await getCourseByCode(body.code);
        if (existing) {
          sendJSON(res, 400, { error: `Course code ${body.code} already exists` });
          return true;
        }

        const newCourse = {
          code: body.code.toUpperCase(),
          name: body.name,
          level: level,
        };

        // optional lecturer assignment
        if (Object.prototype.hasOwnProperty.call(body, 'lecturerId') && body.lecturerId) {
          const lecturerId = parseObjectId(body.lecturerId);
          if (!lecturerId) {
            sendJSON(res, 400, { error: 'Invalid lecturer id' });
            return true;
          }
          const lecturer = await getLecturerById(lecturerId);
          if (!lecturer || lecturer.role !== ROLE_LECTURER) {
            sendJSON(res, 400, { error: 'Lecturer assignment is invalid' });
            return true;
          }
          newCourse.lecturerId = lecturerId;
          newCourse.lecturerName = lecturer.name;
        }

        const result = await coursesCollection.insertOne(newCourse);
        console.log(`Added new course: ${newCourse.code}`);
        
        sendJSON(res, 201, { success: true, courseId: result.insertedId });
        return true;
      } catch (error) {
        sendJSON(res, 400, { error: error.message || 'Invalid request body' });
        return true;
      }
    }

    // PUT admin/courses/:code (update)
    if (req.method === 'PUT' && url.pathname.startsWith('/api/admin/courses/')) {
      try {
        const code = url.pathname.split('/').pop();
        const body = await readBody(req);

        const existing = await getCourseByCode(code);
        if (!existing) {
          sendJSON(res, 404, { error: `Course ${code} not found` });
          return true;
        }

        const updates = {};
        if (body.name) updates.name = body.name;
        if (body.level) {
          const level = normalizeLevel(body.level);
          if (!level) {
            sendJSON(res, 400, { error: 'Invalid level' });
            return true;
          }
          updates.level = level;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'lecturerId')) {
          // Allow unassigning by sending empty string or null
          if (body.lecturerId === '' || body.lecturerId === null) {
            updates.$unset = { lecturerId: '', lecturerName: '' };
          } else {
            const lecturerId = parseObjectId(body.lecturerId);
            if (!lecturerId) {
              sendJSON(res, 400, { error: 'Invalid lecturer id' });
              return true;
            }

            const lecturer = await getLecturerById(lecturerId);
            if (!lecturer || lecturer.role !== ROLE_LECTURER) {
              sendJSON(res, 400, { error: 'Lecturer assignment is invalid' });
              return true;
            }

            updates.lecturerId = lecturerId;
            updates.lecturerName = lecturer.name;
          }
        }

        await coursesCollection.updateOne({ code }, { $set: updates });
        console.log(`Updated course: ${code}`);

        sendJSON(res, 200, { success: true, message: 'Course updated' });
        return true;
      } catch (error) {
        sendJSON(res, 400, { error: error.message || 'Invalid request' });
        return true;
      }
    }

    // DELETE admin/courses/:code
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/courses/')) {
      try {
        const code = url.pathname.split('/').pop();

        const existing = await getCourseByCode(code);
        if (!existing) {
          sendJSON(res, 404, { error: `Course ${code} not found` });
          return true;
        }

        await coursesCollection.deleteOne({ code });
        console.log(`Deleted course: ${code}`);

        sendJSON(res, 200, { success: true, message: 'Course deleted' });
        return true;
      } catch (error) {
        sendJSON(res, 500, { error: error.message || 'Failed to delete course' });
        return true;
      }
    }

    sendJSON(res, 404, { error: 'Admin endpoint not found' });
    return true;
  }

  return false;
}

function getContentType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.html':
    default:
      return 'text/html; charset=utf-8';
  }
}

function resolveStaticPath(urlPath) {
  const requestPath = urlPath === '/' ? '/index.html' : urlPath;
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^([/\\])+/, '');
  const resolvedPath = path.join(PUBLIC_DIR, safePath);

  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return resolvedPath;
}

async function serveStaticFile(res, urlPath) {
  const filePath = resolveStaticPath(urlPath);

  if (!filePath) {
    sendText(res, 400, 'Bad Request');
    return;
  }

  try {
    const stat = await fsp.stat(filePath);
    const finalPath = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const content = await fsp.readFile(finalPath);

    res.writeHead(200, {
      'Content-Type': getContentType(finalPath),
      'Cache-Control': 'no-store',
    });
    res.end(content);
  } catch (_error) {
    try {
      const fallback = await fsp.readFile(path.join(PUBLIC_DIR, 'index.html'));
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(fallback);
    } catch (fallbackError) {
      sendText(res, 404, '404 - Page Not Found');
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    });
    res.end();
    return;
  }

  const handled = await handleApiRequest(req, res, url);
  if (handled) {
    return;
  }

  await serveStaticFile(res, url.pathname);
});

(async () => {
  const mongoClient = await initializeDatabase();
  
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Login Page        -> http://localhost:${PORT}`);
    console.log(`Student Dashboard -> http://localhost:${PORT}/student-dashboard.html`);
    console.log(`Teacher Dashboard -> http://localhost:${PORT}/teacher-dashboard.html`);
    console.log(`Admin Dashboard   -> http://localhost:${PORT}/admin-dashboard.html`);
    console.log('API endpoints:');
    console.log('  GET  /api/health');
    console.log('  GET  /api/courses');
    console.log('  POST /api/feedback');
    console.log('  GET  /api/feedback');
    console.log('Admin endpoints (require Authorization: Bearer admin123):');
    console.log('  GET    /api/admin/courses');
    console.log('  POST   /api/admin/courses');
    console.log('  PUT    /api/admin/courses/:code');
    console.log('  DELETE /api/admin/courses/:code');
  });
  
  process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    server.close();
    await mongoClient.close();
    process.exit(0);
  });
})();
