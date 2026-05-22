const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;

// ──────────────────────────────────────────────
// In-memory feedback store
// Keyed by courseCode, each entry accumulates ratings + comments
// This simulates what a real database would do
// ──────────────────────────────────────────────
const feedbackStore = {}; // { [courseCode]: { name, code, level, ratings: [], lecturerRatings: [], comments: [] } }

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// ──────────────────────────────────────────────
// Aggregate feedbackStore into an array for the teacher view
// ──────────────────────────────────────────────
function aggregateFeedback() {
  return Object.values(feedbackStore).map(entry => {
    const courseRatings   = entry.ratings.filter(r => r > 0);
    const lecturerRatings = entry.lecturerRatings.filter(r => r > 0);
    const avgCourse   = courseRatings.length
      ? courseRatings.reduce((a, b) => a + b, 0) / courseRatings.length
      : 0;
    const avgLecturer = lecturerRatings.length
      ? lecturerRatings.reduce((a, b) => a + b, 0) / lecturerRatings.length
      : 0;
    return {
      name:            entry.name,
      code:            entry.code,
      level:           entry.level,
      responses:       entry.ratings.length,
      courseRating:    Math.round(avgCourse   * 10) / 10,
      lecturerRating:  Math.round(avgLecturer * 10) / 10,
      trending:        entry.ratings.length >= 5,
      comments:        entry.comments.filter(c => c && c.trim()),
    };
  });
}

const server = http.createServer(async (req, res) => {

  // ── CORS preflight ──
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  // ── POST /api/feedback  (student submits) ──
  if (req.method === 'POST' && req.url === '/api/feedback') {
    try {
      const body = await readBody(req);
      // body: { studentLevel, feedbacks: [{ courseCode, courseName, courseRating, lecturerRating, comment }] }
      const { studentLevel, feedbacks } = body;

      if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
        return sendJSON(res, 400, { error: 'No feedback provided' });
      }

      feedbacks.forEach(fb => {
        const key = fb.courseCode;
        if (!feedbackStore[key]) {
          feedbackStore[key] = {
            name:            fb.courseName,
            code:            fb.courseCode,
            level:           studentLevel,
            ratings:         [],
            lecturerRatings: [],
            comments:        [],
          };
        }
        if (fb.courseRating   > 0) feedbackStore[key].ratings.push(fb.courseRating);
        if (fb.lecturerRating > 0) feedbackStore[key].lecturerRatings.push(fb.lecturerRating);
        if (fb.comment && fb.comment.trim()) feedbackStore[key].comments.push(fb.comment.trim());
      });

      console.log(`📥 Feedback received from ${studentLevel} Level student — ${feedbacks.length} course(s)`);
      return sendJSON(res, 200, { success: true, message: 'Feedback saved successfully' });
    } catch (err) {
      return sendJSON(res, 400, { error: 'Invalid request body' });
    }
  }

  // ── GET /api/feedback  (teacher views) ──
  if (req.method === 'GET' && req.url === '/api/feedback') {
    const data = aggregateFeedback();
    console.log(`📊 Teacher fetched feedback — ${data.length} course(s) with responses`);
    return sendJSON(res, 200, data);
  }

  // ── GET /api/feedback?level=400 ──
  if (req.method === 'GET' && req.url.startsWith('/api/feedback?')) {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const level  = parseInt(params.get('level') || '0');
    const data   = aggregateFeedback().filter(f => !level || f.level === level);
    return sendJSON(res, 200, data);
  }

  // ──────────────────────────────────────────────
  // Static file serving
  // ──────────────────────────────────────────────
  let filePath = './public' + req.url;

  if (req.url === '/' || req.url === '/index.html') {
    filePath = './public/index.html';
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.css': contentType = 'text/css'; break;
    case '.js':  contentType = 'text/javascript'; break;
    case '.png':
    case '.jpg':
    case '.jpeg': contentType = 'image/jpeg'; break;
    case '.svg':  contentType = 'image/svg+xml'; break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile('./public/index.html', (_e, c) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(c || '404 - Page Not Found');
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`   Login Page        → http://localhost:${PORT}`);
  console.log(`   Student Dashboard → http://localhost:${PORT}/student-dashboard.html`);
  console.log(`   Teacher Dashboard → http://localhost:${PORT}/teacher-dashboard.html`);
  console.log(`   POST /api/feedback  ← students submit here`);
  console.log(`   GET  /api/feedback  ← teacher reads from here`);
});