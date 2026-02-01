// ==================== CONFIGURATION ====================
const CONFIG = {
  SUPABASE_URL: 'https://dwfrdbqeaiqijvtjmtpu.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZnJkYnFlYWlxaWp2dGptdHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODQ2NjcsImV4cCI6MjA4NTQ2MDY2N30.U2R-imEHE29mPr0sX4DxXO53lA06sqRMM_ddeDnWtSg',
  GOOGLE_APPS_SCRIPT_URL: '', // You'll need to deploy a Google Apps Script - instructions below
  EMAIL_TO: 'jtss0287@gmail.com'
};

// Initialize Supabase client
const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ==================== TAB NAVIGATION ====================
let currentTab = 1;
const totalTabs = 7;

function updateProgress() {
  const progress = Math.round((currentTab / totalTabs) * 100);
  document.getElementById('progress-bar').style.width = progress + '%';
  document.getElementById('step-label').innerText = `Step ${currentTab} of ${totalTabs}`;
  document.getElementById('percent-label').innerText = `${progress}%`;
}

function changeTab(direction) {
  // Validate current tab before moving forward
  if (direction > 0 && !validateCurrentTab()) {
    return;
  }

  // Hide current tab
  const currentTabEl = document.getElementById('tab-' + currentTab);
  currentTabEl.classList.remove('active');
  currentTabEl.style.display = 'none';

  // Update index
  currentTab += direction;

  // Show next tab with animation
  const nextTab = document.getElementById('tab-' + currentTab);
  nextTab.style.display = 'block';
  nextTab.classList.add('active');
  nextTab.style.animation = 'fadeUp 0.6s cubic-bezier(0.23, 1, 0.32, 1)';

  // Scroll to top of card
  document.getElementById('surveyCard').scrollIntoView({ behavior: 'smooth', block: 'start' });

  updateProgress();
}

function validateCurrentTab() {
  const currentTabEl = document.getElementById('tab-' + currentTab);
  const requiredInputs = currentTabEl.querySelectorAll('input[required], select[required]');
  
  for (let input of requiredInputs) {
    if (input.type === 'radio') {
      const name = input.name;
      const checked = currentTabEl.querySelector(`input[name="${name}"]:checked`);
      if (!checked) {
        showValidationError('Please answer all questions before proceeding.');
        return false;
      }
    } else if (!input.value) {
      input.focus();
      showValidationError('Please fill in all required fields.');
      return false;
    }
  }
  return true;
}

function showValidationError(message) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ff5252, #ff7b7b);
    color: white;
    padding: 16px 28px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 9999;
    animation: fadeUp 0.4s ease;
    box-shadow: 0 8px 30px rgba(255, 82, 82, 0.4);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==================== GENERATE LIKERT OPTIONS ====================
function generateLikertOptions() {
  const ratingLabels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
  const containers = document.querySelectorAll('.likert-options[data-name]');
  
  containers.forEach(container => {
    const name = container.dataset.name;
    let html = '';
    
    for (let i = 1; i <= 5; i++) {
      html += `
        <div class="likert-option">
          <input type="radio" name="${name}" id="${name}_${i}" value="${i}" required>
          <label for="${name}_${i}">
            <span class="rating-num">${i}</span>
            <span class="rating-text">${ratingLabels[i-1]}</span>
          </label>
        </div>
      `;
    }
    container.innerHTML = html;
  });
}

// ==================== FORM SUBMISSION ====================
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  
  // Show loading state
  submitBtn.disabled = true;
  submitText.innerHTML = '<span class="loading-spinner"></span>Submitting...';
  
  // Collect form data
  const formData = collectFormData();
  
  try {
    // Send to all destinations in parallel
    const results = await Promise.allSettled([
      sendToSupabase(formData),
      sendToGoogleSheets(formData),
      sendEmailNotification(formData)
    ]);
    
    // Log results
    console.log('Submission results:', results);
    
    // Show success
    showSuccess();
    
  } catch (error) {
    console.error('Submission error:', error);
    showValidationError('There was an error submitting your response. Please try again.');
    submitBtn.disabled = false;
    submitText.innerHTML = 'Submit Survey 🚀';
  }
}

function collectFormData() {
  const form = document.getElementById('surveyForm');
  const timestamp = new Date().toISOString();
  
  const data = {
    timestamp: timestamp,
    name: form.querySelector('#name').value,
    email: form.querySelector('#email').value,
    age: form.querySelector('#age').value,
    gender: form.querySelector('#gender').value,
    visit_frequency: form.querySelector('#visit_frequency').value,
    feedback: form.querySelector('#feedback').value || '',
  };
  
  // Collect all Likert responses (q1 to q20)
  for (let i = 1; i <= 20; i++) {
    const selected = form.querySelector(`input[name="q${i}"]:checked`);
    data[`q${i}`] = selected ? parseInt(selected.value) : null;
  }
  
  // Calculate section averages
  data.avg_service_staff = average([data.q1, data.q2, data.q3, data.q4]);
  data.avg_ambience = average([data.q5, data.q6, data.q7, data.q8]);
  data.avg_time_convenience = average([data.q9, data.q10, data.q11]);
  data.avg_pricing_value = average([data.q12, data.q13, data.q14]);
  data.avg_satisfaction = average([data.q15, data.q16, data.q17]);
  data.avg_loyalty = average([data.q18, data.q19, data.q20]);
  data.overall_score = average([data.q1, data.q2, data.q3, data.q4, data.q5, data.q6, data.q7, data.q8, 
                                 data.q9, data.q10, data.q11, data.q12, data.q13, data.q14, data.q15, 
                                 data.q16, data.q17, data.q18, data.q19, data.q20]);
  
  return data;
}

function average(arr) {
  const valid = arr.filter(v => v !== null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
}

// ==================== SUPABASE INTEGRATION ====================
async function sendToSupabase(data) {
  try {
    const { data: result, error } = await supabase
      .from('survey_responses')
      .insert([data]);
    
    if (error) {
      console.error('Supabase error:', error);
      // If table doesn't exist, log instructions
      if (error.code === '42P01') {
        console.log('Table does not exist. Please create the table in Supabase with the following SQL:');
        console.log(getSupabaseTableSQL());
      }
      throw error;
    }
    
    console.log('✅ Data sent to Supabase successfully');
    return result;
  } catch (error) {
    console.error('Supabase submission failed:', error);
    throw error;
  }
}

function getSupabaseTableSQL() {
  return `
CREATE TABLE survey_responses (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  email TEXT,
  age TEXT,
  gender TEXT,
  visit_frequency TEXT,
  q1 INTEGER, q2 INTEGER, q3 INTEGER, q4 INTEGER,
  q5 INTEGER, q6 INTEGER, q7 INTEGER, q8 INTEGER,
  q9 INTEGER, q10 INTEGER, q11 INTEGER,
  q12 INTEGER, q13 INTEGER, q14 INTEGER,
  q15 INTEGER, q16 INTEGER, q17 INTEGER,
  q18 INTEGER, q19 INTEGER, q20 INTEGER,
  avg_service_staff DECIMAL(3,2),
  avg_ambience DECIMAL(3,2),
  avg_time_convenience DECIMAL(3,2),
  avg_pricing_value DECIMAL(3,2),
  avg_satisfaction DECIMAL(3,2),
  avg_loyalty DECIMAL(3,2),
  overall_score DECIMAL(3,2),
  feedback TEXT
);

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anon users
CREATE POLICY "Allow anonymous inserts" ON survey_responses
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create policy to allow selects (for viewing responses)
CREATE POLICY "Allow anonymous selects" ON survey_responses
  FOR SELECT TO anon
  USING (true);
  `;
}

// ==================== GOOGLE SHEETS INTEGRATION ====================
async function sendToGoogleSheets(data) {
  // Method 1: Using Google Apps Script Web App (Recommended)
  if (CONFIG.GOOGLE_APPS_SCRIPT_URL) {
    try {
      const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      console.log('✅ Data sent to Google Sheets successfully');
      return response;
    } catch (error) {
      console.error('Google Sheets error:', error);
      throw error;
    }
  } else {
    // Log instructions if URL not configured
    console.log('📋 Google Sheets Integration Setup Required:');
    console.log('1. Open your Google Sheet');
    console.log('2. Go to Extensions > Apps Script');
    console.log('3. Paste the following code and deploy as Web App:');
    console.log(getGoogleAppsScriptCode());
    console.log('4. Copy the Web App URL and add it to CONFIG.GOOGLE_APPS_SCRIPT_URL');
    
    // Still return success to not block form submission
    return { status: 'pending_setup' };
  }
}

function getGoogleAppsScriptCode() {
  return `
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.openById('1SVp7ZWh53dZlq0aJJC0Uq-CxM8A4YaUfmbA_iYxM2No').getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // If this is the first row, add headers
    if (sheet.getLastRow() === 0) {
      var headers = ['Timestamp', 'Name', 'Email', 'Age', 'Gender', 'Visit Frequency',
        'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
        'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20',
        'Avg Service', 'Avg Ambience', 'Avg Time', 'Avg Pricing', 'Avg Satisfaction', 'Avg Loyalty', 'Overall Score', 'Feedback'];
      sheet.appendRow(headers);
    }
    
    // Append the data
    var row = [
      data.timestamp, data.name, data.email, data.age, data.gender, data.visit_frequency,
      data.q1, data.q2, data.q3, data.q4, data.q5, data.q6, data.q7, data.q8, data.q9, data.q10,
      data.q11, data.q12, data.q13, data.q14, data.q15, data.q16, data.q17, data.q18, data.q19, data.q20,
      data.avg_service_staff, data.avg_ambience, data.avg_time_convenience, data.avg_pricing_value,
      data.avg_satisfaction, data.avg_loyalty, data.overall_score, data.feedback
    ];
    sheet.appendRow(row);
    
    // Send email notification
    var emailBody = 'New Survey Response Received!\\n\\n' +
      'Name: ' + data.name + '\\n' +
      'Email: ' + data.email + '\\n' +
      'Overall Score: ' + data.overall_score + '/5\\n' +
      'Timestamp: ' + data.timestamp + '\\n\\n' +
      'View full response in your Google Sheet.';
    
    MailApp.sendEmail('jtss0287@gmail.com', 'New Survey Response - Business Analytics', emailBody);
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Survey API is running');
}
  `;
}

// ==================== EMAIL NOTIFICATION ====================
async function sendEmailNotification(data) {
  // Email is handled by Google Apps Script
  // This function is for future implementation with a dedicated email service
  console.log('📧 Email notification will be sent via Google Apps Script');
  return { status: 'via_google_apps_script' };
}

// ==================== SUCCESS HANDLER ====================
function showSuccess() {
  // Hide all tabs
  for (let i = 1; i <= totalTabs; i++) {
    const tab = document.getElementById('tab-' + i);
    if (tab) {
      tab.style.display = 'none';
      tab.classList.remove('active');
    }
  }
  
  // Show success tab
  const successTab = document.getElementById('tab-success');
  successTab.style.display = 'block';
  successTab.classList.add('active');
  
  // Update progress to 100%
  document.getElementById('progress-bar').style.width = '100%';
  document.getElementById('step-label').innerText = 'Complete!';
  document.getElementById('percent-label').innerText = '100%';
  
  // Scroll to top
  document.getElementById('surveyCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== ANIMATIONS & EFFECTS ====================

// Loader matrix rain effect
function initMatrixRain() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  
  function resizeMatrix() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeMatrix();
  window.addEventListener("resize", resizeMatrix);
  
  const letters = "BUSINESS ANALYTICS GROUP10 SURVEY DATA";
  const fontSize = 21;
  let columns = Math.floor(window.innerWidth / fontSize);
  let drops = [];
  for (let x = 0; x < columns; x++) drops[x] = 1;
  
  function randColor() {
    const r = 130 + Math.floor(Math.random() * 80);
    const g = 140 + Math.floor(Math.random() * 75);
    const b = 220 + Math.floor(Math.random() * 30);
    return `rgb(${r},${g},${b})`;
  }
  
  function drawMatrixRain() {
    ctx.fillStyle = "rgba(32,30,65,0.09)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + "px monospace";
    
    for (let i = 0; i < drops.length; i++) {
      const char = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillStyle = randColor();
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.965) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(drawMatrixRain);
  }
  drawMatrixRain();
}

// Hero matrix effect
function initHeroMatrix() {
  const c = document.getElementById("matrixBg");
  if (!c) return;
  
  let w = c.width = window.innerWidth;
  let h = c.height = c.offsetHeight || 340;
  const ctx = c.getContext("2d");
  let cols = Math.floor(w / 20);
  let ypos = Array(cols).fill(0);
  
  function matrix() {
    ctx.fillStyle = "rgba(28,31,43,.13)";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "16px monospace";
    ctx.fillStyle = "#34ffd8";
    ypos.forEach((y, ind) => {
      const txt = String.fromCharCode(Math.random() * 93 + 34);
      ctx.fillText(txt, ind * 21, y);
      if (y > 120 + Math.random() * 210) ypos[ind] = 0;
      else ypos[ind] += 18;
    });
  }
  setInterval(matrix, 48);
  window.addEventListener('resize', () => {
    w = c.width = window.innerWidth;
    h = c.height = c.offsetHeight || 340;
  });
}

// Metaballs background
function metaballs(canvas, opt) {
  const ctx = canvas.getContext("2d");
  let balls = [];
  const num = opt.num || 7;
  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  
  function resize() {
    canvas.width = window.innerWidth;
    const parent = canvas.parentElement;
    canvas.height = parent.offsetHeight || 720;
  }
  resize();
  window.addEventListener('resize', resize);
  
  for (let i = 0; i < num; i++) {
    balls.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: opt.rBase + (Math.random() - 0.5) * opt.rSpread,
      dx: (Math.random() - 0.5) * opt.speed,
      dy: (Math.random() - 0.5) * opt.speed,
      hue: opt.hue + Math.random() * opt.hueSpread
    });
  }
  
  const mouseBall = { x: mouse.x, y: mouse.y, r: opt.rBase * 1.07, dx: 0, dy: 0, hue: 210 };
  balls.push(mouseBall);
  
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    mouseBall.x = e.clientX - rect.left;
    mouseBall.y = e.clientY - rect.top;
  });
  
  function lerp(a, b, t) { return a + (b - a) * t; }
  
  function anim() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = ctx.createImageData(canvas.width, canvas.height);
    const data = img.data;
    
    for (let y = 0; y < canvas.height; y += opt.res) {
      for (let x = 0; x < canvas.width; x += opt.res) {
        let sum = 0, c = 0;
        for (let b = 0; b < balls.length; b++) {
          const dx = x - balls[b].x;
          const dy = y - balls[b].y;
          const v = balls[b].r * balls[b].r / (dx * dx + dy * dy + 1);
          sum += v;
          c = lerp(c, balls[b].hue, v / balls.length);
        }
        const idx = (y * canvas.width + x) * 4;
        if (sum > opt.t) {
          data[idx] = c;
          data[idx + 1] = 133 + Math.sin(c / 45) * 55;
          data[idx + 2] = 230 + Math.cos(c / 89) * 23;
          data[idx + 3] = 182;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    
    for (let b = 0; b < balls.length - 1; b++) {
      balls[b].x += balls[b].dx;
      balls[b].y += balls[b].dy;
      if (balls[b].x < balls[b].r || balls[b].x > canvas.width - balls[b].r) balls[b].dx *= -1;
      if (balls[b].y < balls[b].r || balls[b].y > canvas.height - balls[b].r) balls[b].dy *= -1;
    }
    requestAnimationFrame(anim);
  }
  anim();
}

// Typewriter effect
function initTypewriter() {
  const typeArr = [
    "Customer satisfaction and purchase behavior in retail and cafes 🎯",
    "Help us gather insights for business improvement 📈",
    "Your feedback shapes better customer experiences ✨"
  ];
  let typeIdx = 0, charIdx = 0, typing = true;
  const tw = document.getElementById('typewriter');
  if (!tw) return;
  
  function doType() {
    const txt = typeArr[typeIdx];
    if (typing) {
      tw.innerHTML = txt.slice(0, charIdx) + "<span style='opacity:0.6;'>|</span>";
      if (charIdx < txt.length) {
        charIdx++;
        setTimeout(doType, 43);
      } else {
        typing = false;
        setTimeout(doType, 2000);
      }
    } else {
      tw.innerHTML = txt + "<span style='opacity:0.45;'>|</span>";
      setTimeout(() => {
        tw.innerHTML = "";
        typeIdx = (typeIdx + 1) % typeArr.length;
        charIdx = 0;
        typing = true;
        doType();
      }, 570);
    }
  }
  doType();
}

// Footer local time
function updateLocalTime() {
  const options = {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-IN', options);
  const el = document.getElementById('footer-localtime');
  if (el) el.textContent = '🕔 Local time (India): ' + formatter.format(now);
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
  // Initialize matrix effects
  initMatrixRain();
  initHeroMatrix();
  
  // Generate Likert scale options
  generateLikertOptions();
  
  // Initialize typewriter
  initTypewriter();
  
  // Update local time
  updateLocalTime();
  setInterval(updateLocalTime, 1000);
  
  // Form submission handler
  document.getElementById('surveyForm').addEventListener('submit', handleFormSubmit);
  
  // Hide loader after delay
  setTimeout(function() {
    document.getElementById('loading').classList.add('hide');
    setTimeout(function() {
      document.getElementById('loading').style.display = 'none';
      document.querySelectorAll('.glass-card').forEach(function(card, i) {
        setTimeout(function() { card.classList.add('visible'); }, 150 * i + 250);
      });
    }, 900);
  }, 2500);
  
  // Initialize metaballs after a delay
  setTimeout(function() {
    metaballs(document.getElementById('metaballs-bg'), {
      num: 7,
      rBase: 52,
      rSpread: 43,
      speed: 0.9,
      hue: 135,
      hueSpread: 99,
      t: 0.74,
      res: 3
    });
  }, 400);
  
  // Intersection observer for card animations
  const cards = document.querySelectorAll('.glass-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.22 });
  cards.forEach(card => observer.observe(card));
  
  // Log setup instructions to console
  console.log('='.repeat(60));
  console.log('📊 BUSINESS ANALYTICS SURVEY - SETUP INSTRUCTIONS');
  console.log('='.repeat(60));
  console.log('\n1. SUPABASE SETUP:');
  console.log('   - Go to your Supabase dashboard');
  console.log('   - Run the following SQL to create the table:');
  console.log(getSupabaseTableSQL());
  console.log('\n2. GOOGLE SHEETS SETUP:');
  console.log('   - Open your Google Sheet');
  console.log('   - Go to Extensions > Apps Script');
  console.log('   - Paste the code below and deploy as Web App');
  console.log('   - Copy the Web App URL to CONFIG.GOOGLE_APPS_SCRIPT_URL');
  console.log(getGoogleAppsScriptCode());
  console.log('='.repeat(60));
});
