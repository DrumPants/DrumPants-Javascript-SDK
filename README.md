DrumPants Javascript SDK
=========================

Access the DrumPants sensor data on the web. Requires the [DrumPants hardware](http://store.drumpants.com).

DrumPants let you control devices and websites just by tapping your clothes. For more info visit [drumpants.com](http://www.drumpants.com).


Getting Started
---------------

1. Get a [DrumPants kit](http://store.drumpants.com)
2. Download/install/run the DrumPants app: http://apps.drumpants.com
3. Include the SDK on your HTML page: `<script type='text/javascript' src='drumpants-sdk.js'></script>`
4. Add a listener callback to listen for DrumPants triggers:

````
var drumpants = new DrumPants();

// this is where you listen for hits on the DrumPad
drumpants.addListener('sensorUpdate', 

	// sensorIdx (int) : the index of the DrumPad, 0 through 11.
	// sensorValue (float) : the value of the sensor (how hard it was hit), 
	//                     between 0 (weakest hit) and 1 (hardest hit).
	function (sensorIdx, sensorValue) {
		// your code here
	}
);
````
That's it! Plug in your DrumPants and start playing! You will only receive events when the DrumPants app is running.


Example
---------------

Try the example: http://drumpants.github.io/DrumPants-Javascript-SDK/example/



DrumPants WebSockets JSON API
=========================

The DrumPants app/driver sends out JSON over WebSockets so that you may listen in on sensor data and state changes.

This SDK does most the work for you, but if you want to use another language, this is the API:


Connecting
---------------

Scheme/Address/Port: "ws://localhost:8887"

Please close the connection when you are not using it. For instance, in the onPause() method on Android or viewWillDisappear() message in iOS.

Updates will come in every 80ms, so please keep your processing to a minimum.

The DrumPants app must be running in the background to receive updates. To launch it, run the "drumpants://start" URL from the OS.


Example JSON Response
---------------

All fields in the root object are optional, e.g. a message can have the `sensorValues` and `isConnected` fields, or both, or neither. 


````
{

	// Array of output trigger values, after processing.
	// This is what you should listen for since it will send single detected hits.
	// float from 0 - 1.0 indicates the velocity (how hard) the sensor was hit.
	// null means the sensor has not been hit.
	"sensorOutputValues": [
		0,
		.25,
		.66,
		1.0,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
 		null
	],


	// Array of raw sensor values, before processing.
	"sensorValues": [
		0,
		.25,
		.66,
		1.0,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
 		null
	],


	// true if a device has connected, false if the user needs to plug in / turn on their DrumPants hardware.
	"isConnected": true
}
````


