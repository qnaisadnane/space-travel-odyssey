function createStars() {
  const container = document.getElementById('stars-container');
  const starCount = 150;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.classList.add('star');

    const size = Math.random() * 2 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;

    star.style.animationDelay = `${Math.random() * 5}s`;

    container.appendChild(star);
  }
}

let destinations = [];
let accommodations = [];
let passengerOptions = [];
let departureLocations = [];

async function loadData() {
  try {
    // Load destinations
    const destinationsResponse = await fetch('/data/destinations.json');
    if (!destinationsResponse.ok) throw new Error('Failed to load destinations');
    const destinationsData = await destinationsResponse.json();

    // Load accommodations
    const accommodationsResponse = await fetch('/data/accomandations.json');
    if (!accommodationsResponse.ok) throw new Error('Failed to load accommodations');
    const accommodationsData = await accommodationsResponse.json();

    // Load booking options (packages + departure locations)
    const bookingOptionsResponse = await fetch('/data/booking-options.json');
    if (!bookingOptionsResponse.ok) throw new Error('Failed to load booking options');
    const bookingOptionsData = await bookingOptionsResponse.json();

    // Assign data
    destinations = destinationsData.destinations || [];
    accommodations = accommodationsData.accommodations || [];
    passengerOptions = bookingOptionsData.passengerOptions || [];
    departureLocations = bookingOptionsData.departureLocations || [];

    console.log("Data loaded successfully");
    initForm();
    updatePriceSummary();
  } catch (err) {
    console.error("Error loading data:", err);
    alert("Unable to load booking data. Please check if the JSON files are available and the server is running.");
  }
}

// === DOM ELEMENTS ===
const destinationSelect = document.getElementById('destination');
const packageOptions = document.getElementById('packageOptions') || document.createElement('div'); // fallback
const accommodationSection = document.getElementById('accommodationSection');
const accommodationOptions = document.getElementById('accommodationOptions');
const conditionalFields = document.getElementById('conditionalFields');
const passengersContainer = document.getElementById('passengersContainer');
const addPassengerBtn = document.getElementById('addPassenger');
const bookingForm = document.getElementById('bookingForm');
const departureLocationSelect = document.getElementById('departureLocation');
const priceSummary = document.getElementById('priceSummary') || document.createElement('div');

// === INITIALIZATION ===
function initForm() {
  populateDestinations();
  populateDepartureLocations();

  // Initialiser avec 1 passager (Solo par défaut)
  addPassenger();

  // === ÉCOUTEURS D'ÉVÉNEMENTS ===
  
  // 1. Changement de destination
  destinationSelect.addEventListener('change', () => {
    handleDestinationChange();
    updatePriceSummary();
  });

  // 2. Changement du nombre de passagers (radios)
  document.querySelectorAll('input[name="passengers"]').forEach(radio => {
    radio.addEventListener('change', () => {
      handlePassengerChange();
      updatePriceSummary();
    });
  });

  // 3. Bouton "Add Passenger" (au cas où)
  addPassengerBtn.addEventListener('click', () => {
    addPassenger();
    updatePriceSummary();
  });

  // 4. Soumission du formulaire
  bookingForm.addEventListener('submit', handleSubmit);

  // === INITIALISATION FINALE ===
  // Forcer le rafraîchissement du prix au démarrage (au cas où)
  setTimeout(() => {
    updatePriceSummary();
  }, 100);
  // Dans initForm(), après les autres listeners
accommodationOptions.addEventListener('click', updatePriceSummary);
}

// Populate destinations
function populateDestinations() {
  destinationSelect.innerHTML = '<option value="">Select a destination</option>';

  destinations.forEach(dest => {
    const option = new Option(
      `${dest.name} - ${formatPrice(dest.price)} - ${dest.travelDuration}`,
      dest.id
    );
    destinationSelect.appendChild(option);
  });
}

// Populate departure locations
function populateDepartureLocations() {
  if (!departureLocationSelect) return;

  departureLocationSelect.innerHTML = '';

  departureLocations.forEach(location => {
    const option = new Option(
      `${location.name} (${location.location})`,
      location.id
    );
    departureLocationSelect.appendChild(option);
  });
}

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(price);
}

// === PASSENGER FORM ===
function createPassengerForm(index) {
  const div = document.createElement('div');
  div.className = 'passenger-card content-card p-6 space-y-4';
  div.innerHTML = `
    <div class="flex justify-between items-center">
     
      ${index > 1 ? '<button type="button" class="remove-passenger text-red-400 text-sm hover:underline">Remove</button>' : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-gray-300 mb-2">First Name</label>
        <input type="text" placeholder="Enter your first name" class="form-input w-full px-4 py-3"/>
      </div>
      <div>
        <label class="block text-gray-300 mb-2">Last Name</label>
        <input type="text" placeholder="Enter your last name" class="form-input w-full px-4 py-3"/>
      </div>
      <div>
        <label class="block text-gray-300 mb-2">Email Address</label>
        <input type="email" placeholder="Enter your email" class="form-input w-full px-4 py-3"/>
      </div>
      <div>
        <label class="block text-gray-300 mb-2">Phone Number</label>
        <input type="tel" placeholder="Enter your phone number" class="form-input w-full px-4 py-3" />
      </div>
    </div>
  `;

  // Add remove handler
  const removeBtn = div.querySelector('.remove-passenger');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      div.remove();
      updatePassengerLabels();
      updatePassengerCount();
      updatePriceSummary();
    });
  }

  return div;
}

function addPassenger() {
  const count = passengersContainer.children.length + 1;
  const form = createPassengerForm(count);
  passengersContainer.appendChild(form);
  updatePassengerCount();
  updatePriceSummary();
}

function updatePassengerLabels() {
  Array.from(passengersContainer.children).forEach((el, i) => {
    el.querySelector('h3').textContent = `Passenger ${i + 1}`;
  });
}

function updatePassengerCount() {
  const passengerCount = passengersContainer.children.length;
  // Used in validation and price
}

// === DYNAMIC LOGIC: DESTINATION CHANGE ===
function handleDestinationChange() {
  const dest = destinations.find(d => d.id === destinationSelect.value);
  packageOptions.innerHTML = '';
  accommodationSection.classList.add('hidden');
  conditionalFields.innerHTML = '';
  updatePriceSummary();

  if (!dest) return;

  // Show passenger package options
  renderPackageOptions(dest);
  updateAccommodations(dest);
  updateConditionalFields(dest);

  // Auto-select first package
  setTimeout(() => {
  const firstCard = packageOptions.querySelector('.package-card');
  if (firstCard) {
    // Simule un clic complet
    const radio = firstCard.querySelector('input[name="package"]');
    updatePriceSummary(); // Appelle ici
  }
}, 0);
}

// === ACCOMMODATIONS ===
function updateAccommodations(dest) {
  accommodationOptions.innerHTML = '';
  const available = accommodations.filter(acc => acc.availableOn.includes(dest.id));

  if (available.length === 0) {
    accommodationSection.classList.add('hidden');
    updatePriceSummary();
    return;
  }

  available.forEach((acc, i) => {
    const card = document.createElement('div');
    card.className = `accommodation-card content-card p-4 text-center cursor-pointer transition-all ${
      i === 0 ? 'border-2 border-neon-blue' : 'border border-neon-blue/30'
    }`;
    card.innerHTML = `
      <input type="radio" name="accommodation" value="${acc.id}" class="hidden" ${i === 0 ? 'checked' : ''}>
      <h4 class="font-bold capitalize mb-2 text-cyan-400">${acc.name}</h4>
      <p class="text-xs text-gray-400 mb-2">${acc.shortDescription || acc.description}</p>
      <div class="text-sm text-cyan-300 mt-2">
        ${formatPrice(acc.pricePerDay)}/day
      </div>
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
    });

    accommodationOptions.appendChild(card);
  });

  // AFFICHE LA SECTION
  accommodationSection.classList.remove('hidden');

  // Auto-sélectionne le premier
  setTimeout(() => {
    const firstCard = accommodationOptions.querySelector('.accommodation-card');
    if (firstCard) firstCard.click();
  }, 0);
}

// === CONDITIONAL FIELDS ===
function updateConditionalFields(dest) {
  conditionalFields.innerHTML = '';

  // Moon: Spacesuit size
  if (dest.id === 'moon' && (dest.activities || []).includes('Spacewalk experience')) {
    const field = document.createElement('div');
    field.className = 'mb-6';
    field.innerHTML = `
    `;
    conditionalFields.appendChild(field);
  }


  // Europa/Titan: Radiation insurance
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

// === FORM SUBMISSION ===
function handleSubmit(e) {
  e.preventDefault();

  const selectedDestination = destinationSelect.value;
  const selectedPackageInput = document.querySelector('input[name="package"]:checked');
  const passengerCount = passengersContainer.children.length;

  if (!selectedDestination) return alert('Please select a destination');
  if (!selectedPackageInput) return alert('Please select a passenger package');

  const packageData = passengerOptions.find(p => p.id === selectedPackageInput.value);
  if (passengerCount < packageData.minPassengers || passengerCount > packageData.maxPassengers) {
    return alert(`This package requires between ${packageData.minPassengers} and ${packageData.maxPassengers} passengers`);
  }

  const destination = destinations.find(d => d.id === selectedDestination);
  const approximatePrice = destination.price * packageData.basePriceMultiplier;

  alert(
    `Booking Confirmed!\n\n` +
    `Destination: ${destination.name}\n` +
    `Package: ${packageData.name}\n` +
    `Passengers: ${passengerCount}\n` +
    `Approximate Price: ${formatPrice(approximatePrice)}\n\n` +
    `You are going to space!`
  );

  console.log('Booking submitted:', { destination: selectedDestination, package: selectedPackageInput.value, passengers: passengerCount });
}

// === STARTUP ===
document.addEventListener('DOMContentLoaded', () => {
  createStars();
  loadData();
});

function updatePriceSummary() {
  const priceSummary = document.getElementById('priceSummary');
  if (!priceSummary) return;

  const destination = destinations.find(d => d.id === destinationSelect.value);
  const selectedAccommodationInput = document.querySelector('input[name="accommodation"]:checked');
  const passengerRadio = document.querySelector('input[name="passengers"]:checked');

  if (!destination || !passengerRadio || !selectedAccommodationInput) {
    priceSummary.classList.add('hidden');
    return;
  }

  // --- NOMBRE DE PASSAGERS ---
  let passengerCount;
  if (passengerRadio.value === "3-6") {
    passengerCount = 3; // ou 6
  } else {
    passengerCount = parseInt(passengerRadio.value);
  }

  // --- HÉBERGEMENT ---
  const acc = accommodations.find(a => a.id === selectedAccommodationInput.value);
  if (!acc) return;

  // --- DURÉE EN JOURS ---
  const durationMatch = destination.travelDuration.match(/(\d+)/);
  const days = durationMatch ? parseInt(durationMatch[1]) : 1;

  // --- CALCUL ---
  // Prix voyage (aller-retour)
  const travelPrice = destination.price * 2;

  // Prix hébergement
  const accommodationPrice = acc.pricePerDay * days;

  // Total par personne
  const pricePerPerson = travelPrice + accommodationPrice;

  // Total final
  const totalPrice = pricePerPerson * passengerCount;

  // --- AFFICHAGE ---
  priceSummary.innerHTML = `
    <div class="bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-xl p-6 text-center border border-neon-blue/50">
      <h3 class="font-orbitron text-2xl text-glow text-cyan-300 mb-2">Total Price</h3>
      <p class="text-4xl font-bold text-white tracking-wider">${formatPrice(totalPrice)}</p>
      
    </div>
  `;

  priceSummary.classList.remove('hidden');
}

function handleDestinationChange() {
  const dest = destinations.find(d => d.id === destinationSelect.value);
  accommodationSection.classList.add('hidden');
  conditionalFields.innerHTML = '';
  updatePriceSummary();

  if (!dest) return;

  updateAccommodations(dest);     // Affiche accommodation
  updateConditionalFields(dest);  // Assurance si Europa/Titan
  handlePassengerChange();        // Ajuste passagers
  updatePriceSummary();           // Recalcule
}