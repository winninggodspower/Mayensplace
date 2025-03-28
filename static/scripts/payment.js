PRICE_PER_HOUR = 200;

// Initialize time options
function initializeTimeOptions() {
    const startTime = document.getElementById('start-time');
    const endTime = document.getElementById('end-time');

    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0') + ':00';
        const startOption = new Option(hour, hour);
        startTime.add(startOption);
    }

    startTime.addEventListener('change', function () {
        const selectedStartTime = startTime.value;
        endTime.innerHTML = ''; // Clear existing options

        if (selectedStartTime) {
            const startHour = parseInt(selectedStartTime.split(':')[0]);
            for (let i = startHour + 1; i < 24; i++) {
                const hour = i.toString().padStart(2, '0') + ':00';
                const endOption = new Option(hour, hour);
                endTime.add(endOption);
            }
        } else {
            const defaultOption = new Option('Choose a time', '', true, true);
            endTime.add(defaultOption);
        }
    });
}

// Calculate total price
function calculatePrice() {
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    if (startTime && endTime && /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime)) {
        const start = parseInt(startTime.split(':')[0]);
        const end = parseInt(endTime.split(':')[0]);
        if (end > start) {
            const hours = end - start;
            const price = hours * PRICE_PER_HOUR;
            document.getElementById('total-price').textContent = price;
            document.getElementById('total-hours').textContent = hours;
            document.getElementById('price-display').classList.remove('hidden');
            return price;
        } else {
            alert('End time cannot be earlier than start time');
            return 0;
        }
    }
    document.getElementById('price-display').classList.add('hidden');
    return 0;
}

// Navigation between steps
function showStep(step) {
    document.getElementById('booking-step-1').classList.add('hidden');
    document.getElementById('booking-step-2').classList.add('hidden');
    document.getElementById('booking-step-3').classList.add('hidden');
    document.getElementById(`booking-step-${step}`).classList.remove('hidden');

    // Update progress indicators
    for (let i = 1; i <= 3; i++) {
        const stepElement = document.getElementById(`step-${i}`);
        if (i < step) {
            stepElement.classList.add('text-green-500');
        } else if (i === step) {
            stepElement.classList.add('text-green-500');
        } else {
            stepElement.classList.remove('text-green-500');
        }
    }
}

async function initializePayment(amount) {
    try {
        const name = document.getElementById('name').value;
        const organization = document.getElementById('organization').value;
        const address = document.getElementById('address').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const eventName = document.getElementById('event-name').value;
        const eventType = document.getElementById('event-type').value;
        const eventDate = document.getElementById('date').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const guestCount = document.getElementById('guest-count').value;
        const additionalServices = document.getElementById('additional-services').value;

        const response = await fetch('/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                organization,
                address,
                email,
                phone,
                event_name: eventName,
                event_type: eventType,
                event_date: eventDate,
                event_time: `${startTime} - ${endTime}`,
                guest_count: guestCount,
                additional_services: additionalServices,
                total_price: amount
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Redirect the user to PayPal's approval URL
            window.location.href = data.approval_url;
        } else {
            console.error('Error:', data.error);
            alert('Failed to initialize payment: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while initializing payment.');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    initializeTimeOptions();

    // Time selection changes
    document.getElementById('start-time').addEventListener('change', calculatePrice);
    document.getElementById('end-time').addEventListener('change', calculatePrice);

    // Form submissions
    document.getElementById('booking-step-1').onsubmit = function (event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;

        if (name && email && phone) {
            showStep(2);
        } else {
            alert('Please fill in all fields');
        }
    };

    document.getElementById('booking-step-2').onsubmit = function (event) {
        event.preventDefault();
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const price = calculatePrice();

        if (date && startTime && endTime && price > 0) {
            document.getElementById('summary-date').textContent = date;
            document.getElementById('summary-time').textContent = `${startTime} - ${endTime}`;
            document.getElementById('summary-price').textContent = price;

            showStep(3);
        } else {
            alert('Please fill in all fields');
        }
    };

    document.getElementById('step-2-prev').onclick = function () {
        showStep(1);
    };

    document.getElementById('step-3-prev').onclick = function () {
        showStep(2);
    };

    // Payment submission
    document.getElementById('booking-step-3').onsubmit = async function (event) {
        event.preventDefault();
        const amount = parseInt(document.getElementById('total-price').textContent);
        await initializePayment(amount);
    };
});