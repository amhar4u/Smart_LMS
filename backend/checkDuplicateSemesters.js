/**
 * Script to check for duplicate semesters in the database
 * Run this to see what semesters exist and identify duplicates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Semester = require('./models/Semester');

async function checkDuplicateSemesters() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all semesters
    const semesters = await Semester.find()
      .populate('batch', 'name code')
      .sort({ year: -1, type: 1 });

    console.log(`📊 Total Semesters: ${semesters.length}\n`);

    // Group by year and type
    const grouped = {};
    
    semesters.forEach(sem => {
      const key = `${sem.year}-${sem.type}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(sem);
    });

    // Display grouped semesters
    console.log('📋 Semesters grouped by Year-Type:\n');
    Object.keys(grouped).sort().forEach(key => {
      const sems = grouped[key];
      console.log(`\n${key.toUpperCase()} (${sems.length} semester(s)):`);
      console.log('─'.repeat(60));
      
      sems.forEach(sem => {
        console.log(`  • ${sem.name} (${sem.code})`);
        console.log(`    Batch: ${sem.batch?.name || 'N/A'} (${sem.batch?.code || 'N/A'})`);
        console.log(`    ID: ${sem._id}`);
        console.log(`    Active: ${sem.isActive}`);
      });
    });

    // Find actual duplicates (same year, type, and batch)
    console.log('\n\n🔍 Checking for duplicates (same year, type, AND batch):\n');
    
    const duplicateGroups = {};
    semesters.forEach(sem => {
      const key = `${sem.year}-${sem.type}-${sem.batch?._id}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(sem);
    });

    let hasDuplicates = false;
    Object.entries(duplicateGroups).forEach(([key, sems]) => {
      if (sems.length > 1) {
        hasDuplicates = true;
        const [year, type, batchId] = key.split('-');
        console.log(`⚠️  DUPLICATE FOUND: ${type} ${year} for batch ${sems[0].batch?.name || 'Unknown'}`);
        sems.forEach((sem, idx) => {
          console.log(`   ${idx + 1}. ${sem.name} (${sem.code}) - ID: ${sem._id}`);
        });
        console.log('');
      }
    });

    if (!hasDuplicates) {
      console.log('✅ No duplicates found! Each batch has unique semester combinations.');
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDuplicateSemesters();
