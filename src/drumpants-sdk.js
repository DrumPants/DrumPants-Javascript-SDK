/**
 * DrumPants Javascript SDK
 * Version 0.1
 * 
 * Use this to listen for DrumPants trigger events from the DrumPants hardware.
 *
 * http://developers.drumpants.com
 * 
 * Copyright 2014, DrumPants, Inc.
 * Licensed under the MIT license. 
 **/
;(function(window, document, exportName) {
	'use strict';

	// console wrapper if they want debugging
	var showDebugOutput = false,
		debug =  {
			log: function () {
				if (showDebugOutput) {
					console.log.apply(console, arguments);
				}
			}
		};


	var SENSORIZER_SERVER_UI_URL = "ws://localhost:8887",
		sensorizerServer,

		/***
			Number of seconds to wait before trying to reconnect again.
		***/
		RECONNECT_INTERVAL = 2,
		reconnectIntervalId = null,
		isReconnectPaused = false,


		/**
		 * DrumPantsClient: handles websockets connection and parsing of incoming events data.
		 */
		DrumPantsClient = function () {
			this.eventListeners = [];
			this.enableAutoconnect = true;
		};


	DrumPantsClient.prototype = {

		// must be bound to the Controller object
		startAutoconnect: function () {
			var controller = this,
				reconnect = function () {
					controller.startServer();
				};

			// try to reconnect
			if (!reconnectIntervalId && !isReconnectPaused && !controller.isServerOpen()) {
				// try to connect immediately. well, give the first one time to finish disconnecting first.
				setTimeout(reconnect, 100);

				// also connect later, if that didn't work
				reconnectIntervalId = setInterval(reconnect, RECONNECT_INTERVAL * 1000);
			}
		},
		stopAutoconnect: function () {
			// cancel reconnecting attempts
			if (reconnectIntervalId) {
				clearInterval(reconnectIntervalId);
				reconnectIntervalId = null;
			}
		},

		getIsReconnectPaused: function () {
			return isReconnectPaused;
		},

		isServerOpen: function () {
			if (sensorizerServer) {
				if (sensorizerServer.readyState === WebSocket.OPEN) {
					return true;
				}
				else {
					debug.log("WebSocket server not open. State: " + sensorizerServer.readyState + " (open: " + WebSocket.OPEN);
				}
			}

			return false;
		},

		stopServer: function () {
			if (this.isServerOpen()) {

				try {
					sensorizerServer.close();
				}
				catch (e) {

				}
			}
		},

		/***
			Starts listening for the SensorizerServer websockets connection.
		***/
		startServer: function () {
			var controller = this;

			debug.log("Starting WebSockets server connection");


			controller.stopServer();

			try {
				sensorizerServer = new WebSocket(SENSORIZER_SERVER_UI_URL);
				sensorizerServer.onopen = function () {
					controller.stopAutoconnect();

					debug.log("[DrumPants WebSocket opened]");

					controller.trigger("server:connected");
				};
				sensorizerServer.onmessage = function (e) {
					var json = null;

					try {
						json = JSON.parse(e.data);
					}
					catch (ex) {
						debug.log('Mangled response from server', ex);
						if (e.data) {
							debug.log('Response was: ' + e.data.length + " : " + e.data);
						}
					}

					if (json) {

						// can combine multiple packets so parse all of them!
						if (json.sensorValues) {
							var updates = json.sensorValues;
							controller.trigger("server:update", json);

							// also broadcast events for each individual sensor
							// for (var i = 0; i < updates.length; i++) {
							// 	controller.trigger("server:updateSensor" + i, updates[i]);
							// }
						}
						if (json.sensorInputs) {
							controller.trigger("server:loadPreset", json);
						}
						if (json.devices) {
							// TODO: fix this
							// temporarily convert string array response to list of objects that Backbone likes for models
							json.devices = _.map(json.devices, function (el) {
								return { name: el };
							});

							controller.trigger("server:devices", json);	
						}
						if (typeof(json.isConnected) != "undefined") {
							debug.log("Device connected: " + json.isConnected);

							controller.trigger("server:deviceConnected", json.isConnected);		
						}

						// check if this is a response to a request we're waiting for
						if (json.requestId) {
							var promise = controller.pendingQueries[json.requestId];

							if (promise) {
								promise.resolve(json);
							}
						}
					}
				};
				sensorizerServer.onclose = function () {
					debug.log("[DrumPants WebSocket closed]");
					controller.trigger("server:disconnected");

					if (this.enableAutoconnect) {
						controller.startAutoconnect();
					}
				};
			}
			catch (ex) {
				debug.log("Error connecting to server: " + ex);
			}

			debug.log("Done connecting to server: ");

		},

		/**
		 * Triggers an event with the given name, to be broadcast to listener.
		 * 
		 * @param  {String} eventName Name of event, with optional namespace:
		 * @param  {Object} data      Data from the event. Usually a dictionary.
		 */
		trigger : function (eventName, data) {
			var splitName = eventName.split(':'),
				eventMethod = splitName[splitName.length - 1],
				
				i,
				listener,
				listenerMethod;

			// use for loop for speed
			for (i = 0; i < this.eventListeners.length; i++) {
				listener = this.eventListeners[i];
				listenerMethod = listener[eventMethod];

				if (listenerMethod) {
					listenerMethod.call(listener, data);
				}
			}
		},

		/**
		 * Adds a listener object to receive events from the DrumPants.
		 *
		 * @param {Object} listener Should have any of the following functions, which get called with 1 argument: the data of the event:
		 *                          listener.update : called when sensor data is updated, with array of all current sensor values.
		 *                          listener.devices: called when a new DrumPants device is available.
		 *                          listener.deviceConnected: called when DrumPants are connected/disconnected to the computer.
		 *                          listener.connected: called when WebSockets makes a successfull connection to DrumPants driver.
		 *                          listener.disconnected: called when WebSockets is discconected from DrumPants driver.
		 */
		addListener : function(listener) {
			this.eventListeners.push(listener);
		}
	};


	/**
	 * DrumPants public-facing API.
	 *
	 * Connects automatically to the DrumPants driver.
	 * 
	 */
	var DrumPants = function () {
		this.client = new DrumPantsClient();

		this.start();
	};

	DrumPants.prototype = {
		/**
		 * Connects to the DrumPants driver. 
		 * 
		 * If the DrumPants app is not running, it continues trying to connect until stop() is called.
		 * 
		 */
		start: function () {
			this.client.enableAutoconnect = true;
			this.client.startAutoconnect();
		},

		/**
		 * Disconnects from the DrumPants driver and disables autoconnect.
		 * 
		 * To reconnect, call start();
		 */
		stop: function () {
			this.client.enableAutoconnect = false;
			this.client.stopServer();
		},

		/**
		 * Adds a callback for a given event.
		 * @param {String} event    Event to listen for, one of: 
		 *                          "sensorUpdate" : called when sensor data is updated, with sensor ID and sensor value.
		 *                          "devices": called when a new DrumPants device is available.
		 *                          "deviceConnected": called when DrumPants are connected/disconnected to the computer.
		 *                          "connected": called when WebSockets makes a successfull connection to DrumPants driver.
		 *                          "disconnected": called when WebSockets is discconected from DrumPants driver.
		 *                          
		 * @param {Function} listener Callback function to call when an event is triggered. Arguments:
		 *                          "sensorUpdate" : function({int} sensorId, {float} sensorValue)
		 *                          "devices": function({Array<String>} availableDevices)
		 *                          "deviceConnected": function({boolean} isDeviceConnected)
		 *                          "connected": function()
		 *                          "disconnected": function()
		 */
		addListener: function (event, listener) {
			var listenerObj = {};

			if (!listener) throw 'Failed to add listener: listener callback not provided';

			if (event == 'sensorUpdate') {
				listenerObj.update = function (update) {
						var sensorValues = update.sensorValues,
							value;

						for (var i = 0; i < sensorValues.length; i++) {
							value = sensorValues[i];
							
							if (value >= 0) { // don't send null values, meaning the sensor has not been hit.
								listener(i, value);
							}
						}
					};
			}
			else {
				listenerObj[event] = listener;
			}

			this.client.addListener(listenerObj);
		},

		/**
		 * Enables or disables debug printing.
		 * @param {Boolean} isDebugModeOn If true, print debug statements to the console.
		 */
		setDebugMode: function (isDebugModeOn) {
			showDebugOutput = isDebugModeOn;
		},
	};


	if (typeof define == 'function' && define.amd) {
		define(function() {
			return DrumPants;
		});
	} else if (typeof module != 'undefined' && module.exports) {
		module.exports = DrumPants;
	} else {
		window[exportName] = DrumPants;
	}

})(window, document, 'DrumPants');