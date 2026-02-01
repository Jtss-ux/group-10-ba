# 📊 Business Analytics Survey - Deployment Guide

## Group-10: KC | NIRANJAN | VAISHAVI | JOSEPH | JOSHUA

### Project: Customer Satisfaction and Repeat Purchase Behavior in Local Café/Retail Businesses

---

## 📁 Project Files

| File | Description |
|------|-------------|
| `survey.html` | Main survey form with all sections |
| `survey-styles.css` | Styling and animations |
| `survey-script.js` | Form logic, validations, and API integrations |
| `google-apps-script.js` | Google Apps Script for Sheets + Email |

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Set Up Supabase Database

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Open your project** (or the one already created)
3. **Go to SQL Editor** and run this SQL to create the table:

```sql
CREATE TABLE survey_responses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  timestamp TEXT,
  name TEXT,
  email TEXT,
  age TEXT,
  gender TEXT,
  visit_frequency TEXT,
  q1 TEXT,
  q2 TEXT,
  q3 TEXT,
  q4 TEXT,
  q5 TEXT,
  q6 TEXT,
  q7 TEXT,
  q8 TEXT,
  q9 TEXT,
  q10 TEXT,
  q11 TEXT,
  q12 TEXT,
  q13 TEXT,
  q14 TEXT,
  q15 TEXT,
  q16 TEXT,
  q17 TEXT,
  q18 TEXT,
  q19 TEXT,
  q20 TEXT,
  feedback TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the survey form)
CREATE POLICY "Allow anonymous inserts" ON survey_responses
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow reading for authenticated users only (for analysis)
CREATE POLICY "Allow authenticated reads" ON survey_responses
  FOR SELECT TO authenticated
  USING (true);
```

4. **Verify**: Go to Table Editor and confirm `survey_responses` table exists

---

### Step 2: Set Up Google Sheets Integration

1. **Open your Google Spreadsheet**:
   https://docs.google.com/spreadsheets/d/1SVp7ZWh53dZlq0aJJC0Uq-CxM8A4YaUfmbA_iYxM2No/edit

2. **Go to Extensions → Apps Script**

3. **Delete any existing code** in the editor

4. **Copy the entire content** from `google-apps-script.js` and paste it

5. **Save the project** (Ctrl+S or Cmd+S)
   - Name it: "Business Analytics Survey"

6. **Deploy the Web App**:
   - Click **Deploy** → **New deployment**
   - Click the gear icon ⚙️ next to "Select type"
   - Choose **Web app**
   - Configure:
     - **Description**: "Survey Data Handler"
     - **Execute as**: "Me"
     - **Who has access**: "Anyone"
   - Click **Deploy**

7. **Authorize the app**:
   - Click **Authorize access**
   - Select your Google account
   - Click **Advanced** → **Go to Business Analytics Survey (unsafe)**
   - Click **Allow**

8. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/AKfycb.../exec`)

9. **Update `survey-script.js`**:
   - Open `survey-script.js`
   - Find line ~12: `GOOGLE_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL'`
   - Replace with your actual URL

---

### Step 3: Deploy to Your Website (jtsvizee.in)

#### Option A: Using FTP/SFTP (Most Common)

1. Connect to your hosting via FTP client (FileZilla, etc.)
2. Upload these files to your web directory:
   - `survey.html`
   - `survey-styles.css`
   - `survey-script.js`
3. Access at: `https://jtsvizee.in/survey.html`

#### Option B: Using cPanel File Manager

1. Log into your cPanel
2. Go to File Manager
3. Navigate to `public_html` folder
4. Upload all three files
5. Access at: `https://jtsvizee.in/survey.html`

#### Option C: Using GitHub Pages (Free Alternative)

1. Create a GitHub repository
2. Push all files to the repo
3. Enable GitHub Pages in Settings
4. Access at: `https://yourusername.github.io/repo-name/survey.html`

#### Option D: Using Netlify (Free & Easy)

1. Go to https://app.netlify.com
2. Drag and drop your project folder
3. Get instant URL like: `https://your-site.netlify.app`

---

### Step 4: Test the Integration

1. **Open the survey** in your browser
2. **Fill out the form** with test data
3. **Submit** and verify:
   - ✅ Success message appears with confetti
   - ✅ Data appears in Google Sheets
   - ✅ Email notification received at jtss0287@gmail.com
   - ✅ Data stored in Supabase (check Table Editor)

---

## 📧 Email Notifications

When someone submits the form, you'll receive an email with:
- Respondent details (name, email, demographics)
- Section-wise score breakdown with visual progress bars
- Overall satisfaction score
- Any additional feedback provided

---

## 📊 Data Analysis Tips

### In Google Sheets:
```
=AVERAGE(G:G)           // Average of Q1 (Staff Polite)
=COUNTIF(D:D,"18-24")   // Count respondents aged 18-24
=AVERAGEIF(E:E,"female",G:G)  // Avg Q1 for females
```

### In Supabase (SQL):
```sql
-- Average overall satisfaction
SELECT AVG(q15::int) as avg_satisfaction FROM survey_responses;

-- Response count by age group
SELECT age, COUNT(*) FROM survey_responses GROUP BY age;

-- Loyalty score correlation with satisfaction
SELECT 
  CORR(q15::float, q18::float) as satisfaction_loyalty_correlation
FROM survey_responses;
```

---

## 🎨 Customization Options

### Change Colors:
Edit `survey-styles.css` - look for `:root` variables:
```css
:root {
  --accent: #29ffcf;        /* Main accent color */
  --accent-secondary: #5185ff;
  --bg: #181d2a;            /* Background */
}
```

### Add More Questions:
1. Add new `<div class="question-block">` in `survey.html`
2. Update `collectFormData()` in `survey-script.js`
3. Add column in Google Apps Script headers
4. Add column in Supabase table

---

## 🔧 Troubleshooting

### Form not submitting?
- Check browser console (F12) for errors
- Verify Supabase URL and API key in `survey-script.js`
- Ensure Google Apps Script is deployed and authorized

### Data not appearing in Google Sheets?
- Check if Apps Script URL is correct
- Verify the script is deployed as "Anyone can access"
- Check Apps Script execution logs: Extensions → Apps Script → Executions

### Email not received?
- Check spam folder
- Verify email in `google-apps-script.js` NOTIFICATION_EMAIL
- Check Apps Script execution logs for errors

### Supabase errors?
- Verify RLS policies are set correctly
- Check API key is the anon key
- Ensure table structure matches the code

---

## 📱 QR Code for Easy Sharing

Generate a QR code for your survey URL using:
- https://www.qr-code-generator.com/
- Input: `https://jtsvizee.in/survey.html`

Print and place in your café/store for customers to scan!

---

## 📈 Analytics Dashboard (Bonus)

You can create a live dashboard using:
1. **Google Data Studio** - Connect to your Google Sheet
2. **Supabase + Metabase** - For SQL-based dashboards
3. **Power BI** - Import data from either source

---

## 👥 Team

| Member | Role |
|--------|------|
| KC | Team Lead |
| NIRANJAN | Data Analysis |
| VAISHAVI | Survey Design |
| JOSEPH | Development |
| JOSHUA | Testing |

---

## 📞 Support

For technical issues:
- Email: jtss0287@gmail.com
- Website: https://jtsvizee.in

---

Made with ❤️ for Business Analytics Live Project
