// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Exercise data management
let exerciseData = {
    exercises: []
};

// Modal management
function showModal() {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('exerciseForm').reset();
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}

// Exercise form management
function addSet() {
    const setsContainer = document.getElementById('sets');
    const setNumber = setsContainer.children.length + 1;
    
    const setDiv = document.createElement('div');
    setDiv.className = 'form-group';
    setDiv.innerHTML = `
        <input type="number" placeholder="Weight (kg)" required>
        <input type="number" placeholder="Reps" required>
        <button type="button" onclick="removeSet(this)" class="remove-set-btn">
            <i class="fas fa-minus"></i>
        </button>
    `;
    
    setsContainer.appendChild(setDiv);
    
    // Scroll to the new set
    setDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeSet(button) {
    const setDiv = button.parentElement;
    setDiv.remove();
    updateSetNumbers();
}

function updateSetNumbers() {
    const sets = document.querySelectorAll('#sets .form-group');
    sets.forEach((set, index) => {
        const label = set.querySelector('label');
        if (label) {
            label.textContent = `Set ${index + 1}:`;
        }
    });
}

// Exercise list management
function addNewExercise() {
    const input = document.getElementById('newExercise');
    const exerciseName = input.value.trim();
    
    if (!exerciseName) {
        alert('Please enter an exercise name');
        return;
    }
    
    if (exerciseData.exercises.includes(exerciseName)) {
        alert('This exercise already exists');
        return;
    }
    
    exerciseData.exercises.push(exerciseName);
    updateExerciseList();
    input.value = '';
}

function removeExercise(exercise) {
    if (!confirm(`Are you sure you want to remove ${exercise}?`)) {
        return;
    }
    
    exerciseData.exercises = exerciseData.exercises.filter(e => e !== exercise);
    updateExerciseList();
    saveToLocalStorage();
}

function updateExerciseList() {
    const list = document.getElementById('exercise-list');
    if (!list) return;
    
    list.innerHTML = '';
    exerciseData.exercises.forEach(exercise => {
        const li = document.createElement('li');
        li.className = 'settings-item';
        li.innerHTML = `
            <span>${exercise}</span>
            <button onclick="removeExercise('${exercise}')" class="remove-exercise-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        list.appendChild(li);
    });
    
    saveToLocalStorage();
}

// Workout management
function createExerciseCard(exercise, data) {
    const card = document.createElement('div');
    card.className = 'exercise-card fade-in';
    
    const sets = data.sets.map((set, index) => `
        <div class="set-info">
            <span>Set ${index + 1}:</span>
            <span>${set.weight}kg × ${set.reps}</span>
        </div>
    `).join('');
    
    card.innerHTML = `
        <div class="exercise-name">${exercise}</div>
        <div class="sets-container">${sets}</div>
        <div class="pr-info">PR: ${data.pr || 'Not set'}</div>
    `;
    
    return card;
}

function updateWorkoutDisplay() {
    const container = document.getElementById('exercises-container');
    if (!container) return;
    
    const workoutData = JSON.parse(localStorage.getItem('workoutData')) || {};
    container.innerHTML = '';
    
    Object.entries(workoutData).forEach(([exercise, data]) => {
        const card = createExerciseCard(exercise, data);
        container.appendChild(card);
    });
}

// Form submission
document.getElementById('exerciseForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const exercise = document.getElementById('exercise').value;
    const sets = [];
    
    document.querySelectorAll('#sets .form-group').forEach(setDiv => {
        const [weight, reps] = setDiv.querySelectorAll('input');
        sets.push({
            weight: parseFloat(weight.value),
            reps: parseInt(reps.value)
        });
    });
    
    const workoutData = JSON.parse(localStorage.getItem('workoutData')) || {};
    workoutData[exercise] = { sets };
    
    localStorage.setItem('workoutData', JSON.stringify(workoutData));
    updateWorkoutDisplay();
    hideModal();
});

// Dark mode toggle
document.getElementById('darkModeToggle')?.addEventListener('change', function(e) {
    document.body.classList.toggle('dark-mode', e.target.checked);
    localStorage.setItem('darkMode', e.target.checked);
});

// Units selection
document.getElementById('unitsSelect')?.addEventListener('change', function(e) {
    localStorage.setItem('units', e.target.value);
});

// Local storage management
function saveToLocalStorage() {
    localStorage.setItem('exerciseData', JSON.stringify(exerciseData));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('exerciseData');
    if (savedData) {
        exerciseData = JSON.parse(savedData);
    }
    
    // Load dark mode preference
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
    
    // Load units preference
    const units = localStorage.getItem('units');
    if (units) {
        document.getElementById('unitsSelect').value = units;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    updateExerciseList();
    updateWorkoutDisplay();
});
