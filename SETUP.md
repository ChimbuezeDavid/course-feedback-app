# Database Setup Guide

This guide helps developers set up the course feedback app database quickly.

## Prerequisites

- **MongoDB**: Install MongoDB locally or have a MongoDB Atlas account
- **Node.js**: Version 14 or higher
- **npm**: Version 6 or higher

## Quick Setup

### Option 1: Complete Setup (Recommended for first-time setup)
```bash
npm run setup
```

This command will:
1. Install dependencies
2. Build TypeScript files
3. Seed the database with default courses and lecturers

### Option 2: Manual Steps

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Build TypeScript
```bash
npm run build
```

#### 3. Seed the Database
```bash
npm run seed
```

## Seeding the Database

The `seed` script will:
- Create the necessary MongoDB collections
- Create indexes for optimal query performance
- Populate lecturers from the course catalog
- Populate courses with relationships to lecturers

### What Gets Seeded?

**Lecturers**: Automatically extracted from the course catalog (20+ lecturers)

**Courses**: Organized by level (100-500) with:
- Course name
- Course code (e.g., CSC 101)
- Academic level
- Associated lecturer

**Feedback**: Initially empty (populated by user submissions)

### Running the Seed Script

```bash
# Standard seeding
npm run seed

# To reseed (data already exists, script will skip)
npm run seed
```

The seed script is **safe to run multiple times** — it checks if data exists before inserting, preventing duplicates.

## Environment Configuration

### MongoDB Connection

Set the `MONGODB_URI` environment variable to connect to your database:

```bash
# Local MongoDB (default)
MONGODB_URI=mongodb://localhost:27017

# MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
```

**Example with local MongoDB:**
```bash
MONGODB_URI=mongodb://localhost:27017 npm run seed
```

**Example with MongoDB Atlas:**
```bash
MONGODB_URI=mongodb+srv://user:password@cluster0.mongodb.net/ npm run seed
```

## Troubleshooting

### "Failed to connect to MongoDB"
- Ensure MongoDB is running (`mongod` for local, or check MongoDB Atlas connection)
- Verify `MONGODB_URI` is correct
- Check firewall/network settings

### "Collection already exists"
- The seed script safely handles this — just run `npm run seed` again
- If you need a fresh database, drop the `course_feedback_app` database in MongoDB and run the script

### "Module not found"
- Run `npm install` to install dependencies
- Ensure Node.js is properly installed

## Development Workflow

```bash
# Initial setup
npm run setup

# Start the development server
npm run dev

# Build only (TypeScript → JavaScript)
npm run build

# Run the app (requires pre-built JS)
npm start

# Run admin smoke tests
npm run admin:smoke

# Reseed database as needed
npm run seed
```

## Database Structure

```
course_feedback_app
├── lecturers
│   ├── _id
│   ├── name
│   ├── role ("lecturer")
│   └── createdAt
├── courses
│   ├── _id
│   ├── name
│   ├── code
│   ├── level
│   ├── lecturerId (references lecturers._id)
│   └── lecturerName
└── feedback
    ├── _id
    ├── code (course code)
    ├── ratings []
    ├── lecturerRatings []
    ├── comments []
    ├── responses (count)
    └── lastUpdatedAt
```

## Need Help?

- Check [README.md](../README.md) for general app documentation
- Review [server.js](../server.js) for API implementation details
- Check MongoDB logs if connections fail
