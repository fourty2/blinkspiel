(function() {
	var gameStates = {
		WAITINGFORDEVICE: 0,
		READYPLAYERONE: 1,
		PLAYPATTERN: 2,
		PLAYING: 3,
		LOST: 4
	};

	var tileStates = {
		INACTIVE: 0,
		SELECTED: 1,
		SELECTABLE: 2,
		ACTIVE: 3
	};

	var colors = [
		new THREE.Color(1,0,0),
		new THREE.Color(0,1,0),
		new THREE.Color(0,0,1),
		new THREE.Color(1,1,0)
	];

	var Blinkspiel = {
		blink1: null,
		gamecanvas: null,
		gameState: gameStates.WAITINGFORDEVICE,
		raycaster: new THREE.Raycaster(),
		mouseVector: new THREE.Vector2(),
		playerPosition: new THREE.Vector2(),
		currentPlayerPath: 0,
		init: function() {

			var WIDTH = window.innerWidth;
			var HEIGHT = window.innerHeight;

			var NEAR = 0.1;
			var FAR = 5000;
			var FOV = 45;

			this.gamecanvas = document.getElementById('blinkspiel');
			this.renderer = new THREE.WebGLRenderer({canvas: this.gamecanvas});
			this.renderer.setViewport(0, 0,WIDTH, HEIGHT);
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
				for (var pathPos in Blinkspiel.currentPath) {
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
					for (var pathPos in this.currentPath) {
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
			// 2* 5 + 2
			this.tiles[12].state = tileStates.ACTIVE;

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
	      light.position.set(20,120,30);
	     
	      light.castShadow = true;

	      light.shadowMapWidth = 1024;
	      light.shadowMapHeight = 1024;
	      
	      light.shadowCameraNear = 10;
	      light.shadowCameraFar = 200;
	      light.shadowCameraFov = 40;
	      light.intensity = 4.0;
	      
	      this.scene.add(light);
	      

		var geometry  = new THREE.SphereGeometry(200, 32, 32)
		// create the material, using a texture of startfield
		var material  = new THREE.MeshLambertMaterial({color:0x100101})
		material.side  = THREE.BackSide
		// create the mesh based on geometry and material
		var mesh  = new THREE.Mesh(geometry, material)
		this.scene.add(mesh);


	      // noch ein licht von unten
	      var light2 = new THREE.SpotLight(0xff0000);
	      light2.position.set(0,-100,50);
	     
	      light2.castShadow = true;

	      light2.shadowMapWidth = 1024;
	      light2.shadowMapHeight = 1024;
	      
	      light2.shadowCameraNear = 10;
	      light2.shadowCameraFar = 200;
	      light2.shadowCameraFov = 40;
	      light2.intensity = 3.0;
	      
	      this.scene.add(light2);
	      



		//	this.scene.add(this.tileObjects);

		/*	var test = new THREE.SphereGeometry(10,10, 32);
			var material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
			var mesh = new THREE.Mesh(test, material);
			this.scene.add(mesh);
			*/

		var text = "BLINKSPIEL";
		this.menuLine = new THREE.Mesh(
				new THREE.TextGeometry(text,
						{
							size: 8,
							height: 2,
							font: 'LobsterLove',
							weight: 'normal',
							style: 'normal'
						}
					),
				new THREE.MeshLambertMaterial({color: 0x336699})
			);

		this.menuLine.position.set(-38,15,-25);
		//this.menuLine.rotation.y = Math.PI;
		this.menuLine.rotation.x = -Math.PI/4;
		this.menuLine.castShadow = true;
		this.scene.add(this.menuLine);

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


			this.effectComposer = new THREE.EffectComposer( this.renderer);
			this.effectComposer.addPass( new THREE.RenderPass(this.scene, this.camera));
			var copyPass = new THREE.ShaderPass( THREE.CopyShader );
			copyPass.renderToScreen = true;
			this.effectComposer.addPass( new THREE.BloomPass(1, 17, 8, 128));
			this.effectComposer.addPass(copyPass);
		

			this.animate();

			window.addEventListener( 'mousemove', Blinkspiel.onMouseMove, false );
			window.addEventListener( 'click', Blinkspiel.onMouseClick, false );
			var startButton = document.getElementById('startButton');
			startButton.addEventListener( 'click', Blinkspiel.startGame.bind(this), false );
			window.addEventListener( 'resize', Blinkspiel.onWindowResize.bind(this), false );
			this.setGameState(gameStates.WAITINGFORDEVICE);
			chrome.hid.getDevices({}, Blinkspiel.onDevicesEnumerated);
			if (chrome.hid.onDeviceAdded) {
				chrome.hid.onDeviceAdded.addListener(Blinkspiel.onDeviceAdded);
			}
			if (chrome.hid.onDeviceRemoved) {
				chrome.hid.onDeviceRemoved.addListener(Blinkspiel.onDeviceRemoved);
			}
		},
		getInactive: function(color) {
			color.r = 0.05 * color.r;
			color.g = 0.05 * color.g;
			color.b = 0.05 * color.b;
			return color;
		},
		getSelectable: function(color) {
			color.r = 0.4 * color.r;
			color.g = 0.4 * color.g;
			color.b = 0.4 * color.b;
			return color;
		},
		movePlayer: function() {
			var centeroffset = 25;
			this.player.position.set((this.playerPosition.x * 12) - centeroffset,5, (this.playerPosition.y * 12) - centeroffset );

			console.log(this.currentPlayerPath);

			if (this.currentPath[this.currentPlayerPath].position.x == this.playerPosition.x && 
				this.currentPath[this.currentPlayerPath].position.y == this.playerPosition.y
				) {
				console.log("richtig!");
			} else {
				console.log(this.currentPath[this.currentPlayerPath]);
				console.log(this.playerPosition);
				this.setGameState(gameStates.LOST);
			}

			this.currentPlayerPath++;


			// nun die tilestates ändern
			for (var tile in this.tiles) {
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
			for (var tile in this.tiles) {
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
			
			//that.setGameState(gameStates.PLAYPATTERN);
			that = Blinkspiel;
			if (that.gameState != gameStates.PLAYING) {
				return;	

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
		onWindowResize: function() {
			this.gamecanvas.width = window.innerWidth;
			this.gamecanvas.height = window.innerHeight;
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.renderer.setViewport(0, 0, this.gamecanvas.clientWidth, this.gamecanvas.clientHeight);
			this.renderer.setSize( window.innerWidth, window.innerHeight );
			this.effectComposer.setSize( window.innerWidth, window.innerHeight );
	    	this.camera.updateProjectionMatrix();


		},
		onMouseMove: function(e) {
			that = Blinkspiel;
			that.mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
			that.mouseVector.y = - ( e.clientY / window.innerHeight) * 2 + 1;

			that.raycaster.setFromCamera( that.mouseVector, that.camera );	

			
			that.updateTileStates();
			var coloring = false;
			var intersects = that.raycaster.intersectObjects( that.scene.children );
			for ( var i = 0; i < intersects.length; i++ ) {		
				var tile = that.tiles[intersects[i].object.tileIndex];

				if (tile && that.gameState == gameStates.PLAYING && tile.state == tileStates.SELECTABLE) {
					
					bg.blink1.fadeRgb(tile.color.r * 255, tile.color.g * 255, tile.color.b * 255, 0, 0);
					//console.log(intersects[i].object.tileIndex);
					coloring = true;
					intersects[ i ].object.material.color.set( tile.color );
					intersects[ i ].object.scale.y = 2;
				}

			}

			if (tile && !coloring && that.gameState == gameStates.PLAYING) {
				bg.blink1.fadeRgb(0,0,0, 0, 0);
			}

		},
		onDevicesEnumerated: function(devices) {
			for (var device in devices) {
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
				case gameStates.WAITINGFORDEVICE:
					var wfd = document.getElementById('wfd');
					wfd.style.display = 'block';
					break;
				case gameStates.READYPLAYERONE:
					var lost = document.getElementById('lost');
					lost.style.display = 'none';

					var wfd = document.getElementById('wfd');
					wfd.style.display = 'none';

					var startGame = document.getElementById('startGame');
					startGame.style.display = 'block';

					// init game

					bg.blink1.fadeRgb(0, 0, 0, 250, 0);

				break;
				case gameStates.PLAYPATTERN:
				console.log("play");
					var startGame = document.getElementById('startGame');
					startGame.style.display = 'none';

					this.patternTime =  new Date();
					this.currentDelta = -1;
				break;
				case gameStates.PLAYING:
				console.log("nun gehts los");

				break;
				case gameStates.LOST:

					var lost = document.getElementById('lost');
					lost.style.display = 'block';

				break;

			}
		},
		startGame: function() {
			this.setGameState(gameStates.PLAYPATTERN);
		},
		playPattern: function() {
			var actualTime = new Date();
			var delta = Math.floor((actualTime - Blinkspiel.patternTime) / 1000);
			if (delta < (Blinkspiel.currentPath.length -1) * 2 && Blinkspiel.currentDelta != delta) {
							 
				if (delta % 2 == 0) {
					var blinky = document.getElementById('blink');
					blinky.style.display = 'block';
					var color = Blinkspiel.currentPath[(delta / 2) + 1].color;	
				 	bg.blink1.fadeRgb(color.r * 255, color.g * 255, color.b * 255, 150, 0);
				} else {
					var blinky = document.getElementById('blink');
					blinky.style.display = 'none';
				 	bg.blink1.fadeRgb(0,0,0, 600, 0);
				
				}

			 	console.log(color);
			 	Blinkspiel.currentDelta = delta;
			} else if (delta >= (Blinkspiel.currentPath.length -1) * 2) {
				Blinkspiel.setGameState(gameStates.PLAYING)
			}			
		},
		fallingBlocks: function() {
			for (var tile in this.tiles) {
				if (tile.state != tileStates.ACTIVE && tile.mesh.position.y > -100) {

					tile.mesh.position.y-= Math.random();
					tile.mesh.rotateX(Math.random() * 0.1);
					tile.mesh.rotateY(Math.random() * 0.1);
					tile.mesh.rotateZ(Math.random() * 0.1);
				}
			}

			if (this.player.position.y > -100) {
				this.player.position.y-=Math.random();	
			} else {
				this.setGameState(gameStates.READYPLAYERONE);
			}
			


		},
		render: function() {
			if (Blinkspiel.gameState == gameStates.PLAYPATTERN) {
				Blinkspiel.playPattern();
			} else if (Blinkspiel.gameState == gameStates.LOST) {
				Blinkspiel.fallingBlocks();

			}			

			Blinkspiel.effectComposer.render(0.017); 
			//Blinkspiel.renderer.render(Blinkspiel.scene, Blinkspiel.camera);
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