// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import sessionRoutes from './routes/session.routes.js';
import attendanceRoutes from './routes/attendence.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/session', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
