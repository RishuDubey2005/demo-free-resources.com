const SibApiV3Sdk = require('sib-api-v3-sdk');
const { Verification_Template, Welcome_Template } = require("./email.template");

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// ✅ Send OTP verification email
const sendVerificationCode = async (email, verificationCode) => {
    try {
        console.log(`📧 Attempting to send OTP to: ${email}`);

        const response = await emailApi.sendTransacEmail({
            sender: {
                email: process.env.EMAIL_FROM,
                name: "NITP Resources"
            },
            to: [{ email }],
            subject: "Verify Your Email ✔",
            htmlContent: Verification_Template.replace("{verificationCode}", verificationCode),
            textContent: `Your verification code is: ${verificationCode}`
        });

        console.log("✅ Verification code sent:", response.messageId);
        return response;
    }
    catch (err) {
        console.error("❌ Error sending verification code:", err);
        throw err;
    }
};

// ✅ Send welcome email
const WelcomeEmail = async (email, name) => {
    try {
        console.log(`📧 Attempting to send welcome email to: ${email}`);

        const response = await emailApi.sendTransacEmail({
            sender: {
                email: process.env.EMAIL_FROM,
                name: "NITP Resources"
            },
            to: [{ email }],
            subject: "Welcome to Our Platform ✔",
            htmlContent: Welcome_Template.replace("{name}", name),
            textContent: `Welcome ${name} to our platform!`
        });

        console.log("✅ Welcome email sent:", response.messageId);
        return response;
    }
    catch (err) {
        console.error("❌ Error sending welcome email:", err);
        throw err;
    }
};

module.exports = { sendVerificationCode, WelcomeEmail };