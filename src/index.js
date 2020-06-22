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

// Change tourist or trail Layer colours to grayscale
const numOfDivTags = 10;
let touristMap = document.getElementsByTagName('div')[numOfDivTags + 2];
touristMap.style.filter = 'grayscale(100%)';
let trailMap = document.getElementsByTagName('div')[numOfDivTags];

// Global variables
//TODO: Get rid of global variables (after testing with mapy.cz API is finished)
//TODO: Too many unnecessary variables, get rid of some of them
let addPoints = null;
let marker = [];
let geometry = [];
let coords = [];
let coordsToFile = [];
let routeLength = [];
let totalLength = 0.0;
let numOfClicks = 0;
let strokeColor = 'red';
let routeWidth = 5.5;
let alertShow = false;
let printMap = false;
let timeSetLoadEvent = 0;

const signalListener = async event => {
  if (event.type === 'map-click' && addPoints !== null) {
    addPointMarker(event);
  }
  // if (event.type === 'marker-drag-start') {
  //   startDrag(event);
  // }
  // if (event.type === 'marker-drag-stop') {
  //   stopDrag(event);
  // }

  if (event.type === 'tileset-load' && printMap) {
    // mapy.cz API triggers tile-set-load 2 times when map loaded, we don´t want to download 2 images
    timeSetLoadEvent += 1;
    if (timeSetLoadEvent > 1) {
      // Wait 2 s just for slower internet loading
      setTimeout(async () => await domToImage(), 2000);
    }
  }
};
map.getSignals().addListener(window, '*', signalListener);

// const startDrag = event => {
//   let node = event.target.getContainer();
//   node[SMap.LAYER_MARKER].style.cursor = 'grab';
// };
//
// const stopDrag = event => {
//   let node = event.target.getContainer();
//   node[SMap.LAYER_MARKER].style.cursor = 'move';
//   coords[(event.target._id - 1).toString()] = event.target.getCoords();
//   addRoute();
// };

const addPointMarker = (event, onePoint = null) => {
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

  let gpsCoords = !onePoint
    ? SMap.Coords.fromEvent(event.data.event, map)
    : onePoint;
  const newMarker = new SMap.Marker(gpsCoords, numOfClicks.toString(), {
    title: numOfClicks.toString(),
    url: numberMarker
  });
  marker = [...marker, newMarker];
  // marker.decorate(SMap.Marker.Feature.Draggable);
  // marker.decorate(SMap.Marker.Feature.Card);
  numOfClicks += 1;
  markerLayer.addMarker(newMarker);
  if (!onePoint) {
    coordsToFile = [
      ...coordsToFile,
      { ...gpsCoords, point: addPoints, color: strokeColor, width: routeWidth }
    ];
    coords = [...coords, gpsCoords];
    addRoute();
  }
};

const findRoute = () => {
  let normalRouteCheckBox = document.getElementById('findRoute');
  let lineRouteCheckBox = document.getElementById('lineRoute');

  let mousePointer = document.getElementsByTagName('div')[numOfDivTags + 12];
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
    SMap.Route.route(coords.slice(-2), options).then(createRoute);
  }
};

const createRoute = route => {
  let currentCoords = coords.slice(-2);
  // newCoords from geometry for normal route, from currentCoords for line route
  let newCoords =
    addPoints === 'normal' ? route.getResults().geometry : currentCoords;
  let newLength =
    addPoints === 'normal'
      ? route.getResults().length
      : SMap.Coords.fromWGS84(currentCoords[0].x, currentCoords[0].y).distance(
          currentCoords[1]
        );
  routeLength = [...routeLength, newLength];
  coordsToFile[coordsToFile.length - 1] = {
    ...coordsToFile[coordsToFile.length - 1],
    distance: newLength
  };

  showTotalDistance();
  //let place = map.computeCenterZoom(newCoords);
  //map.setCenterZoom(place[0], place[1]);

  // Add actual distance in km to marker title
  const markerTotalLength = document.querySelector(
    '[title="' + (numOfClicks - 1).toString() + '"]'
  );
  markerTotalLength.title =
    (totalLength / 1000.0).toFixed(3).toString() + ' km';

  const geometryOptions = {
    color: strokeColor,
    outlineOpacity: 0.0,
    width: routeWidth
    //opacity: 0.5
  };

  const newGeometry = new SMap.Geometry(
    SMap.GEOMETRY_POLYLINE,
    null,
    newCoords,
    geometryOptions
  );
  geometry = [...geometry, newGeometry];
  routeLayer.addGeometry(newGeometry);
};

const removeRoute = (loadMoreRoutes = false) => {
  if (!loadMoreRoutes) {
    routeLayer.removeAll();
  }
  markerLayer.removeAll();
  marker = [];
  geometry = [];
  coords = [];
  coordsToFile = [];
  routeLength = [];
  totalLength = 0.0;
  numOfClicks = 0;
  strokeColor = 'red';
  routeWidth = 5.5;
  document.getElementById('routeWidth').value = 5.5;
  alertShow = false;
  showTotalDistance();
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

const changeTouristMapColour = () => {
  const pointMarkersText = document.getElementById('changeTouristMapColour');
  if (pointMarkersText.innerHTML === 'Barevná podkladová mapa') {
    pointMarkersText.innerHTML = 'Černobílá podkladová mapa';
    touristMap.style.filter = 'grayscale(0%)';
  } else {
    pointMarkersText.innerHTML = 'Barevná podkladová mapa';
    touristMap.style.filter = 'grayscale(100%)';
  }
};

const changeRouteMapColour = () => {
  let pointMarkersText = document.getElementById('changeRouteMapColour');
  if (pointMarkersText.innerHTML === 'Vše černobílé') {
    pointMarkersText.innerHTML = 'Barevné vlastní a turistické trasy';
    trailMap.style.filter = 'grayscale(100%)';
  } else {
    pointMarkersText.innerHTML = 'Vše černobílé';
    trailMap.style.filter = 'grayscale(0%)';
  }
};

const removeLastMarker = () => {
  coords.splice(-1, 1);
  coordsToFile.splice(-1, 1);
  numOfClicks -= 1;
  markerLayer.removeMarker(marker.slice(-1)[0]);
  routeLayer.removeGeometry(geometry.slice(-1)[0]);
  marker.pop();
  geometry.pop();
  routeLength.pop();
  showTotalDistance();
};

const colourChange = trailColor => {
  strokeColor = trailColor;
  Object.values(routeLayer._geometries).map(
    item => (item._options.color = trailColor)
  );
  coordsToFile.map(item => (item.color = trailColor));
  routeLayer.redraw();
};

const routeWidthChange = () => {
  const newRouteWidth = document.getElementById('routeWidth').value;
  routeWidth = newRouteWidth;
  Object.values(routeLayer._geometries).map(
    item => (item._options.width = newRouteWidth)
  );
  coordsToFile.map(item => (item.width = newRouteWidth));
  routeLayer.redraw();
};

const showTotalDistance = () => {
  let lengthLabel = document.getElementById('routeLabel');
  totalLength = routeLength.reduce((a, b) => a + b, 0);
  lengthLabel.innerHTML =
    'Délka trasy: ' + (totalLength / 1000.0).toFixed(3).toString() + ' km';
};

const showAlert = () => {
  const saveImageAlert = document.getElementById('saveImageAlert');
  saveImageAlert.hidden = !saveImageAlert.hidden;
  alertShow = !alertShow;
};

const downloadRouteTxt = () => {
  let element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(coordsToFile))
  );
  element.setAttribute('download', 'trasa.txt');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const uploadRouteTxt = async routeFile => {
  await readFile(routeFile);
  // Delete uploaded file info from input
  document.getElementById('uploadFile').value = '';

  const promises = coords.map(async (item, index) => {
    // Add point marker numbers and add distance titles later
    addPointMarker(event, item);

    // Create route on map from file
    if (index > 0) {
      let actualCoords = [coords[index - 1], coords[index]];
      let options = {
        geometry: true,
        criterion: 'turist1'
      };
      const geometryOptions = {
        color: strokeColor,
        outlineOpacity: 0.0,
        width: routeWidth
        //opacity: 0.5
      };
      const route = await SMap.Route.route(actualCoords, options);

      let newCoords =
        coordsToFile[index].point === 'normal'
          ? route.getResults().geometry
          : actualCoords;
      const newGeometry = new SMap.Geometry(
        SMap.GEOMETRY_POLYLINE,
        null,
        newCoords,
        geometryOptions
      );
      geometry = [...geometry, newGeometry];
      routeLayer.addGeometry(newGeometry);
    }
  });
  await Promise.all(promises);
  addDistancesFromSavedFile();
};

const addDistancesFromSavedFile = () => {
  // Add actual distance in km to marker title and routeLabel
  let actualDistance = 0;
  coords.map((item, index) => {
    if (index > 0) {
      const routeLabel = document.getElementById('routeLabel');
      const markerTotalDistance = document.querySelector(
        '[title="' + index.toString() + '"]'
      );
      actualDistance += routeLength[index];
      let actualDistanceToString = (actualDistance / 1000.0)
        .toFixed(3)
        .toString();

      routeLabel.innerHTML = 'Délka trasy: ' + actualDistanceToString + ' km';
      markerTotalDistance.title = actualDistanceToString + ' km';
    }
  });
};

const readFile = routeFile => {
  removeRoute(true);
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = e => {
      let readCoords = JSON.parse(reader.result).map(item =>
        SMap.Coords.fromWGS84(item.x, item.y)
      );
      let readDistances = JSON.parse(reader.result).map(item =>
        item.distance ? item.distance : null
      );
      strokeColor = JSON.parse(reader.result)[0].color
        ? JSON.parse(reader.result)[0].color
        : 'red';
      routeWidth = JSON.parse(reader.result)[0].width
        ? JSON.parse(reader.result)[0].width
        : 5.5;
      document.getElementById('routeWidth').value = routeWidth;
      routeLength = readDistances;
      coordsToFile = JSON.parse(reader.result);
      resolve((coords = readCoords));
    };
    reader.readAsText(routeFile[0]);
  });
};

const saveImg = async () => {
  if (!alertShow) {
    showAlert();
  } else {
    showAlert();
    await bigMapSize();
    printMap = true;
  }
};

const bigMapSize = async () => {
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

const domToImage = async () => {
  domtoimage
    .toPng(document.getElementById('map'))
    .then(dataUrl => {
      printMap = false;
      const link = document.createElement('a');
      link.download = 'mapa.png';
      link.href = dataUrl;
      link.click();
      normalMapSize();
    })
    .catch(error => {
      console.error('Oops, no picture generated :(', error);
    });
};

// vanila-picker own color select
const parentBasic = document.querySelector('#colorPicker');
popupBasic = new Picker({ parent: parentBasic, color: strokeColor });
popupBasic.onDone = color => {
  colourChange(color.rgbaString);
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
