// Array of 10 different photos URLs (pexels)
const photos = [
    "foto.jpeg",
    "1.jpg",
    "2.jpg",
    "3.jpg",
    "4.jpg",
    "foto.jpeg",
    "foto.jpeg",
    "jared.jpg",
    "xd.jpeg",
    "Fondofijo.jpeg",
];

const mainBox = document.getElementById('main-box');
const imageOverlay = document.getElementById('image-overlay');

let active = false;
let currentPhotoIdx = 0;
let clickX = 0;
let clickY = 0;

// Shuffle array utility (Fisher-Yates)
function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Store current displayed positions to avoid overlap
const occupiedSpaces = [];

function getRandomPositionAvoidOverlap(rect, imgWidth, imgHeight) {
    const maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
        const x = Math.random() * (rect.width - imgWidth);
        const y = Math.random() * (rect.height - imgHeight);
        // Check overlap with occupiedSpaces
        let overlap = false;
        for (const pos of occupiedSpaces) {
            if (
                x < pos.x + imgWidth &&
                x + imgWidth > pos.x &&
                y < pos.y + imgHeight &&
                y + imgHeight > pos.y
            ) {
                overlap = true;
                break;
            }
        }
        if (!overlap) {
            // Save this position as occupied
            occupiedSpaces.push({ x, y });
            return { x, y };
        }
    }
    // If can't find non-overlapping position, just return random
    return {
        x: Math.random() * (rect.width - imgWidth),
        y: Math.random() * (rect.height - imgHeight),
    };
}

function animatePhotoSimultaneous(url, fromX, fromY) {
    return new Promise((resolve) => {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'animated-photo';
        imageOverlay.appendChild(img);

        const rect = mainBox.getBoundingClientRect();

        // Compute photo size from style or default to 100
        const style = window.getComputedStyle(img);
        const imgWidth = parseFloat(style.width) || 100;
        const imgHeight = parseFloat(style.height) || 100;

        // Start at click position centered
        const startLeft = fromX - rect.left - imgWidth / 2;
        const startTop = fromY - rect.top - imgHeight / 2;
        img.style.left = `${startLeft}px`;
        img.style.top = `${startTop}px`;
        img.style.opacity = '0';
        img.style.transform = 'scale(0.3)';

        void img.offsetWidth; // force reflow

        // Calculate random position avoiding overlap
        const targetPos = getRandomPositionAvoidOverlap(rect, imgWidth, imgHeight);

        // Animate to random position and fade in
        img.style.transition = 'all 1.5s ease-out';
        img.style.left = `${targetPos.x}px`;
        img.style.top = `${targetPos.y}px`;
        img.style.opacity = '1';
        img.style.transform = 'scale(1)';

        // Stay visible 5 seconds then fade out
        setTimeout(() => {
            img.style.transition = 'opacity 1s ease-in, transform 1s ease-in';
            img.style.opacity = '0';
            img.style.transform = 'scale(0.3)';

            setTimeout(() => {
                imageOverlay.removeChild(img);
                // Remove this space from occupiedSpaces
                const index = occupiedSpaces.findIndex(
                    (pos) => pos.x === targetPos.x && pos.y === targetPos.y
                );
                if (index !== -1) {
                    occupiedSpaces.splice(index, 1);
                }
                resolve();
            }, 1000);
        }, 5000);
    });
}

async function startAnimationCycleSimultaneous() {
    let order = shuffleArray([...Array(photos.length).keys()]);
    currentPhotoIdx = 0;
    occupiedSpaces.length = 0; // clear on new cycle

    // Show a new photo every 1.5 seconds, multiple photos visible simultaneously
    while (active) {
        if (currentPhotoIdx >= order.length) {
            order = shuffleArray([...Array(photos.length).keys()]);
            currentPhotoIdx = 0;
        }

        animatePhotoSimultaneous(photos[order[currentPhotoIdx]], clickX, clickY);
        currentPhotoIdx++;

        // Wait 1.5 seconds before showing next photo
        await new Promise((r) => setTimeout(r, 1500));
    }
}

// On click toggle animation cycle and store click location
mainBox.addEventListener('click', (e) => {
    if (!active) {
        active = true;
        occupiedSpaces.length = 0; // reset occupied spaces
        currentPhotoIdx = 0;
        clickX = e.clientX;
        clickY = e.clientY;
        startAnimationCycleSimultaneous();
    } else {
        active = false;
        occupiedSpaces.length = 0;
        imageOverlay.innerHTML = '';
    }
});

// Accessibility toggle w/ enter or space key for keyboard users (center point for animation)
mainBox.addEventListener('keydown', e => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!active) {
            active = true;
            occupiedSpaces.length = 0;
            currentPhotoIdx = 0;
            const rect = mainBox.getBoundingClientRect();
            clickX = rect.left + rect.width / 2;
            clickY = rect.top + rect.height / 2;
            startAnimationCycleSimultaneous();
        } else {
            active = false;
            occupiedSpaces.length = 0;
            imageOverlay.innerHTML = '';
        }
    }
});
const bgAudio = document.getElementById('background-audio');

mainBox.addEventListener('click', () => {
  if (bgAudio.paused) {
    bgAudio.play();
  } else {
    bgAudio.pause();
  }
});