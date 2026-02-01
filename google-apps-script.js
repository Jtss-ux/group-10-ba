/**
 * =====================================================
 * GOOGLE APPS SCRIPT FOR SURVEY DATA COLLECTION
 * =====================================================
 * 
 * This script receives survey data and:
 * 1. Saves it to your Google Spreadsheet
 * 2. Sends email notification to specified email
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Spreadsheet: https://docs.google.com/spreadsheets/d/1SVp7ZWh53dZlq0aJJC0Uq-CxM8A4YaUfmbA_iYxM2No/edit
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the project (Ctrl+S)
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"
 * 9. Click "Deploy"
 * 10. Authorize the app when prompted
 * 11. Copy the Web App URL and paste it in survey-script.js CONFIG.GOOGLE_SCRIPT_URL
 */

// Configuration
const SPREADSHEET_ID = '1SVp7ZWh53dZlq0aJJC0Uq-CxM8A4YaUfmbA_iYxM2No';
const SHEET_NAME = 'Survey Responses';
const NOTIFICATION_EMAIL = 'jtss0287@gmail.com';

/**
 * Handle POST requests from the survey form
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Save to spreadsheet
    saveToSheet(data);
    
    // Send email notification
    sendEmailNotification(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Data saved successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'active', 
      message: 'Business Analytics Survey API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Save survey data to Google Spreadsheet
 */
function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    
    // Add headers
    const headers = [
      'Timestamp',
      'Name',
      'Email',
      'Age Group',
      'Gender',
      'Visit Frequency',
      'Q1 - Staff Polite',
      'Q2 - Quick Response',
      'Q3 - Staff Knowledgeable',
      'Q4 - Feel Welcomed',
      'Q5 - Ambience Comfortable',
      'Q6 - Cleanliness',
      'Q7 - Space Arrangement',
      'Q8 - Feel Relaxed',
      'Q9 - Waiting Time',
      'Q10 - Smooth Service',
      'Q11 - Convenient Timings',
      'Q12 - Fair Prices',
      'Q13 - Good Value',
      'Q14 - Attractive Discounts',
      'Q15 - Overall Satisfaction',
      'Q16 - Quality Meets Expectations',
      'Q17 - Better Than Competitors',
      'Q18 - Intent to Return',
      'Q19 - Would Recommend',
      'Q20 - Prefer Over Alternatives',
      'Feedback',
      'User Agent'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#29ffcf');
  }
  
  // Prepare row data
  const rowData = [
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.age || '',
    data.gender || '',
    data.visit_frequency || '',
    data.q1 || '',
    data.q2 || '',
    data.q3 || '',
    data.q4 || '',
    data.q5 || '',
    data.q6 || '',
    data.q7 || '',
    data.q8 || '',
    data.q9 || '',
    data.q10 || '',
    data.q11 || '',
    data.q12 || '',
    data.q13 || '',
    data.q14 || '',
    data.q15 || '',
    data.q16 || '',
    data.q17 || '',
    data.q18 || '',
    data.q19 || '',
    data.q20 || '',
    data.feedback || '',
    data.user_agent || ''
  ];
  
  // Append data
  sheet.appendRow(rowData);
  
  console.log('Data saved to spreadsheet:', data.email);
}

/**
 * Send email notification for new survey response
 */
function sendEmailNotification(data) {
  const email = data.notificationEmail || NOTIFICATION_EMAIL;
  
  // Calculate section averages
  const serviceAvg = Math.round((parseInt(data.q1) + parseInt(data.q2) + parseInt(data.q3) + parseInt(data.q4)) / 4);
  const ambienceAvg = Math.round((parseInt(data.q5) + parseInt(data.q6) + parseInt(data.q7) + parseInt(data.q8)) / 4);
  const timeAvg = Math.round((parseInt(data.q9) + parseInt(data.q10) + parseInt(data.q11)) / 3);
  const pricingAvg = Math.round((parseInt(data.q12) + parseInt(data.q13) + parseInt(data.q14)) / 3);
  const satisfactionAvg = Math.round((parseInt(data.q15) + parseInt(data.q16) + parseInt(data.q17)) / 3);
  const loyaltyAvg = Math.round((parseInt(data.q18) + parseInt(data.q19) + parseInt(data.q20)) / 3);
  const overallAvg = calculateAverage([
    data.q1, data.q2, data.q3, data.q4, data.q5, data.q6, data.q7, data.q8,
    data.q9, data.q10, data.q11, data.q12, data.q13, data.q14, data.q15,
    data.q16, data.q17, data.q18, data.q19, data.q20
  ]);
  
  const subject = `📊 New Survey Response - ${data.name} (Score: ${overallAvg.toFixed(1)}/5)`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #181d2a, #29ffcf22); padding: 30px; border-radius: 15px; border: 2px solid #29ffcf;">
        <h1 style="color: #29ffcf; margin: 0 0 10px 0;">📊 New Survey Response</h1>
        <p style="color: #a8f5e0; margin: 0;">Business Analytics Live Project - Group 10</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">👤 Respondent Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Name:</strong></td>
            <td style="padding: 8px 0;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
            <td style="padding: 8px 0;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Age Group:</strong></td>
            <td style="padding: 8px 0;">${data.age}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Gender:</strong></td>
            <td style="padding: 8px 0;">${data.gender}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Visit Frequency:</strong></td>
            <td style="padding: 8px 0;">${data.visit_frequency}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">📈 Section Scores</h2>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>🧾 Service & Staff</span>
            <span><strong>${serviceAvg.toFixed(1)}/5</strong></span>
          </div>
          <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #29ffcf, #5185ff); height: 100%; width: ${serviceAvg * 20}%;"></div>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>🏪 Ambience & Environment</span>
            <span><strong>${ambienceAvg.toFixed(1)}/5</strong></span>
          </div>
          <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #29ffcf, #5185ff); height: 100%; width: ${ambienceAvg * 20}%;"></div>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>⏱️ Time & Convenience</span>
            <span><strong>${timeAvg.toFixed(1)}/5</strong></span>
          </div>
          <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #29ffcf, #5185ff); height: 100%; width: ${timeAvg * 20}%;"></div>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>💰 Pricing & Value</span>
            <span><strong>${pricingAvg.toFixed(1)}/5</strong></span>
          </div>
          <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #29ffcf, #5185ff); height: 100%; width: ${pricingAvg * 20}%;"></div>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>⭐ Overall Satisfaction</span>
            <span><strong>${satisfactionAvg.toFixed(1)}/5</strong></span>
          </div>
          <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #29ffcf, #5185ff); height: 100%; width: ${satisfactionAvg * 20}%;"></div>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>🔁 Loyalty & Repeat Purchase</span>
            <span><strong>${loyaltyAvg.toFixed(1)}/5</strong></span>
          </div>
          <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #29ffcf, #5185ff); height: 100%; width: ${loyaltyAvg * 20}%;"></div>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #29ffcf, #5185ff); padding: 20px; border-radius: 10px; text-align: center; margin-top: 20px;">
          <h3 style="color: #0a1a15; margin: 0;">Overall Score</h3>
          <p style="font-size: 2.5em; font-weight: bold; color: #0a1a15; margin: 10px 0;">${overallAvg.toFixed(2)}/5</p>
          <p style="color: #0a1a15; margin: 0;">${getScoreEmoji(overallAvg)}</p>
        </div>
      </div>
      
      ${data.feedback ? `
      <div style="background: #fff3cd; padding: 25px; border-radius: 15px; margin-top: 20px; border-left: 4px solid #ffc107;">
        <h2 style="color: #856404; margin-top: 0;">💬 Additional Feedback</h2>
        <p style="color: #856404; margin: 0; font-style: italic;">"${data.feedback}"</p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        <p>Submitted at: ${new Date(data.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        <p>📊 Business Analytics Live Project | Group-10</p>
        <p>KC | NIRANJAN | VAISHAVI | JOSEPH | JOSHUA</p>
      </div>
    </div>
  `;
  
  GmailApp.sendEmail(email, subject, '', { htmlBody: htmlBody });
  console.log('Email notification sent to:', email);
}

/**
 * Calculate average of numeric values
 */
function calculateAverage(values) {
  const nums = values.map(v => parseInt(v) || 0).filter(v => v > 0);
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Get emoji based on score
 */
function getScoreEmoji(score) {
  if (score >= 4.5) return '🌟 Excellent!';
  if (score >= 4) return '😊 Very Good';
  if (score >= 3) return '👍 Good';
  if (score >= 2) return '😐 Average';
  return '😞 Needs Improvement';
}

/**
 * Test function - run this to verify the script works
 */
function testScript() {
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    age: '25-34',
    gender: 'male',
    visit_frequency: 'weekly',
    q1: '5', q2: '4', q3: '5', q4: '4',
    q5: '5', q6: '4', q7: '5', q8: '4',
    q9: '4', q10: '5', q11: '4',
    q12: '4', q13: '5', q14: '4',
    q15: '5', q16: '4', q17: '5',
    q18: '5', q19: '5', q20: '4',
    feedback: 'This is a test response',
    timestamp: new Date().toISOString()
  };
  
  saveToSheet(testData);
  console.log('Test completed successfully!');
}
