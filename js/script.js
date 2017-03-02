'use strict';

var initialLocations = [
	{
		name: 'Papa Razzi',
		lat: 42.299867,
		long: -71.400919
	},
	{
		name: 'Aegean Restaurant',
		lat: 42.302002,
		long: -71.403340
	},
	{
		name: 'Sichuan Gourmet',
		lat: 42.298846,
		long: -71.405591
	},
	{
		name: 'Big Fresh Cafe',
		lat: 42.298195,
		long: -71.394985
	},
	{
		name: 'Thai Place Restaurant',
		lat: 42.298122,
		long: -71.406423
	},
	{
		name: 'Bella Costa',
		lat: 42.300266,
		long: -71.407886
	}
];

// Declaring global variables now to satisfy strict mode
var map;
var clientID;
var clientSecret;
var bound;

function runApp() {
	//Google Map object and map options
	map = new google.maps.Map(document.getElementById('map'), {
				zoom: 15,
				center: {lat: 42.298846, lng: -71.405591}
		});

	// Recenter map upon window resize
	google.maps.event.addDomListener(window, "resize", function() {
     var center = map.getCenter();
     google.maps.event.trigger(map, "resize");
     map.setCenter(center);
    });

	// Recenter map upon button click
	$("#clear").click(function() {
		document.getElementById("search-box").value = "";
		this.searchTerm = ko.observable("");
	});

	//Creating Location Objects
	var Location = function(data) {
		var self = this;
		this.name = data.name;
		this.lat = data.lat;
		this.long = data.long;
		this.URL = "";
		this.street = "";
		this.city = "";

		this.visible = ko.observable(true);

		//Foursquare API Call
		var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll='+ this.lat + ',' + this.long + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.name;

		//Getting JSON data from the Foursquare API
		$.getJSON(foursquareURL).done(function(data) {
			var results = data.response.venues[0];
			self.URL = results.url;
			if (typeof self.URL === 'undefined'){
				self.URL = "";
			}
			self.street = results.location.formattedAddress[0];
	     	self.city = results.location.formattedAddress[1];
		}).fail(function() {
			alert("There was an error with the Foursquare API call. Please refresh the page and try again to load Foursquare data.");
		});

		//Content for infoWindow
		this.contentString = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
	        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
	        '<div class="content">' + self.street + "</div>" +
	        '<div class="content">' + self.city + "</div>"+'<div class="content">' + self.photoUrl + "</div>";

	    //Create infoWindow containing the content
		this.infoWindow = new google.maps.InfoWindow({content: self.contentString});

		//Creating the marker element per location item
		this.marker = new google.maps.Marker({
				position: new google.maps.LatLng(data.lat, data.long),
				map: map,
				title: data.name
		});

		this.showMarker = ko.computed(function() {
			if(this.visible() === true) {
				this.marker.setMap(map);
			} else {
				this.marker.setMap(null);
			}
			return true;
		}, this);

		this.marker.addListener('click', function(){
			self.contentString = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
	        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
	        '<div class="content">' + self.street + "</div>" +
	        '<div class="content">' + self.city + "</div>";

	        self.infoWindow.setContent(self.contentString);

			self.infoWindow.open(map, this);

			self.marker.setAnimation(google.maps.Animation.BOUNCE);
	      	setTimeout(function() {
	      		self.marker.setAnimation(null);
	     	}, 2100);
		});

		// Close infowindow when clicked elsewhere on the map
	    map.addListener("click", function(){
	    	self.infoWindow.close(self.infoWindow);
	  	});

	    //Bounce effect to marker
		this.bounce = function(place) {
			google.maps.event.trigger(self.marker, 'click');
		};
	};

	function AppViewModel() {
		var self = this;

		// Nav button control
	    this.isNavClosed = ko.observable(true);
	    this.navClick = function () {
	      this.isNavClosed(!this.isNavClosed());
	    };
		this.searchTerm = ko.observable("");

		this.locationList = ko.observableArray([]);

		// Foursquare API settings
		clientID = "ZY3HMEJVKWTUM2HP1JLJSO0JZAK24CFODQBH41KU1TIXWRFS";
		clientSecret = "CWH0NBE3RRW2B5Z1UAM3ZXXRMZUR1BOSMV015OOPSPSQ4KTZ";

		initialLocations.forEach(function(locationItem){
			self.locationList.push( new Location(locationItem));
		});

		//Filter the location list
		this.filteredList = ko.computed( function() {
			var filter = self.searchTerm().toLowerCase();
			if (!filter) {
				self.locationList().forEach(function(locationItem){
					locationItem.visible(true);
				});
				return self.locationList();
			} else {
				return ko.utils.arrayFilter(self.locationList(), function(locationItem) {
					var string = locationItem.name.toLowerCase();
					var result = (string.search(filter) >= 0);
					locationItem.visible(result);
					return result;
				});
			}
		}, self);

		this.mapElem = document.getElementById('map');
		this.mapElem.style.height = window.innerHeight - 50;

	}
  ko.applyBindings(new AppViewModel());
}

function errorHandling() {
	alert("Google Maps has failed to load. Please check your internet connection and try again.");
}