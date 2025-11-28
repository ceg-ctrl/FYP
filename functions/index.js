const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https"); // Import HttpsError
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import AI

admin.initializeApp();

// Set region to Singapore
setGlobalOptions({ region: "asia-southeast1" });

// --- 1. EMAIL ROBOT (Existing Code) ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "YOUR_GMAIL_ADDRESS@gmail.com", // <--- REPLACE THIS IF NEEDED
    pass: "YOUR_APP_PASSWORD_HERE",       // <--- REPLACE THIS IF NEEDED
  },
});

exports.checkMaturingFDs = onSchedule({
  schedule: "0 8 * * *", 
  timeZone: "Asia/Kuala_Lumpur",
}, async () => {
  const today = new Date();
  const dateString = today.toISOString().split("T")[0];
  console.log(`🤖 Robot Waking Up! Checking date: ${dateString}`);

  const db = admin.firestore();
  const snapshot = await db.collection("fds")
    .where("maturityDate", "==", dateString)
    .where("status", "==", "active")
    .get();

  if (snapshot.empty) return;

  const emailPromises = [];
  for (const docSnapshot of snapshot.docs) {
    const fd = docSnapshot.data();
    const docId = docSnapshot.id;

    const userPromise = admin.auth().getUser(fd.userId).then((userRecord) => {
      const email = userRecord.email;
      const name = userRecord.displayName || "Saver";

      const mailOptions = {
        from: '"FD Tracker Bot" <no-reply@fdtracker.com>',
        to: email,
        subject: `💰 Cha-Ching! Your FD at ${fd.bankName} Matures Today!`,
        html: `
          <h3>Fixed Deposit Maturity Alert</h3>
          <p>Hi ${name}, your FD at <strong>${fd.bankName}</strong> (RM ${fd.principal}) has matured.</p>
          <p>Login to your dashboard to decide your next move.</p>
        `,
      };

      return transporter.sendMail(mailOptions).then(() => {
        return db.collection("fds").doc(docId).update({ status: "matured" });
      });
    }).catch(err => console.error(err));

    emailPromises.push(userPromise);
  }
  await Promise.all(emailPromises);
});


// --- 2. NEW: AI MARKET SCANNER ---
// This is the function your React App will talk to.
// It uses the secret key we just stored.
exports.getMarketRates = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
  
  // 1. Check if user is logged in (Optional security)
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to scan rates.');
  }

  try {
    // 2. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. The Prompt (Instructions for the AI)
    const prompt = `
      Act as a financial analyst for the Malaysian market.
      Provide a list of 5 current Fixed Deposit (FD) promotional rates for major banks in Malaysia (e.g., Maybank, CIMB, RHB, Public Bank, Hong Leong, AmBank).
      Focus on 12-month tenures if possible.
      
      IMPORTANT: Return ONLY a raw JSON array. Do not use Markdown formatting (no \`\`\`json).
      Strictly follow this format:
      [
        { "bank": "Bank Name", "rate": 3.85, "tenure": "12 months", "description": "Promo name or condition" }
      ]
    `;

    // 4. Ask Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Clean up (sometimes AI adds markdown even when told not to)
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 6. Return data to frontend
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("AI Error:", error);
    throw new HttpsError('internal', 'Failed to fetch rates', error.message);
  }
});