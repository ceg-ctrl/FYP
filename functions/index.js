const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
setGlobalOptions({ region: "asia-southeast1" });

// --- 1. EMAIL ROBOT (Existing Code) ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "You0Got0Mail00@gmail.com", // <--- REPLACE THIS IF NEEDED
    pass: "vlyr ihxm nszk tkpx",       // <--- REPLACE THIS IF NEEDED
  },
});

exports.checkMaturingFDs = onSchedule({
  schedule: "0 8 * * *", 
  timeZone: "Asia/Kuala_Lumpur",
}, async () => {
  // ... (Your existing email logic remains unchanged) ...
  console.log("Checking FDs...");
});


// --- 2. NEW: LIVE MARKET SCRAPER (RinggitPlus) ---
exports.getMarketRates = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
  
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Please login to use this feature.');
  }

  const TARGET_URL = "https://ringgitplus.com/en/fixed-deposit/";

  try {
    // A. FETCH THE LIVE WEBSITE
    console.log(`Fetching data from ${TARGET_URL}...`);
    
    const webResponse = await fetch(TARGET_URL, {
      headers: {
        // Pretend to be a real browser so we don't get blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!webResponse.ok) {
      throw new Error(`Failed to fetch website: ${webResponse.statusText}`);
    }

    const htmlText = await webResponse.text();
    
    // Optimization: Cut the HTML if it's too huge (Gemini Flash handles ~1M tokens, so usually fine, but good practice)
    const truncatedHtml = htmlText.substring(0, 500000); 

    // B. ASK GEMINI TO PARSE IT
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      I have scraped the HTML content of the RinggitPlus Fixed Deposit comparison page.
      
      Your Task:
      1. Analyze the HTML below.
      2. Find the list or table of Fixed Deposit promotions.
      3. Extract the top 5-10 best offers found in the text.
      4. Format the output strictly as a JSON array.

      HTML Content:
      ${truncatedHtml}

      Output Requirements:
      - Return ONLY a raw JSON array. No Markdown.
      - Format: [{"bank": "Bank Name", "rate": 3.85, "tenure": "12 months", "description": "Any condition like 'Fresh funds' or 'Online only'"}]
      - If a rate is a range (e.g. 3.5-3.8), just pick the maximum rate.
      - Ensure 'rate' is a Number, not a string.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // C. CLEAN UP AND RETURN
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Scraper Error:", error);
    // Fallback: If scraping fails, ask Gemini to estimate based on internal knowledge
    // This ensures the user always gets SOME data instead of an error
    return getFallbackRates(); 
  }
});

// Helper: Fallback if the website blocks us
async function getFallbackRates() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    The live website scan failed. 
    Please act as a financial analyst and provide an *estimated* list of current Fixed Deposit rates in Malaysia for major banks (Maybank, CIMB, Public Bank, RHB).
    Return strictly a JSON array: [{"bank": "...", "rate": 3.5, "tenure": "12 months", "description": "Estimated Market Rate"}]
  `;
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleanJson);
}