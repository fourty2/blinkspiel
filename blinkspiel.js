(function() {
	var gameStates = {
		WAITINGFORDEVICE: 0,
		READYPLAYERONE: 1,
		PLAYPATTERN: 2,
		PLAYING: 3
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
			var tileGeometry = new THREE.BoxGeometry(10,4,10);
			
			var centeroffset = 25;


      // path generation
			this.currentPath = [];
			var checkOldPos = function(pos) {
				for (var pathPos of Blinkspiel.currentPath) {
					if (pathPos.position.x == pos.x && pathPos.position.y == pos.y) {
						return true;
					}
				}

				return false;
			};

			var currentPos = new THREE.Vector2(2,2);
			this.currentPath.push({
					'position': currentPos,
					'color': colors[Math.floor(Math.random() * (colors.length))].clone()
					});

			var possiblePos = new THREE.Vector2();
			console.log("generating path");
			for (var i= 0; i<4; i++) {
				var iterations = 0;
				do {
					iterations++;
					var direction = Math.floor(Math.random() * 4);				
					possiblePos = currentPos.clone();
					switch (direction) {
						case 0:
							possiblePos.x++;
						break;
						case 1:
							possiblePos.x--;
						break;
						case 2:
							possiblePos.y++;
						break;
						case 3:
							possiblePos.y--;
						break;
					}
			
				} while (
					possiblePos.x < 0 || possiblePos.x > 4 || 
					possiblePos.y < 0 || possiblePos.y > 4 || 
					( possiblePos.x == currentPos.x && possiblePos.y == currentPos.y ) || 
					(checkOldPos(possiblePos)) || 
					iterations > 10
				);
				
				if (iterations > 10) {
					console.log ("neu generieren");
				}

				currentPos = possiblePos.clone();

				this.currentPath.push({
					'position': currentPos.clone(),
					'color': colors[Math.floor(Math.random() * (colors.length))].clone()
					});
			}			


			console.log(this.currentPath);


			//this.tileObjects = new THREE.Object3D();
			for (var x = 0; x<5; x++) {
				for (var y = 0; y<5; y++) {

					var tileMaterial = new THREE.MeshPhongMaterial({color: 0x00ff00, side: THREE.DoubleSide});		
					var mesh = new THREE.Mesh(tileGeometry, tileMaterial);
          mesh.receiveShadow = true;
					mesh.position.set((x * 12) - centeroffset,0, (y * 12) - centeroffset);


					var color = colors[Math.floor(Math.random() * (colors.length))].clone();					
					var state = tileStates.INACTIVE;
					// schauen obs, im pfad ist
					for (var pathPos of this.currentPath) {
						if (pathPos.position.x == x && pathPos.position.y == y) {
							color = pathPos.color.clone();
							//state = tileStates.ACTIVE;
						}
					}

					// select color random from list
					
					this.tiles.push(
					{
						x: x,
						y: y,						
						color: color,
						mesh: mesh,
						state: state
					}
					);
					mesh.material.color = this.getInactive(color.clone());
					mesh.tileIndex = (this.tiles.length - 1);
					this.scene.add(mesh);
				}
			}
			this.updateTileStates();

      // auf den letzten pfad dann noch das ziel setzen
      var lastPathItem = this.currentPath[this.currentPath.length - 1];
      console.log(lastPathItem);
			var destination = new THREE.Mesh(
			  new THREE.TorusKnotGeometry( 3, 1, 20, 16 ),
				//	new THREE.SphereGeometry(4,8,8),
					new THREE.MeshPhongMaterial({color:lastPathItem.color, shading: THREE.FlatShading})
				);
			destination.castShadow = true;
			destination.position.set((lastPathItem.position.x * 12) - centeroffset,
			            5, 
			             (lastPathItem.position.y * 12) - centeroffset);
      
      this.scene.add(destination);
      
      
      // es werde licht
      
      var light = new THREE.SpotLight(0xffffff);
      light.position.set(20,80,30);
     
      light.castShadow = true;

      light.shadowMapWidth = 1024;
      light.shadowMapHeight = 1024;
      
      light.shadowCameraNear = 10;
      light.shadowCameraFar = 200;
      light.shadowCameraFov = 40;
      light.intensity = 3.0;
      
      this.scene.add(light);
      

		//	this.scene.add(this.tileObjects);

		/*	var test = new THREE.SphereGeometry(10,10, 32);
			var material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
			var mesh = new THREE.Mesh(test, material);
			this.scene.add(mesh);
			*/

			this.player = new THREE.Mesh(
					new THREE.SphereGeometry(4,8,8),
					new THREE.MeshPhongMaterial({color:0x00ff00, shading: THREE.FlatShading})
				);
			this.player.castShadow = true;
			this.playerPosition.x = 2;
			this.playerPosition.y = 2;
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
			color.r = 0.5 * color.r;
			color.g = 0.5 * color.g;
			color.b = 0.5 * color.b;
			return color;
		},
		movePlayer: function() {
			var centeroffset = 25;
			this.player.position.set((this.playerPosition.x * 12) - centeroffset,5, (this.playerPosition.y * 12) - centeroffset );

			// nun die tilestates ändern
			for (var tile of this.tiles) {
				if (tile.state == tileStates.SELECTABLE) {
				  if (tile.state != tileStates.ACTIVE) {
					  tile.state = tileStates.INACTIVE;
				  }
				}
			}

			var x = this.playerPosition.x;
			var y = this.playerPosition.y;

			if (x < 5 && this.tiles[((x + 1) * 5) + y].state != tileStates.ACTIVE) { this.tiles[((x + 1) * 5) + y].state = tileStates.SELECTABLE; }
			if (x > 0 && this.tiles[((x - 1) * 5) + y].state != tileStates.ACTIVE) { this.tiles[((x - 1) * 5) + y].state = tileStates.SELECTABLE; }
			if (y < 5 && this.tiles[(x * 5) + y + 1].state != tileStates.ACTIVE) { this.tiles[(x * 5) + y + 1].state = tileStates.SELECTABLE; }
			if (y > 0  && this.tiles[(x * 5) + y - 1].state != tileStates.ACTIVE) { this.tiles[(x * 5) + y - 1].state = tileStates.SELECTABLE; }

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
						break;
					case tileStates.ACTIVE:
						tile.mesh.material.color.set(tile.color.clone());	
				}
				tile.mesh.scale.y = 1;
			}
		},
		onMouseClick: function(e) {
			

			that = Blinkspiel;
			if (that.gameState == gameStates.READYPLAYERONE) {
				that.setGameState(gameStates.PLAYPATTERN);

			}
			that.mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
			that.mouseVector.y = - ( e.clientY / window.innerHeight) * 2 + 1;

			that.raycaster.setFromCamera( that.mouseVector, that.camera );	
			var intersects = that.raycaster.intersectObjects( that.scene.children );
			for ( var i = 0; i < intersects.length; i++ ) {		
				var tile = that.tiles[intersects[i].object.tileIndex];
				if (tile && that.gameState == gameStates.PLAYING && tile.state == tileStates.SELECTABLE) {
					
					that.tiles[((that.playerPosition.x) * 5) + that.playerPosition.y].state = tileStates.ACTIVE;
					
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
			var intersects = that.raycaster.intersectObjects( that.scene.children );
			for ( var i = 0; i < intersects.length; i++ ) {		
				var tile = that.tiles[intersects[i].object.tileIndex];

				if (tile && that.gameState == gameStates.PLAYING && tile.state == tileStates.SELECTABLE) {
					
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
				bg.blink1.fadeRgb(0, 0, 0, 250, 0);
				break;
				case gameStates.PLAYPATTERN:
				console.log("play");
				this.patternTime =  new Date();
				this.currentDelta = -1;
				break;
				case gameStates.PLAYING:
				console.log("nun gehts los");

				break;
			}
		},
		playPattern: function() {
			var actualTime = new Date();
			var delta = Math.floor((actualTime - Blinkspiel.patternTime) / 1000);
			if (delta < Blinkspiel.currentPath.length * 2 && Blinkspiel.currentDelta != delta) {
				console.log("set led");
			 	

				if (delta % 2 == 0) {
					var color = Blinkspiel.currentPath[delta / 2].color;	
				 	bg.blink1.fadeRgb(color.r * 255, color.g * 255, color.b * 255, 150, 0);
				} else {
					console.log("black");
				 	bg.blink1.fadeRgb(0,0,0, 600, 0);
				
				}


			 	console.log(color);

			 	Blinkspiel.currentDelta = delta;
			} else if (delta >= Blinkspiel.currentPath.length * 2) {
				Blinkspiel.setGameState(gameStates.PLAYING)
			}			
		},
		render: function() {
			if (Blinkspiel.gameState == gameStates.PLAYPATTERN) {
				Blinkspiel.playPattern();
			}
			

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
/*	});
	});

})();
*///);););();
///);););;*///);););();
///);););;;();
///);););;*///);););();
///);););;;;