(function() {
	var gameStates = {
		WAITINGFORDEVICE: 0,
		READYPLAYERONE: 1
	};

	var tileStates = {
		INACTIVE: 0,
		SELECTED: 1,
		SELECTABLE: 2,
		ACTIVE: 3,
	};

	var colors = [
		new THREE.Color(1,0,0),
		new THREE.Color(0,1,0),
		new THREE.Color(0,0,1),
		new THREE.Color(1,0,1)
	];

	var Blinkspiel = {
		blink1: null,
		gamecanvas: null,
		gameState: gameStates.WAITINGFORDEVICE,
		raycaster: new THREE.Raycaster(),
		mouseVector: new THREE.Vector2(),
		playerPosition: new THREE.Vector2(),
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

					var tileMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide});		
					var mesh = new THREE.Mesh(tileGeometry, tileMaterial);

					mesh.position.set((x * 12) - centeroffset,0, (y * 12) - centeroffset);

					// select color random from list
					var color = colors[Math.floor(Math.random() * (colors.length))].clone();
					console.log(colors);
					this.tiles.push(
					{
						x: x,
						y: y,						
						color: color,
						mesh: mesh,
						state: tileStates.INACTIVE
					}
					);
					mesh.material.color = this.getInactive(color.clone());
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

			this.player = new THREE.Mesh(
					new THREE.SphereGeometry(5,5,8),
					new THREE.MeshBasicMaterial({color:0x00ff00})
				);
			this.playerPosition.x = 0;
			this.playerPosition.y = 0;
			this.movePlayer();

			this.scene.add(this.player);

			this.camera.lookAt(new THREE.Vector3(0,0,0));


			this.animate();

			window.addEventListener( 'mousemove', Blinkspiel.onMouseMove, false );
			window.addEventListener( 'click', Blinkspiel.onMouseClick, false );
			chrome.hid.getDevices({}, Blinkspiel.onDevicesEnumerated);
			if (chrome.hid.onDeviceAdded) {
				chrome.hid.onDeviceAdded.addListener(Blinkspiel.onDeviceAdded);
			}
			if (chrome.hid.onDeviceRemoved) {
				chrome.hid.onDeviceRemoved.addListener(Blinkspiel.onDeviceRemoved);
			}
		},
		getInactive: function(color) {
			color.r = 0.1 * color.r;
			color.g = 0.1 * color.g;
			color.b = 0.1 * color.b;
			return color;
		},
		getSelectable: function(color) {
			color.r = 0.6 * color.r;
			color.g = 0.6 * color.g;
			color.b = 0.6 * color.b;
			return color;
		},
		movePlayer: function() {
			var centeroffset = 25;
			this.player.position.set((this.playerPosition.x * 12) - centeroffset,0, (this.playerPosition.y * 12) - centeroffset );

			// nun die tilestates ändern
			for (var tile of this.tiles) {
				if (tile.state == tileStates.SELECTABLE) {
					tile.state = tileStates.INACTIVE;
				}
			}

			var x = this.playerPosition.x;
			var y = this.playerPosition.y;

			if (x < 5) { this.tiles[((x + 1) * 5) + y].state = tileStates.SELECTABLE; };
			if (x > 0) { this.tiles[((x - 1) * 5) + y].state = tileStates.SELECTABLE; };
			if (y < 5) { this.tiles[(x * 5) + y + 1].state = tileStates.SELECTABLE; };
			if (y > 0) { this.tiles[(x * 5) + y - 1].state = tileStates.SELECTABLE; };

			this.updateTileStates();

		},
		updateTileStates: function() {
			for (var tile of this.tiles) {
				switch (tile.state) {
					case tileStates.SELECTABLE:
						
						//tile.mesh.material.color.set(tile.color.clone());	
						tile.mesh.material.color.set(this.getSelectable(tile.color.clone()));	
						break;
					case tileStates.INACTIVE:
						tile.mesh.material.color.set(this.getInactive(tile.color.clone()));	
						break;
					case tileStates.SELECTED:
						tile.mesh.material.color.set(tile.color.clone());	
				}
				tile.mesh.scale.y = 1;
			}
		},
		onMouseClick: function(e) {
			
			that = Blinkspiel;
			that.mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
			that.mouseVector.y = - ( e.clientY / window.innerHeight) * 2 + 1;

			that.raycaster.setFromCamera( that.mouseVector, that.camera );	
			var intersects = that.raycaster.intersectObjects( that.scene.children );
			for ( var i = 0; i < intersects.length; i++ ) {		
				var tile = that.tiles[intersects[i].object.tileIndex];
				if (that.gameState == gameStates.READYPLAYERONE && tile.state == tileStates.SELECTABLE) {
					
					tile.state = tileStates.SELECTED;
					that.playerPosition.x = tile.x;
					that.playerPosition.y = tile.y;
					that.movePlayer();
					//bg.blink1.fadeRgb(tile.color.r * 255, tile.color.g * 255, tile.color.b * 255, 0, 0);
					//console.log(intersects[i].object.tileIndex);
				}

				intersects[ i ].object.material.color.set( tile.color);
				intersects[ i ].object.scale.y = 2;
			}
			

			console.log(e);
		},
		onMouseMove: function(e) {
			that = Blinkspiel;
			that.mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
			that.mouseVector.y = - ( e.clientY / window.innerHeight) * 2 + 1;

			that.raycaster.setFromCamera( that.mouseVector, that.camera );	

			
			that.updateTileStates();
			/*for (var tile of that.tiles) {
				if (tile.state == tileStates.INACTIVE) {
					tile.mesh.material.color.set(that.getInactive(tile.color.clone()));	
				} else {
					tile.mesh.material.color.set(tile.color);	
				}

				
				tile.mesh.scale.y = 1;
			}	*/
			
			var intersects = that.raycaster.intersectObjects( that.scene.children );
			for ( var i = 0; i < intersects.length; i++ ) {		
				var tile = that.tiles[intersects[i].object.tileIndex];

				if (that.gameState == gameStates.READYPLAYERONE && tile.state == tileStates.SELECTABLE) {
					
					bg.blink1.fadeRgb(tile.color.r * 255, tile.color.g * 255, tile.color.b * 255, 0, 0);
					//console.log(intersects[i].object.tileIndex);
					intersects[ i ].object.material.color.set( tile.color );
					intersects[ i ].object.scale.y = 2;
				}

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
