(function() {
	var gameStates = {
		WAITINGFORDEVICE: 0,
		READYPLAYERONE: 1
	};

	var Blinkspiel = {
		blink1: null,
		gameState: gameStates.WAITINGFORDEVICE,
		init: function() {

			var WIDTH = window.innerWidth;
			var HEIGHT = window.innerHeight;

			var NEAR = 0.1;
			var FAR = 5000;
			var FOV = 45;

			this.gamecanvas = document.getElementById('blinkspiel');
			this.renderer = new THREE.WebGLRenderer({canvas: this.gamecanvas});

			this.renderer.setSize(WIDTH, HEIGHT);
			this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMapSoft = true;
			this.renderer.setClearColor(0x402020, 1);
			this.renderer.autoClear = false;

			this.renderer.gammaInput = true;
			this.renderer.gammaOutput = false;

			this.scene = new THREE.Scene();

			this.camera = new THREE.PerspectiveCamera(FOV, WIDTH/ HEIGHT, NEAR, FAR);
			this.camera.position.set(0,50,0);
			this.scene.add(this.camera);

			var test = new THREE.SphereGeometry(10,10, 32);
			var material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
			var mesh = new THREE.Mesh(test, material);
			this.scene.add(mesh);
			this.camera.lookAt(mesh.position);


			this.animate();


			chrome.hid.getDevices({}, Blinkspiel.onDevicesEnumerated);
			if (chrome.hid.onDeviceAdded) {
				chrome.hid.onDeviceAdded.addListener(Blinkspiel.onDeviceAdded);
			}
			if (chrome.hid.onDeviceRemoved) {
				chrome.hid.onDeviceRemoved.addListener(Blinkspiel.onDeviceRemoved);
			}
		},
		onDevicesEnumerated: function(devices) {
			for (var device of devices) {
      			Blinkspiel.onDeviceAdded(device);
		    }
		},
		onDeviceAdded: function(device) {
			if (device.vendorId != Blink1.VENDOR_ID ||
	     		device.productId != Blink1.PRODUCT_ID) {
	      		return;
	    	}
	    	var blink1 = new Blink1(device.deviceId);

    		blink1.connect(function (success) {
				if (success) {
					blink1.getVersion(function (version) {
						if (version) {
							blink1.version = version;
							bg.blink1 = blink1;
							Blinkspiel.blink1 = blink1;
							Blinkspiel.setGameState(gameStates.READYPLAYERONE);
							
						}
					});
	    		}
    		});
		},
		onDeviceRemoved: function(device) {
			console.log("removed");
			console.log(device);
		},
		setGameState: function(state) {
			console.log("setting game state");
			this.gameState = state;
			switch (this.gameState) {
				case gameStates.READYPLAYERONE:
				//bg.blink1.fadeRgb(60, 128, 200, 2500, 0);
				bg.blink1.fadeRgb(0, 0, 0, 2500, 0);
				break;
			}
		},
		render: function() {
			Blinkspiel.renderer.render(Blinkspiel.scene, Blinkspiel.camera);
		},
		animate: function() {
			requestAnimationFrame(Blinkspiel.animate);
			Blinkspiel.render();
		}
	}

	window.addEventListener('load', function() {
	// Once the background page has been loaded, it will not unload until this
	// window is closed.
	chrome.runtime.getBackgroundPage(function(backgroundPage) {
	  bg = backgroundPage;
	  Blinkspiel.init();
	});
	});

})();
