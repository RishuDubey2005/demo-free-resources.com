const userModel = require('../models/user.model.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationCode, sendForgotPasswordCode, WelcomeEmail } = require('../config/email.verify.js');
// Temporary OTP storage (In production, use Redis)
const otpStorage = new Map();

// Cookie options - reusable
const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// NITP Email Validation Helper
const isValidNitpEmail = (email) => {
    // Allows: anything@nitp.ac.in
    // Examples: 2101001@nitp.ac.in, john.doe@nitp.ac.in, name.cse@nitp.ac.in
    const nitpEmailRegex = /^[a-zA-Z0-9._%+-]+(@nitp\.ac\.in|(\.(ee|me|ce))@nitp\.ac\.in)$/;
    return nitpEmailRegex.test(email);
};
// Professor Email Validation Helper
// Professor emails should NOT contain numbers (e.g., name.ee@nitp.ac.in)
// Student emails CAN contain numbers (e.g., 2101001.ee@nitp.ac.in)
const isProfessorEmail = (email) => {
    // Professor email: only letters and dots before .branch@nitp.ac.in
    const professorEmailRegex = /^[a-zA-Z.]+\.(ee|me|ce)@nitp\.ac\.in$/;
    return professorEmailRegex.test(email);
};

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Send OTP (Before Registration)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function sendOtp(req, res) {
    try {
        const { username, email, role } = req.body;

        if (!username || !email) {
            return res.status(400).json({
                message: 'Username and email are required'
            });
        }

        // NITP Email Check (Skip for Admin)
        if (role !== 'Admin' && !isValidNitpEmail(email)) {
            return res.status(400).json({
                message: 'Only NITP email addresses (@nitp.ac.in) are allowed.'
            });
        }
        // Professor email validation (no numbers allowed)
        if (role === 'Professor' && !isProfessorEmail(email)) {
            return res.status(400).json({
                message: 'Professor email should be like name.branch@nitp.ac.in'
            });
        }

        // Check if user already exists
        const isUserAlreadyExist = await userModel.findOne({ email });

        if (isUserAlreadyExist) {
            return res.status(409).json({
                message: 'User Already Exists. Please Login'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with expiry (5 minutes)
        otpStorage.set(email, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        });

        // ✅ CHANGED: Added try-catch for email sending
        try {
            await sendVerificationCode(email, otp);
            return res.status(200).json({
                message: 'OTP sent successfully. Check your email.(⚠️spam also)'
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            otpStorage.delete(email);
            return res.status(500).json({ 
                message: 'Failed to send OTP email. Please try again.' 
            });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Verify OTP and Register User
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function registerUser(req, res) {
    try {
        const { username, email, password, role, otp } = req.body;

        // Input validation
        if (!username || !email || !password || !role || !otp) {
            return res.status(400).json({
                message: 'All fields including OTP are required'
            });
        }

        // NITP Email Check (Skip for Admin)
        if (role !== 'Admin' && !isValidNitpEmail(email)) {
            return res.status(400).json({
                message: 'Only NITP email addresses (@nitp.ac.in) are allowed.'
            });
        }
        // Professor email validation (no numbers allowed)
        if (role === 'Professor' && !isProfessorEmail(email)) {
            return res.status(400).json({
                message: 'Professor email should be like name.branch@nitp.ac.in'
            });
        }

        // Verify OTP
        const storedOtpData = otpStorage.get(email);

        if (!storedOtpData) {
            return res.status(400).json({
                message: 'OTP not found. Please request a new OTP.'
            });
        }

        if (Date.now() > storedOtpData.expiresAt) {
            otpStorage.delete(email);
            return res.status(400).json({
                message: 'OTP expired. Please request a new OTP.'
            });
        }

        if (storedOtpData.otp !== otp) {
            return res.status(400).json({
                message: 'Invalid OTP. Please try again.'
            });
        }

        // OTP verified - Delete from storage
        otpStorage.delete(email);

        // Check if user already exists (double check)
        const isUserAlreadyExist = await userModel.findOne({ email });

        if (isUserAlreadyExist) {
            return res.status(409).json({
                message: 'User Already Exists. Please Login'
            });
        }

        // Create user
        const hash = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            username,
            email,
            password: hash,
            role,
            isVerified: true // Already verified via OTP
        });

        // Send welcome email
        await WelcomeEmail(user.email, user.username);

        const token = jwt.sign({
            id: user._id,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, getCookieOptions());

        return res.status(201).json({
            message: "User registered successfully",
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Login User
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function loginUser(req, res) {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: 'Email, password and role are required'
            });
        }

        // NITP Email Check (Skip for Admin)
        if (role !== 'Admin' && !isValidNitpEmail(email)) {
            return res.status(400).json({
                message: 'Only NITP email addresses (@nitp.ac.in) are allowed.'
            });
        }
        // Professor email validation (no numbers allowed)
        if (role === 'Professor' && !isProfessorEmail(email)) {
            return res.status(400).json({
                message: 'Unauthorised Access. Professor email should be like (name.branch@nitp.ac.in)'
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User Not Found. Please Register"
            });
        }

        if (user.role!=='Admin'&&!user.isVerified) {
            return res.status(403).json({
                message: "Email not verified. Please register again."
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                message: "Your account has been blocked by the administrator. Please contact support.",
                isBlocked: true
            });
        }

        if (user.role !== role) {
            return res.status(403).json({
                message: `You are not registered as ${role}. Your role is ${user.role}`
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid Password"
            });
        }

        // ✅ Update last visited time
        user.lastVisitedAt = new Date();
        await user.save();        

        const token = jwt.sign({
            id: user._id,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, getCookieOptions());

        return res.status(200).json({
            message: "User Logged In Successfully",
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Logout User
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function logoutUser(req, res) {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        return res.status(200).json({
            message: "User logged out successfully."
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get User Count
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getUserCount(req, res) {
    try {
        const count = await userModel.countDocuments();
        res.status(200).json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get Current User
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getMe(req, res) {
    try {
        // Try cookie first, then Authorization header
        let token = req.cookies.token;
        
        // Fallback: Check Authorization header
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({ message: "Not logged in" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Update last visited time
        user.lastVisitedAt = new Date();
        await user.save();

        // Extract branch from email
        let branch = null;
        const match = user.email.match(/\.([a-z]{2})@nitp\.ac\.in$/i);
        if (match) {
            branch = match[1].toUpperCase();
        }

        res.status(200).json({ 
            user: {
                ...user.toObject(),
                branch
            }
        });

    } catch (err) {
        console.error(err);
        res.status(401).json({ message: "Invalid token" });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Forgot Password OTP Storage
const forgotPasswordOtpStorage = new Map();

// Send Forgot Password OTP
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function sendForgotPasswordOtp(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: 'Email is required'
            });
        }

        // Check if user exists
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: 'No account found with this email'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with expiry (5 minutes)
        forgotPasswordOtpStorage.set(email, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000,
            verified: false
        });

        // ✅ Send forgot password OTP with user's name
        try {
            await sendForgotPasswordCode(email, otp, user.username);
            return res.status(200).json({
                message: 'OTP sent successfully. Check your email.(🚨SPAM also🚨)'
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            forgotPasswordOtpStorage.delete(email);
            return res.status(500).json({ 
                message: 'Failed to send OTP email. Please try again.' 
            });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Verify Forgot Password OTP
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function verifyForgotPasswordOtp(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: 'Email and OTP are required'
            });
        }

        const storedOtpData = forgotPasswordOtpStorage.get(email);

        if (!storedOtpData) {
            return res.status(400).json({
                message: 'OTP not found. Please request a new OTP.'
            });
        }

        if (Date.now() > storedOtpData.expiresAt) {
            forgotPasswordOtpStorage.delete(email);
            return res.status(400).json({
                message: 'OTP expired. Please request a new OTP.'
            });
        }

        if (storedOtpData.otp !== otp) {
            return res.status(400).json({
                message: 'Invalid OTP. Please try again.'
            });
        }

        // Mark OTP as verified
        forgotPasswordOtpStorage.set(email, {
            ...storedOtpData,
            verified: true,
            expiresAt: Date.now() + 10 * 60 * 1000 // Extend 10 more minutes for password reset
        });

        return res.status(200).json({
            message: 'OTP verified successfully.'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Reset Password
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function resetPassword(req, res) {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                message: 'Email and new password are required'
            });
        }

        const storedOtpData = forgotPasswordOtpStorage.get(email);

        if (!storedOtpData || !storedOtpData.verified) {
            return res.status(400).json({
                message: 'Please verify OTP first'
            });
        }

        if (Date.now() > storedOtpData.expiresAt) {
            forgotPasswordOtpStorage.delete(email);
            return res.status(400).json({
                message: 'Session expired. Please start again.'
            });
        }

        // Hash new password
        const hash = await bcrypt.hash(newPassword, 10);

        // Update password in database
        const user = await userModel.findOneAndUpdate(
            { email },
            { password: hash },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Clear OTP storage
        forgotPasswordOtpStorage.delete(email);

        return res.status(200).json({
            message: 'Password updated successfully.'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Update Profile
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function updateProfile(req, res) {
    try {
        // Get token
        let token = req.cookies.token;
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({ message: "Not logged in" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { username, mobile, rollNo, passingYear, gender } = req.body;

        // Update only provided fields
        if (username !== undefined && username.trim() !== '') user.username = username.trim();
        if (mobile !== undefined) user.mobile = mobile;
        if (rollNo !== undefined) user.rollNo = rollNo;
        if (passingYear !== undefined) user.passingYear = passingYear;
        if (gender !== undefined) user.gender = gender;
        
        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                mobile: user.mobile,
                rollNo: user.rollNo,
                passingYear: user.passingYear,
                gender: user.gender,
                isBlocked: user.isBlocked,
                blockReason: user.blockReason,
                blockedAt: user.blockedAt,
                createdAt: user.createdAt
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

const visitModel = require('../models/visit.model.js');

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get Total Visits
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getVisitCount(req, res) {
    try {
        let visit = await visitModel.findOne();
        if (!visit) {
            visit = await visitModel.create({ count: 0 });
        }
        res.status(200).json({ count: visit.count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Increment Visit (Called from frontend only if valid)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function incrementVisit(req, res) {
    try {
        let visit = await visitModel.findOne();
        if (!visit) {
            visit = await visitModel.create({ count: 1 });
        } else {
            visit.count += 1;
            await visit.save();
        }
        res.status(200).json({ count: visit.count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { sendOtp, registerUser, loginUser, logoutUser, getUserCount, getMe, sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword, updateProfile, getVisitCount, incrementVisit };