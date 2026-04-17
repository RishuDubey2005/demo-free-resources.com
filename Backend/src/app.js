const express=require('express');
const cookieParser=require('cookie-parser');
const authRoutes=require('./routes/auth.routes');
const notificationRoutes=require('./routes/notification.route');
const userRoutes=require('./routes/user.route');
const cors=require('cors');
const app=express();
const lostItemRoutes = require('./routes/lost-item.route');
const resourceRoutes = require('./routes/resource.route');
const aiRoutes = require('./routes/ai.route');
const driveTokenRoutes = require('./routes/driveToken.route');

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://demo-free-content-com.onrender.com",
    process.env.FRONTEND_URL
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lost-items', lostItemRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/drive-tokens', driveTokenRoutes);

module.exports=app;