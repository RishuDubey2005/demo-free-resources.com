const SibApiV3Sdk = require('sib-api-v3-sdk');
const { Verification_Template, Forgot_Password_Template, Welcome_Template } = require("./email.template");

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// ✅ Send OTP for Registration (New User)
const sendVerificationCode = async (email, verificationCode) => {
    try {
        console.log(`📧 Attempting to send registration OTP to: ${email}`);

        const response = await emailApi.sendTransacEmail({
            sender: {
                email: process.env.EMAIL_FROM,
                name: "NIT Patna Resources"
            },
            to: [{ email }],
            subject: "Verify Your Email - NIT Patna Resources",
            htmlContent: Verification_Template.replace("{verificationCode}", verificationCode),
            textContent: `Your verification code is: ${verificationCode}. This code expires in 5 minutes.`
        });

        console.log("✅ Registration OTP sent:", response.messageId);
        return response;
    }
    catch (err) {
        console.error("❌ Error sending registration OTP:", err);
        throw err;
    }
};

// ✅ Send OTP for Forgot Password (Existing User)
const sendForgotPasswordCode = async (email, verificationCode, userName) => {
    try {
        console.log(`📧 Attempting to send password reset OTP to: ${email}`);

        const htmlContent = Forgot_Password_Template
            .replace("{verificationCode}", verificationCode)
            .replace("{userName}", userName || "User");

        const response = await emailApi.sendTransacEmail({
            sender: {
                email: process.env.EMAIL_FROM,
                name: "NIT Patna Resources"
            },
            to: [{ email }],
            subject: "Password Reset Request - NIT Patna Resources",
            htmlContent: htmlContent,
            textContent: `Hello ${userName || "User"}, Your password reset code is: ${verificationCode}. This code expires in 5 minutes. If you didn't request this, please ignore this email.`
        });

        console.log("✅ Password reset OTP sent:", response.messageId);
        return response;
    }
    catch (err) {
        console.error("❌ Error sending password reset OTP:", err);
        throw err;
    }
};

// ✅ Send Welcome Email (After Registration)
const WelcomeEmail = async (email, name) => {
    try {
        console.log(`📧 Attempting to send welcome email to: ${email}`);

        const response = await emailApi.sendTransacEmail({
            sender: {
                email: process.env.EMAIL_FROM,
                name: "NIT Patna Resources"
            },
            to: [{ email }],
            subject: "Welcome to NIT Patna Free Resources!",
            htmlContent: Welcome_Template.replace("{name}", name),
            textContent: `Welcome ${name} to NIT Patna Free Resources! We're thrilled to have you join us.`
        });

        console.log("✅ Welcome email sent:", response.messageId);
        return response;
    }
    catch (err) {
        console.error("❌ Error sending welcome email:", err);
        throw err;
    }
};

module.exports = { sendVerificationCode, sendForgotPasswordCode, WelcomeEmail };
