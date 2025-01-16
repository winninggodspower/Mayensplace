const eventTypes = [
    'Birthday Parties',
    'Wedding Ceremonies',
    'Corporate Events',
    'Baby Showers',
    'Anniversary Celebrations',
    'Graduation Parties',
    'Family Reunions',
    'Holiday Gatherings'
];

let currentWordIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
let typingSpeed = 150;
let deletingSpeed = 75;
let pauseTime = 2000;

const typedTextElement = document.getElementById('typed-text');

function typeText() {
    const currentWord = eventTypes[currentWordIndex];
    
    if (isDeleting) {
        currentCharIndex--;
        typedTextElement.textContent = currentWord.substring(0, currentCharIndex);
        
        if (currentCharIndex === 0) {
            isDeleting = false;
            currentWordIndex = (currentWordIndex + 1) % eventTypes.length;
            setTimeout(typeText, typingSpeed);
        } else {
            setTimeout(typeText, deletingSpeed);
        }
    } else {
        currentCharIndex++;
        typedTextElement.textContent = currentWord.substring(0, currentCharIndex);
        
        if (currentCharIndex === currentWord.length) {
            isDeleting = true;
            setTimeout(typeText, pauseTime);
        } else {
            setTimeout(typeText, typingSpeed);
        }
    }
}

// Start the typing animation
typeText();