(function() {
	var gameStates = {
		WAITINGFORDEVICE: 0,
		READYPLAYERONE: 1
	};

	var Blinkspiel = {
		blink1: null,
		gamecanvas: null,
		gameState: gameStates.WAITINGFORDEVICE,
		raycaster: new THREE.Raycaster(),
		mouseVector: new THREE.Vector2(),
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
			this.camera.position.set(0,80,80);
			this.scene.add(this.camera);


			// matrix von 5x5 planes erstellen
			this.tiles = [];
			var tileGeometry = new THREE.BoxGeometry(10,1,10);
			var centeroffset = 25;
			//this.tileObjects = new THREE.Object3D();
			for (var x = 0; x<5; x++) {
				for (var y = 0; y<5; y++) {

					var mat = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide});
					var mesh = new THREE.Mesh(tileGeometry, mat);
					mesh.position.set((x * 12) - centeroffset,0, (y * 12) - centeroffset);

					var color = [Math.random(), Math.random(), Math.random()];
					this.tiles.push(
					{
						x: x,
						y: y,
						colorArray: color,
						color: new THREE.Color(color[0], color[1], color[2]),
						mesh: mesh
					}
					);
					mesh.tileIndex = (this.tiles.length - 1);
					this.scene.add(mesh);
				}

			}
		//	this.scene.add(this.tileObjects);

		/*	var test = new THREE.SphereGeometry(10,10, 32);
			var material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
			var mesh = new THREE.Mesh(test, material);
			this.scene.add(mesh);
			*/
			this.camera.lookAt(new THREE.Vector3(0,0,0));


			this.animate();

			window.addEventListener( 'mousemove', Blinkspiel.onMouseMove, false );
			chrome.hid.getDevices({}, Blinkspiel.onDevicesEnumerated);
			if (chrome.hid.onDeviceAdded) {
				chrome.hid.onDeviceAdded.addListener(Blinkspiel.onDeviceAdded);
			}
			if (chrome.hid.onDeviceRemoved) {
				chrome.hid.onDeviceRemoved.addListener(Blinkspiel.onDeviceRemoved);
			}
		},
		onMouseMove: function(e) {
			that = Blinkspiel;
			that.mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
			that.mouseVector.y = - ( e.clientY / window.innerHeight) * 2 + 1;

			that.raycaster.setFromCamera( that.mouseVector, that.camera );	

			for (var tile of that.tiles) {
				tile.mesh.material.color.set(tile.color);
			}

			var intersects = that.raycaster.intersectObjects( that.scene.children );
			for ( var i = 0; i < intersects.length; i++ ) {		
				if (that.gameState == gameStates.READYPLAYERONE) {
					var tile = that.tiles[intersects[i].object.tileIndex];

					
					bg.blink1.fadeRgb(tile.colorArray[0] * 255, tile.colorArray[1] * 255, tile.colorArray[2] * 255, 250, 0);
					//console.log(intersects[i].object.tileIndex);
				}

				intersects[ i ].object.material.color.set( 0xff0000 );
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
