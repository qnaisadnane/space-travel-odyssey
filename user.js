let userData = [];
fetch('data/user.json')
  .then(res => {
    if (!res.ok) throw new Error('Failed to load user data');
    return res.json();
  })
  .then(data => {
    userData = data;
    startLiveChecks();
  })
  .catch(err => console.error('Error fetching user data:', err));


const emailInput = document.getElementById('emailinput');
const passwordInput = document.getElementById('passwordinput');
const loginBtn = document.getElementById('loginbtn');
const form = document.querySelector('form');

let isEmailCorrect = false;
let isPasswordCorrect = false;

function LiveEventListener(el, fn) {
  el.addEventListener('input', fn);
}

function checkInput(input, correctValue, feedbackId, flag) {
  const feedback = document.getElementById(feedbackId);
  return () => {
    const typed = input.value.trim();
    const correct = typed === correctValue;

    if (flag === 'email') isEmailCorrect = correct;
    if (flag === 'password') isPasswordCorrect = correct;

    if (typed === '') {
      feedback.textContent = '';
      feedback.style.color = '';
    } else if (correct) {
      feedback.textContent = 'Correct';
      feedback.style.color = '#0a7d2aff';
    } else {
      feedback.textContent = 'Incorrect';
      feedback.style.color = '#941f07ff';
    }

    loginBtn.disabled = !(isEmailCorrect && isPasswordCorrect);
  };
}

// Après login réussi
const pending = sessionStorage.getItem('pendingBooking');
if (pending) {
  const booking = JSON.parse(pending);
  booking.isGuest = false;
  saveBooking(booking);
  sessionStorage.removeItem('pendingBooking');
  alert("Your pending booking has been saved!");
}

function startLiveChecks() {
  if (!userData.length) return;
  const { email: correctEmail, password: correctPassword } = userData[0];

  LiveEventListener(emailInput, checkInput(emailInput, correctEmail, 'email-feedback', 'email'));
  LiveEventListener(passwordInput, checkInput(passwordInput, correctPassword, 'password-feedback', 'password'));
}

form?.addEventListener('submit', e => {
  e.preventDefault();

  localStorage.setItem('loggedIn', 'true');
  localStorage.setItem('username', userData[0].username || 'Adnane');
  
  window.location.href = 'index.html';
});

window.initAuth = function () {
  if (window.location.pathname.includes('login.html')) return;

  const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
  const username = localStorage.getItem('username') || 'User';


  const usernameDisplay = document.getElementById('username-display');
  if (isLoggedIn && usernameDisplay) {
    usernameDisplay.textContent = username;
    usernameDisplay.classList.remove('hidden');
  }

  const desktopLoginLink = document.querySelector('nav .hidden.md\\:flex a[href="login.html"]');
  if (desktopLoginLink && isLoggedIn) {
    desktopLoginLink.outerHTML = `
      <div class="flex items-center space-x-4">
        <button id="logout-btn-desktop" class="text-neon-blue font-bold">Log out</button>
      </div>
    `;

    document.getElementById('logout-btn-desktop')?.addEventListener('click', logout);
  }

  const mobileLoginLink = document.querySelector('#mobile-menu a[href="login.html"]');
  if (mobileLoginLink && isLoggedIn) {
    mobileLoginLink.outerHTML = `
      <div class="flex items-center justify-between py-2 border-b border-neon-blue/20">
        <button id="logout-btn-mobile" class="text-neon-blue font-bold">Log out</button>
      </div>
    `;

    document.getElementById('logout-btn-mobile')?.addEventListener('click', logout);
  }

  function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
  }

  if (!isLoggedIn && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
  }
};