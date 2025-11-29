const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params"); // 1. Import defineSecret
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
setGlobalOptions({ region: "asia-southeast1" });

// 2. Define the secret key
const gmailPass = defineSecret("GMAIL_PASS");

exports.checkMaturingFDs = onSchedule({
  schedule: "0 8 * * *", 
  timeZone: "Asia/Kuala_Lumpur",
  secrets: [gmailPass], // 3. Allow this function to access the secret
}, async () => {
  console.log("Checking FDs...");
  
  try {
    // 4. Initialize transporter INSIDE the function to access the secret value
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "You0Got0Mail00@gmail.com", 
        pass: gmailPass.value(), // 5. Access the secure value
      },
    });

    // 1. Get today's date in YYYY-MM-DD format (Match your FDForm format)
    const today = new Date();
    // Adjust for Malaysia time if server is UTC
    today.setHours(today.getHours() + 8); 
    const todayStr = today.toISOString().split('T')[0];

    // 2. Query Firestore for FDs maturing today
    const snapshot = await admin.firestore().collection('fds')
      .where('maturityDate', '==', todayStr)
      .where('status', '==', 'active')
      .get();

    if (snapshot.empty) {
      console.log('No FDs maturing today.');
      return;
    }

    // 3. Loop through results and send emails
    const emailPromises = snapshot.docs.map(async (doc) => {
      const fd = doc.data();
      
      // Get user email from Auth using userId stored in FD document
      try {
        const userRecord = await admin.auth().getUser(fd.userId);
        const userEmail = userRecord.email;

        if (userEmail) {
          const mailOptions = {
            from: '"FD Tracker Robot" <You0Got0Mail00@gmail.com>',
            to: userEmail,
            subject: `💰 FD Maturity Alert: ${fd.bankName}`,
            text: `Your Fixed Deposit of RM ${fd.principal} at ${fd.bankName} matures today (${fd.maturityDate}). Please check your FD Tracker app.`
          };

          return transporter.sendMail(mailOptions);
        }
      } catch (err) {
        console.error(`Failed to fetch user or send email for doc ${doc.id}:`, err);
      }
    });

    await Promise.all(emailPromises);
    console.log(`Sent emails for ${snapshot.size} maturing FDs.`);

  } catch (error) {
    console.error("Error in checkMaturingFDs:", error);
  }
});

// --- 2. MARKET RATES (Live Search + Manual Regex Parsing) ---
exports.getMarketRates = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Please login.');
  }

  try {
    console.log("Initializing Gemini 2.5 Flash (Search Mode)...");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Enable Search, DISABLE JSON Mode (to avoid 400 error)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }] 
    });

    const prompt = `
      Search for "Current Fixed Deposit Rates in Malaysia for each bank" and specifically look for data matching the StashAway comparison table on https://www.stashaway.my/r/malaysia-fixed-deposit-rates.
      
      Task:
      Extract a detailed list of ALL Fixed Deposit promotions found.
      
      Output Instructions:
      Provide the data as a raw JSON array. Do not wrap it in markdown ticks.
      
      Schema:
      [
        {
          "bank": "Bank Name",
          "product": "Product Name",
          "min_deposit": "RM10,000",
          "tenure": "12 months",
          "rate": 3.85,
          "valid_until": "31 Dec 2025"
        }
      ]
      
      Constraints:
      - 'rate' must be a Number.
      - Sort by 'rate' descending (Highest first).
      - Return ALL items found (aim for 20+).
    `;

    console.log("Sending prompt...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("AI Response (Snippet):", text.substring(0, 100));

    // Manually extract JSON array using Regex
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    
    if (!jsonMatch) {
      throw new Error("No JSON array found in AI response.");
    }

    const cleanJson = jsonMatch[0];
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("AI Search Failed:", error);
    return getFallbackRates(); 
  }
});

// --- 3. DETAILED STATIC FALLBACK ---
function getFallbackRates() {
  console.log("Using Detailed Fallback Data");
  return [
    { bank: "MBSB Bank", product: "Unit Trust Term Deposit-i", min_deposit: "RM20,000", tenure: "3 months", rate: 5.88, valid_until: "30 Nov 2025" },
    { bank: "BSN", product: "Term Deposit-i with SSP", min_deposit: "RM5,000", tenure: "6 months", rate: 5.15, valid_until: "31 Dec 2025" },
    { bank: "Bank Muamalat", product: "Term Investment Account-i", min_deposit: "RM10,000", tenure: "12 months", rate: 4.00, valid_until: "31 Dec 2025" }
  ];
}