async function convertAudioFileToDataUrl(file){
  const reader = new FileReader();

  const loadPromise = new Promise((resolve, reject) => {
    reader.onload = (event) => {
      resolve(event.target.result);
    };
  });

  reader.readAsDataURL(file);
  return loadPromise;
}


const fileInput = document.querySelector('#js-play');

let audio = null;
let audioSource = null;
let spectrumArray = null;
let intervalId = null;

fileInput.addEventListener('change', async(event) => {
  const audioContext = new AudioContext();
  const analyzerNode = audioContext.createAnalyser();

  if(audio){
    audio.pause();
    audio.src = '';
  }

  if(audioSource){
    audioSource.disconnect();
  }

  if(intervalId){
    clearInterval(intervalId);
  }

  analyzerNode.fftSize = 32;

  const file = fileInput.files[0];
  if(file){
    spectrumArray = new Uint8Array(analyzerNode.frequencyBinCount);
    audio = new Audio();
    audio.src = await convertAudioFileToDataUrl(file);

    audioSource = audioContext.createMediaElementSource(audio);
    audioSource.connect(analyzerNode);
    analyzerNode.connect(audioContext.destination);

    intervalId = setInterval((event) =>{
      analyzerNode.getByteFrequencyData(spectrumArray);

    }, 1/60);
  }

  audio.play();
});


//-----------------------------------------------

class Ring {
  constructor(index){
    this.index = index + 1;
    this.r = 5;
    this.t = 0; //theta
    this.p = 0; //phi
    this.radian = Math.PI / 180;
    this.pointNum = 20;
    this.stairsNum = 16;
    this.stepRadius = 360 / this.pointNum;
    this.ring = this.ring();
  }

  ring(){
    this.count = 1;
    this.group = new THREE.Group();
    for(let t = 0; t < 180; t += this.stairsNum){
      if(this.count === this.index){
        for(let p = 0; p < 360; p += this.stepRadius) {
          const x = this.r * Math.sin(t * this.radian) * Math.cos(p * this.radian);
          const y = this.r * Math.sin(t * this.radian) * Math.sin(p * this.radian);
          const z = this.r * Math.cos(t * this.radian);

          const geometry = new THREE.SphereGeometry(0.2);
          const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;

          mesh.position.x = x;
          mesh.position.y = z;
          mesh.position.z = y;

          this.group.add(mesh);
        }
      }
      this.count ++;
    }
    return this.group;
  }
}


class Main {
  constructor(){
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('#canvas')
    });
    this.width = 800;
    this.height = 800;
    this.init();

    this.playBtn = document.querySelector('#js-play');
  }

  init(){
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1.0);
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height);
    this.camera.position.set(0, 0, 100); //

    this.scene.add(new THREE.AmbientLight(0xad0178));

    this.rings = [];
    this.scaleAngle = 0;
    console.log(this.scaleAngle);

    // this.axisHelper = new THREE.AxisHelper(1000);
    // this.scene.add(this.axisHelper);
  }




  start(){
    window.addEventListener('resize', ()=>{
      this.resize();
    });

    fileInput.addEventListener('change', ()=>{
      if(!this.colorLight1) {
        this.createSpot();
      }
      this.rings.forEach((r) => {
        r.scale.x = 1;
        r.scale.y = 1;
        r.scale.z = 1;
      });
    });

    for(let i = 0; i < 16; i++ ){
      this.ring = new Ring(i).ring;
      this.scene.add(this.ring);
      this.rings.push(this.ring);
    }

    this.createLight();
    this.createWall();

    this.delegate = () =>{
      this.update();
    };
    this.resize();
    this.update();
  }

  resize(){
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  createLight(){
    const intensity = 2;
    this.pointLight = new THREE.PointLight(0xffffff, intensity, 40);
    this.pointLight.castShadow = true;
    this.pointLight.shadow.camera.near = 1;
    this.pointLight.shadow.camera.far = 80;
    this.pointLight.shadow.bias = -0.005;

    const geometry = new THREE.SphereBufferGeometry(0.5, 12, 6);
    const material = new THREE.MeshBasicMaterial({color: 0xffffff});
    material.color.multiplyScalar(intensity);
    const sphere = new THREE.Mesh(geometry, material);
    this.pointLight.add(sphere);

    this.pointLight.position.x = 0;
    this.pointLight.position.y = 0;
    this.pointLight.position.z = 0;

    this.scene.add(this.pointLight);
  }

  createWall(){
    const geometry = new THREE.BoxBufferGeometry(50, 50, 50);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 10,
      specular: 0x111111,
      side: THREE.BackSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  createSpot(){
    this.colorLight1 = new THREE.SpotLight(0x0088ff, 1, 0, 10 * Math.PI/180, 0, 1);
    this.colorLight1.position.set(0, 0, 50);
    this.scene.add(this.colorLight1);

    this.colorLight2 = new THREE.SpotLight(0xf0ff03, 0.5, 0, 10 * Math.PI/180, 0, 1);
    this.colorLight2.position.set(0, 0, 50);
    this.scene.add(this.colorLight2);

    this.lightAngle = 0;
    this.spotTarget1 = new THREE.Object3D();
    this.colorLight1.target = this.spotTarget1;
    this.spotTarget1.position.z = -50;
    this.scene.add(this.spotTarget1);

    this.spotTarget2 = new THREE.Object3D();
    this.colorLight2.target = this.spotTarget2;
    this.spotTarget2.position.z = -50;
    this.scene.add(this.spotTarget2);
  }

  update(){
    this.rings.forEach((r) => {
        r.rotation.y += 0.004;
      // if(spectrumArray) {
      //   r.rotation.y += 0.008;
      // // } else {
      // }
    });



    if(spectrumArray) {
      let sum = Math.max.apply(null, spectrumArray);
      let avr = Math.max.apply(null, spectrumArray) / spectrumArray.length;

      this.rings.forEach((r) => {
        r.rotation.z += avr * 0.0002;
        r.rotation.y += avr * 0.0002;
      });
      //円周scale
      let max = Math.max.apply(null, spectrumArray);
      for(let i = 15; i >= 0; i--){
          this.rings[i].scale.x = 1;
          this.rings[i].scale.z = 1;

        let angle = spectrumArray[i] / max * 100;
        if(angle){
          this.scaleAngle += angle;
          this.rings[i].scale.x += Math.sin(this.scaleAngle * Math.PI/180) * 0.1;
          // this.rings[i].scale.y += Math.sin(this.scaleAngle * Math.PI/180) * 0.03;
          this.rings[i].scale.z += Math.sin(this.scaleAngle * Math.PI/180) * 0.1;
        }
      }

      this.lightAngle += 1.5;
      this.spotTarget1.position.x = Math.cos(this.lightAngle / 2 * Math.PI/180) * 50;
      this.spotTarget1.position.y = Math.sin(this.lightAngle * Math.PI/180) * 25;
      this.spotTarget2.position.x = -Math.cos((this.lightAngle / 2 + 90) * Math.PI/180) * 50;
      this.spotTarget2.position.y = -Math.sin(this.lightAngle * Math.PI/180) * 25;
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.delegate);
  }
}

window.addEventListener('load', ()=>{
  new Main().start();
});
