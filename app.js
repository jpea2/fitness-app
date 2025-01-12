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

let exerciseData = {
    exercises: ['Squats', 'Bench Press', 'Deadlift']
};

function updateExerciseList() {
    const exerciseList = document.getElementById('exercise-list');
    if (!exerciseList) return;

    exerciseList.innerHTML = '';
    
    exerciseData.exercises.forEach(exercise => {
        const li = document.createElement('li');
        li.className = 'exercise-item';
        
        const exerciseName = document.createElement('span');
        exerciseName.textContent = exercise;
        li.appendChild(exerciseName);
        
        const removeButton = document.createElement('button');
        removeButton.textContent = '×';
        removeButton.className = 'remove-exercise-btn';
        removeButton.onclick = () => removeExercise(exercise);
        li.appendChild(removeButton);
        
        exerciseList.appendChild(li);
    });

    // Save to localStorage
    localStorage.setItem('exerciseData', JSON.stringify(exerciseData));
}

function addExercise() {
    const input = document.getElementById('new-exercise-name');
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
    
    // Update home page if we need to
    updateHomeExercises();
}

function removeExercise(exercise) {
    if (!confirm(`Are you sure you want to remove ${exercise}? This will also remove any PR data for this exercise.`)) {
        return;
    }
    
    // Remove exercise from the list
    exerciseData.exercises = exerciseData.exercises.filter(e => e !== exercise);
    
    // Remove PR data for this exercise
    const prs = JSON.parse(localStorage.getItem('exercisePRs')) || {};
    delete prs[exercise];
    localStorage.setItem('exercisePRs', JSON.stringify(prs));
    
    updateExerciseList();
    updatePRList();
    
    // Update home page if we need to
    updateHomeExercises();
}

function updateHomeExercises() {
    const home = document.getElementById('home');
    if (!home) return;
    
    home.innerHTML = '';
    
    exerciseData.exercises.forEach((exercise, index) => {
        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.onclick = () => openExerciseModal(exercise);
        
        const name = document.createElement('span');
        name.className = 'exercise-name';
        name.textContent = `Exercise ${index + 1}: ${exercise}`;
        
        const pr = document.createElement('div');
        pr.className = 'pr-info';
        pr.id = `${exercise.toLowerCase().replace(' ', '-')}-pr`;
        pr.textContent = 'PR: Not set';
        
        card.appendChild(name);
        card.appendChild(pr);
        home.appendChild(card);
    });
    
    // Update PR display
    updatePRDisplay();
}

function initializeExerciseData() {
    const savedData = localStorage.getItem('exerciseData');
    if (savedData) {
        exerciseData = JSON.parse(savedData);
    }
    
    if (document.getElementById('exercise-list')) {
        updateExerciseList();
    } else if (document.getElementById('home')) {
        updateHomeExercises();
    }
}

function openExerciseModal(exerciseName) {
    document.getElementById('exerciseName').textContent = exerciseName;
    document.getElementById('exerciseModal').style.display = 'block';
    
    // Clear previous form content
    const form = document.getElementById('exerciseForm');
    form.innerHTML = '';
    
    // Add initial sets for the exercise
    const numSets = exerciseData[exerciseName] ? exerciseData[exerciseName].sets : 3;
    for (let i = 1; i <= numSets; i++) {
        const setDiv = document.createElement('div');
        setDiv.innerHTML = `
            <label for="set">Set ${i}:</label>
            <input type="number" id="weight${i}" placeholder="Weight (kg)" required>
            <input type="number" id="reps${i}" placeholder="Reps" required>
            <button type="button" onclick="removeSet(this, '${exerciseName}')">X</button>
        `;
        form.appendChild(setDiv);
    }
    
    // Add the action buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'form-buttons';
    buttonsDiv.innerHTML = `
        <button type="button" onclick="addSet('${exerciseName}')">Add Set</button>
        <button type="button" onclick="saveExerciseData()">Save Exercise</button>
    `;
    form.appendChild(buttonsDiv);
}

function closeExerciseModal() {
    document.getElementById('exerciseModal').style.display = 'none';
}

function updateSetNumbers(exerciseName) {
    const form = document.getElementById('exerciseForm');
    const setDivs = form.querySelectorAll('div:not(.form-buttons)');
    
    setDivs.forEach((div, index) => {
        const setNumber = index + 1;
        const label = div.querySelector('label');
        if (label) {
            label.textContent = `Set ${setNumber}:`;
            
            // Update IDs of inputs to match new set number
            const weightInput = div.querySelector('input[id^="weight"]');
            const repsInput = div.querySelector('input[id^="reps"]');
            
            if (weightInput && repsInput) {
                weightInput.id = `weight${setNumber}`;
                repsInput.id = `reps${setNumber}`;
            }
        }
    });
    
    // Update the number of sets in exerciseData
    exerciseData[exerciseName] = exerciseData[exerciseName] || {};
    exerciseData[exerciseName].sets = setDivs.length;
}

function addSet(exerciseName) {
    const form = document.getElementById('exerciseForm');
    const setIndex = form.querySelectorAll('div:not(.form-buttons)').length + 1;
    
    const newSetDiv = document.createElement('div');
    newSetDiv.innerHTML = `
        <label for="set">Set ${setIndex}:</label>
        <input type="number" id="weight${setIndex}" placeholder="Weight (kg)" required>
        <input type="number" id="reps${setIndex}" placeholder="Reps" required>
        <button type="button" onclick="removeSet(this, '${exerciseName}')">X</button>
    `;
    
    // Insert the new set div before the buttons
    const buttonsDiv = form.querySelector('.form-buttons');
    form.insertBefore(newSetDiv, buttonsDiv);
    
    updateSetNumbers(exerciseName);
}

function removeSet(button, exerciseName) {
    const setDiv = button.parentElement;
    setDiv.remove();
    updateSetNumbers(exerciseName);
}

function saveExerciseData() {
    const exerciseName = document.getElementById('exerciseName').textContent;
    const sets = [];
    
    // Collect and validate all sets data
    let setIndex = 1;
    while (document.getElementById(`weight${setIndex}`)) {
        const weightInput = document.getElementById(`weight${setIndex}`).value;
        const repsInput = document.getElementById(`reps${setIndex}`).value;
        
        // Only add set if both weight and reps are provided
        if (weightInput && repsInput) {
            const weight = parseFloat(weightInput);
            const reps = parseInt(repsInput);
            sets.push({ weight, reps });
        }
        setIndex++;
    }
    
    if (sets.length === 0) {
        alert('Please fill in at least one set with valid data.');
        return;
    }
    
    // Get existing PRs from localStorage
    const prs = JSON.parse(localStorage.getItem('exercisePRs')) || {};
    
    // Find the set with the highest weight and its reps
    const maxWeightSet = sets.reduce((max, set) => set.weight > max.weight ? set : max, { weight: 0, reps: 0 });
    
    // Find sets with the same weight as the current max weight
    const setsWithMaxWeight = sets.filter(set => set.weight === maxWeightSet.weight);
    
    // Among sets with max weight, find the one with most reps
    const maxRepsAtMaxWeight = setsWithMaxWeight.reduce((max, set) => set.reps > max ? set.reps : max, 0);
    
    // Update PR if:
    // 1. No PR exists
    // 2. Current weight is higher than PR weight
    // 3. Current weight equals PR weight AND current reps are higher
    if (!prs[exerciseName] || 
        maxWeightSet.weight > prs[exerciseName].weight ||
        (maxWeightSet.weight === prs[exerciseName].weight && maxRepsAtMaxWeight > prs[exerciseName].reps)) {
        
        prs[exerciseName] = {
            weight: maxWeightSet.weight,
            reps: maxRepsAtMaxWeight
        };
        localStorage.setItem('exercisePRs', JSON.stringify(prs));
    }
    
    // Update the specific exercise's PR display immediately
    const elementId = `${exerciseName.toLowerCase().replace(' ', '-')}-pr`;
    const element = document.getElementById(elementId);
    if (element) {
        const pr = prs[exerciseName];
        element.textContent = pr ? `PR: ${pr.weight}kg × ${pr.reps} reps` : 'PR: Not set';
    }
    
    closeExerciseModal();
}

function updatePRDisplay() {
    // Only run this if we're on the home page
    if (!document.getElementById('squats-pr')) return;

    const prs = JSON.parse(localStorage.getItem('exercisePRs')) || {};
    
    const exercises = exerciseData.exercises;
    exercises.forEach(exercise => {
        const elementId = `${exercise.toLowerCase().replace(' ', '-')}-pr`;
        const element = document.getElementById(elementId);
        
        if (element && prs[exercise]) {
            element.textContent = `PR: ${prs[exercise].weight}kg × ${prs[exercise].reps} reps`;
        } else if (element) {
            element.textContent = 'PR: Not set';
        }
    });
}

function updatePRList() {
    // Only run this if we're on the settings page
    const prItems = document.getElementById('pr-items');
    if (!prItems) return;

    const prs = JSON.parse(localStorage.getItem('exercisePRs')) || {};
    prItems.innerHTML = '';
    
    if (Object.keys(prs).length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No Personal Records set yet.';
        prItems.appendChild(li);
        return;
    }
    
    for (const exercise in prs) {
        const li = document.createElement('li');
        li.className = 'pr-item';
        
        const prInfo = document.createElement('span');
        prInfo.textContent = `${exercise}: ${prs[exercise].weight}kg × ${prs[exercise].reps} reps`;
        li.appendChild(prInfo);
        
        const removeButton = document.createElement('button');
        removeButton.textContent = '×'; // Unicode times symbol
        removeButton.className = 'remove-pr-btn';
        removeButton.onclick = () => removePR(exercise);
        li.appendChild(removeButton);
        
        prItems.appendChild(li);
    }
}

function removePR(exercise) {
    const prs = JSON.parse(localStorage.getItem('exercisePRs')) || {};
    delete prs[exercise];
    localStorage.setItem('exercisePRs', JSON.stringify(prs));
    
    // Update the PR list
    updatePRList();
}

// Initialize the pages based on their content
document.addEventListener('DOMContentLoaded', () => {
    initializeExerciseData();
    
    // Check which page we're on and update accordingly
    if (document.getElementById('squats-pr')) {
        updatePRDisplay(); // For index.html
    } else if (document.getElementById('pr-items')) {
        updatePRList();   // For settings.html
    }
});
