// Lists all the locations of Tokyo

var locations = [{
    title: 'Mt. Fuji',
    location: {
      lat: 35.3605547,
      lng: 138.7190229,
    },
  },
  {
    title: 'Tokyo Skytree',
    location: {
      lat: 35.7100627,
      lng: 139.8085117,
    },
  },
  {
    title: 'Akihabara',
    location: {
      lat: 35.7022077,
      lng: 139.7722703,
    },
  },
  {
    title: 'Ghibli Musuem',
    location: {
      lat: 35.696238,
      lng: 139.568243,
    },
  },
  {
    title: 'Meiji Shrine',
    location: {
      lat: 35.6763976,
      lng: 139.6971372,
    },
  },
  {
    title: 'Shibuya',
    location: {
      lat: 35.6668475,
      lng: 139.6576066,
    },
  },
  {
    title: 'Shinjuku',
    location: {
      lat: 35.7015201,
      lng: 139.6741875,
    },
  },
  {
    title: 'Chichibu',
    location: {
      lat: 35.9827745,
      lng: 138.8038108,
    },
  },
  {
    title: 'Roppongi',
    location: {
      lat: 35.6628732,
      lng: 139.7248504,
    },
  },
];
var map;
var infoWindow;
var bounds;

function initMap() {
  var sciencecity = {
    lat: 35.689488,
    lng: 139.691706,
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 3,
    center: sciencecity,
    mapTypeControl: false
  });

  infoWindow = new google.maps.InfoWindow();

  bounds = new google.maps.LatLngBounds();

  ko.applyBindings(new ViewModel());
}

// Notifies when any error has occurred
function googleError() {
  alert('An error occurred with Google Maps!');
}

var LocationMarker = function(data) {
  var self = this;

  this.title = data.title;
  this.position = data.location;
  this.street = '',
    this.city = '',
    this.phone = '';

  this.visible = ko.observable(true);

  // Before the marker is clicked, it'll have a default color
  // When it IS clicked, it'll change colors
  var defaultIcon = makeMarkerIcon('70B1C6');
  var highlightedIcon = makeMarkerIcon('DCA7B4');

  // Foursquare ID and Secret
  var clientID = 'ZWUUBKK1I53USZNDUBUZDH2WT2LGKPYENH1CSOKLOBWU13LU';
  var clientSecret = 'LLIN2CTUXS40RH24KJQGBYKOBCALWS1H4ZZZXMOOIKCEWIL1';

  // get JSON request of foursquare data
  var reqURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.title;

  $.getJSON(reqURL).done(function(data) {
    var results = data.response.venues[0];
    self.street = results.location.formattedAddress[0] ? results.location.formattedAddress[0] : 'N/A';
    self.city = results.location.formattedAddress[1] ? results.location.formattedAddress[1] : 'N/A';
    self.phone = results.contact.formattedPhone ? results.contact.formattedPhone : 'N/A';
  }).fail(function() {
    alert('Something went wrong with foursquare');
  });

  // Creates an array for the markers and does it by location
  this.marker = new google.maps.Marker({
    position: this.position,
    title: this.title,
    animation: google.maps.Animation.DROP,
    icon: defaultIcon
  });

  self.filterMarkers = ko.computed(function() {
    if (self.visible() === true) {
      self.marker.setMap(map);
      bounds.extend(self.marker.position);
      map.fitBounds(bounds);
    } else {
      self.marker.setMap(null);
    }
  });

  // Shows a preview, infowindow, when a marker is clicked
  this.marker.addListener('click', function() {
    populateInfoWindow(this, self.street, self.city, self.phone, infoWindow);
    toggleBounce(this);
    map.panTo(this.getPosition());
  });

  // Marker animation
  this.bounce = function(place) {
    google.maps.event.trigger(self.marker, 'click');
  };

  // Two event listeners - one for mouseover, one for mouseout,
  // to change the colors back and forth.
  this.marker.addListener('mouseover', function() {
    this.setIcon(highlightedIcon);
  });
  this.marker.addListener('mouseout', function() {
    this.setIcon(defaultIcon);
  });

  // Gives detail on a selected marker
  this.show = function(location) {
    google.maps.event.trigger(self.marker, 'click');
  };
};

/* View Model */
var ViewModel = function() {
  var self = this;

  this.searchItem = ko.observable('');

  this.mapList = ko.observableArray([]);

  // Drops a marker for each location
  locations.forEach(function(location) {
    self.mapList.push(new LocationMarker(location));
  });

  this.locationList = ko.computed(function() {
    var searchFilter = self.searchItem().toLowerCase();
    if (searchFilter) {
      return ko.utils.arrayFilter(self.mapList(), function(location) {
        var str = location.title.toLowerCase();
        var result = str.includes(searchFilter);
        location.visible(result);
        return result;
      });
    }
    self.mapList().forEach(function(location) {
      location.visible(true);
    });
    return self.mapList();
  }, self);
};

function populateInfoWindow(marker, street, city, phone, infowindow) {
  if (infowindow.marker != marker) {
    infowindow.setContent('');
    infowindow.marker = marker;

    // Closes out the infowindow
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;

    var windowContent = '<h4>' + marker.title + '</h4>' +
      '<p>' + street + "<br>" + city + '<br>' + phone + "</p>";


    var getStreetView = function(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
        infowindow.setContent(windowContent + '<div id="pano"></div>');
        var panoramaOptions = {
          position: nearStreetViewLocation,
          pov: {
            heading: heading,
            pitch: 20
          }
        };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent(windowContent + '<div style="color: red">No Street View Found</div>');
      }
    };

    // Enables a streetview option
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    infowindow.open(map, marker);
  }
}

function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
      marker.setAnimation(null);
    }, 1400);
  }
}

function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21, 34));
  return markerImage;
}
