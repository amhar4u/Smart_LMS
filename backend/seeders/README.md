# Smart LMS Database Seeders

This directory contains database seeder files to populate your Smart LMS database with initial data.

## Available Seeders

### Admin Seeder
Seeds admin users into the database with predefined credentials.

## Usage

### Using npm scripts (Recommended)
```bash
# Seed admin users
npm run seed:admin

# Clear admin users
npm run seed:clear

# Run main seeder (shows options)
npm run seed
```

### Using node directly
```bash
# Seed admin users
node seeders/adminSeeder.js

# Clear admin users  
node seeders/adminSeeder.js --clear

# Show help
node seeders/adminSeeder.js --help
```

## Default Admin Credentials

After running the admin seeder, you'll have these default admin accounts:

| Name | Email | Password | Role |
|------|-------|----------|------|
| Super Admin | admin@smartlms.com | admin123 | admin |
| John Administrator | john.admin@smartlms.com | johnadmin123 | admin |
| Sarah Manager | sarah.manager@smartlms.com | sarahmanager123 | admin |

## Important Notes

⚠️ **Security Warning**: Change these default passwords immediately after first login in production!

✅ **Safe to Run**: The seeder checks for existing admin users and asks for confirmation before proceeding.

🔄 **Idempotent**: Running the seeder multiple times won't create duplicates unless you confirm.

## Adding New Seeders

1. Create a new seeder file in this directory (e.g., `teacherSeeder.js`)
2. Follow the same pattern as `adminSeeder.js`
3. Add the new seeder to `index.js`
4. Add npm scripts to `package.json`

## Environment Requirements

Make sure your `.env` file contains:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key

## Troubleshooting

### Connection Issues
- Verify your MongoDB connection string in `.env`
- Ensure MongoDB is running (if using local instance)
- Check network connectivity (if using MongoDB Atlas)

### Duplicate Key Errors
- Clear existing data with `npm run seed:clear`
- Or modify the seeder data to use different email addresses

### Permission Issues
- Ensure your MongoDB user has write permissions
- Check database access restrictions
