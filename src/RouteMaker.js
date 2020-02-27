// import {
//   map,
//   markerLayer,
//   routeLayer,
//   addPoints,
//   addLinePoints
// } from './index.js';
//
// let coords = [];
//
// // Move with markers by drag and drop
// const startDrag = event => {
//   let node = event.target.getContainer();
//   node[SMap.LAYER_MARKER].style.cursor = 'grab';
// };
//
// const stopDrag = event => {
//   let node = event.target.getContainer();
//   node[SMap.LAYER_MARKER].style.cursor = 'move';
//   let dragCoords = event.target.getCoords();
//   coords[(event.target._id - 1).toString()] = dragCoords;
//   addRoute(coords);
// };
//
// let numOfClicks = 1;
// const addPointMarker = event => {
//   let numberMarker = JAK.mel('div');
//   let makerImg = JAK.mel('img', {
//     src: SMap.CONFIG.img + '/marker/drop-red.png'
//   });
//   numberMarker.appendChild(makerImg);
//
//   let numberText = JAK.mel(
//     'div',
//     {},
//     {
//       position: 'absolute',
//       left: '0px',
//       top: '2px',
//       textAlign: 'center',
//       width: '22px',
//       color: 'white',
//       fontWeight: 'bold'
//     }
//   );
//
//   numberText.innerHTML = numOfClicks.toString();
//   numberMarker.appendChild(numberText);
//
//   let gpsCoords = SMap.Coords.fromEvent(event.data.event, map);
//   let marker = new SMap.Marker(gpsCoords, numOfClicks.toString(), {
//     url: numberMarker
//   });
//   marker.decorate(SMap.Marker.Feature.Draggable);
//   numOfClicks += 1;
//   //console.log(marker.getId())
//   markerLayer.addMarker(marker);
//   coords.push(gpsCoords);
//   addRoute(coords);
// };
//
// const findRouteButton = () => {
//   let checkBox = document.getElementById('findRoute');
//   let mousePointer = document.getElementsByTagName('div')[6];
//   mousePointer.style.cursor = checkBox.checked ? 'crosshair' : 'move';
//   addPoints = checkBox.checked ? 'true' : 'false';
// };
//
// const lineRouteButton = () => {
//   let checkBox = document.getElementById('lineRoute');
//   let mousePointer = document.getElementsByTagName('div')[6];
//   mousePointer.style.cursor = checkBox.checked ? 'crosshair' : 'move';
//   addLinePoints = checkBox.checked ? 'true' : 'false';
// };
//
// let strokeColor = 'red';
// const handleColorChange = strokeColor => {
//   addRoute(coords);
// };
//
// const addRoute = () => {
//   // TODO: Pridat if, kdyz jsou jen 2 body
//   let options = {
//     geometry: true,
//     criterion: 'turist1'
//   };
//   if (addLinePoints === 'true') {
//     SMap.Route.route(coords, options).then(createLineRoute);
//   } else {
//     SMap.Route.route(coords, options).then(createRoute);
//   }
// };
//
// let totalLength = 0.0;
// const createRoute = route => {
//   let lengthLabel = document.getElementById('routeLabel');
//   //routeLayer.removeAll()
//   let newCoords = route.getResults().geometry;
//   let newLength = route.getResults().length;
//   totalLength = totalLength + newLength;
//   lengthLabel.innerHTML =
//     'Délka trasy: ' + (totalLength / 1000.0).toString() + ' km';
//   //let place = map.computeCenterZoom(newCoords);
//   //map.setCenterZoom(place[0], place[1]);
//   let geometry = new SMap.Geometry(SMap.GEOMETRY_POLYLINE, null, newCoords, {
//     color: strokeColor
//     //opacity: 0.5,
//     //outlineOpacity: 0.0,
//     //width: 5,
//   });
//   //console.log(geometry.getOptions())
//   routeLayer.addGeometry(geometry);
// };
//
// const createLineRoute = route => {
//   let lengthLabel = document.getElementById('routeLabel');
//   //routeLayer.removeAll()
//   let newLength = route.getResults().length;
//   totalLength = totalLength + newLength;
//   lengthLabel.innerHTML =
//     'Délka trasy: ' + (totalLength / 1000.0).toString() + ' km';
//   let geometry = new SMap.Geometry(SMap.GEOMETRY_POLYLINE, null, coords, {
//     color: strokeColor
//     //opacity: 0.5,
//     //outlineOpacity: 0.0,
//     //width: 5,
//   });
//   //console.log(geometry.getOptions())
//   routeLayer.addGeometry(geometry);
// };
//
// const removePointMarkersButton = () => {
//   let pointMarkersText = document.getElementById('removePointMarkers');
//   if (pointMarkersText.innerHTML === 'Skrýt značky') {
//     pointMarkersText.innerHTML = 'Ukázat značky';
//     markerLayer.disable();
//   } else {
//     pointMarkersText.innerHTML = 'Skrýt značky';
//     markerLayer.enable();
//   }
// };
//
// const saveImgButton = () => {
//   html2canvas(document.getElementById('map')).then(function(canvas) {
//     let link = document.createElement('a');
//     document.body.appendChild(link);
//     link.download = 'map.jpg';
//     link.href = canvas.toDataURL();
//     link.target = '_blank';
//     link.click();
//   });
// };
