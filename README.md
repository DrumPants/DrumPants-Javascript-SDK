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

	// sensorIdx (int) is the index of the DrumPad, 0 through 11.
	// sensorValue (float) is the value of the sensor (how hard it was hit), between 0 (weakest hit) and 1 (hardest hit).
	function (sensorIdx, sensorValue) {
		// your code here
	}
);
````
That's it! Plug in your DrumPants and start playing! You will only receive events when the DrumPants app is running.
