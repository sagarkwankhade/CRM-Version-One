require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./utils/db');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const vendorRoutes = require('./routes/vendors');
const employeeRoutes = require('./routes/employees');
const taskRoutes = require('./routes/tasks');
const leadRoutes = require('./routes/leads');
const notificationRoutes = require('./routes/notifications');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handler (express default replacement)
app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

// Start server after attempting DB connection so nodemon doesn't crash instantly
(async () => {
	try {
		const connected = await connectDB({ maxAttempts: 3, delayMs: 4000 });
		if (!connected) {
			console.warn('Server starting without a database connection. Some endpoints may fail until the DB is available.');
		}

		app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
	} catch (err) {
		console.error('Fatal error while starting the server:', err && err.message ? err.message : err);
		process.exit(1);
	}
})();
