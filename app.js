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
    exercises: ['Squats', 'Bench Press', 'Deadlift'] // Default exercises only for first time
};

// Modal management
function showModal() {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('exerciseForm').reset();
    
    // Clear existing sets
    const setsContainer = document.getElementById('sets');
    setsContainer.innerHTML = '';
    
    // Add default set
    addSet();
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
    updateExerciseDropdown(); // Update exercise dropdown after list changes
}

function updateExerciseDropdown() {
    const select = document.getElementById('exercise');
    if (!select) return;
    
    // Save current selection if any
    const currentValue = select.value;
    
    // Clear existing options except the first placeholder
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add exercise options
    exerciseData.exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        select.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (exerciseData.exercises.includes(currentValue)) {
        select.value = currentValue;
    }
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
        // Load saved exercises without enforcing defaults
        exerciseData = JSON.parse(savedData);
    } else {
        // Only set default exercises for first-time users
        exerciseData = {
            exercises: ['Squats', 'Bench Press', 'Deadlift']
        };
        saveToLocalStorage();
    }
    
    // Load dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
    
    // Load units preference
    const units = localStorage.getItem('units');
    if (units) {
        document.getElementById('unitsSelect').value = units;
    }
    
    updateExerciseList();
}

// Initialize workout date to today
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workoutDate').value = today;
    loadFromLocalStorage();
    updateExerciseDropdown(); // Initialize exercise dropdown when page loads
    updateExerciseList();
    updateWorkoutDisplay();
    loadProgress();
});

// Initialize settings page
if (window.location.pathname.includes('settings.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        loadFromLocalStorage();
        updateExerciseList();
    });
}

function saveWorkout() {
    const workoutDate = document.getElementById('workoutDate').value;
    const workoutData = JSON.parse(localStorage.getItem('workoutData')) || {};
    
    if (!workoutData || Object.keys(workoutData).length === 0) {
        alert('Please add at least one exercise to your workout before saving.');
        return;
    }
    
    // Get saved workouts or initialize empty object
    const savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts')) || {};
    
    // Save workout data with date
    savedWorkouts[workoutDate] = {
        exercises: workoutData,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('savedWorkouts', JSON.stringify(savedWorkouts));
    
    // Show workout summary
    showWorkoutSummary(workoutData);
}

function showWorkoutSummary(workoutData) {
    const summaryDiv = document.getElementById('workoutSummary');
    summaryDiv.innerHTML = '';
    
    Object.entries(workoutData).forEach(([exercise, data]) => {
        const summaryItem = document.createElement('div');
        summaryItem.className = 'summary-item';
        
        const sets = data.sets.map(set => `${set.weight}kg × ${set.reps}`).join(', ');
        
        summaryItem.innerHTML = `
            <span class="summary-exercise">${exercise}</span>
            <span class="summary-sets">${sets}</span>
        `;
        
        summaryDiv.appendChild(summaryItem);
    });
    
    // Show the save workout modal
    document.getElementById('saveWorkoutModal').style.display = 'block';
}

function hideSaveWorkoutModal() {
    document.getElementById('saveWorkoutModal').style.display = 'none';
}

function startNewWorkout() {
    // Clear current workout data
    localStorage.removeItem('workoutData');
    
    // Reset date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workoutDate').value = today;
    
    // Clear exercises display
    document.getElementById('exercises-container').innerHTML = '';
    
    // Hide the modal
    hideSaveWorkoutModal();
}

function viewProgress() {
    window.location.href = 'progress.html';
}

// Progress page functions
function loadProgress() {
    if (window.location.pathname.includes('progress.html')) {
        const timeRange = document.getElementById('timeRange');
        timeRange.addEventListener('change', updateProgress);
        updateProgress();
    }
}

function updateProgress() {
    const timeRange = document.getElementById('timeRange').value;
    const savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts')) || {};
    const workouts = Object.entries(savedWorkouts);
    
    // Sort workouts by date (newest first)
    workouts.sort((a, b) => new Date(b[0]) - new Date(a[0]));
    
    // Filter workouts based on time range
    const filteredWorkouts = filterWorkoutsByTimeRange(workouts, timeRange);
    
    // Update stats
    updateStats(filteredWorkouts);
    
    // Update PRs
    updatePRs(filteredWorkouts);
    
    // Update workout history
    updateWorkoutHistory(filteredWorkouts);
}

function filterWorkoutsByTimeRange(workouts, days) {
    if (days === 'all') return workouts;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    return workouts.filter(([date]) => new Date(date) >= cutoffDate);
}

function updateStats(workouts) {
    const totalWorkouts = workouts.length;
    const totalExercises = workouts.reduce((total, [_, workout]) => {
        return total + Object.keys(workout.exercises).length;
    }, 0);
    
    document.getElementById('totalWorkouts').textContent = totalWorkouts;
    document.getElementById('totalExercises').textContent = totalExercises;
}

function updatePRs(workouts) {
    const prList = document.getElementById('prList');
    const prs = calculatePRs(workouts);
    
    prList.innerHTML = '';
    Object.entries(prs).forEach(([exercise, pr]) => {
        const prItem = document.createElement('div');
        prItem.className = 'pr-item';
        prItem.innerHTML = `
            <span class="pr-exercise">${exercise}</span>
            <span class="pr-value">${pr.weight}kg × ${pr.reps} reps</span>
        `;
        prList.appendChild(prItem);
    });
}

function calculatePRs(workouts) {
    const prs = {};
    
    workouts.forEach(([_, workout]) => {
        Object.entries(workout.exercises).forEach(([exercise, data]) => {
            data.sets.forEach(set => {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;
                
                // Calculate total volume (weight × reps) for comparison
                const volume = weight * reps;
                
                if (!prs[exercise] || volume > (prs[exercise].weight * prs[exercise].reps)) {
                    prs[exercise] = {
                        weight: weight,
                        reps: reps
                    };
                }
            });
        });
    });
    
    return prs;
}

function updateWorkoutHistory(workouts) {
    const historyContainer = document.getElementById('workoutHistory');
    historyContainer.innerHTML = '';
    
    workouts.forEach(([date, workout]) => {
        const workoutItem = document.createElement('div');
        workoutItem.className = 'workout-item';
        workoutItem.onclick = () => showWorkoutDetails(date, workout);
        
        const exerciseCount = Object.keys(workout.exercises).length;
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        workoutItem.innerHTML = `
            <span class="workout-date">${formattedDate}</span>
            <div class="workout-meta">
                <span>${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}</span>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        
        historyContainer.appendChild(workoutItem);
    });
}

function showWorkoutDetails(date, workout) {
    const modal = document.getElementById('workoutDetailsModal');
    const details = document.getElementById('workoutDetails');
    const dateTitle = document.getElementById('workoutDate');
    
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    dateTitle.textContent = formattedDate;
    details.innerHTML = '';
    
    Object.entries(workout.exercises).forEach(([exercise, data]) => {
        const exerciseGroup = document.createElement('div');
        exerciseGroup.className = 'exercise-group';
        
        const setsList = data.sets.map((set, index) => `
            <div class="set-item">
                <span>Set ${index + 1}:</span>
                <span>${set.weight}kg × ${set.reps}</span>
            </div>
        `).join('');
        
        exerciseGroup.innerHTML = `
            <div class="exercise-name">${exercise}</div>
            <div class="set-list">
                ${setsList}
            </div>
        `;
        
        details.appendChild(exerciseGroup);
    });
    
    modal.style.display = 'block';
}

function hideWorkoutDetails() {
    document.getElementById('workoutDetailsModal').style.display = 'none';
}
