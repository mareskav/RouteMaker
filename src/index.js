// Create map
let centerMap = SMap.Coords.fromWGS84(15.5886289, 49.502485);
let map = new SMap(JAK.gel('map'), centerMap, 14);

//Add map layers and controls
map.addDefaultLayer(SMap.DEF_BASE).enable();
map.addDefaultLayer(SMap.DEF_TRAIL).enable();
let markerLayer = map.addLayer(new SMap.Layer.Marker()).enable();
let routeLayer = map.addLayer(new SMap.Layer.Geometry()).enable();
// map.addDefaultContextMenu(); // Menu for right mouse click
map.addDefaultControls();
map.addControl(new SMap.Control.Sync());
let mouse = new SMap.Control.Mouse(
  SMap.MOUSE_PAN | SMap.MOUSE_WHEEL | SMap.MOUSE_ZOOM
);
map.addControl(mouse);

// Change turist trailLayer colors to grayscale
let turistMap = document.getElementsByTagName('div')[9];
turistMap.style.filter = 'grayscale(100%)';

// Global variables
let addPoints = null;
let coords = [];
let routeLength = [];
let totalLength = 0.0;
let numOfClicks = 0;
let strokeColor = 'red';
let routeWidth = 5;
let alertShow = false;

const signalListener = event => {
  if (event.type === 'map-click' && addPoints !== null) {
    addPointMarker(event);
  }
  if (event.type === 'marker-drag-start') {
    startDrag(event);
  }
  if (event.type === 'marker-drag-stop') {
    stopDrag(event);
  }
};
map.getSignals().addListener(window, '*', signalListener);

const startDrag = event => {
  let node = event.target.getContainer();
  node[SMap.LAYER_MARKER].style.cursor = 'grab';
};

const stopDrag = event => {
  let node = event.target.getContainer();
  node[SMap.LAYER_MARKER].style.cursor = 'move';
  coords[(event.target._id - 1).toString()] = event.target.getCoords();
  // addRoute();
};

const addPointMarker = event => {
  let numberMarker = JAK.mel('div');
  let makerImg = JAK.mel('img', {
    src: SMap.CONFIG.img + '/marker/drop-red.png'
  });
  numberMarker.appendChild(makerImg);

  let numberText = JAK.mel(
    'div',
    {},
    {
      position: 'absolute',
      left: '0px',
      top: '2px',
      textAlign: 'center',
      width: '22px',
      color: 'white',
      fontWeight: 'bold'
    }
  );

  numberText.innerHTML = numOfClicks.toString();
  numberMarker.appendChild(numberText);

  let gpsCoords = SMap.Coords.fromEvent(event.data.event, map);
  let marker = new SMap.Marker(gpsCoords, numOfClicks.toString(), {
    title: numOfClicks.toString(),
    url: numberMarker
  });
  // marker.decorate(SMap.Marker.Feature.Draggable);
  marker.decorate(SMap.Marker.Feature.Card);
  numOfClicks += 1;
  markerLayer.addMarker(marker);
  coords = [...coords, gpsCoords];
  addRoute();
};

const findRoute = () => {
  let normalRouteCheckBox = document.getElementById('findRoute');
  let lineRouteCheckBox = document.getElementById('lineRoute');

  let mousePointer = document.getElementsByTagName('div')[19];
  mousePointer.style.cursor =
    normalRouteCheckBox.checked || lineRouteCheckBox.checked
      ? 'crosshair'
      : 'move';

  if (normalRouteCheckBox.checked && addPoints !== 'normal') {
    addPoints = 'normal';
    lineRouteCheckBox.checked = false;
  }
  if (lineRouteCheckBox.checked && addPoints !== 'line') {
    addPoints = 'line';
    normalRouteCheckBox.checked = false;
  }
  if (!normalRouteCheckBox.checked && !lineRouteCheckBox.checked) {
    addPoints = null;
  }
};

const addRoute = () => {
  let options = {
    geometry: true,
    criterion: 'turist1'
  };
  if (coords.length > 1) {
    coords = coords.slice(-2);
    SMap.Route.route(coords, options).then(createRoute);
  }
};

const createRoute = route => {
  let lengthLabel = document.getElementById('routeLabel');
  // newCoords for normal route, coords for line route
  let newCoords =
    addPoints === 'normal' ? route.getResults().geometry : coords.slice(-2);
  let newLength = route.getResults().length;
  routeLength = [...routeLength, newLength];

  const totalLength = routeLength.reduce((a, b) => a + b, 0);
  lengthLabel.innerHTML =
    'Délka trasy: ' + (totalLength / 1000.0).toString() + ' km';
  //let place = map.computeCenterZoom(newCoords);
  //map.setCenterZoom(place[0], place[1]);

  // Add actual distance in km to marker title
  const markerTotalLength = document.querySelector(
    '[title="' + (numOfClicks - 1).toString() + '"]'
  );
  markerTotalLength.title = (totalLength / 1000.0).toString() + ' km';

  const geometryOptions = {
    color: strokeColor,
    outlineOpacity: 0.0,
    width: routeWidth
    //opacity: 0.5
  };

  let geometry = new SMap.Geometry(
    SMap.GEOMETRY_POLYLINE,
    null,
    newCoords,
    geometryOptions
  );
  // console.log(geometry.getOptions());
  routeLayer.addGeometry(geometry);
};

const removeRoute = () => {
  let lengthLabel = document.getElementById('routeLabel');
  routeLayer.removeAll();
  markerLayer.removeAll();
  coords = [];
  totalLength = 0.0;
  numOfClicks = 0;
  lengthLabel.innerHTML =
    'Délka trasy: ' + (totalLength / 1000.0).toString() + ' km';
};

const hidePointMarkers = () => {
  let pointMarkersText = document.getElementById('removePointMarkers');
  if (pointMarkersText.innerHTML === 'Skrýt značky') {
    pointMarkersText.innerHTML = 'Ukázat značky';
    markerLayer.disable();
  } else {
    pointMarkersText.innerHTML = 'Skrýt značky';
    markerLayer.enable();
  }
};

colorChange = trailColor => {
  strokeColor = trailColor;
  Object.values(routeLayer._geometries).map(
    item => (item._options.color = trailColor)
  );
  routeLayer.redraw();
};

const routeWidthChange = () => {
  const newRouteWidth = document.getElementById('routeWidth').value;
  routeWidth = newRouteWidth;
  Object.values(routeLayer._geometries).map(
    item => (item._options.width = newRouteWidth)
  );
  routeLayer.redraw();
};

const showAlert = () => {
  const saveImageAlert = document.getElementById('saveImageAlert');
  saveImageAlert.hidden = !saveImageAlert.hidden;
  alertShow = !alertShow;
};

const saveImg = () => {
  if (!alertShow) {
    showAlert();
  } else {
    showAlert();
    const bigMapSize = () => {
      showLoader();
      const node = document.getElementById('map');
      node.removeAttribute('min-height');
      node.style.height = '5000px';
      node.style.width = '5000px';
      map.addControl(new SMap.Control.Sync());
    };

    const normalMapSize = () => {
      const node = document.getElementById('map');
      node.style.width = null;
      node.style.height = null;
      node.style.minHeight = '90vh';
      map.addControl(new SMap.Control.Sync());
      showLoader();
    };

    let promise = new Promise(bigMapSize);
    promise
      .then(
        setTimeout(
          () =>
            domtoimage
              .toPng(document.getElementById('map'))
              .then(dataUrl => {
                const link = document.createElement('a');
                link.download = 'mapa.png';
                link.href = dataUrl;
                link.click();
              })
              .catch(error => {
                console.error('Oops, no picture generated :(', error);
              }),
          10000
        )
      )
      .then(setTimeout(() => normalMapSize(), 15000));
  }
};

// vanila-picker own color select
const parentBasic = document.querySelector('#colorPicker');
popupBasic = new Picker({ parent: parentBasic, color: strokeColor });
popupBasic.onDone = color => {
  colorChange(color.rgbaString);
};
//Open the popup manually:
popupBasic.openHandler();

const showLoader = () => {
  const loader = document.getElementById('loader');
  const overlay = document.getElementById('overlay');
  loader.hidden = !loader.hidden;
  overlay.hidden = !overlay.hidden;
};

// Search place and center map to it
let inputEl = document.querySelector("input[type='text']");
let suggest = new SMap.Suggest(inputEl);
const suggestFindPlace = suggestData => {
  let suggestPlace = SMap.Coords.fromWGS84(
    suggestData.data.longitude,
    suggestData.data.latitude
  );
  map.setCenterZoom(suggestPlace, 14);
};
suggest.addListener('suggest', suggestFindPlace);
