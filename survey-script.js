// =====================================================
// CONFIGURATION - Update these values as needed
// =====================================================
const CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 'https://dwfrdbqeaiqijvtjmtpu.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZnJkYnFlYWlxaWp2dGptdHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODQ2NjcsImV4cCI6MjA4NTQ2MDY2N30.U2R-imEHE29mPr0sX4DxXO53lA06sqRMM_ddeDnWtSg',
  
  // Google Apps Script Web App URL (You need to deploy the script and paste URL here)
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw6paDXQOThrdJRXByRuKw58vDJBk8eUQnspneEzHNmGZAGsKoeQzrgQ2MyPT_EVhH7tA/exec',
  
  // Email Configuration (via Google Apps Script)
  NOTIFICATION_EMAIL: 'jtss0287@gmail.com'
};

// =====================================================
// SURVEY NAVIGATION
// =====================================================
let currentTab = 1;
const totalTabs = 7;

function changeTab(direction) {
  const currentTabEl = document.getElementById('tab-' + currentTab);
  
  // Validate current tab before moving forward
  if (direction > 0 && !validateTab(currentTab)) {
    showToast('Please fill all required fields', 'error');
    shakeElement(currentTabEl);
    return;
  }
  
  // Hide current tab with animation
  currentTabEl.style.animation = 'slideOut 0.3s ease-out';
  setTimeout(() => {
    currentTabEl.style.display = 'none';
    currentTabEl.style.animation = '';
    
    // Update index
    currentTab += direction;
    
    // Show next tab
    const nextTab = document.getElementById('tab-' + currentTab);
    nextTab.style.display = 'block';
    nextTab.style.animation = 'slideIn 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    
    // Scroll to top of form
    nextTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Update progress
    updateProgress();
  }, 250);
}

function validateTab(tabNum) {
  const tab = document.getElementById('tab-' + tabNum);
  const requiredInputs = tab.querySelectorAll('input[required], select[required]');
  let valid = true;
  
  requiredInputs.forEach(input => {
    if (input.type === 'radio') {
      const radioGroup = tab.querySelectorAll(`input[name="${input.name}"]`);
      const checked = Array.from(radioGroup).some(r => r.checked);
      if (!checked) valid = false;
    } else if (!input.value.trim()) {
      valid = false;
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 500);
    }
  });
  
  return valid;
}

function updateProgress() {
  const progress = (currentTab / totalTabs) * 100;
  document.getElementById('progress-bar').style.width = progress + '%';
  document.getElementById('step-label').innerText = `Step ${currentTab} of ${totalTabs}`;
  document.getElementById('percent-label').innerText = `${Math.round(progress)}%`;
  
  // Update step dots
  document.querySelectorAll('.step-dot').forEach((dot, index) => {
    dot.classList.remove('active', 'completed');
    if (index + 1 < currentTab) {
      dot.classList.add('completed');
    } else if (index + 1 === currentTab) {
      dot.classList.add('active');
    }
  });
}

function shakeElement(el) {
  el.style.animation = 'shake 0.5s ease-out';
  setTimeout(() => el.style.animation = '', 500);
}

// Add shake animation to CSS dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  @keyframes slideOut {
    to { opacity: 0; transform: translateX(-30px); }
  }
  .shake { animation: shake 0.5s ease-out; }
`;
document.head.appendChild(shakeStyle);

// =====================================================
// FORM SUBMISSION
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('surveyForm');
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate final tab
    if (!validateTab(currentTab)) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    submitBtn.disabled = true;
    
    // Collect form data
    const formData = collectFormData();
    
    try {
      // Send to all destinations in parallel
      const results = await Promise.allSettled([
        sendToSupabase(formData),
        sendToGoogleSheets(formData)
      ]);
      
      // Check results
      const supabaseResult = results[0];
      const sheetsResult = results[1];
      
      console.log('Supabase result:', supabaseResult);
      console.log('Google Sheets result:', sheetsResult);
      
      // Show success even if some fail (data is saved somewhere)
      showSuccessMessage();
      launchConfetti();
      
    } catch (error) {
      console.error('Submission error:', error);
      showToast('Error submitting form. Please try again.', 'error');
      
      // Reset button
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
});

function collectFormData() {
  const form = document.getElementById('surveyForm');
  const formDataObj = new FormData(form);
  const data = {};
  
  // Basic info
  data.name = formDataObj.get('name');
  data.email = formDataObj.get('email');
  data.age = formDataObj.get('age');
  data.gender = formDataObj.get('gender');
  data.visit_frequency = formDataObj.get('visit_frequency');
  
  // Survey responses (q1 to q20)
  for (let i = 1; i <= 20; i++) {
    data[`q${i}`] = formDataObj.get(`q${i}`) || '';
  }
  
  // Feedback
  data.feedback = formDataObj.get('feedback') || '';
  
  // Metadata
  data.timestamp = new Date().toISOString();
  data.user_agent = navigator.userAgent;
  
  return data;
}

// =====================================================
// SUPABASE INTEGRATION
// =====================================================
async function sendToSupabase(data) {
  const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/survey_responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status}`);
  }
  
  return { success: true };
}

// =====================================================
// GOOGLE SHEETS INTEGRATION
// =====================================================
async function sendToGoogleSheets(data) {
  // Skip if URL not configured
  if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
    console.log('Google Sheets URL not configured. Skipping...');
    return { success: false, message: 'Not configured' };
  }
  
  const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      notificationEmail: CONFIG.NOTIFICATION_EMAIL
    })
  });
  
  return { success: true };
}

// =====================================================
// UI HELPERS
// =====================================================
function showSuccessMessage() {
  // Hide form
  document.querySelectorAll('.survey-tab').forEach(tab => tab.style.display = 'none');
  document.querySelector('.progress-container').style.display = 'none';
  document.querySelector('.intro-card').style.display = 'none';
  
  // Show success
  const successCard = document.getElementById('success-message');
  successCard.style.display = 'block';
  successCard.classList.add('visible');
  successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.5s ease-out forwards';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// Add slideOutRight animation
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes slideOutRight {
    to { opacity: 0; transform: translateX(100px); }
  }
`;
document.head.appendChild(toastStyle);

// =====================================================
// LOADER ANIMATION
// =====================================================
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(function() {
    document.getElementById('loading').classList.add('hide');
    setTimeout(function() {
      document.getElementById('loading').style.display = 'none';
      document.querySelectorAll('.glass-card').forEach(function(card, i) {
        setTimeout(function() { card.classList.add('visible'); }, 150 * i + 250);
      });
    }, 900);
  }, 2800);
});

// =====================================================
// MATRIX RAIN - LOADER
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  
  function resizeMatrix() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeMatrix();
  window.addEventListener("resize", resizeMatrix);
  
  const letters = "GROUP10BUSINESSANALYTICS0123456789ABCDEF";
  const fontSize = 21;
  let columns = Math.floor(window.innerWidth / fontSize);
  let drops = [];
  for (let x = 0; x < columns; x++) drops[x] = 1;
  
  function randColor() {
    const colors = [
      'rgb(41, 255, 207)',
      'rgb(81, 133, 255)',
      'rgb(74, 222, 128)',
      'rgb(251, 191, 36)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  function drawMatrixRain() {
    ctx.fillStyle = "rgba(32,30,65,0.09)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + "px monospace";
    
    for (let i = 0; i < drops.length; i++) {
      const char = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillStyle = randColor();
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.965) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    requestAnimationFrame(drawMatrixRain);
  }
  drawMatrixRain();
});

// =====================================================
// MATRIX RAIN - HERO
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
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
    
    const heroChars = "ANALYTICS0123456789ABCDEFGROUP10";
    ypos.forEach((y, ind) => {
      const txt = heroChars[Math.floor(Math.random() * heroChars.length)];
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
});

// =====================================================
// METABALLS ANIMATION
// =====================================================
function metaballs(canvas, opt) {
  let ctx = canvas.getContext("2d");
  let balls = [];
  let num = opt.num || 7;
  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  
  let initialHeight = 0;
  
  function resize() {
    canvas.width = window.innerWidth;
    const parent = canvas.parentElement;
    const parentHeight = parent.offsetHeight || 720;
    
    // Store initial height and never go below it
    if (initialHeight === 0 || parentHeight > initialHeight) {
      initialHeight = parentHeight;
    }
    
    // Use the larger of current parent height, initial height, or window height
    canvas.height = Math.max(parentHeight, initialHeight, window.innerHeight);
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
      hue: opt.hue + (Math.random() * opt.hueSpread)
    });
  }
  
  let mouseBall = { x: mouse.x, y: mouse.y, r: opt.rBase * 1.07, dx: 0, dy: 0, hue: 210 };
  balls.push(mouseBall);
  
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    mouseBall.x = e.clientX - rect.left;
    mouseBall.y = e.clientY - rect.top;
  });
  
  function lerp(a, b, t) { return a + (b - a) * t; }
  
  function anim() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let img = ctx.createImageData(canvas.width, canvas.height);
    let data = img.data;
    
    for (let y = 0; y < canvas.height; y += opt.res) {
      for (let x = 0; x < canvas.width; x += opt.res) {
        let sum = 0, c = 0;
        for (let b = 0; b < balls.length; b++) {
          let dx = x - balls[b].x;
          let dy = y - balls[b].y;
          let v = balls[b].r * balls[b].r / (dx * dx + dy * dy + 1);
          sum += v;
          c = lerp(c, balls[b].hue, v / balls.length);
        }
        let idx = (y * canvas.width + x) * 4;
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

window.addEventListener('DOMContentLoaded', function() {
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
});

// =====================================================
// TYPEWRITER EFFECT
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
  const typeArr = [
    "Customer Satisfaction & Repeat Purchase Behavior 🎯",
    "Help us improve your experience! 📊",
    "Your feedback matters to us! ⭐",
    "Live Business Analytics Project 📈"
  ];
  let typeIdx = 0, charIdx = 0, typing = true;
  const tw = document.getElementById('typewriter');
  
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
});

// =====================================================
// SCROLL ANIMATIONS
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
  const cards = document.querySelectorAll('.glass-card');
  
  const animateCards = function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  };
  
  const observer = new IntersectionObserver(animateCards, { threshold: 0.22 });
  cards.forEach(card => observer.observe(card));
  
  setTimeout(() => cards.forEach(card => card.classList.add('visible')), 4000);
});

// =====================================================
// FOOTER LOCAL TIME
// =====================================================
function updateLocalTime() {
  const options = {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  const now = new Date();
  const formatted = now.toLocaleString('en-IN', options);
  const el = document.getElementById('footer-localtime');
  if (el) el.textContent = '🕔 Local time (India): ' + formatted;
}
updateLocalTime();
setInterval(updateLocalTime, 1000);

// =====================================================
// CLICK PARTICLE EFFECTS
// =====================================================
const particleCanvas = document.getElementById('particle-canvas');
const pCtx = particleCanvas ? particleCanvas.getContext('2d') : null;
let particles = [];

function resizeParticleCanvas() {
  if (particleCanvas) {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
}
resizeParticleCanvas();
window.addEventListener('resize', resizeParticleCanvas);

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 8 + 3;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = (Math.random() - 0.5) * 8;
    this.color = color;
    this.life = 1;
    this.decay = Math.random() * 0.02 + 0.01;
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += 0.1;
    this.life -= this.decay;
    this.size *= 0.98;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function createParticleBurst(x, y) {
  const colors = ['#29ffcf', '#5185ff', '#4ade80', '#fbbf24', '#f472b6'];
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
  }
}

function animateParticles() {
  if (!pCtx) return requestAnimationFrame(animateParticles);
  
  pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.update();
    p.draw(pCtx);
  });
  
  requestAnimationFrame(animateParticles);
}
animateParticles();

// Click particle effects removed for cleaner UX

// =====================================================
// CONFETTI EFFECT
// =====================================================
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
let confettiPieces = [];
let confettiActive = false;

function resizeConfettiCanvas() {
  if (confettiCanvas) {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
}
resizeConfettiCanvas();
window.addEventListener('resize', resizeConfettiCanvas);

class ConfettiPiece {
  constructor() {
    this.x = Math.random() * confettiCanvas.width;
    this.y = -20;
    this.size = Math.random() * 10 + 5;
    this.speedX = (Math.random() - 0.5) * 4;
    this.speedY = Math.random() * 3 + 2;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    this.color = ['#29ffcf', '#5185ff', '#4ade80', '#fbbf24', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 6)];
    this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
    this.speedX *= 0.99;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.fillStyle = this.color;
    
    if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function launchConfetti() {
  confettiActive = true;
  
  // Create initial burst
  for (let i = 0; i < 150; i++) {
    setTimeout(() => {
      confettiPieces.push(new ConfettiPiece());
    }, i * 20);
  }
  
  // Stop after 3 seconds
  setTimeout(() => {
    confettiActive = false;
  }, 3000);
}

function animateConfetti() {
  if (!confettiCtx) return requestAnimationFrame(animateConfetti);
  
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  
  confettiPieces = confettiPieces.filter(p => p.y < confettiCanvas.height + 50);
  confettiPieces.forEach(p => {
    p.update();
    p.draw(confettiCtx);
  });
  
  requestAnimationFrame(animateConfetti);
}
animateConfetti();

// =====================================================
// RIPPLE EFFECT ON BUTTONS
// =====================================================
document.querySelectorAll('.btn-nav').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
    ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
    
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Rating option effects - simplified for cleaner UX

// =====================================================
// BOUNCING BALL ANIMATION (Extra visual element)
// =====================================================
function createBouncingBall() {
  const ball = document.createElement('div');
  ball.className = 'bouncing-ball';
  ball.innerHTML = '⚽';
  ball.style.cssText = `
    position: fixed;
    font-size: 2em;
    z-index: 9997;
    pointer-events: none;
    user-select: none;
  `;
  document.body.appendChild(ball);
  
  let x = Math.random() * (window.innerWidth - 50);
  let y = Math.random() * (window.innerHeight - 50);
  let vx = (Math.random() - 0.5) * 4;
  let vy = (Math.random() - 0.5) * 4;
  
  function animate() {
    x += vx;
    y += vy;
    
    if (x <= 0 || x >= window.innerWidth - 40) vx *= -1;
    if (y <= 0 || y >= window.innerHeight - 40) vy *= -1;
    
    ball.style.transform = `translate(${x}px, ${y}px) rotate(${x}deg)`;
    
    requestAnimationFrame(animate);
  }
  animate();
}

// Bouncing balls disabled for cleaner experience

console.log('📊 Business Analytics Survey - Group 10');
console.log('🚀 Survey form loaded successfully!');
