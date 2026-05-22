# Course Feedback App

An interactive, responsive full-stack web application designed to collect and aggregate course evaluations. The project features clean dashboards for both students (to rate and write comments on their courses) and lecturers (to track rating trends and read student feedback).

---

## Key Features

### Role-Based Interface
- **Dynamic Login**: A single entrance page that adjusts contextually. Selecting the student role prompts for their academic level, while selecting the teacher role automatically hides irrelevant fields and transitions seamlessly.

### Student Dashboard
- **Level-Specific Course Listings**: Students see courses tailored specifically to their academic level.
- **Dual Rating System**: Provides interactive star ratings for both the course content and the lecturer.
- **Interactive Comment Section**: Course cards expand smoothly upon interaction, revealing a dedicated discussion/feedback area where comments can be written and viewed.
- **Live Search**: Quick filter tools to search through courses by code or title in real time.

### Lecturer Dashboard
- **Consolidated Analytics**: An aggregated view showing average course ratings, lecturer ratings, and response counts.
- **Trending Alerts**: Special badges highlight courses that have received a high volume of responses.
- **Comprehensive Feedback View**: Interactive course cards that expand to display all student comments.
- **Filter by Level**: Ability to segment statistics by academic level (100, 200, 300, or 400).

### Modern Design System
- Built using semantic HTML5 and vanilla CSS.
- Implements custom variables for a cohesive dark-mode/glassmorphism design theme.
- Enhanced with micro-animations and smooth transition effects to improve interactivity.

---

## Project Structure

```
├── public/                 # Static files served by the backend
│   ├── css/
│   │   └── style.css       # Core styling and premium layout theme
│   ├── js/                 # Compiled JavaScript files
│   ├── index.html          # Authentication / Login page
│   ├── student-dashboard.html
│   └── teacher-dashboard.html
├── src/                    # Source TypeScript files
│   ├── types/              # Type definitions for state and responses
│   ├── utils/              # Helper functions (e.g. rating computations)
│   └── main.ts             # Core frontend controller
├── server.js               # Zero-dependency Node.js HTTP server
├── tsconfig.json           # TypeScript configuration
└── package.json            # Scripts and project dependencies
```

---

## Technical Stack

- **Frontend**: HTML5, TypeScript, Vanilla CSS (using modern CSS Grid, Flexbox, Custom Properties, and Keyframe animations).
- **Backend**: Node.js HTTP server. Serves static files and provides API endpoints for posting/getting in-memory aggregated feedback with no external framework dependencies.

---

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ChimbuezeDavid/course-feedback-app.git
   cd course-feedback-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
To compile the TypeScript files and start the Node.js development server simultaneously, run:
```bash
npm run dev
```

Once started, the application is available at:
- **Application Portal**: [http://localhost:3000](http://localhost:3000)
- **Student Dashboard**: [http://localhost:3000/student-dashboard.html](http://localhost:3000/student-dashboard.html)
- **Teacher Dashboard**: [http://localhost:3000/teacher-dashboard.html](http://localhost:3000/teacher-dashboard.html)

---

## API Endpoints

The server exposes the following HTTP endpoints for frontend integration:

- `POST /api/feedback` - Accepts and saves student ratings and comments in memory.
- `GET /api/feedback` - Returns aggregated analytics for all courses.
- `GET /api/feedback?level=<level>` - Returns filtered feedback matching a specific academic level.
