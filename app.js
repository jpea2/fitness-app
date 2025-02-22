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
    exercises: [] // Initialize empty, will be populated from storage or defaults
};

// Load exercises from localStorage
function loadExercises() {
    try {
        const savedExercises = localStorage.getItem('exercises');
        if (savedExercises) {
            exerciseData.exercises = JSON.parse(savedExercises);
        } else {
            // Default exercises if none exist
            exerciseData.exercises = [
                'Squats',
                'Bench Press',
                'Deadlift',
                'Rows',
                'Shoulder Press'
            ];
            // Save defaults to localStorage
            saveExercises();
        }
        
        // Update UI elements
        updateExerciseList();
        updateExerciseDropdown();
        
        console.log('Loaded exercises:', exerciseData.exercises);
    } catch (error) {
        console.error('Error loading exercises:', error);
        alert('Error loading exercises. Using defaults.');
        exerciseData.exercises = ['Squats', 'Bench Press', 'Deadlift'];
        saveExercises();
    }
}

// Save exercises to localStorage
function saveExercises() {
    try {
        // Remove any potential duplicates and empty values
        exerciseData.exercises = [...new Set(exerciseData.exercises.filter(e => e))];
        
        localStorage.setItem('exercises', JSON.stringify(exerciseData.exercises));
        console.log('Saved exercises:', exerciseData.exercises);
        
        // Update UI after saving
        updateExerciseList();
        updateExerciseDropdown();
    } catch (error) {
        console.error('Error saving exercises:', error);
        alert('Error saving exercises. Please try again.');
    }
}

// Update the exercise list in settings
function updateExerciseList() {
    const list = document.getElementById('exercise-list');
    if (!list) {
        return; // Not on settings page
    }
    
    list.innerHTML = '';
    const sortedExercises = [...exerciseData.exercises].sort();
    
    sortedExercises.forEach(exercise => {
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
}

// Update the exercise dropdown in the workout form
function updateExerciseDropdown() {
    const select = document.getElementById('exercise');
    if (!select) {
        return; // Not on workout page
    }
    
    // Save the current selection
    const currentValue = select.value;
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select Exercise</option>';
    
    // Sort exercises alphabetically
    const sortedExercises = [...exerciseData.exercises].sort();
    
    // Add exercise options
    sortedExercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        select.appendChild(option);
    });
    
    // Restore the selection if it still exists
    if (exerciseData.exercises.includes(currentValue)) {
        select.value = currentValue;
    }
}

// Exercise list management
function addNewExercise() {
    const input = document.getElementById('newExercise');
    if (!input) return;
    
    const exerciseName = input.value.trim();
    
    if (!exerciseName) {
        alert('Please enter an exercise name');
        return;
    }
    
    if (exerciseData.exercises.includes(exerciseName)) {
        alert('This exercise already exists');
        return;
    }
    
    // Add the exercise and save
    exerciseData.exercises.push(exerciseName);
    saveExercises(); // This will also update the UI
    input.value = '';
    
    console.log('Added exercise:', exerciseName);
}

// Remove exercise
function removeExercise(exercise) {
    if (!exercise) return;
    
    if (confirm(`Are you sure you want to remove "${exercise}"?`)) {
        const index = exerciseData.exercises.indexOf(exercise);
        if (index > -1) {
            exerciseData.exercises.splice(index, 1);
            saveExercises(); // This will also update the UI
            console.log('Removed exercise:', exercise);
        }
    }
}

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
        <div class="exercise-header">
            <div class="exercise-name">${exercise}</div>
            <button class="remove-exercise-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="sets-container">${sets}</div>
    `;
    
    // Add click event listener to remove button
    const removeButton = card.querySelector('.remove-exercise-btn');
    removeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeExerciseFromWorkout(exercise);
    });
    
    return card;
}

function removeExerciseFromWorkout(exerciseName) {
    const workoutDate = document.getElementById('workoutDate').value;
    let workoutData = JSON.parse(localStorage.getItem('workoutData')) || {};
    
    if (workoutData[exerciseName]) {
        delete workoutData[exerciseName];
        localStorage.setItem('workoutData', JSON.stringify(workoutData));
        updateWorkoutDisplay();
    }
}

function updateWorkoutDisplay() {
    const container = document.getElementById('exercises-container');
    if (!container) return;
    
    const workoutData = JSON.parse(localStorage.getItem('workoutData')) || {};
    container.innerHTML = '';
    
    for (const [exercise, data] of Object.entries(workoutData)) {
        const card = createExerciseCard(exercise, data);
        container.appendChild(card);
    }
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

// Initialize common settings for all pages
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    
    // Initialize dark mode
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = darkMode;
        darkModeToggle.addEventListener('change', function(e) {
            document.body.classList.toggle('dark-mode', e.target.checked);
            localStorage.setItem('darkMode', e.target.checked);
        });
    }

    // Initialize theme color for all pages
    const savedColor = localStorage.getItem('primaryColor') || '#007AFF';
    document.documentElement.style.setProperty('--primary-color', savedColor);
    
    // Set up event listener for adding exercises with Enter key
    const newExerciseInput = document.getElementById('newExercise');
    if (newExerciseInput) {
        newExerciseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewExercise();
            }
        });
    }
    
    // Set up event listeners for the exercise form
    const exerciseForm = document.getElementById('exerciseForm');
    if (exerciseForm) {
        exerciseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const exercise = document.getElementById('exercise').value;
            if (!exercise) {
                alert('Please select an exercise');
                return;
            }
            addExerciseToWorkout(exercise);
            hideModal();
        });
    }
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('workoutDate');
    if (dateInput) {
        dateInput.value = today;
    }

    // Add event listener for save workout button
    const saveButton = document.getElementById('saveWorkoutBtn');
    if (saveButton) {
        console.log('Found save button, adding click listener');
        saveButton.addEventListener('click', saveWorkout);
    }

    // Initialize progress page if we're on it
    const timeRange = document.getElementById('timeRange');
    if (timeRange) {
        console.log('Initializing progress page...');
        // Add change listener for time range
        timeRange.addEventListener('change', updateProgress);
        // Initial load of progress data
        updateProgress();
    }
});

function loadFromLocalStorage() {
    loadExercises(); // Load exercises on every page
    // No need to handle dark mode here as it's handled globally
    // Add any other settings loading logic here if needed
}

// Initialize dashboard page
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', () => {
        updateWorkoutDisplay(); // This will load and display any saved workout data
    });
}

// Initialize progress page
if (window.location.pathname.includes('progress.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Initializing progress page...');
        updateProgress();
        
        // Add event listener for time range changes
        document.getElementById('timeRange')?.addEventListener('change', updateProgress);
    });
}

// Initialize settings page
if (window.location.pathname.includes('settings.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize theme color picker
        const colorPicker = document.getElementById('primaryColorPicker');
        if (colorPicker) {
            const savedColor = localStorage.getItem('primaryColor') || '#007AFF';
            colorPicker.value = savedColor;
            document.documentElement.style.setProperty('--primary-color', savedColor);
            
            colorPicker.addEventListener('change', (e) => {
                const newColor = e.target.value;
                document.documentElement.style.setProperty('--primary-color', newColor);
                localStorage.setItem('primaryColor', newColor);
            });
        }
    });
}

function saveWorkout() {
    console.log('Save workout button clicked!');
    try {
        console.log('Starting saveWorkout function...');
        const workoutDate = document.getElementById('workoutDate').value;
        console.log('Workout date:', workoutDate);
        
        const workoutData = JSON.parse(localStorage.getItem('workoutData')) || {};
        console.log('Current workout data to save:', workoutData);
        
        if (!workoutData || Object.keys(workoutData).length === 0) {
            console.log('No workout data found');
            alert('Please add at least one exercise to your workout before saving.');
            return;
        }

        // Get saved workouts or initialize empty object
        const savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts')) || {};
        console.log('Existing saved workouts:', savedWorkouts);
        
        savedWorkouts[workoutDate] = {
            exercises: workoutData,
            timestamp: new Date().toISOString(),
            tag: document.getElementById('workoutTag')?.value || 'untagged' // Save the selected tag
        };
        
        console.log('Updated saved workouts:', savedWorkouts);
        
        // Save to localStorage
        localStorage.setItem('savedWorkouts', JSON.stringify(savedWorkouts));
        console.log('Saved to localStorage successfully');
        
        // Clear the current workout data
        localStorage.removeItem('workoutData');
        console.log('Cleared current workout data');
        
        // Clear the exercises container
        const exercisesContainer = document.getElementById('exercises-container');
        if (exercisesContainer) {
            exercisesContainer.innerHTML = '';
            console.log('Cleared exercises container');
        }
        
        // Show workout summary
        showWorkoutSummary(workoutData);

        // Update progress page if it's open
        if (window.location.pathname.includes('progress.html')) {
            console.log('On progress page, updating display...');
            updateProgress();
        }
    } catch (error) {
        console.error('Error in saveWorkout:', error);
    }
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

function deleteWorkout(date) {
    if (confirm('Are you sure you want to delete this workout?')) {
        const savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts')) || {};
        delete savedWorkouts[date];
        localStorage.setItem('savedWorkouts', JSON.stringify(savedWorkouts));
        updateProgress(); // Refresh the display
    }
}

function updateWorkoutHistory(workouts, filterTag = "all") {
    console.log('Starting updateWorkoutHistory with workouts:', workouts);
    const historyContainer = document.getElementById('workoutHistory');

    if (!historyContainer) {
        console.log('Workout history container not found - likely not on progress page');
        return;
    }

    console.log('Clearing and updating workout history container');
    historyContainer.innerHTML = '';

    // Filter and sort workouts before displaying
    const filteredWorkouts = workouts.filter(([date, workout]) => 
        filterTag === "all" || workout.tag === filterTag
    );

    // Sort by date (newest first)
    filteredWorkouts.sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));

    filteredWorkouts.forEach(([date, workout]) => {

        const workoutItem = document.createElement('div');
        workoutItem.className = 'workout-item';

        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        // Dropdown for tagging
        const tagDropdown = `
            <select class="workout-tag" onchange="updateWorkoutTag('${date}', this.value)">
                <option value="untagged" ${(!workout.tag || workout.tag === "untagged") ? "selected" : ""}>Untagged</option>
                <option value="push" ${workout.tag === "push" ? "selected" : ""}>Push</option>
                <option value="pull" ${workout.tag === "pull" ? "selected" : ""}>Pull</option>
                <option value="legs" ${workout.tag === "legs" ? "selected" : ""}>Legs</option>
            </select>
        `;

        const exerciseDetails = Object.entries(workout.exercises).map(([exercise, data]) => {
            const setsList = data.sets.map((set, index) => `
                <div class="set-item">
                    <span>Set ${index + 1}:</span>
                    <span>${set.weight}kg × ${set.reps}</span>
                </div>
            `).join('');

            return `
                <div class="exercise-group">
                    <div class="exercise-name-column">
                        <div class="exercise-name">${exercise}</div>
                    </div>
                    <div class="sets-column">
                        ${setsList}
                    </div>
                </div>
            `;
        }).join('');

        workoutItem.innerHTML = `
            <div class="workout-header">
                <span class="workout-date">${formattedDate}</span>
                <div class="workout-meta">
                    <span>${Object.keys(workout.exercises).length} exercise${Object.keys(workout.exercises).length !== 1 ? 's' : ''}</span>
                </div>
                <div class="workout-actions">
                    ${tagDropdown}
                    <button onclick="deleteWorkout('${date}')" class="remove-exercise-btn" aria-label="Delete workout">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="workout-details">
                ${exerciseDetails}
            </div>
        `;

        historyContainer.appendChild(workoutItem);
    });
    console.log('Finished updating workout history');
}

// Function to update the workout tag
function updateWorkoutTag(date, newTag) {
    try {
        let savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts')) || {};
        if (savedWorkouts[date]) {
            savedWorkouts[date].tag = newTag || 'untagged';
            localStorage.setItem('savedWorkouts', JSON.stringify(savedWorkouts));
            
            // Convert to array format for updateWorkoutHistory
            const workoutsArray = Object.entries(savedWorkouts);
            const selectedTag = document.getElementById('filterByTag')?.value || 'all';
            updateWorkoutHistory(workoutsArray, selectedTag);
            console.log(`Updated workout tag for ${date} to ${newTag}`);
        } else {
            console.error('Workout not found for date:', date);
        }
    } catch (error) {
        console.error('Error updating workout tag:', error);
        alert('Failed to update workout tag. Please try again.');
    }
}

// Function to filter workouts based on tag
function filterWorkouts() {
    try {
        const selectedTag = document.getElementById('filterByTag').value;
        const savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts')) || {};
        const workoutsArray = Object.entries(savedWorkouts);
        updateWorkoutHistory(workoutsArray, selectedTag);
        console.log('Filtering workouts by tag:', selectedTag);
    } catch (error) {
        console.error('Error filtering workouts:', error);
        alert('Failed to filter workouts. Please try again.');
    }
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

// Force update function
async function forceUpdate() {
    try {
        // Show loading state
        const button = event.target.closest('button');
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        button.disabled = true;

        // Unregister service worker
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }

        // Clear only the service worker cache
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter(name => name.startsWith('fitness-app-v')) // Only clear our app's cache
                    .map(cacheName => caches.delete(cacheName))
            );
        }

        // Show success message
        button.innerHTML = '<i class="fas fa-check"></i> Updated!';
        button.classList.remove('button-primary');
        button.classList.add('button-success');

        // Reload the page after a short delay
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);

    } catch (error) {
        console.error('Force update failed:', error);
        alert('Update failed. Please try again.');
        
        // Reset button state
        button.innerHTML = originalContent;
        button.disabled = false;
    }
}

function updateProgress() {
    console.log('Starting updateProgress function...');
    const timeRange = document.getElementById('timeRange')?.value || 'all';
    const filterTag = document.getElementById('filterByTag')?.value || 'all';
    console.log('Selected time range:', timeRange, 'filter tag:', filterTag);
    
    const savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts')) || {};
    console.log('Retrieved saved workouts for progress:', savedWorkouts);
    
    const workouts = Object.entries(savedWorkouts);
    
    // Sort workouts by date (newest first)
    workouts.sort((a, b) => new Date(b[0]) - new Date(a[0]));
    console.log('Sorted workouts:', workouts);
    
    // Filter workouts based on time range
    const filteredWorkouts = filterWorkoutsByTimeRange(workouts, timeRange);
    console.log('Filtered workouts:', filteredWorkouts);
    
    // Update stats using all workouts in time range
    updateStats(filteredWorkouts);
    
    // Update workout history with current filter
    updateWorkoutHistory(filteredWorkouts, filterTag);
    
    // Update PRs
    updatePRs(filteredWorkouts);
    
    // Update workout history
    updateWorkoutHistory(filteredWorkouts);
}