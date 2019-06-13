// Create map
let centerMap = SMap.Coords.fromWGS84(15.5886289, 49.502485)
let map = new SMap(JAK.gel("map"), centerMap, 14)

//Add map layers and controls
map.addDefaultLayer(SMap.DEF_BASE).enable()
map.addDefaultLayer(SMap.DEF_TRAIL).enable()
let markerLayer = map.addLayer(new SMap.Layer.Marker()).enable()
let routeLayer = map.addLayer(new SMap.Layer.Geometry()).enable()
map.addDefaultContextMenu() // Menu for right mouse click
map.addDefaultControls()
map.addControl(new SMap.Control.Sync())
let mouse = new SMap.Control.Mouse(
  SMap.MOUSE_PAN | SMap.MOUSE_WHEEL | SMap.MOUSE_ZOOM
)
map.addControl(mouse)

// Change turist trailLayer colors to grayscale
let turistMap = document.getElementsByTagName("div")[8]
turistMap.style.filter = "grayscale(100%)"

let strokeColor = "red"
colorChange = trailColor => {
  strokeColor = trailColor
  addRoute(coords)
}

// Find easiest route
let addPoints = "false"
let addLinePoints = "false"
let coords = []

const signalListener = event => {
  if (
    event.type === "map-click" &&
    (addPoints === "true" || addLinePoints === "true")
  ) {
    addPointMarker(event)
  }
  if (event.type === "marker-drag-start") {
    startDrag(event)
  }
  if (event.type === "marker-drag-stop") {
    stopDrag(event)
  }
}
map.getSignals().addListener(window, "*", signalListener)

const startDrag = event => {
  let node = event.target.getContainer()
  node[SMap.LAYER_MARKER].style.cursor = "grab"
}

const stopDrag = event => {
  let node = event.target.getContainer()
  node[SMap.LAYER_MARKER].style.cursor = "move"
  let dragCoords = event.target.getCoords()
  coords[(event.target._id - 1).toString()] = dragCoords
  addRoute(coords)
}

let numOfClicks = 1
const addPointMarker = event => {
  let numberMarker = JAK.mel("div")
  let makerImg = JAK.mel("img", {
    src: SMap.CONFIG.img + "/marker/drop-red.png"
  })
  numberMarker.appendChild(makerImg)

  let numberText = JAK.mel(
    "div",
    {},
    {
      position: "absolute",
      left: "0px",
      top: "2px",
      textAlign: "center",
      width: "22px",
      color: "white",
      fontWeight: "bold"
    }
  )

  numberText.innerHTML = numOfClicks.toString()
  numberMarker.appendChild(numberText)

  let gpsCoords = SMap.Coords.fromEvent(event.data.event, map)
  let marker = new SMap.Marker(gpsCoords, numOfClicks.toString(), {
    url: numberMarker
  })
  marker.decorate(SMap.Marker.Feature.Draggable)
  numOfClicks += 1
  //console.log(marker.getId())
  markerLayer.addMarker(marker)
  coords.push(gpsCoords)
  addRoute(coords)
}

findRoute.onclick = () => {
  let checkBox = document.getElementById("findRoute")
  let mousePointer = document.getElementsByTagName("div")[6]
  mousePointer.style.cursor = checkBox.checked ? "crosshair" : "move"
  addPoints = checkBox.checked ? "true" : "false"
}

lineRoute.onclick = () => {
  let checkBox = document.getElementById("lineRoute")
  let mousePointer = document.getElementsByTagName("div")[6]
  mousePointer.style.cursor = checkBox.checked ? "crosshair" : "move"
  addLinePoints = checkBox.checked ? "true" : "false"
}

let totalLength = 0.0

const addRoute = () => {
  // TODO: Pridat if, kdyz jsou jen 2 body
  let options = {
    geometry: true,
    criterion: "turist1"
  }
  if (addLinePoints === "true") {
    SMap.Route.route(coords, options).then(createLineRoute)
  } else {
    SMap.Route.route(coords.slice(-2), options).then(createRoute)
  }
}

const createRoute = route => {
  let lengthLabel = document.getElementById("routeLabel")
  //routeLayer.removeAll()
  let newCoords = route.getResults().geometry
  let newLength = route.getResults().length
  totalLength = totalLength + newLength
  lengthLabel.innerHTML =
    "Délka trasy: " + (totalLength / 1000.0).toString() + " km"
  //let place = map.computeCenterZoom(newCoords);
  //map.setCenterZoom(place[0], place[1]);
  let geometry = new SMap.Geometry(SMap.GEOMETRY_POLYLINE, null, newCoords, {
    color: strokeColor
    //opacity: 0.5,
    //outlineOpacity: 0.0,
    //width: 5,
  })
  //console.log(geometry.getOptions())
  routeLayer.addGeometry(geometry)
}

const createLineRoute = route => {
  let lengthLabel = document.getElementById("routeLabel")
  //routeLayer.removeAll()
  let newLength = route.getResults().length
  totalLength = totalLength + newLength
  lengthLabel.innerHTML =
    "Délka trasy: " + (totalLength / 1000.0).toString() + " km"
  let geometry = new SMap.Geometry(
    SMap.GEOMETRY_POLYLINE,
    null,
    coords.slice(-2),
    {
      color: strokeColor
      //opacity: 0.5,
      //outlineOpacity: 0.0,
      //width: 5,
    }
  )
  //console.log(geometry.getOptions())
  routeLayer.addGeometry(geometry)
}

removePointMarkers.onclick = () => {
  let pointMarkersText = document.getElementById("removePointMarkers")
  if (pointMarkersText.innerHTML === "Skrýt značky") {
    pointMarkersText.innerHTML = "Ukázat značky"
    markerLayer.disable()
  } else {
    pointMarkersText.innerHTML = "Skrýt značky"
    markerLayer.enable()
  }
}

saveImg.onclick = () => {
  html2canvas(document.getElementById("map"), (allowTaint = true)).then(
    function(canvas) {
      let link = document.createElement("a")
      document.body.appendChild(link)
      link.download = "map.jpg"
      link.href = canvas.toDataURL()
      link.target = "_blank"
      link.click()
    }
  )
}

// Search place and center map to it
let inputEl = document.querySelector("input[type='text']")
let suggest = new SMap.Suggest(inputEl)
const suggestFindPlace = suggestData => {
  let suggestPlace = SMap.Coords.fromWGS84(
    suggestData.data.longitude,
    suggestData.data.latitude
  )
  map.setCenterZoom(suggestPlace, 14)
}
suggest.addListener("suggest", suggestFindPlace)