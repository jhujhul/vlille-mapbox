const API_VLILLE_BASEURL =
  "https://opendata.lillemetropole.fr/api/records/1.0/search/?dataset=vlille-realtime";
let map;
const popups = {};

initializeMap();
displayStationsMarkers();

function initializeMap() {
  mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [3.065183, 50.637522],
    zoom: 15,
  });
  map.addControl(
    new mapboxgl.GeolocateControl({
      trackUserLocation: true,
    })
  );
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
}

function displayStationsMarkers() {
  fetchAllStations().then((stations) => {
    addMarkersToMap(stations);
  });
}

function fetchAllStations() {
  const url = `${API_VLILLE_BASEURL}&rows=300`;
  showSpinner();

  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      hideSpinner();
      return data.records.map(parseStationRecord);
    });
}

function fetchStation(libelle) {
  const url = `${API_VLILLE_BASEURL}&rows=1&q=libelle=${libelle}`;
  showSpinner();

  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      hideSpinner();
      const record = data.records[0];

      return parseStationRecord(record);
    });
}

function showSpinner() {
  const spinner = getSpinnerElement();
  spinner.style.visibility = "visible";
}

function hideSpinner() {
  const spinner = getSpinnerElement();
  spinner.style.visibility = "hidden";
}

function getSpinnerElement() {
  return document.getElementById("spinner");
}

function parseStationRecord(record) {
  record.fields.geo = record.geometry.coordinates;
  return record.fields;
}

function addMarkersToMap(stations) {
  const TAILWIND_RED_700 = "#C53030";

  stations.forEach((station) => {
    const popup = new mapboxgl.Popup().setHTML(getPopupHTML(station));

    popups[station.libelle] = popup;

    var marker = new mapboxgl.Marker({ color: TAILWIND_RED_700 })
      .setLngLat(station.geo)
      .setPopup(popup)
      .addTo(map);
  });
}

export function updateStation(libelle) {
  fetchStation(libelle).then((station) => {
    const stationPopup = popups[station.libelle];
    stationPopup.setHTML(getPopupHTML(station));
  });
}

function getPopupHTML(station) {
  const estEnService = station.etat === "EN SERVICE";
  const classEtat = estEnService ? "text-green-500" : "text-red-600 font-bold";

  const accepteLesCB = station.type === "AVEC TPE";
  const cbIcon = `
    <span class="ml-2 text-blue-700">
      <svg class="fill-current w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M18 6V4H2v2h16zm0 4H2v6h16v-6zM0 4c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm4 8h4v2H4v-2z"/>
      </svg>
    </span>
  `;

  const dateMiseAJour = new Date(station.datemiseajour).toLocaleTimeString();

  return `
    <div class="leading-tight pr-2" style="min-width: 130px;">
      <div class="flex justify-between leading-none">
        <h3 class="text-sm text-red-700">${station.nom}</h3>
        ${accepteLesCB ? cbIcon : ""}
      </div>
      <div class="mb-2">
        <span class="${classEtat}">${station.etat.toLowerCase()}</span>
      </div>
      <div>
        ${station.nbvelosdispo} <span class="font-bold">vélos</span> disponibles
      </div>
      <div>
        ${
          station.nbplacesdispo
        } <span class="font-bold">places</span> disponibles
      </div>
      <div class="flex items-center mt-2">
        <span class="text-gray-600">
          Mis à jour à ${dateMiseAJour}
        </span>
        <button onclick="Main.updateStation(${
          station.libelle
        })" class="focus:outline-none border border-gray-600 text-gray-600 rounded-full p-1 hover:border-gray-800 hover:text-gray-800 ml-2">
          <svg class="fill-current w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M10 3v2a5 5 0 0 0-3.54 8.54l-1.41 1.41A7 7 0 0 1 10 3zm4.95 2.05A7 7 0 0 1 10 17v-2a5 5 0 0 0 3.54-8.54l1.41-1.41zM10 20l-4-4 4-4v8zm0-12V0l4 4-4 4z"/>
          </svg>
        </button>
      </div>
    <div>
  `;
}
