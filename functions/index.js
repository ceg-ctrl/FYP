const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
setGlobalOptions({ region: "asia-southeast1" });

// --- 1. EMAIL ROBOT ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "You0Got0Mail00@gmail.com", 
    pass: "vlyr ihxm nszk tkpx",       
  },
});

exports.checkMaturingFDs = onSchedule({
  schedule: "0 8 * * *", 
  timeZone: "Asia/Kuala_Lumpur",
}, async () => {
  console.log("Checking FDs...");
});

// --- 2. MARKET RATES (Stable AI Estimate) ---
exports.getMarketRates = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Please login.');
  }

  try {
    console.log("Initializing Gemini 2.5 Flash (Standard Mode)...");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json" 
      }
    });

    const prompt = `
      Act as a Malaysian financial analyst.
      
      Task:
      Generate a detailed list of CURRENT Fixed Deposit (FD) promotions in Malaysia.
      Base this on your internal knowledge of standard market offerings from banks like Affin, Al Rajhi, Alliance, AmBank, Maybank, Bank Muamalat, Hong Leong, CIMB, MBSB, Public Bank, RHB, and Standard Chartered.
      
      Output Requirements:
      1. **Exact Columns**: 
         - Bank Name
         - Product Name (e.g. "eFD/eTD-i Promotion", "CASA Gold")
         - Minimum Deposit (e.g. "RM10,000")
         - Tenure (e.g. "12 months")
         - Rate (Number, e.g. 3.85)
         - Promo End Date (e.g. "31 Dec 2025")
      
      2. **Granularity**: 
         - If a bank has multiple tenures (3, 6, 12 months), list them as SEPARATE rows.
      
      Output Format (JSON Array):
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
      - Sort by 'rate' descending.
    `;

    console.log("Sending prompt...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("AI Response received.");
    
    // Clean up
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("AI Failed, using Backup Data:", error);
    return getFallbackRates(); 
  }
});

// --- 3. STABLE BACKUP DATA (Matches StashAway exactly) ---
function getFallbackRates() {
  console.log("Using StashAway Backup Data");
  return [
    { bank: "MBSB Bank", product: "Unit Trust Term Deposit-i", min_deposit: "RM20,000", tenure: "3 months", rate: 5.88, valid_until: "30 Nov 2025" },
    { bank: "BSN", product: "Term Deposit-i with SSP", min_deposit: "RM5,000", tenure: "6 months", rate: 5.15, valid_until: "31 Dec 2025" },
    { bank: "Bank Muamalat", product: "Term Investment Account-i", min_deposit: "RM10,000", tenure: "12 months", rate: 4.00, valid_until: "31 Dec 2025" },
    { bank: "RHB Bank", product: "CASA Gold Campaign", min_deposit: "RM500,000", tenure: "3 months", rate: 4.00, valid_until: "31 Dec 2025" }

  ];
}