const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'course_feedback_app';
const FEEDBACK_COLLECTION = 'feedback';
const COURSES_COLLECTION = 'courses';
const LECTURERS_COLLECTION = 'lecturers';
const ROLE_LECTURER = 'lecturer';

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

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const feedbackCollection = db.collection(FEEDBACK_COLLECTION);
    const coursesCollection = db.collection(COURSES_COLLECTION);
    const lecturersCollection = db.collection(LECTURERS_COLLECTION);
    
    // Create indexes
    console.log('Creating indexes...');
    await feedbackCollection.createIndex({ code: 1 });
    await coursesCollection.createIndex({ code: 1 }, { unique: true });
    await lecturersCollection.createIndex({ name: 1 }, { unique: true });
    console.log('✓ Indexes created');
    
    // Seed lecturers
    console.log('\nSeeding lecturers...');
    const lecturerMap = await seedLecturers(lecturersCollection);
    console.log(`✓ Seeded ${lecturerMap.size} lecturers`);
    
    // Seed courses
    console.log('\nSeeding courses...');
    const coursesCount = await seedCourses(coursesCollection, lecturerMap);
    console.log(`✓ Seeded ${coursesCount} courses`);
    
    console.log('\n✓ Database seeded successfully!');
    console.log(`  Database: ${DB_NAME}`);
    console.log(`  Collections: ${LECTURERS_COLLECTION}, ${COURSES_COLLECTION}, ${FEEDBACK_COLLECTION}`);
    
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function seedLecturers(lecturersCollection) {
  const existingCount = await lecturersCollection.countDocuments();
  
  if (existingCount > 0) {
    console.log(`  (${existingCount} lecturers already exist)`);
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

async function seedCourses(coursesCollection, lecturerMap) {
  const existingCount = await coursesCollection.countDocuments();
  
  if (existingCount > 0) {
    console.log(`  (${existingCount} courses already exist)`);
    return 0;
  }

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
  }

  return docs.length;
}

// Run the seeding script
seedDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
