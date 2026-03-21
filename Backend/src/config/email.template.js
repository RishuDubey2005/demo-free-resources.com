const Verification_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f2f5;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 35px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 40px 30px;
            color: #333;
            line-height: 1.8;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            font-size: 15px;
            color: #555;
            margin-bottom: 25px;
        }
        .otp-box {
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            border: 2px dashed #4CAF50;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #2e7d32;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .otp-expiry {
            font-size: 13px;
            color: #888;
            margin-top: 15px;
        }
        .warning-box {
            background: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 0 8px 8px 0;
            margin: 25px 0;
        }
        .warning-box p {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
        .footer {
            background: #f8f9fa;
            padding: 25px;
            text-align: center;
            border-top: 1px solid #eee;
        }
        .footer p {
            margin: 5px 0;
            font-size: 12px;
            color: #888;
        }
        .footer .brand {
            font-weight: 600;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 NIT Patna Resources</h1>
            <p>Email Verification</p>
        </div>
        <div class="content">
            <p class="greeting">Hello there! 👋</p>
            <p class="message">
                Thank you for signing up with <strong>NIT Patna Free Resources</strong>. 
                To complete your registration, please use the verification code below:
            </p>
            
            <div class="otp-box">
                <p class="otp-label">Your Verification Code</p>
                <div class="otp-code">{verificationCode}</div>
                <p class="otp-expiry">⏰ This code expires in 5 minutes</p>
            </div>
            
            <div class="warning-box">
                <p>⚠️ <strong>Security Note:</strong> Never share this code with anyone. Our team will never ask for your verification code.</p>
            </div>
            
            <p class="message">
                If you didn't create an account with us, you can safely ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} <span class="brand">NIT Patna Free Resources</span></p>
            <p>Your one-stop destination for study materials 📚</p>
        </div>
    </div>
</body>
</html>
`;

const Forgot_Password_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f2f5;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 35px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 40px 30px;
            color: #333;
            line-height: 1.8;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            font-size: 15px;
            color: #555;
            margin-bottom: 25px;
        }
        .otp-box {
            background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%);
            border: 2px dashed #e91e63;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #c2185b;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .otp-expiry {
            font-size: 13px;
            color: #888;
            margin-top: 15px;
        }
        .warning-box {
            background: #ffebee;
            border-left: 4px solid #f44336;
            padding: 15px;
            border-radius: 0 8px 8px 0;
            margin: 25px 0;
        }
        .warning-box p {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            border-radius: 0 8px 8px 0;
            margin: 25px 0;
        }
        .info-box p {
            margin: 0;
            font-size: 14px;
            color: #555;
        }
        .footer {
            background: #f8f9fa;
            padding: 25px;
            text-align: center;
            border-top: 1px solid #eee;
        }
        .footer p {
            margin: 5px 0;
            font-size: 12px;
            color: #888;
        }
        .footer .brand {
            font-weight: 600;
            color: #f5576c;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>NIT Patna Free Resources</p>
        </div>
        <div class="content">
            <p class="greeting">Hello {userName}! 👋</p>
            <p class="message">
                We received a request to reset the password for your <strong>NIT Patna Free Resources</strong> account.
            </p>
            <p class="message">
                Use the code below to reset your password:
            </p>
            
            <div class="otp-box">
                <p class="otp-label">Password Reset Code</p>
                <div class="otp-code">{verificationCode}</div>
                <p class="otp-expiry">⏰ This code expires in 5 minutes</p>
            </div>
            
            <div class="warning-box">
                <p>🚨 <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your account is safe and no changes have been made.</p>
            </div>
            
            <div class="info-box">
                <p>💡 <strong>Tip:</strong> After resetting your password, make sure to use a strong password that you haven't used before.</p>
            </div>
            
            <p class="message">
                If you need any help, feel free to contact our support team.
            </p>
            
            <p class="message">
                Stay secure! 🔒<br>
                <strong>— Team NIT Patna Resources</strong>
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} <span class="brand">NIT Patna Free Resources</span></p>
            <p>Your one-stop destination for study materials 📚</p>
        </div>
    </div>
</body>
</html>
`;

const Welcome_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to NIT Patna Resources</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f2f5;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header .emoji {
            font-size: 50px;
            margin-bottom: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 15px;
        }
        .content {
            padding: 40px 30px;
            color: #333;
            line-height: 1.8;
        }
        .greeting {
            font-size: 20px;
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            font-size: 15px;
            color: #555;
            margin-bottom: 25px;
        }
        .features-box {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
        }
        .features-box h3 {
            margin: 0 0 15px;
            color: #667eea;
            font-size: 16px;
        }
        .feature-item {
            display: flex;
            align-items: center;
            margin: 12px 0;
            font-size: 14px;
            color: #555;
        }
        .feature-item .icon {
            margin-right: 12px;
            font-size: 18px;
        }
        .cta-button {
            display: inline-block;
            padding: 15px 35px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            margin: 25px 0;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .cta-button:hover {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
        .support-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            border-radius: 0 8px 8px 0;
            margin: 25px 0;
        }
        .support-box p {
            margin: 0;
            font-size: 14px;
            color: #555;
        }
        .footer {
            background: #f8f9fa;
            padding: 25px;
            text-align: center;
            border-top: 1px solid #eee;
        }
        .footer p {
            margin: 5px 0;
            font-size: 12px;
            color: #888;
        }
        .footer .brand {
            font-weight: 600;
            color: #667eea;
        }
        .social-links {
            margin-top: 15px;
        }
        .social-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🎉</div>
            <h1>Welcome to NIT Patna Resources!</h1>
            <p>You're officially part of our community</p>
        </div>
        <div class="content">
            <p class="greeting">Hi {name}! 👋</p>
            <p class="message">
                Congratulations on joining <strong>NIT Patna Free Resources</strong>! 
                We're thrilled to have you as part of our growing community of learners.
            </p>
            
            <div class="features-box">
                <h3>🚀 What You Can Access Now:</h3>
                <div class="feature-item">
                    <span class="icon">📚</span>
                    <span>Study materials for all semesters (1-8)</span>
                </div>
                <div class="feature-item">
                    <span class="icon">📝</span>
                    <span>Previous Year Questions (PYQs) with solutions</span>
                </div>
                <div class="feature-item">
                    <span class="icon">📖</span>
                    <span>Lecture notes from toppers</span>
                </div>
                <div class="feature-item">
                    <span class="icon">🎬</span>
                    <span>Curated video lectures</span>
                </div>
                <div class="feature-item">
                    <span class="icon">🔔</span>
                    <span>Latest updates & notifications</span>
                </div>
            </div>
            
            <center>
                <a href="https://nitp-free-resources-com-8t1w.onrender.com" class="cta-button">
                    🚀 Start Exploring Now
                </a>
            </center>
            
            <div class="support-box">
                <p>💡 <strong>Pro Tip:</strong> Click the 🔔 bell icon in the header to never miss any important updates or newly added resources!</p>
            </div>
            
            <p class="message">
                If you have any questions or need assistance, feel free to reach out. 
                We're here to help you succeed in your academic journey!
            </p>
            
            <p class="message">
                Best wishes for your studies! 📖✨<br>
                <strong>— Team NIT Patna Resources</strong>
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} <span class="brand">NIT Patna Free Resources</span></p>
            <p>Helping students achieve academic excellence 🎓</p>
            <div class="social-links">
                <a href="https://nitp-free-resources-com-8t1w.onrender.com">🌐 Visit Website</a>
            </div>
        </div>
    </div>
</body>
</html>
`;

module.exports = { Verification_Template, Forgot_Password_Template, Welcome_Template };
