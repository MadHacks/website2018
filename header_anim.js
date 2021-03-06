var camera, scene, renderer, lights, orbit;
var wireframe, wireframe_t;
var animInt;

var shapes;
var shapes_i;
var xrot = 0.01;
var yrot = 0.005;
var spreadx = 3;

function Basic(type) {
    this.type = type;
    if (type == 1) { this.geometry = new THREE.TetrahedronGeometry(1, 0); }
    else if (type == 2) { this.geometry = new THREE.BoxBufferGeometry(1, 1, 1); }
    else if (type == 3) { this.geometry = new THREE.OctahedronBufferGeometry(1, 0); }
    else if (type == 4) { this.geometry = new THREE.DodecahedronGeometry(1, 0); }
    else if (type == 0) { this.geometry = new THREE.IcosahedronGeometry(1, 0); }
    else { this.geometry = null; }

    this.geo = new THREE.EdgesGeometry( this.geometry );
    this.material = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2, transparent: true, opacity: 1 } );
    this.wireframe = new THREE.LineSegments( this.geo, this.material );

    this.velocity = {x: 0, y: 0}
    this.acceleration = {x: 0, y: 0}
    this.fade = 0;
}
Basic.prototype.toMiddleMat = function() {
    this.wireframe = new THREE.Object3D();
    this.material = new THREE.MeshPhongMaterial({ color: 0xb5271e, emissive: 0x440d0b, side: THREE.DoubleSide, flatShading: true, transparent: true, opacity: 1.0 });
    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    this.wireframe.add( new THREE.LineSegments(this.geo, this.lineMaterial) );
    this.wireframe.add( new THREE.Mesh( this.geometry, this.material ) );
}
Basic.prototype.addToScene = function() {
    scene.add(this.wireframe);
}
Basic.prototype.removeFromScene = function() {
    scene.remove(this.wireframe);
}

init();
animate();
function init() {
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
  
    scene = new THREE.Scene();

    orbit = new THREE.OrbitControls( camera, renderer.domElement );
   
    lights = []
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[0].position.set(0, 40, 0);
    scene.add(lights[0]);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1].position.set(20, 40, 20);
    scene.add(lights[1]);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);
        lights[2].position.set(-20, -40, -20);
        scene.add(lights[2]);
        
        shapes = initAnimation();
        shapes.left.addToScene();
        shapes.right.addToScene();

        shapes.middle.toMiddleMat();
        shapes.middle.addToScene();

        animInt = window.setInterval(animStep, 6000);

        document.body.appendChild( renderer.domElement );
        window.addEventListener( 'resize', onWindowResize, false );
    }

    function initAnimation() {
        seed = Math.floor(Math.random() * 5);
        shapes_i = [seed, (seed + 2) % 5, Math.abs((seed - 1) % 5)]
        var left = new Basic(shapes_i[0]);
        left.wireframe.position.x -= spreadx;
        var middle = new Basic(shapes_i[1]);
        var right = new Basic(shapes_i[2]);
        right.wireframe.position.x += spreadx;
        return { "left": left, "middle": middle, "right": right };
    }

    function getRandomI() {
        remaining = [1,1,1,1,1]
        for (var i = 0; i < 3; i++) {
            remaining[shapes_i[i]] = 0;
        }
        j = Math.floor(Math.random() * 5);
        while (remaining[j] == 0) {
            j = Math.floor(Math.random() * 5);
        }
        return j;
    }
   
    function animMorph(key) {
        old_i = shapes[key].type
        old_rot = shapes[key].wireframe.rotation;
        old_mid_rot = shapes.middle.wireframe.rotation

        if (key == "left") { shapes_i[1] = (shapes_i[0] + shapes_i[1]) % 5; }
        else { shapes_i[1] = (shapes_i[1] + shapes_i[2]) % 5; }
        next_shape = new Basic(getRandomI());

        shapes_i[key == "left" ? 0 : 2] = next_shape.type;
        shapes[key].removeFromScene();
        shapes[key] = next_shape;
        shapes[key].wireframe.position.x += (key == "left" ? (-1.0 * spreadx) : spreadx);
        shapes[key].wireframe.rotation = old_rot;
        shapes[key].fade = 0.005;
        shapes[key].material.opacity = 0;
        shapes[key].addToScene()

        shapes.middle.removeFromScene();
        shapes.middle = new Basic((shapes.middle.type + old_i) % 5);
        shapes.middle.toMiddleMat();
        shapes.middle.wireframe.rotation = old_mid_rot;
        shapes.middle.fade = 0.01;
        shapes.middle.material.opacity = 0;
        shapes.middle.lineMaterial.opacity = 0;
        shapes.middle.addToScene();
    }

    function animStep() {
        direction = Math.floor(Math.random() * 2);
        if (direction == 0 && shapes.right.fade == 0.0) {
            shapes.left.acceleration.x = 0.00035;
            shapes.left.fade = -0.01;
            shapes.middle.fade = -0.01;
        }
        else if (shapes.left.fade == 0.0) {
            shapes.right.acceleration.x = -0.00035;
            shapes.right.fade = -0.01;
            shapes.middle.fade = -0.01;
        }
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    
    function animate() {
        requestAnimationFrame( animate );
        for (var key in shapes) {
            shapes[key].wireframe.rotation.x += xrot;
            shapes[key].wireframe.rotation.y += yrot;
            shapes[key].wireframe.position.x += shapes[key].velocity.x
            shapes[key].velocity.x += shapes[key].acceleration.x
            if (key != "middle" && Math.abs(shapes[key].wireframe.position.x) < 0.05) {
                animMorph(key);
            }
            if (shapes[key].fade != 0.0) { 
                if (shapes[key].material.opacity > 1) { shapes[key].material.opacity = 1; shapes[key].fade = 0.0; }
                else if (shapes[key].material.opacity < 0) { shapes[key].material.opacity = 0; shapes[key].fade = 0.0; } 
                else { 
                    shapes[key].material.opacity += shapes[key].fade;
                    if (shapes[key].lineMaterial) { shapes[key].lineMaterial.opacity += (shapes[key].fade / 2); }
                }
            }
        }
        renderer.render( scene, camera );
    }
