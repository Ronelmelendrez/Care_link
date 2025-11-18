const db = require('../database'); // Assuming a database setup file

// Fetch appointments for a specific user
async function getAppointmentsForUser(userId) {
  try {
    const query = 'SELECT * FROM appointments WHERE user_id = ?';
    const [rows] = await db.execute(query, [userId]);
    return rows;
  } catch (error) {
    throw new Error('Database query failed');
  }
}

module.exports = { getAppointmentsForUser };
