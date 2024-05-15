'use strict';

//Data taked from the DOM element
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const handleClearBtn = document.querySelector('.clear_workouts');
const alertMsgContainer = document.querySelector('.alert__msg');
//This is the parent of all workout child

class Workout {
  date = new Date();
  _id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    console.log(this._id);
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    console.log(this.description);
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevatioGain) {
    super(coords, distance, duration);
    this.elevatioGain = elevatioGain;
    //Here i just need to call it cause it is just returning a text
    this._setDescription();
    this._calcSpeed();
  }
  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    //Here i just need to call it cause it is just returning a text
    this._setDescription();
    this._calcPace();
  }
  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

//Just to test the object created by each class, so you can uncomment and check.
// const cyl1 = new Workout([32, 34], 32, 33, 12);
// console.log(cyl1);

/**_____________________HERE THE APP LOGIC CONTENT__________________ */
class App {
  //Here i will create public fields, not private like the course!
  map;
  markEvent;
  _username;
  /**Here im loading all logic when the app is starting
   * First one : to get the position
   * Second one: to toggle the cadence/elevationGian while inputType is changed
   * Third one: to create new Workout while im submiting the form compilated.
   * Fourth one: While im cliking the workout div, to move the user to the marker in the map.
   * Fifth one: Im creating a general workouts array to use in certain places
   */
  constructor() {
    this._username = null;
    this._initializeUsername();
    this._getPosition();
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._gotToPopup.bind(this));
    this.workouts = [];
    //Get data from local storage
    this._getLocalStorage();
    handleClearBtn.addEventListener('click', this._reset.bind(this));
    //Comment this and recomment the below one:
    this._getOnSubmit();
    // form.addEventListener('submit', this._newWorkOut.bind(this));
  }

  //Here i use this to test some logics but u can comment this and recomment the  one in the constructor
  _getOnSubmit() {
    form.addEventListener('submit', this._newWorkOut.bind(this));
  }
  // Call this method in your constructor or wherever necessary
  _initializeUsername() {
    // Check if the username exists in sessionStorage
    const storedUsername = sessionStorage.getItem('_username');

    if (storedUsername) {
      // If username exists, set it to the instance property
      this._username = storedUsername;
      // Get reference to the userdata_welcome element
      const usrMsgCont = document.querySelector('.userdata_welcome');
      if (usrMsgCont) {
        // Remove the active class if userdata_welcome element exists
        usrMsgCont.classList.remove('userdata_welcome--active');
      }
    } else {
      // If username does not exist, set it using prompt and save to sessionStorage
      this._setUserSession();
    }
  }

  _setUserSession() {
    const username = prompt('Please write your name to make the app correctly');
    if (username) {
      this._username = username;
      this._dataSession(username);
    }
  }

  _dataSession(username) {
    if (!username) return;
    sessionStorage.setItem('_username', username);
  }

  //Qua otteniamo la positione dall'utente appena entrato nel sito.
  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
      console.log('Not enable to check your position!');
    });
  }
  //This is were we took the position by the utent, when we click the consent position.
  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    map = L.map('map').setView([latitude, longitude], 20);
    //this is to choise another model of map, like google or other...
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    //Here when user click the map to  show the form.
    map.on('click', this._showForm.bind(this));

    // The rendere marker is here cause there are a lot of staff to do before marker
    //to be marked on the map, so we have to take the marker position here.
    this.workouts.forEach(el => {
      this._renderWorkoutMarker(el);
    });
  }
  //here is the methods for the user to show the form.
  _showForm(marEv) {
    this.markEvent = marEv;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputElevation.value =
      inputDuration.value =
        '';

    form.classList.add('hidden');

    setTimeout(() => {
      form.style.dislay = 'grid';
    }, 1800);
  }

  //Here im toggling the elevation and cadence any time input type is changed.
  _toggleElevationField(e) {
    const valueInp = e.target.value;

    if (valueInp === 'running') {
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
    }

    if (valueInp === 'cycling') {
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
    }
  }
  /**Here im creating all logic to create a new object by the target type */

  _showError() {
    alertMsgContainer.classList.add('alert__msg--active');
    alertMsgContainer.innerHTML = `${this._username} Please write a positive number 😅`;

    const timer = setTimeout(() => {
      alertMsgContainer.classList.remove('alert__msg--active');
    }, 3800);
  }
  _newWorkOut(e) {
    e.preventDefault();
    //Here there are variable to store the input value from the form
    const typeofInput = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.markEvent.latlng;
    var workout;
    const allInputAreNumber = (...inputs) => {
      return inputs.every(num => Number.isFinite(num));
    };
    const allIsPositiveNum = (...inputs) => {
      return inputs.every(num => num > 0);
    };
    // If workout is = to Running create running object
    if (typeofInput === 'running') {
      const cadence = +inputCadence.value;

      console.log(typeofInput);
      //Check data validation
      if (
        !allInputAreNumber(duration, distance, cadence) ||
        !allIsPositiveNum(duration, distance, cadence)
      )
        return this._showError();
      workout = new Running([lat, lng], duration, distance, cadence);
      console.log(workout);
      //cheking if all logics are working
      console.log(workout.__proto__);
    }
    // if workout is = to Cycling create Cycling object
    if (typeofInput === 'cycling') {
      const elevation = +inputElevation.value;

      console.log(typeofInput);
      //Check data validation
      if (
        !allInputAreNumber(duration, distance, elevation) ||
        !allIsPositiveNum(duration, distance, elevation)
      )
        return this._showError();

      workout = new Cycling([lat, lng], duration, distance, elevation);
      //cheking if all logics are working
      console.log(workout);
    }
    //Add new workout created to wourkouts array
    this.workouts.push(workout);
    console.log('All workouts', this.workouts);
    //Render workout on map as a marker
    this._renderWorkoutMarker(workout);

    //Cheking the input values, if it is working
    // console.log(iputType, cadence, duration, elevetion);
    this._renderWorkout(workout);
    this._hideForm();
    this._setLocalStorage();
    location.reload();
  }
  _renderWorkoutMarker(workout) {
    // const { lat, lng } = this.markEvent.latlng;

    L.marker(workout.coords, { draggable: true })
      .addTo(map)
      .bindPopup(
        L.popup({
          closeButton: false,
          autoClose: false,
          closeOnEscapeKey: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();
  }
  _renderWorkout(workout) {
    let html;

    html = `
    <li class="workout workout--running" data-id="${workout._id}">
    <div class="control__workouts">
    <button class="control__edit " type="submit" data-editid="${
      workout._id
    }">edit</button>
    <button class="control__delete " data-delid="${
      workout._id
    }" type="submit"">delete</button>
    </div>
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃🏽‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevatioGain}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);

    //Controlling the workouts array btns
    const allBtn = document.querySelector('.control__workouts');
    const deletCOnt = allBtn.closest('.control__workouts');
    deletCOnt.addEventListener('click', e => this._deleteSingleWorkout(e));
    deletCOnt.addEventListener('click', e => this._editWorkout(e));
  }

  //Here when user click any workout div to go automatically to the clicked workout on the map
  _gotToPopup(e) {
    const workIndex = e.target.closest('.workout');
    //Here cheking if it not the current target cliked to avoid it, so we will not have many repetitions.
    if (!workIndex) return;
    //Here creating a finded workout cliked and then setting the set view on the map marker.
    const workoute = this.workouts.find(a => a._id === workIndex.dataset.id);
    map.setView(workoute.coords, 30);
  }

  _setLocalStorage() {
    localStorage.setItem('_workouts', JSON.stringify(this.workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('_workouts'));
    // console.log(data);

    if (!data) return;

    this.workouts = data;

    this.workouts.forEach(el => {
      this._renderWorkout(el);
    });
  }
  //Here to reset/delete all data/workouts
  _reset() {
    localStorage.removeItem('_workouts');
    location.reload();
  }

  _deleteSingleWorkout(e) {
    if (e.target.classList.contains('control__delete')) {
      console.log('Delete target', e);
      const delid = e.target.dataset.delid;

      if (!delid) return;
      console.log('Delid', delid);
      const updateWorkouts = this.workouts.filter(el => el._id !== delid);
      this.workouts = updateWorkouts;
      console.log('New Array', this.workouts);
      const workouteupdated = this.workouts;
      // console.log('New workout', workouteupdated);
      location.reload();
      this._setLocalStorage(updateWorkouts);
      console.log(workouteupdated.length);
      if (workouteupdated >= 0) {
        const check = (workouteupdated.length = 0);
        console.log(check);
        localStorage.removeItem('_workouts');
      }
    }
  }
  _editWorkout(e) {
    if (e.target.classList.contains('control__edit'))
      console.log('Target edit', e.target);
    const editId = e.target.dataset.editid; // Retrieve workout ID from dataset
    const workoutToEdit = this.workouts.find(workout => workout._id === editId); // Find workout to edit
    const [lat, lng] = workoutToEdit.coords;
    L.marker([lat, lng], { draggable: false })
      .addTo(map)
      .bindPopup(
        L.popup({
          closeButton: false,
          autoClose: false,
          closeOnEscapeKey: false,
          closeOnClick: false,
          className: `${workoutToEdit.type}-popup`,
        })
      )
      .setPopupContent(workoutToEdit.description)
      .openPopup();
    if (!workoutToEdit) return;

    inputType.value = workoutToEdit.type;
    inputDistance.value = +workoutToEdit.distance;
    inputDuration.value = +workoutToEdit.duration;

    const editedWorkout = {
      ...workoutToEdit,
      type: inputType.value,
      distance: +inputDistance.value,
      duration: +inputDuration.value,
      coords: workoutToEdit.coords,
    };

    if (inputType.value === 'running') {
      inputCadence.value = +workoutToEdit.cadence;
    } else if (inputType.value === 'cycling') {
      inputElevation.value = +workoutToEdit.elevatioGain;
    }
    // Show form for editing
    this._showForm();
    // Remove the workout from the workouts array
    this.workouts.push(editedWorkout);
    const updateEdit = this.workouts.filter(workout => workout._id !== editId);
    this.workouts = updateEdit;
    const finalEdit = this.workouts;

    this.workouts.slice(finalEdit, 1);
    console.log('Final', finalEdit);
    console.log('ALL ', this.workouts);
    this._setLocalStorage();
  }
}

const app = new App();
