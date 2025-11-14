// === STARS ANIMATION ===
function createStars() {
  const container = document.getElementById('stars-container');
  for (let i = 0; i < 150; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    container.appendChild(star);
  }
}

// === DATA ===
let destinations = [], accommodations = [];

// === DOM ELEMENTS ===
const destinationSelect = document.getElementById('destination');
const accommodationSection = document.getElementById('accommodationSection');
const accommodationOptions = document.getElementById('accommodationOptions');
const conditionalFields = document.getElementById('conditionalFields');
const passengersContainer = document.getElementById('passengersContainer');
const addPassengerBtn = document.getElementById('addPassenger');
const bookingForm = document.getElementById('bookingForm');
const priceSummary = document.getElementById('priceSummary');
const submitBtn = document.getElementById('confbooking');

// === UTILS ===
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function saveBooking(data) {
  const bookings = JSON.parse(localStorage.getItem('spaceBookings') || '[]');
  bookings.push(data);
  localStorage.setItem('spaceBookings', JSON.stringify(bookings));
}

// === PASSENGER FORM ===
function createPassengerForm(index) {
  const div = document.createElement('div');
  div.className = 'passenger-card content-card p-6 space-y-4';
  div.innerHTML = `
    <div class="flex justify-between items-center">
      <h3 class="font-semibold text-lg">Passenger ${index}</h3>
      ${index > 1 ? '<button type="button" class="remove-passenger text-red-400 text-sm hover:underline">Remove</button>' : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="relative">
        <label class="block text-gray-300 mb-2">First Name</label>
        <input type="text" data-field="firstName" placeholder="Enter first name" class="form-input w-full px-4 py-3" required />
        <p class="feedback text-xs mt-1 hidden"></p>
      </div>
      <div class="relative">
        <label class="block text-gray-300 mb-2">Last Name</label>
        <input type="text" data-field="lastName" placeholder="Enter last name" class="form-input w-full px-4 py-3" required />
        <p class="feedback text-xs mt-1 hidden"></p>
      </div>
      <div class="relative">
        <label class="block text-gray-300 mb-2">Email Address</label>
        <input type="email" data-field="email" placeholder="Enter email" class="form-input w-full px-4 py-3" required />
        <p class="feedback text-xs mt-1 hidden"></p>
      </div>
      <div class="relative">
        <label class="block text-gray-300 mb-2">Phone Number</label>
        <input type="tel" data-field="phone" placeholder="Enter phone" class="form-input w-full px-4 py-3" />
        <p class="feedback text-xs mt-1 hidden"></p>
      </div>
    </div>
  `;

  const removeBtn = div.querySelector('.remove-passenger');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      div.remove();
      updatePassengerLabels();
      updateSubmitButtonLive();
      updatePriceSummary();
    });
  }

  return div;
}

function addPassenger() {
  const count = passengersContainer.children.length + 1;
  const form = createPassengerForm(count);
  passengersContainer.appendChild(form);
  updatePassengerLabels();
  updatePriceSummary();
  updateSubmitButtonLive();
}

function updatePassengerLabels() {
  Array.from(passengersContainer.children).forEach((el, i) => {
    el.querySelector('h3').textContent = `Passenger ${i + 1}`;
  });
}

// === PASSENGER RADIO ===
function handlePassengerChange() {
  const radio = document.querySelector('input[name="passengers"]:checked');
  if (!radio) return;

  const targetCount = radio.value === "3-6" ? 3 : parseInt(radio.value);
  const currentCount = passengersContainer.children.length;

  while (currentCount < targetCount) addPassenger();
  while (currentCount > targetCount) passengersContainer.lastChild?.remove();

  updatePassengerLabels();
  updatePriceSummary();
  updateSubmitButtonLive();
}

// === DESTINATION & ACCOMMODATION ===
function populateDestinations() {
  destinationSelect.innerHTML = '<option value="">Select a destination</option>';
  destinations.forEach(dest => {
    const opt = new Option(`${dest.name} - ${formatPrice(dest.price)} - ${dest.travelDuration}`, dest.id);
    destinationSelect.appendChild(opt);
  });
}

function updateAccommodations(dest) {
  accommodationOptions.innerHTML = '';
  const available = accommodations.filter(acc => acc.availableOn.includes(dest.id));

  if (available.length === 0) {
    accommodationSection.classList.add('hidden');
    return;
  }

  available.forEach((acc, i) => {
    const card = document.createElement('div');
    card.className = `accommodation-card content-card p-4 text-center cursor-pointer transition-all ${i === 0 ? 'border-2 border-neon-blue' : 'border border-neon-blue/30'}`;
    card.innerHTML = `
      <input type="radio" name="accommodation" value="${acc.id}" class="hidden" ${i === 0 ? 'checked' : ''}>
      <h4 class="font-bold capitalize mb-2 text-cyan-400">${acc.name}</h4>
      <p class="text-xs text-gray-400 mb-2">${acc.shortDescription || acc.description}</p>
      <div class="text-sm text-cyan-300 mt-2">${formatPrice(acc.pricePerDay)}/day</div>
    `;

    card.addEventListener('click', () => {
      accommodationOptions.querySelectorAll('.accommodation-card').forEach(c => {
        c.classList.remove('border-2', 'border-neon-blue');
        c.classList.add('border', 'border-neon-blue/30');
      });
      card.classList.remove('border', 'border-neon-blue/30');
      card.classList.add('border-2', 'border-neon-blue');
      card.querySelector('input').checked = true;
      updatePriceSummary();
      updateSubmitButtonLive();
    });

    accommodationOptions.appendChild(card);
  });

  accommodationSection.classList.remove('hidden');
  setTimeout(() => {
    const first = accommodationOptions.querySelector('.accommodation-card');
    if (first) first.click();
  }, 0);
}

function updateConditionalFields(dest) {
  conditionalFields.innerHTML = '';
  if (['europa', 'titan'].includes(dest.id)) {
    const field = document.createElement('div');
    field.className = 'mb-6';
    field.innerHTML = `
      <label class="flex items-center space-x-2">
        <input type="checkbox" class="form-input insurance-checkbox" checked>
        <span class="text-gray-300">Enhanced radiation protection insurance (+$10,000)</span>
      </label>
    `;
    field.querySelector('.insurance-checkbox').addEventListener('change', updatePriceSummary);
    conditionalFields.appendChild(field);
  }
}

// === PRICE ===
function updatePriceSummary() {
  if (!priceSummary) return;

  const destination = destinations.find(d => d.id === destinationSelect.value);
  const accInput = document.querySelector('input[name="accommodation"]:checked');
  const passengerRadio = document.querySelector('input[name="passengers"]:checked');

  if (!destination || !passengerRadio || !accInput) {
    priceSummary.classList.add('hidden');
    return;
  }

  const passengerCount = passengerRadio.value === "3-6" ? 3 : parseInt(passengerRadio.value);
  const acc = accommodations.find(a => a.id === accInput.value);
  if (!acc) return;

  const days = destination.travelDuration.match(/(\d+)/)?.[1] ? parseInt(destination.travelDuration.match(/(\d+)/)[1]) : 1;
  const travelPrice = destination.price * 2;
  const stayPrice = acc.pricePerDay * days;
  const totalPerPerson = travelPrice + stayPrice;
  const baseTotal = totalPerPerson * passengerCount;

  const insurance = document.querySelector('.insurance-checkbox');
  const extra = insurance?.checked ? 10000 : 0;
  const totalPrice = baseTotal + extra;

  priceSummary.innerHTML = `
    <div class="bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-xl p-6 text-center border border-neon-blue/50">
      <h3 class="font-orbitron text-2xl text-glow text-cyan-300 mb-2">Total Price</h3>
      <p class="text-4xl font-bold text-white tracking-wider">${formatPrice(totalPrice)}</p>
      <p class="text-sm text-gray-300 mt-2">
        ${passengerCount} passenger${passengerCount > 1 ? 's' : ''} × ${formatPrice(totalPerPerson)}/person
        ${extra > 0 ? `<span class="text-yellow-400">+ $10,000 insurance</span>` : ''}
      </p>
    </div>
  `;
  priceSummary.classList.remove('hidden');
}

// === VALIDATION LIVE ===
function showFeedback(el, msg, type) {
  el.textContent = msg;
  el.className = `feedback show ${type === 'red' ? 'red' : 'green'}`;
}

function hideFeedback(el) {
  el.classList.remove('show');
  el.textContent = '';
}

function getRequiredMessage(field) {
  const map = { firstName: "First name is required", lastName: "Last name is required", email: "Email is required" };
  return map[field] || `${field} is required`;
}

function isValidName(name) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,}$/.test(name);
}

function validateFieldLive(input) {
  const value = input.value.trim();
  const field = input.dataset.field;
  const feedback = input.parentElement.querySelector('.feedback');

  if (!value && input.hasAttribute('required')) {
    showFeedback(feedback, getRequiredMessage(field), 'red');
    return false;
  }

  if (['firstName', 'lastName'].includes(field) && value) {
    if (isValidName(value)) {
      showFeedback(feedback, 'Looks good', 'green');
      return true;
    } else {
      showFeedback(feedback, 'Looks bad', 'red');
      return false;
    }
  }

  if (field === 'email' && value) {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    showFeedback(feedback, isValid ? 'Valid email' : 'Invalid email format', isValid ? 'green' : 'red');
    return isValid;
  }

  if (field === 'phone' && value) {
    if (!/^\+?[\d\s\-\(\)]{10}$/.test(value)) {
      showFeedback(feedback, 'Invalid phone format', 'red');
      return false;
    }
  }

  if (value) {
    showFeedback(feedback, 'Looks good', 'green');
    return true;
  }

  hideFeedback(feedback);
  return true;
}

function validateDepartureDate() {
  const input = document.getElementById('departureDate');
  const date = new Date(input.value);
  const today = new Date(); today.setHours(0,0,0,0);
  const max = new Date(today); max.setDate(today.getDate() + 30);

  const error = document.getElementById('departureDateError') || createErrorElement(input);

  if (!input.value) { showInlineError(error, "Please select a departure date"); return false; }
  if (date < today) { showInlineError(error, "Date must be in the future"); return false; }
  if (date > max) { showInlineError(error, "Booking max 30 days in advance"); return false; }
  clearInlineError(error);
  return true;
}

function createErrorElement(input) {
  const error = document.createElement('p');
  error.id = 'departureDateError';
  error.className = 'error-message text-xs mt-1 hidden';
  input.parentElement.appendChild(error);
  return error;
}

function showInlineError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('show');
  el.style.display = 'block';
}

function clearInlineError(el) {
  el.classList.add('hidden');
  el.classList.remove('show');
  el.style.display = 'none';
  el.textContent = '';
}

function updateSubmitButtonLive() {
  const hasErrors = document.querySelectorAll('.feedback.red.show').length > 0;
  const requiredFilled = 
    destinationSelect.value &&
    document.getElementById('departureDate').value &&
    document.querySelector('input[name="passengers"]:checked') &&
    (!accommodationSection.classList.contains('hidden') ? document.querySelector('input[name="accommodation"]:checked') : true);

  submitBtn.disabled = hasErrors || !requiredFilled;
}

// === SUBMIT (UNIQUE) ===
bookingForm.addEventListener("submit", function (e) {
  e.preventDefault();

  let allValid = true;

  // Validation
  passengersContainer.querySelectorAll('input[data-field]').forEach(input => {
    if (!validateFieldLive(input)) allValid = false;
  });

  if (!validateDepartureDate()) allValid = false;
  if (!destinationSelect.value) { alert("Please select a destination."); allValid = false; }
  if (!accommodationSection.classList.contains('hidden') && !document.querySelector('input[name="accommodation"]:checked')) {
    alert("Please select an accommodation."); allValid = false;
  }

  if (!allValid) {
    alert("Please fill in all required fields correctly.");
    return;
  }

  // === CALCUL DU PRIX FINAL ===
  const destination = destinations.find(d => d.id === destinationSelect.value);
  const accInput = document.querySelector('input[name="accommodation"]:checked');
  const accommodation = accommodations.find(a => a.id === accInput.value);
  const passengerRadio = document.querySelector('input[name="passengers"]:checked');
  const passengerCount = passengerRadio.value === "3-6" ? 3 : parseInt(passengerRadio.value);

  const days = destination.travelDuration.match(/(\d+)/)?.[1] ? parseInt(destination.travelDuration.match(/(\d+)/)[1]) : 1;
  const travelPrice = destination.price * 2;
  const stayPrice = accommodation.pricePerDay * days;
  const totalPerPerson = travelPrice + stayPrice;
  const baseTotal = totalPerPerson * passengerCount;

  const insurance = document.querySelector('.insurance-checkbox');
  const extra = insurance?.checked ? 10000 : 0;
  const finalTotal = baseTotal + extra;

  // === SAUVEGARDE ===
  const bookingData = {
    id: generateUUID(),
    destination: destination,
    accommodation: accommodation,
    passengers: Array.from(passengersContainer.children).map(card => ({
      firstName: card.querySelector('input[data-field="firstName"]').value.trim(),
      lastName: card.querySelector('input[data-field="lastName"]').value.trim(),
      email: card.querySelector('input[data-field="email"]').value.trim(),
      phone: card.querySelector('input[data-field="phone"]').value.trim(),
    })),
    departureDate: document.getElementById("departureDate").value,
    totalPassengers: passengerCount,
    insurance: !!insurance?.checked,
    totalPrice: finalTotal,
    createdAt: new Date().toISOString()
  };

  saveBooking(bookingData);

  window.location.href = "mybooking.html";
});

// === INIT ===
async function loadData() {
  try {
    const [destRes, accRes] = await Promise.all([
      fetch('/data/destinations.json'),
      fetch('/data/accomandations.json')
    ]);

    if (!destRes.ok || !accRes.ok) throw new Error('Failed to load data');

    const destData = await destRes.json();
    const accData = await accRes.json();

    destinations = destData.destinations || [];
    accommodations = accData.accommodations || [];

    initForm();
  } catch (err) {
    console.error("Error:", err);
    alert("Unable to load data.");
  }
}

function initForm() {
  populateDestinations();
  addPassenger();

  destinationSelect.addEventListener('change', () => {
    const dest = destinations.find(d => d.id === destinationSelect.value);
    accommodationSection.classList.add('hidden');
    conditionalFields.innerHTML = '';
    if (dest) {
      updateAccommodations(dest);
      updateConditionalFields(dest);
      handlePassengerChange();
    }
    updatePriceSummary();
    updateSubmitButtonLive();
  });

  document.querySelectorAll('input[name="passengers"]').forEach(radio => {
    radio.addEventListener('change', () => {
      handlePassengerChange();
      updatePriceSummary();
      updateSubmitButtonLive();
    });
  });

  addPassengerBtn.addEventListener('click', () => {
    addPassenger();
    updatePriceSummary();
    updateSubmitButtonLive();
  });

  document.addEventListener('input', e => {
    if (e.target.matches('input[data-field]')) {
      validateFieldLive(e.target);
      updateSubmitButtonLive();
    }
  });

  document.addEventListener('change', e => {
    if (e.target.matches('#departureDate')) {
      validateDepartureDate();
      updateSubmitButtonLive();
    }
    if (e.target.matches('input[name="accommodation"]')) {
      updatePriceSummary();
      updateSubmitButtonLive();
    }
  });
}

// === START ===
document.addEventListener('DOMContentLoaded', () => {
  createStars();
  loadData();

  const pending = sessionStorage.getItem('pendingBooking');
  if (pending && confirm("You have a pending booking. Restore it?")) {
    sessionStorage.removeItem('pendingBooking');
  }
});