// Initialize time options
function initializeTimeOptions() {
    const startTime = document.getElementById('start-time');
    const endTime = document.getElementById('end-time');
    
    for(let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0') + ':00';
        const startOption = new Option(hour, hour);
        const endOption = new Option(hour, hour);
        startTime.add(startOption);
        endTime.add(endOption);
    }
}

// Calculate total price
function calculatePrice() {
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    if (startTime && endTime) {
        const start = parseInt(startTime.split(':')[0]);
        const end = parseInt(endTime.split(':')[0]);
        if (end > start) {
            const hours = end - start;
            const price = hours * 400;
            document.getElementById('total-price').textContent = price;
            document.getElementById('total-hours').textContent = hours;
            document.getElementById('price-display').classList.remove('hidden');
            return price;
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
    for(let i = 1; i <= 3; i++) {
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

// Initialize Stripe
const stripe = Stripe('your_publishable_key'); // Replace with your Stripe publishable key
let elements;

async function initializePayment(amount) {
    try {
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const { clientSecret } = await response.json();

        elements = stripe.elements({ clientSecret });
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeTimeOptions();

    // Time selection changes
    document.getElementById('start-time').addEventListener('change', calculatePrice);
    document.getElementById('end-time').addEventListener('change', calculatePrice);

    // Navigation buttons
    document.getElementById('step-1-next').addEventListener('click', () => {
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const price = calculatePrice();

        if (date && startTime && endTime && price > 0) {
            showStep(2);
        } else {
            alert('Please fill in all fields');
        }
    });

    document.getElementById('step-2-prev').addEventListener('click', () => showStep(1));
    document.getElementById('step-2-next').addEventListener('click', () => {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;

        if (name && email && phone) {
            // Update summary
            document.getElementById('summary-date').textContent = document.getElementById('date').value;
            document.getElementById('summary-time').textContent = 
                `${document.getElementById('start-time').value} - ${document.getElementById('end-time').value}`;
            document.getElementById('summary-price').textContent = document.getElementById('total-price').textContent;

            // Initialize payment
            const amount = parseInt(document.getElementById('total-price').textContent);
            initializePayment(amount);
            showStep(3);
        } else {
            alert('Please fill in all fields');
        }
    });

    document.getElementById('step-3-prev').addEventListener('click', () => showStep(2));

    // Payment submission
    document.getElementById('pay-button').addEventListener('click', async () => {
        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/booking-confirmation',
                },
            });

            if (error) {
                console.error('Payment error:', error);
                alert('Payment failed: ' + error.message);
            }
        } catch (e) {
            console.error('Error:', e);
            alert('An error occurred during payment');
        }
    });
});