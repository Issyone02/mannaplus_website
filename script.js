// ===== DYNAMIC QUIZ ENGINE (Powered by Open Trivia Database) =====

const FALLBACK_QUESTIONS = [
  { subject: "Science", question: "What is the chemical symbol for Oxygen?", options: ["O2", "Ox", "O", "Om"], answer: 2, explanation: "Oxygen's symbol is simply O, atomic number 8 on the periodic table.", difficulty: "easy" },
  { subject: "Mathematics", question: "What is the square root of 144?", options: ["11", "12", "13", "14"], answer: 1, explanation: "12 × 12 = 144, so √144 = 12.", difficulty: "easy" },
  { subject: "History", question: "Nigeria gained independence from Britain on October 1st of which year?", options: ["1955", "1960", "1963", "1966"], answer: 1, explanation: "Nigeria declared independence on October 1, 1960.", difficulty: "medium" },
  { subject: "Science", question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Cell membrane"], answer: 2, explanation: "Mitochondria produce ATP through cellular respiration.", difficulty: "easy" },
  { subject: "General Knowledge", question: "Which continent is the largest by area?", options: ["Africa", "North America", "Asia", "Antarctica"], answer: 2, explanation: "Asia covers ~44.6 million km², about 30% of Earth's land area.", difficulty: "easy" },
  { subject: "Mathematics", question: "A rectangle has length 12 cm and width 5 cm. What is its perimeter?", options: ["17 cm", "34 cm", "60 cm", "24 cm"], answer: 1, explanation: "Perimeter = 2 × (12 + 5) = 34 cm.", difficulty: "easy" },
  { subject: "Science", question: "What is the chemical symbol for Gold?", options: ["Gd", "Go", "Au", "Ag"], answer: 2, explanation: "Gold's symbol is Au from the Latin 'Aurum'.", difficulty: "medium" },
  { subject: "English", question: "Which of these is a metaphor?", options: ["She runs like the wind", "The moon was a silver coin", "He is very tall", "Dogs bark loudly"], answer: 1, explanation: "'The moon was a silver coin' directly states one thing IS another — that is a metaphor.", difficulty: "medium" },
  { subject: "Geography", question: "What is the capital city of Nigeria?", options: ["Lagos", "Ibadan", "Kano", "Abuja"], answer: 3, explanation: "Abuja became Nigeria's capital in 1991, replacing Lagos.", difficulty: "easy" },
  { subject: "Biology", question: "How many chambers does the human heart have?", options: ["2", "3", "4", "5"], answer: 2, explanation: "The human heart has 4 chambers: right/left atria and right/left ventricles.", difficulty: "easy" }
];

let currentQ = 0;
let score = 0;
let answered = [];
let shuffledQuiz = [];
let totalQuestions = 10;

function decodeHTML(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function difficultyDot(d) {
  const map = { easy: "diff-easy", medium: "diff-medium", hard: "diff-hard" };
  return `<span class="difficulty-dot ${map[d] || "diff-medium"}"></span>${(d || "medium").charAt(0).toUpperCase() + (d || "medium").slice(1)}`;
}

function buildQuizFromAPI(results) {
  return results.map(item => {
    const allOptions = shuffleArray([decodeHTML(item.correct_answer), ...item.incorrect_answers.map(decodeHTML)]);
    const answerIdx = allOptions.indexOf(decodeHTML(item.correct_answer));
    const cat = decodeHTML(item.category).replace(/^Science: /, "").replace(/^Entertainment: /, "");
    return {
      subject: cat,
      question: decodeHTML(item.question),
      options: allOptions,
      answer: answerIdx,
      difficulty: item.difficulty,
      explanation: `The correct answer is <strong>${decodeHTML(item.correct_answer)}</strong>. Category: ${cat} | Difficulty: ${item.difficulty}.`
    };
  });
}

function showLoader(msg) {
  document.getElementById("quizArea").innerHTML = `<div class="quiz-loader"><div class="spinner"></div><strong>Fetching fresh questions…</strong><p>${msg || "Connecting to academic question database"}</p></div>`;
  document.getElementById("progressFill").style.width = "0%";
  document.getElementById("quizScore").classList.remove("show");
  document.getElementById("quizArea").style.display = "";
}

function showError(msg) {
  document.getElementById("quizArea").innerHTML = `<div class="quiz-error glass"><i class="fas fa-exclamation-triangle"></i><h3>Could Not Fetch Questions</h3><p>${msg}</p><p style="margin-bottom:1.5rem;margin-top:0.5rem;">Falling back to our built-in question bank instead.</p><button class="btn-quiz btn-quiz-gold" onclick="loadFallback()"><i class="fas fa-database"></i> Use Built-in Questions</button></div>`;
}

async function startNewQuiz() {
  const cat = document.getElementById("quizCategory").value;
  const diff = document.getElementById("quizDifficulty").value;
  const amt = parseInt(document.getElementById("quizAmount").value) || 10;
  totalQuestions = amt;

  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching…';
  showLoader(`Loading ${amt} ${diff || "mixed difficulty"} questions${cat ? " on your chosen topic" : ""}…`);

  let url = `https://opentdb.com/api.php?amount=${amt}&type=multiple`;
  if (cat) url += `&category=${cat}`;
  if (diff) url += `&difficulty=${diff}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network error: " + res.status);
    const data = await res.json();
    if (data.response_code === 1) {
      showError("Not enough questions found for your selected combination. Try fewer questions, a different category, or easier difficulty.");
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-bolt"></i> Generate Quiz';
      return;
    }
    if (data.response_code !== 0 || !data.results?.length) throw new Error("Bad API response (code " + data.response_code + ")");
    currentQ = 0; score = 0; answered = [];
    shuffledQuiz = buildQuizFromAPI(data.results);
    document.getElementById("quizScore").classList.remove("show");
    document.getElementById("quizArea").style.display = "";
    renderQuestion(0);
  } catch (err) {
    console.warn("OpenTDB error:", err);
    showError("Could not reach the question database. Please check your connection.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-bolt"></i> Generate Quiz';
  }
}

function loadFallback() {
  currentQ = 0; score = 0; answered = [];
  shuffledQuiz = shuffleArray(FALLBACK_QUESTIONS);
  document.getElementById("quizScore").classList.remove("show");
  renderQuestion(0);
}

function renderQuestion(index) {
  const q = shuffledQuiz[index];
  if (!q) return;
  const progress = (index / shuffledQuiz.length) * 100;
  document.getElementById("progressFill").style.width = progress + "%";
  const letters = ["A", "B", "C", "D"];
  const isLast = index === shuffledQuiz.length - 1;
  const html = `<div class="question-card glass">
    <div class="q-header"><span class="q-num">Question ${index+1} / ${shuffledQuiz.length}</span><span class="q-subject">${q.subject}</span></div>
    ${q.difficulty ? `<div style="margin-bottom:0.75rem;font-size:0.78rem;color:var(--text-muted)">${difficultyDot(q.difficulty)}</div>` : ""}
    <div class="q-text">${q.question}</div>
    <div class="options" id="options">${q.options.map((opt,i) => `<div class="option" data-idx="${i}" onclick="selectOption(${i},${index})"><span class="opt-letter">${letters[i]}</span><span class="opt-text">${opt}</span></div>`).join("")}</div>
    <div class="answer-reveal" id="answerReveal"></div>
  </div>
  <div class="quiz-nav">
    <button class="btn-quiz btn-quiz-glass" onclick="prevQuestion()" ${index === 0 ? "disabled" : ""}><i class="fas fa-arrow-left"></i> Previous</button>
    <button class="btn-quiz btn-quiz-gold" id="quizNextBtn" onclick="nextQuestion()" disabled>${isLast ? 'See Results <i class="fas fa-trophy"></i>' : 'Next <i class="fas fa-arrow-right"></i>'}</button>
  </div>`;
  document.getElementById("quizArea").innerHTML = html;
  if (answered[index] !== undefined) revealAnswer(answered[index], index, false);
}

function selectOption(chosenIdx, qIdx) {
  if (answered[qIdx] !== undefined) return;
  answered[qIdx] = chosenIdx;
  if (chosenIdx === shuffledQuiz[qIdx].answer) score++;
  revealAnswer(chosenIdx, qIdx, true);
}

function revealAnswer(chosenIdx, qIdx, animate) {
  const q = shuffledQuiz[qIdx];
  document.querySelectorAll(".option").forEach((opt, i) => {
    opt.classList.add("disabled");
    if (i === q.answer) opt.classList.add("correct");
    else if (i === chosenIdx && chosenIdx !== q.answer) opt.classList.add("wrong");
  });
  const isCorrect = chosenIdx === q.answer;
  const reveal = document.getElementById("answerReveal");
  reveal.className = "answer-reveal show " + (isCorrect ? "is-correct" : "is-wrong");
  reveal.innerHTML = `<span class="reveal-icon">${isCorrect ? "✅" : "❌"}</span><strong>${isCorrect ? "Correct!" : "Incorrect."}</strong> ${q.explanation}`;
  const qnb = document.getElementById("quizNextBtn");
  if (qnb) qnb.disabled = false;
}

function nextQuestion() {
  if (answered[currentQ] === undefined) return;
  if (currentQ < shuffledQuiz.length - 1) { currentQ++; renderQuestion(currentQ); }
  else showResults();
}

function prevQuestion() {
  if (currentQ > 0) { currentQ--; renderQuestion(currentQ); }
}

function showResults() {
  document.getElementById("quizArea").style.display = "none";
  document.getElementById("progressFill").style.width = "100%";
  document.getElementById("quizScore").classList.add("show");
  const total = shuffledQuiz.length;
  document.getElementById("scoreNum").textContent = score + "/" + total;
  const pct = (score / total) * 100;
  const msgs = [[0,29,"Keep practising! Every great journey begins with a single step. 📖"],[30,49,"Good effort! You're building a solid foundation of knowledge. 💡"],[50,69,"Well done! You have impressive academic knowledge. 🌟"],[70,89,"Excellent! You are truly brilliant and well-read. 🔥"],[90,100,"Perfect! You are a Mannaplus scholar in the making! 🏆"]];
  const msg = msgs.find(m => pct >= m[0] && pct <= m[1]);
  document.getElementById("scoreMsg").textContent = msg ? msg[2] : "🌟 Great effort!";
}

function restartQuiz() {
  currentQ = 0; score = 0; answered = [];
  shuffledQuiz = shuffleArray(shuffledQuiz);
  document.getElementById("quizScore").classList.remove("show");
  document.getElementById("quizArea").style.display = "";
  document.getElementById("progressFill").style.width = "0%";
  renderQuestion(0);
}

// ===== HERO SLIDER =====
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.getElementById("heroSlides");
  const dotsContainer = document.getElementById("sliderDots");
  let current = 0;
  const total = document.querySelectorAll(".slide").length;
  for (let i = 0; i < total; i++) {
    const d = document.createElement("div");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.onclick = () => goTo(i);
    dotsContainer.appendChild(d);
  }
  function goTo(n) {
    current = n;
    slides.style.transform = `translateX(-${100 * current}%)`;
    document.querySelectorAll(".dot").forEach((d,i) => d.className = "dot" + (i === current ? " active" : ""));
  }
  document.getElementById("prevBtn").onclick = () => goTo((current - 1 + total) % total);
  document.getElementById("nextBtn").onclick = () => goTo((current + 1) % total);
  setInterval(() => goTo((current + 1) % total), 4500);
});

// ===== GALLERY AUTO-SCROLL =====
setInterval(() => {
  const gt = document.getElementById("galleryTrack");
  const slides = gt.querySelectorAll(".gallery-slide");
  if (!slides.length) return;
  const w = slides[0].offsetWidth + 16;
  const max = w * (slides.length - 3);
  let gPos = parseFloat(gt.dataset.pos) || 0;
  gPos = gPos + w >= max ? 0 : gPos + w;
  gt.style.transform = `translateX(-${gPos}px)`;
  gt.dataset.pos = gPos;
}, 3000);

// ===== NAVBAR SCROLL & ACTIVE LINK =====
window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar");
  if (window.scrollY > 60) navbar.classList.add("scrolled");
  else navbar.classList.remove("scrolled");
  const st = document.getElementById("scrollTop");
  if (window.scrollY > 300) st.classList.add("show");
  else st.classList.remove("show");
  const sections = document.querySelectorAll("section[id]");
  const navAs = document.querySelectorAll(".nav-links a");
  let cur = "";
  sections.forEach(s => { if (window.scrollY + 120 >= s.offsetTop) cur = s.getAttribute("id"); });
  navAs.forEach(a => {
    a.classList.remove("active");
    const href = a.getAttribute("href");
    if (href && href !== "#" && href === "#" + cur) {
      a.classList.add("active");
    }
  });
});

// ===== MOBILE MENU =====
document.getElementById("mobileBtn").onclick = function() {
  document.getElementById("navLinks").classList.toggle("open");
  this.querySelector("i").className = document.getElementById("navLinks").classList.contains("open") ? "fas fa-times" : "fas fa-bars";
};
document.querySelectorAll(".nav-links a").forEach(a => {
  a.onclick = () => {
    document.getElementById("navLinks").classList.remove("open");
    document.getElementById("mobileBtn").querySelector("i").className = "fas fa-bars";
  };
});

// ===== SCROLL REVEAL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// ===== SCROLL TOP BUTTON =====
document.getElementById("scrollTop").onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

// ===== CONTACT FORM =====
document.getElementById("contactForm").onsubmit = function(e) {
  e.preventDefault();
  const s = document.getElementById("formSuccess");
  s.style.display = "block";
  this.reset();
  setTimeout(() => s.style.display = "none", 5000);
};

// ===== INITIAL QUIZ LOAD =====
startNewQuiz();

// ========== FIX: Make gallery modal header sticky and content scrollable ==========
(function fixGalleryModalScroll() {
  // Add CSS to keep the close button and back button always visible
  const style = document.createElement('style');
  style.textContent = `
    /* Keep gallery modal header fixed at top */
    .gallery-modal .gallery-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;
      padding: 1rem 1.5rem 1.5rem;
    }
    .gallery-modal .gallery-header {
      flex-shrink: 0;
      position: sticky;
      top: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      z-index: 10;
      margin: -0.5rem -0.5rem 0.5rem -0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
    }
    .gallery-modal #galleryDynamicContent {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    /* Ensure back button is always visible at top of content */
    .gallery-modal #galleryDynamicContent .back-nav-btn {
      position: sticky;
      top: 0;
      z-index: 5;
      margin-bottom: 1rem;
    }
    /* For smaller screens, adjust padding */
    @media (max-width: 700px) {
      .gallery-modal .gallery-container {
        padding: 0.8rem;
      }
    }
  `;
  document.head.appendChild(style);
})();

// ========== GALLERY DATA ==========
const galleryImages = {
  cultural: [
    { url: "./cultural/proprietor.png", caption: "Proprietor's Attire" },
    { url: "./cultural/proprietress.png", caption: "Proprietress's Attire" },
    { url: "./cultural/cultural1.png", caption: "Student's Attire" },
    { url: "./cultural/cultural2.png", caption: "Cultural Attires" },
    { url: "./cultural/cultural3.png", caption: "Student's Attire" },
    { url: "./cultural/cultural4.png", caption: "Cultural Attires" }
  ],
  indomie: [
    { url: "https://picsum.photos/id/127/500/350", caption: "Indomie Factory Tour" },
    { url: "https://picsum.photos/id/129/500/350", caption: "Production Line" },
    { url: "https://picsum.photos/id/113/500/350", caption: "Students at Indomie" },
    { url: "https://picsum.photos/id/109/500/350", caption: "Packaging Section" },
    { url: "https://picsum.photos/id/70/500/350", caption: "Learning Process" }
  ],
  badagry: [
    { url: "./badagry/badagry.jpg", caption: "some shots taken " },
    { url: "./badagry/badagry1.jpg", caption: "some shots taken" },
    { url: "./badagry/badagry2.jpg", caption: "some shots taken" },
    { url: "./badagry/badagry3.jpg", caption: "some shots taken" },
    { url: "./badagry/badagry4.jpg", caption: "some shots taken" },
    { url: "./badagry/badagry5.jpg", caption: "some shots taken" },
    { url: "./badagry/badagry6.jpg", caption: "some shots taken" },
    { url: "./badagry/badagry7.jpg", caption: "some shots taken" },
    { url: "./badagry/badagry8.jpg", caption: "some shots taken" },
    { url: "./badagry/badagry9.jpg", caption: "some shots taken" },
    { url: "./badagry/badagry10.jpg", caption: "some shots taken" }
  ],
  obasanjo: [
    { url: "./obasanjo/obasanjo.jpg", caption: "Presidential Library" },
    { url: "./obasanjo/obasanjo1.jpg", caption: "Presidential Library" },
    { url: "./obasanjo/obasanjo2.jpg", caption: "Presidential Library" },
    { url: "./obasanjo/obasanjo3.jpg", caption: "Presidential Library" },
    { url: "./obasanjo/obasanjo4.jpg", caption: "Presidential Library" },
    { url: "./obasanjo/obasanjo5.jpg", caption: "Presidential Library" }
  ],
  abeokuta: [
    { url: "https://picsum.photos/id/96/500/350", caption: "Olumo Rock" },
    { url: "https://picsum.photos/id/190/500/350", caption: "Abeokuta City View" },
    { url: "https://picsum.photos/id/168/500/350", caption: "Historical Sites" }
  ],
  wildlife: [
    { url: "./wildlife/donkey.jpg", caption: "Donkey in Habitat" },
    { url: "./wildlife/horse.jpg ", caption: "Horses at Library" },
    { url: "./wildlife/hyena.jpg", caption: "Hyena in Habitat" },
    { url: "./wildlife/wildlife1.jpg", caption: "Students at Wildlife Section" },
    { url: "./wildlife/peacock.jpg", caption: "Bird Sanctuary" }
  ],
  career: [
    { url: "./career/career1.jpg", caption: "Career Day - Guest Speaker" },
    { url: "./career/career2.jpg", caption: "Students in Professional Attire" },
    { url: "./career/career3.jpg", caption: "Career Fair Booths" },
    { url: "./career/career4.jpg", caption: "Young Engineers Club" },
    { url: "./career/career5.jpg", caption: "Medical Career Talk" },
    { url: "./career/career6.jpg", caption: "Aviation & Technology Session" },
    { url: "./career/career7.jpg", caption: "Career Day - Guest Speaker" },
    { url: "./career/career8.jpg", caption: "Students in Professional Attire" },
    { url: "./career/career9.jpg", caption: "Career Fair Booths" },
    { url: "./career/career10.jpg", caption: "Young Engineers Club" },
    { url: "./career/career11.jpg", caption: "Medical Career Talk" },
    { url: "./career/career12.jpg", caption: "Aviation & Technology Session" },
    { url: "./career/career13.jpg", caption: "Career Day - Guest Speaker" },
    { url: "./career/career14.jpg", caption: "Students in Professional Attire" },
    { url: "./career/career15.jpg", caption: "Career Fair Booths" },
    { url: "./career/career16.jpg", caption: "Young Engineers Club" },
    { url: "./career/career17.jpg", caption: "Medical Career Talk" },
    { url: "./career/career18.jpg", caption: "Aviation & Technology Session" },
    { url: "./career/career19.jpg", caption: "Career Day - Guest Speaker" },
    { url: "./career/career20.jpg", caption: "Students in Professional Attire" },
    { url: "./career/career21.jpg", caption: "Aviation & Technology Session" }
  ],
  assembly: [
    { url: "https://picsum.photos/id/135/500/350", caption: "Morning Assembly" },
    { url: "https://picsum.photos/id/145/500/350", caption: "Student Presentation on Stage" },
    { url: "https://picsum.photos/id/146/500/350", caption: "Assembly Awards Ceremony" },
    { url: "https://picsum.photos/id/147/500/350", caption: "Pledge & National Anthem" },
    { url: "https://picsum.photos/id/155/500/350", caption: "Principal's Address" },
    { url: "https://picsum.photos/id/159/500/350", caption: "Creative Assembly Display" }
  ],
  studentCatalogues: [
    { url: "https://picsum.photos/id/169/500/350", caption: "Student Portfolio Cover" },
    { url: "https://picsum.photos/id/170/500/350", caption: "Art & Craft Catalogue" },
    { url: "https://picsum.photos/id/175/500/350", caption: "Science Project Showcase" },
    { url: "https://picsum.photos/id/176/500/350", caption: "Literary Magazine" },
    { url: "https://picsum.photos/id/180/500/350", caption: "Annual Student Directory" },
    { url: "https://picsum.photos/id/186/500/350", caption: "Achievements Record" }
  ]
};

let galleryState = { view: "main" };

// ========== RENDER GALLERY ==========
function renderGallery() {
  const container = document.getElementById("galleryDynamicContent");
  if (!container) return;

  if (galleryState.view === "main") {
    container.innerHTML = `
      <div class="gallery-category-grid">
        <div class="gallery-cat-card" data-cat="cultural"><i class="fas fa-globe-africa"></i><h3>Cultural Celebration</h3><p>Vibrant traditions & festivities</p></div>
        <div class="gallery-cat-card" data-cat="excursion"><i class="fas fa-bus"></i><h3>Excursion</h3><p>Educational tours & adventures</p></div>
        <div class="gallery-cat-card" data-cat="career"><i class="fas fa-briefcase"></i><h3>Career Day</h3><p>Inspiring future professionals</p></div>
        <div class="gallery-cat-card" data-cat="assembly"><i class="fas fa-chalkboard-user"></i><h3>Assembly Display</h3><p>Morning showcases & awards</p></div>
        <div class="gallery-cat-card" data-cat="studentcatalogues"><i class="fas fa-folder-open"></i><h3>Student Catalogues</h3><p>Portfolios & achievements</p></div>
      </div>
    `;
    document.querySelectorAll("[data-cat]").forEach(el => {
      el.addEventListener("click", () => {
        const cat = el.dataset.cat;
        if (cat === "excursion") showExcursionSub();
        else if (cat === "cultural") showCultural();
        else if (cat === "career") showCareer();
        else if (cat === "assembly") showAssembly();
        else if (cat === "studentcatalogues") showStudentCatalogues();
      });
    });
  } 
  else if (galleryState.view === "excursion_sub") {
    container.innerHTML = `
      <button class="back-nav-btn" id="backToMainBtn"><i class="fas fa-arrow-left"></i> Back to Categories</button>
      <h3 style="margin:0.5rem 0 1rem"><i class="fas fa-map-marked-alt"></i> Choose Excursion Destination</h3>
      <div class="subcat-list">
        <button class="subcat-btn" data-sub="indomie">🍜 Indomie Company</button>
        <button class="subcat-btn" data-sub="badagry">⛓️ Badagry Slave Trade</button>
        <button class="subcat-btn" data-sub="obasanjo">🏛️ Obasanjo Presidential Library</button>
        <button class="subcat-btn" data-sub="abeokuta">⛰️ Abeokuta City Tour</button>
        <button class="subcat-btn" data-sub="wildlife">🦒 Wildlife Section (OPL)</button>
      </div>
    `;
    document.querySelectorAll(".subcat-btn").forEach(btn => {
      btn.addEventListener("click", () => showSubGallery(btn.dataset.sub));
    });
    document.getElementById("backToMainBtn")?.addEventListener("click", () => {
      galleryState = { view: "main" };
      renderGallery();
    });
  } 
  else if (galleryState.view === "gallery") {
    let images = [], title = "";
    const sub = galleryState.sub;
    if (sub === "cultural") { images = galleryImages.cultural; title = "🎭 Cultural Celebration"; }
    else if (sub === "indomie") { images = galleryImages.indomie; title = "🍜 Excursion: Indomie Company"; }
    else if (sub === "badagry") { images = galleryImages.badagry; title = "⛓️ Excursion: Badagry Slave Trade"; }
    else if (sub === "obasanjo") { images = galleryImages.obasanjo; title = "🏛️ Obasanjo Presidential Library"; }
    else if (sub === "abeokuta") { images = galleryImages.abeokuta; title = "⛰️ Excursion: Abeokuta"; }
    else if (sub === "wildlife") { images = galleryImages.wildlife; title = "🦒 Wildlife Section (OPL)"; }
    else if (sub === "career") { images = galleryImages.career; title = "💼 Career Day Highlights"; }
    else if (sub === "assembly") { images = galleryImages.assembly; title = "🎤 Assembly Display Moments"; }
    else if (sub === "studentcatalogues") { images = galleryImages.studentCatalogues; title = "📚 Student Catalogues & Portfolios"; }

    let backLabel = (galleryState.previous === "excursion") ? "Back to Excursions" : "Back to Categories";
    let gridHtml = `
      <button class="back-nav-btn" id="backFromGalleryBtn"><i class="fas fa-arrow-left"></i> ${backLabel}</button>
      <h3>${title}</h3>
      <div class="image-grid">
    `;
    images.forEach(img => {
      gridHtml += `<div class="grid-img-card"><img src="${img.url}" alt="${img.caption}" loading="lazy"><div class="img-caption">${img.caption}</div></div>`;
    });
    gridHtml += `</div>`;
    container.innerHTML = gridHtml;

    // ----- ATTACH LIGHTBOX CLICK HANDLERS (Slider) -----
        // ----- ATTACH LIGHTBOX CLICK HANDLERS + 404 FALLBACK -----
    const imagesInGrid = container.querySelectorAll('.grid-img-card img');
    const allImageData = [];
    imagesInGrid.forEach(img => {
      const card = img.closest('.grid-img-card');
      const caption = card?.querySelector('.img-caption')?.textContent || '';
      allImageData.push({ src: img.src, caption: caption });
      
      // FALLBACK: if image fails to load, replace with placeholder
      img.onerror = function() {
        this.src = 'https://placehold.co/500x350/071f17/f59e0b?text=Image+Not+Found&font=Montserrat';
        this.alt = 'Image not available';
      };
    });
    imagesInGrid.forEach((img, idx) => {
      img.style.cursor = 'pointer';
      img.onclick = (e) => {
        e.stopPropagation();
        openLightbox(img.src, allImageData[idx].caption, allImageData, idx);
      };
    });
    // ----- END LIGHTBOX -----
    

    document.getElementById("backFromGalleryBtn")?.addEventListener("click", () => {
      if (galleryState.previous === "excursion") {
        galleryState = { view: "excursion_sub" };
        renderGallery();
      } else {
        galleryState = { view: "main" };
        renderGallery();
      }
    });

    // Scroll the dynamic content to top so the back button is visible
    setTimeout(() => {
      container.scrollTop = 0;
    }, 50);
  }
}

// ========== NAVIGATION FUNCTIONS ==========
function showCultural() {
  galleryState = { view: "gallery", sub: "cultural", previous: null };
  renderGallery();
}
function showExcursionSub() {
  galleryState = { view: "excursion_sub", previous: null };
  renderGallery();
}
function showSubGallery(sub) {
  galleryState = { view: "gallery", sub: sub, previous: "excursion" };
  renderGallery();
}
function showCareer() {
  galleryState = { view: "gallery", sub: "career", previous: null };
  renderGallery();
}
function showAssembly() {
  galleryState = { view: "gallery", sub: "assembly", previous: null };
  renderGallery();
}
function showStudentCatalogues() {
  galleryState = { view: "gallery", sub: "studentcatalogues", previous: null };
  renderGallery();
}

// ========== MODAL CONTROLS ==========
const galleryModalElem = document.getElementById("photoGalleryModal");
const galleryBtn = document.getElementById("galleryNavBtn");
const closeGalleryBtn = document.getElementById("closeGalleryBtn");

if (galleryBtn) {
  galleryBtn.addEventListener("click", (e) => {
    e.preventDefault();
    galleryState = { view: "main" };
    renderGallery();
    galleryModalElem.classList.add("active");
    document.body.style.overflow = "hidden";
  });
}
if (closeGalleryBtn) {
  closeGalleryBtn.addEventListener("click", () => {
    galleryModalElem.classList.remove("active");
    document.body.style.overflow = "";
  });
}
if (galleryModalElem) {
  galleryModalElem.addEventListener("click", (e) => {
    if (e.target === galleryModalElem) {
      galleryModalElem.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// ========== LIGHTBOX SLIDER (NEXT/PREV BUTTONS) ==========
let currentImageList = [];
let currentImageIndex = 0;

function openLightbox(imgSrc, caption, imageArray = null, index = 0) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  const cap = document.getElementById('lightboxCaption');
  if (!modal || !img) return;

  if (imageArray && Array.isArray(imageArray)) {
    currentImageList = imageArray;
    currentImageIndex = index;
  } else {
    currentImageList = [{ src: imgSrc, caption: caption || '' }];
    currentImageIndex = 0;
  }

  img.src = currentImageList[currentImageIndex].src;
  cap.textContent = currentImageList[currentImageIndex].caption || '';
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  if (prevBtn && nextBtn) {
    const hasMultiple = currentImageList.length > 1;
    prevBtn.style.display = hasMultiple ? 'flex' : 'none';
    nextBtn.style.display = hasMultiple ? 'flex' : 'none';
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
}

function nextImage() {
  if (currentImageList.length === 0) return;
  currentImageIndex = (currentImageIndex + 1) % currentImageList.length;
  const img = document.getElementById('lightboxImg');
  const cap = document.getElementById('lightboxCaption');
  if (img && cap) {
    img.src = currentImageList[currentImageIndex].src;
    cap.textContent = currentImageList[currentImageIndex].caption;
  }
}

function prevImage() {
  if (currentImageList.length === 0) return;
  currentImageIndex = (currentImageIndex - 1 + currentImageList.length) % currentImageList.length;
  const img = document.getElementById('lightboxImg');
  const cap = document.getElementById('lightboxCaption');
  if (img && cap) {
    img.src = currentImageList[currentImageIndex].src;
    cap.textContent = currentImageList[currentImageIndex].caption;
  }
}

// Attach event listeners for lightbox buttons
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('lightboxModal');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', prevImage);
  if (nextBtn) nextBtn.addEventListener('click', nextImage);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('show')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });
  // ========== GLOBAL IMAGE 404 FALLBACK (works for all images, including dynamically added ones) ==========
document.addEventListener('DOMContentLoaded', function() {
  // Handle existing images
  document.querySelectorAll('img').forEach(img => {
    img.onerror = function() {
      if (this.src.includes('placehold.co')) return; // avoid infinite loop
      this.src = 'https://placehold.co/600x400/071f17/f59e0b?text=Image+Not+Found&font=Montserrat';
      this.alt = 'Image not available';
    };
  });
  
  // Also handle images added later (like gallery images)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeName === 'IMG') {
          node.onerror = function() {
            if (this.src.includes('placehold.co')) return;
            this.src = 'https://placehold.co/600x400/071f17/f59e0b?text=Image+Not+Found&font=Montserrat';
            this.alt = 'Image not available';
          };
        } else if (node.querySelectorAll) {
          node.querySelectorAll('img').forEach(img => {
            img.onerror = function() {
              if (this.src.includes('placehold.co')) return;
              this.src = 'https://placehold.co/600x400/071f17/f59e0b?text=Image+Not+Found&font=Montserrat';
              this.alt = 'Image not available';
            };
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
});