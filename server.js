const express = require('express');
const connectDB = require('./config/db');
// 1330026
const app = express();
const PORT = process.env.PORT || 5000;

// COnnect to Database
connectDB();

// Initialize middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('My Api is running...'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

app.listen(PORT, () => console.log(`App is up on port ${PORT}`));
