const express = require('express');
const app = express();
const { getAppointmentsForUser } = require('./controllers/appointmentController');

// Define the route
app.get('/api/appointments/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Fetch appointments for the user
    const appointments = await getAppointmentsForUser(userId);
    res.status(200).json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Error fetching appointments' });
  }
});
