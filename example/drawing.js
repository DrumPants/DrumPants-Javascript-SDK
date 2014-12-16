// -----------------------
// EXAMPLE DRAWING FUNCTIONS
// 
// This is just for the example; has nothing to do with DrumPants.
// -----------------------
var
	// The following are for drawing on the canvas.
	canvas = document.getElementById('display'),
	ctx = canvas.getContext("2d"),

	textToShow = null,

	// Draws a circle in the canvas.		
	// x and y and size are between 0 and 1.
	drawCircle = function (x, y, size) {
		var radius = canvas.width / 12 * size,
			green = Math.min(Math.floor( (x * 2.0 * 255) ), 255);

		ctx.beginPath();
		ctx.arc(x * canvas.width + radius, y * canvas.height, radius, 0, 2 * Math.PI, false);
		ctx.lineWidth = 5;
		ctx.strokeStyle = 'rgba(255,' + green + ',0,' + size + ')';
		ctx.stroke();
	},

	// Shows text at the top of the canvas
	displayText = function (text) {
		textToShow = text;
	},
	hideText = function () {
		textToShow = null;
	},

	// Animate the canvas for a nice fade-away effect
	drawFrame = function () {
		ctx.globalCompositeOperation = 'source-over';

		ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		if (textToShow) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
			ctx.textAlign = 'center';
			ctx.textBaseline = "top";
			ctx.font = "28px serif";
			ctx.fillText(textToShow, canvas.width / 2, 10);
		}
	};

// Make canvas fill the whole screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// Start animating canvas
(function animloop(){
  window.requestAnimationFrame(animloop);
  drawFrame();
})();