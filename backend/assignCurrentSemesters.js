require('dotenv').config();
const mongoose = require('mongoose');
const Batch = require('./models/Batch');
const Semester = require('./models/Semester');
const Course = require('./models/Course');
const Department = require('./models/Department');

async function assignCurrentSemesters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all semesters
    const semesters = await Semester.find({ isActive: true })
      .populate('batch', 'name code');

    console.log(`Found ${semesters.length} active semesters\n`);

    // Group semesters by batch
    const semestersByBatch = {};
    semesters.forEach(semester => {
      if (semester.batch) {
        const batchId = semester.batch._id.toString();
        if (!semestersByBatch[batchId]) {
          semestersByBatch[batchId] = [];
        }
        semestersByBatch[batchId].push(semester);
      }
    });

    // For each batch, set the first semester as current
    for (const [batchId, batchSemesters] of Object.entries(semestersByBatch)) {
      const batch = await Batch.findById(batchId);
      if (!batch) continue;

      // Sort semesters by year and semester type
      const sortedSemesters = batchSemesters.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        // Spring comes before Fall
        if (a.type === 'Spring' && b.type === 'Fall') return -1;
        if (a.type === 'Fall' && b.type === 'Spring') return 1;
        return 0;
      });

      const firstSemester = sortedSemesters[0];
      
      console.log(`📚 Batch: ${batch.name} (${batch.code})`);
      console.log(`   Setting current semester to: ${firstSemester.name} (${firstSemester.year} ${firstSemester.type})`);
      console.log(`   All semesters: ${sortedSemesters.map(s => s.name).join(', ')}`);

      // Add all semesters to batch and set first as current
      batch.semesters = sortedSemesters.map(s => s._id);
      batch.currentSemester = firstSemester._id;
      await batch.save();
      
      console.log(`   ✅ Updated successfully\n`);
    }

    console.log('✅ All batches updated!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignCurrentSemesters();
