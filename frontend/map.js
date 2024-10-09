let myMap;

async function initialMap() {
    let mapOptions;
    var SIT = {
        lat: 35.63086715908561,
        lng: 139.88285876755307,
    };
    mapOptions = { zoom: 12, center: SIT, mapId: "map1" };
    myMap = new google.maps.Map(document.getElementById('mapDisplay'), mapOptions);

    const headQuarter = {
        position: SIT,
        title: "Disney Tokyo"
    };

    const markerImage = {
        url: '../project/logo.png', // Path to the uploaded image
        scaledSize: new google.maps.Size(70, 70) // Adjust the size as needed
    };

    const myMarker = new google.maps.Marker({
        position: headQuarter.position,
        map: myMap,
        title: headQuarter.title,
        icon: markerImage
    });
}


//   myMap = new google.maps.Map(document.getElementById('mapDisplay'), mapOption);

//   headQuater = {
//       position: {
//           lat: 35.63086715908561, 
//           lng: 139.88285876755307}, 
//   title:"Disney Tokyo" }
//   const{AdvancedMarkerElement, PinElement} = 
//   await google.maps.importLibrary("marker");
//   myMarker = new google.maps.marker.AdvancedMarkerElement(headQuater);
//   myMarker.setMap(myMap);
//   const myMarker = new google.maps.Marker({
//     position: headQuater.position,
//     map: myMap,
//     title: headQuater.title,
//     icon: {
//       url: 'logo.png',
//       scaledSize: new google.maps.Size(width, height) // ขนาดของรูปภาพ (ถ้าต้องการ)
//     }
//   });
// }
  
//   // const marakerImage = {
//   //   url:'logo.png',
//   //   // scaledSize: 
//   // };
//   // for (let index = 0; index < branchArray.length; index++) {
//   //   myMarker =
//   //   new google.maps.marker.AdvancedMarkerElement(
//   //                  branchArray[index]);
//   //     myMarker.setMap(myMap);
//   // }

//   // customerMarker = { position: SIT,
//   // title:" PLease drag the maraker to ypur place ",
//   // icon: {url:"http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"},
//   // draggable:true};
//   // customerPin = new google.maps.Marker(customerMarker);
//   // customerPin.setMap(myMap);
  
//   google.maps.event.addListener(customerPin,"dragend", 
//   function (event) {
//   customerLat = this.position.lat();
//   customerLng = this.position.lng();
//   document.getElementById('userLat').value = customerLat;
//   document.getElementById('userLng').value = customerLng;    
//   }) 

