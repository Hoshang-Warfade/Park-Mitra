const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Database is at project root
const dbPath = path.join(__dirname, '../../parkmitra.db');
const db = new sqlite3.Database(dbPath);

// Get user email or name from command line
const identifier = process.argv[2];
const newPassword = process.argv[3] || 'password123';

if (!identifier) {
  console.error('Usage: node reset-password.js <email_or_name> [new_password]');
  console.error('Example: node reset-password.js Shounak password123');
  process.exit(1);
}

// First, find the user
db.get(
  'SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ?',
  [`%${identifier}%`, `%${identifier}%`],
  async (err, user) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      process.exit(1);
    }
    
    if (!user) {
      console.log(`No user found with name or email containing "${identifier}"`);
      db.close();
      process.exit(1);
    }
    
    console.log(`\nFound user:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`\nResetting password to: ${newPassword}`);
    
    try {
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update the password
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id],
        function(updateErr) {
          if (updateErr) {
            console.error('Error updating password:', updateErr);
            db.close();
            process.exit(1);
          }
          
          console.log(`\n✅ Password successfully reset!`);
          console.log(`\nLogin credentials:`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Password: ${newPassword}`);
          console.log(`\nYou can now login with these credentials.`);
          
          db.close();
        }
      );
    } catch (hashErr) {
      console.error('Error hashing password:', hashErr);
      db.close();
      process.exit(1);
    }
  }
);
