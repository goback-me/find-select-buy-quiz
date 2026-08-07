const QUESTIONS = [
  {
    text: 'Are you an Australian Citizen or Permanent Resident?',
    options: [
      { label: 'Australian Citizen' },
      { label: 'Permanent Resident' },
      { label: 'Visa', disqualifies: true },
    ],
  },
  {
    text: 'What is your employment status?',
    options: [
      { label: 'Full-Time' },
      { label: 'Centrelink', disqualifies: true },
      { label: 'Self-Employed', disqualifies: true },
      { label: 'Casual' },
    ],
  },
  {
    text: 'What is your annual household income?',
    options: [
      { label: 'Under $60,000', disqualifies: true },
      { label: '$60,000–$100,000' },
      { label: '$100,000–$150,000' },
      { label: '$150,000+' },
    ],
  },
  {
    text: 'Approximately how much deposit have you saved?',
    options: [
      { label: 'Under $5,000', disqualifies: true },
      { label: '$5,000–$10,000' },
      { label: '$10,000–$25,000' },
      { label: '$25,000+' },
    ],
  },
  {
    text: 'Are you currently...',
    options: [
      { label: 'Renting' },
      { label: 'Living with family' },
      { label: 'Own a home', disqualifies: true },
      { label: 'Other', disqualifies: true },
    ],
  },
  {
    text: 'When are you looking to buy?',
    options: [
      { label: 'ASAP' },
      { label: 'Within 3 Months' },
      { label: 'Just Researching' },
    ],
  },
  {
    text: 'Are you a First Home Buyer?',
    options: [
      { label: 'Yes' },
      { label: 'No', disqualifies: true },
    ],
  },
];

const TOTAL_STEPS = QUESTIONS.length + 1; // + contact step
const STORAGE_KEY = 'eligibilityQuizSubmitted';
const BOOKING_URL = 'https://findselectbuy.findlocal.au/booking-page';
// ponytail: capture whatever tracking params the ad platform appended (lead_source, campaign, utm_*, ...) instead of hardcoding a key list.
const trackingParams = Object.fromEntries(new URLSearchParams(location.search));

// ponytail: pure function kept separate from render() so it stays testable without a DOM.
function isDisqualifying(questionIndex, optionIndex) {
  return !!QUESTIONS[questionIndex].options[optionIndex].disqualifies;
}

const state = {
  screen: 'question', // question | disqualified | contact | submitting | error | already
  step: 0,
  answers: [],
  disqualified: false,
};

const card = document.getElementById('card');

function progressBar(currentStep) {
  const pct = Math.min(100, Math.round((currentStep / TOTAL_STEPS) * 100));
  return `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>`;
}

function render() {
  renderScreen();
  reportHeight();
}

// ponytail: posts height to the parent frame so embed.js can resize the iframe; no-op outside an iframe.
function reportHeight() {
  if (window.parent === window) return;
  window.parent.postMessage(
    { source: 'eligibility-quiz', height: document.documentElement.scrollHeight },
    '*'
  );
}

// ponytail: keeps the same tracking params flowing to the booking page for attribution there too.
function redirectToBooking() {
  const url = BOOKING_URL + location.search;
  if (window.parent === window) {
    window.location.href = url;
    return;
  }
  window.parent.postMessage({ source: 'eligibility-quiz', redirect: url }, '*');
}

function renderScreen() {
  if (state.screen === 'already') {
    card.innerHTML = `
      <p class="eyebrow">Eligibility Check</p>
      <h1>You've already completed this quiz</h1>
      <p class="result-message">Looks like you've already submitted your answers from this device. If your circumstances have changed or you need to update your details, just email us directly and we'll take care of it.</p>
    `;
    return;
  }

  if (state.screen === 'disqualified') {
    card.innerHTML = `
      <p class="eyebrow">Eligibility Check</p>
      <div class="result-icon">👋</div>
      <h1>Thanks for sharing that</h1>
      <p class="result-message">Based on your answers, this particular pathway isn't the right fit right now. If your circumstances change, feel free to check back.</p>
    `;
    return;
  }

  if (state.screen === 'question') {
    const q = QUESTIONS[state.step];
    card.innerHTML = `
      <p class="eyebrow">${state.step === 0 ? 'Start Here' : `Question ${state.step + 1} of ${QUESTIONS.length}`}</p>
      <h1>Check your eligibility</h1>
      ${progressBar(state.step)}
      <p class="question">${q.text}</p>
      <div class="options">
        ${q.options.map((o, i) => `
          <button class="option" data-index="${i}">
            <span class="radio"></span>${o.label}
          </button>
        `).join('')}
      </div>
      ${state.step === 0 ? `
        <div class="trust">
          <span>✓ Takes 60 seconds</span>
          <span>✓ Free</span>
          <span>✓ No obligation</span>
        </div>` : ''}
    `;
    card.querySelectorAll('.option').forEach((btn) => {
      btn.addEventListener('click', () => selectOption(Number(btn.dataset.index)));
    });
    return;
  }

  if (state.screen === 'contact') {
    card.innerHTML = `
      <p class="eyebrow">Almost done</p>
      <h1>Where should we send your results?</h1>
      ${progressBar(QUESTIONS.length + 1)}
      <div class="field">
        <label for="name">Full name</label>
        <input id="name" type="text" autocomplete="name" />
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" type="email" autocomplete="email" />
      </div>
      <div class="field">
        <label for="phone">Phone</label>
        <input id="phone" type="tel" autocomplete="tel" />
      </div>
      <p class="error" id="contact-error">Please enter your name and a valid email.</p>
      <button class="btn" id="submit-btn">Submit</button>
    `;
    document.getElementById('submit-btn').addEventListener('click', submitForm);
    return;
  }

  if (state.screen === 'submitting') {
    card.innerHTML = `<p class="eyebrow">Eligibility Check</p><h1>Submitting your details...</h1>`;
    return;
  }

  if (state.screen === 'done') {
    card.innerHTML = `
      <p class="eyebrow">All set</p>
      <div class="result-icon">✅</div>
      <h1>Thanks, that's everything!</h1>
      <p class="result-message">We've received your details and someone from our team will be in touch shortly.</p>
    `;
    return;
  }

  if (state.screen === 'error') {
    card.innerHTML = `
      <p class="eyebrow">Something went wrong</p>
      <h1>We couldn't submit your details</h1>
      <p class="result-message">Please check your connection and try again.</p>
      <button class="btn" id="retry-btn">Try again</button>
    `;
    document.getElementById('retry-btn').addEventListener('click', () => {
      state.screen = 'contact';
      render();
    });
  }
}

function selectOption(index) {
  const q = QUESTIONS[state.step];
  state.answers.push({ question: q.text, answer: q.options[index].label });

  if (isDisqualifying(state.step, index)) {
    state.disqualified = true;
    state.screen = 'disqualified';
    // ponytail: persist immediately so a refresh can't be used to re-answer into qualifying.
    localStorage.setItem(STORAGE_KEY, 'disqualified');
    render();
    return;
  }

  if (state.step + 1 < QUESTIONS.length) {
    state.step += 1;
    render();
  } else {
    state.screen = 'contact';
    render();
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function submitForm() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const errorEl = document.getElementById('contact-error');

  if (!name || !isValidEmail(email)) {
    errorEl.classList.add('show');
    return;
  }
  errorEl.classList.remove('show');

  state.screen = 'submitting';
  render();

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        qualified: !state.disqualified,
        answers: state.answers,
        tracking: trackingParams,
      }),
    });
    if (!res.ok) throw new Error('submit failed');
    localStorage.setItem(STORAGE_KEY, 'submitted');
    redirectToBooking();
  } catch (err) {
    state.screen = 'error';
    render();
  }
}

const savedStatus = localStorage.getItem(STORAGE_KEY);
if (savedStatus === 'disqualified') {
  state.disqualified = true;
  state.screen = 'disqualified';
} else if (savedStatus) {
  // legacy '1' flag or 'submitted' — quiz was already completed
  state.screen = 'already';
}
render();
// ponytail: keeps the iframe height synced through orientation changes / mobile keyboard show-hide, not just screen transitions.
window.addEventListener('resize', reportHeight);

// ponytail: minimal self-check for the disqualify logic; run manually via ?test=1, not on every load.
if (new URLSearchParams(location.search).has('test')) {
  console.assert(isDisqualifying(0, 2) === true, 'Visa should disqualify');
  console.assert(isDisqualifying(0, 0) === false, 'Australian Citizen should not disqualify');
  console.assert(isDisqualifying(1, 1) === true, 'Centrelink should disqualify');
  console.assert(isDisqualifying(1, 2) === true, 'Self-Employed should disqualify');
  console.assert(isDisqualifying(5, 0) === false, 'ASAP should not disqualify');
  console.assert(isDisqualifying(6, 1) === true, 'No (first home buyer) should disqualify');
  console.log('quiz self-check done');
}
