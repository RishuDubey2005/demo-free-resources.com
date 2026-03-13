const express=require('express');
const cookieParser=require('cookie-parser');
const authRoutes=require('./routes/auth.routes');
const notificationRoutes=require('./routes/notification.route');
const userRoutes=require('./routes/user.route');
const cors=require('cors');

const app=express();

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://spotify-songs-frontend.onrender.com",
    process.env.FRONTEND_URL
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

module.exports=app;