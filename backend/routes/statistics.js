const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Batch = require('../models/Batch');

// @route   GET /api/statistics
// @desc    Get overall platform statistics
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('📊 [STATISTICS] Fetching platform statistics');

    // Get user counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });
    const expertTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const admins = await User.countDocuments({ role: 'admin', isActive: true });

    // Get course count
    const coursesAvailable = await Course.countDocuments({ isActive: true });

    // Get department count
    const totalDepartments = await Department.countDocuments({ isActive: true });

    // Calculate success rate based on active users vs total users
    const totalRegisteredUsers = await User.countDocuments({});
    const successRate = totalRegisteredUsers > 0 ? Math.round((totalUsers / totalRegisteredUsers) * 100) : 0;

    // Get department-wise statistics
    const departmentStats = await Department.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'department',
          as: 'courses'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          studentCount: {
            $size: {
              $filter: {
                input: '$users',
                cond: { 
                  $and: [
                    { $eq: ['$$this.role', 'student'] },
                    { $eq: ['$$this.isActive', true] }
                  ]
                }
              }
            }
          },
          teacherCount: {
            $size: {
              $filter: {
                input: '$users',
                cond: { 
                  $and: [
                    { $eq: ['$$this.role', 'teacher'] },
                    { $eq: ['$$this.isActive', true] }
                  ]
                }
              }
            }
          },
          courseCount: {
            $size: {
              $filter: {
                input: '$courses',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          },
          successRate: {
            $cond: {
              if: { $gt: [{ $size: '$users' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$users',
                            cond: { $eq: ['$$this.isActive', true] }
                          }
                        }
                      },
                      { $size: '$users' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    const statistics = {
      overall: {
        activeStudents,
        expertTeachers,
        coursesAvailable,
        successRate,
        totalDepartments,
        totalUsers,
        admins
      },
      departments: departmentStats
    };

    console.log(`✅ [STATISTICS] Statistics fetched successfully`);
    console.log(`   📊 Active Students: ${activeStudents}`);
    console.log(`   👨‍🏫 Expert Teachers: ${expertTeachers}`);
    console.log(`   📚 Courses Available: ${coursesAvailable}`);
    console.log(`   📈 Success Rate: ${successRate}%`);
    console.log(`   🏢 Total Departments: ${totalDepartments}`);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('❌ [STATISTICS] Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// @route   GET /api/statistics/departments
// @desc    Get department-wise detailed statistics
// @access  Public
router.get('/departments', async (req, res) => {
  try {
    console.log('📊 [STATISTICS] Fetching department-wise statistics');

    const departmentStats = await Department.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'department',
          as: 'courses'
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: 'department',
          as: 'batches'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          description: 1,
          totalUsers: { $size: '$users' },
          activeUsers: {
            $size: {
              $filter: {
                input: '$users',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          },
          studentCount: {
            $size: {
              $filter: {
                input: '$users',
                cond: { 
                  $and: [
                    { $eq: ['$$this.role', 'student'] },
                    { $eq: ['$$this.isActive', true] }
                  ]
                }
              }
            }
          },
          teacherCount: {
            $size: {
              $filter: {
                input: '$users',
                cond: { 
                  $and: [
                    { $eq: ['$$this.role', 'teacher'] },
                    { $eq: ['$$this.isActive', true] }
                  ]
                }
              }
            }
          },
          courseCount: {
            $size: {
              $filter: {
                input: '$courses',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          },
          batchCount: {
            $size: {
              $filter: {
                input: '$batches',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          },
          successRate: {
            $cond: {
              if: { $gt: [{ $size: '$users' }, 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $size: {
                              $filter: {
                                input: '$users',
                                cond: { $eq: ['$$this.isActive', true] }
                              }
                            }
                          },
                          { $size: '$users' }
                        ]
                      },
                      100
                    ]
                  },
                  0
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    console.log(`✅ [STATISTICS] Department statistics fetched for ${departmentStats.length} departments`);

    res.json({
      success: true,
      data: departmentStats
    });
  } catch (error) {
    console.error('❌ [STATISTICS] Error fetching department statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department statistics',
      error: error.message
    });
  }
});

module.exports = router;
