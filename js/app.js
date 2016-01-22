window.addEventListener("DOMContentLoaded", function(){
  var requestAnimationFrame = ( function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function( callback ){
              window.setTimeout( callback, 1000.0 / 60.0 );
            };
  } )();

  var camera,controls,scene,renderer,flagMesh,cubeParent,lightGroup;
  var SEGX      = 64;
  var SEGY      = 64;
  var PAPER_NUM = 2000;
  var canvas    = document.getElementById("canvas");
  var stats     = new Stats();
  
  init();
  render();
  stats_init();
  animate();

  /**
   * 初期設定
  */
  function init(){
    /*
     * カメラを用意
     * THREE.PerspectiveCamera(画角, 縦横比, クリッピング手前, クリッピング奥);
     * クリッピング手前からクリッピング奥までが描画される
     */
    var width  = canvas.clientWidth,
        height = window.innerHeight;

    camera = new THREE.PerspectiveCamera(45, width/height, 1, 1000);
    camera.position.set(0, 5, 15);

    /*
     * マウスコントロール
     */
    controls = new THREE.TrackballControls( camera,canvas );
    controls.addEventListener( 'change', render );
    controls.rotateSpeed = 0.5; //回転の速さ
    controls.zoomSpeed   = 0.5; //ズームの速さ
    controls.minDistance = 10; //最小値
    controls.maxDistance = 100; //最大値
  
    /*
     * シーンの準備
     * ここに様々なオブジェクトを詰め込んでいく
     */
    scene = new THREE.Scene();
    // scene.fog = new THREE.FogExp2(0xffffff, 0.01);

    /* 
     * 旗の作成
     */
    var flag         = new THREE.PlaneGeometry(15, 10, SEGX, SEGY);
    var flagImg      = THREE.ImageUtils.loadTexture("/images/flag.png", {}, function() {renderer.render(scene, camera);});
    var flagMaterial = new THREE.MeshLambertMaterial( {color: 0xffffff, side: THREE.DoubleSide, map: flagImg} );
    flagMesh         = new THREE.Mesh(flag, flagMaterial);
    flagMesh.castShadow = true;
    flagMesh.position.y = 0;
    scene.add(flagMesh);

    /*
     * 地面の作成
     */
    var plane = new THREE.PlaneGeometry(100, 100, 64, 64);

    // 画像を読み込み 画像が読み込まれる前に描画されている？ため上手く読み込めない。renderer.render()を走らせる
    var lawnImg       = THREE.ImageUtils.loadTexture("/images/lawn.png", {}, function() {renderer.render(scene, camera);});
    var planeMaterial = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, color: 0x000});
    var planeMesh     = new THREE.Mesh(plane, planeMaterial);

    // x軸を90度回転
    planeMesh.rotation.x = Math.PI / -2;
    planeMesh.position.y = -5;
    //影の有効化          
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);

    /*
     * 紙吹雪の作成
     */
    cubeParent = new THREE.Object3D();
    var cubeItem = new THREE.CubeGeometry(1, 2, 0.08);
    for (var i = 0; i < PAPER_NUM; i++) {
      var object = new THREE.Mesh( cubeItem, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
      object.position.x = Math.random() * (-200 - 0);
      object.position.y = Math.random() * (200 - 30) + 30;
      object.position.z = Math.random() * (100 - -100) - 100;
      cubeParent.add(object);
    }
    scene.add( cubeParent );

    /*
     * 光源の作成
     */
    // var lightParent = new THREE.Object3D();
    // var light       = new THREE.SpotLight( 0xffffff, 1.5 );
    // var light2      = new THREE.SpotLight( 0xffffff, 1.0 );
    // var light3      = new THREE.SpotLight( 0xffffff, 1.0 );

    // light.position.set( 100, 300, 300 );
    // light2.position.set( 100, 300, -500 );
    // light3.position.set( 0, -300, 0 );

    // lightParent.add(light);
    // lightParent.add(light2);
    // lightParent.add(light3);
    // lightParent.castShadow = true;
    // lightParent.shadowCameraNear = true;

    // /*
    //  * lightヘルパー
    //  */
    // var lighthelper = new THREE.SpotLightHelper(light, 1);
    // scene.add(lighthelper);
    // lighthelper = new THREE.SpotLightHelper(light2, 1);
    // scene.add(lighthelper);
    // lighthelper = new THREE.SpotLightHelper(light3, 1);
    // scene.add(lighthelper);



    scene.add( new THREE.AmbientLight( 0x111111 ) );
    var intensity        = 2.5;
    var distance         = 500;
    var lightColors      = [0xffffff, 0xff0040, 0x0040ff, 0x80ff80, 0xffaa00, 0x00ffaa, 0xff1100, 0xff0040];
    var lightPosi        = [
      0, 5, 30,
      -20, 5, 20,
      -30, 5, 0,
      -20, 5, -20,
      0, 5, -30,
      20, 5, -20,
      30, 5, 0,
      20, 5, 20
    ];
    var lighthelperGroup = new THREE.Object3D();
    lightGroup           = new THREE.Object3D();

    for(var i = 0;i < 8;i++){
      var light        = new THREE.PointLight(lightColors[i], intensity, distance);
      light.position.x = lightPosi[i*3];
      light.position.y = lightPosi[i*3+1];
      light.position.z = lightPosi[i*3+2];
      light.rotation.x = 145;
      lightGroup.add(light);
      lighthelperGroup.add(new THREE.PointLightHelper(light, 1));
    }
    lightGroup.castShadow = true;
    lightGroup.shadowCameraNear = true;
    scene.add(lightGroup);
    scene.add(lighthelperGroup);

    /* 
     * レンダラーを用意
     * 実際に描画を行うための処理
     */
    renderer = new THREE.WebGLRenderer();
  
    // 大きさの定義
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    renderer.shadowMapEnabled = true;
  
    // DOMにcanvasを追加
    canvas.appendChild( renderer.domElement );
  }


  /** 
   * 描画処理
   * レンダラー.render(シーン, カメラ)
   */
  function render(){
    renderer.render(scene, camera);
  }

  /**
   * アニメーション
   */
  function animate(){
    requestAnimationFrame(animate);

    // TrackballControlsを更新
    controls.update();

    // 旗オブジェクト
    update_flag();

    // カメラ
    // update_camera();

    // 紙吹雪オブジェクト
    update_cube();

    // ライトオブジェクト
    update_light();

    // stats.js
    update_stats();

    // 描画の更新
    render();
  }

  /**
   * カメラ 更新処理
   */
  function update_camera(){
    var timer = Date.now();
    camera.position.x = 15 * Math.sin( timer / 50 * Math.PI / 360 );
    camera.position.z = 15 * Math.cos( timer / 50 * Math.PI / 360 );
    camera.lookAt( scene.position );
  }

  /**
   * 旗オブジェクト 更新処理
   */
  var startData = new Date();
  function update_flag(){
    flagMesh.geometry.verticesNeedUpdate = true;
    var time = (new Date() - startData)/1000;
    for (var i = 0;i < SEGX+1;i++) {
      for (var j = 0;j < SEGY+1;j++) {
        //(i,j)のvertexを得る
        var index = j * (SEGX + 1) + i % (SEGX + 1);
        var vertex = flagMesh.geometry.vertices[index];
        //時間経過と頂点の位置によって波を作る
        var amp = 0.5 * noise.perlin3(i/500+time/5,j/70,time);
        // var amp = 5;//振幅
        vertex.z = amp * Math.sin( -i/2 + time*15 );
      }
    }
  }

  /**
   * 紙吹雪オブジェクト 更新処理
   */
  function update_cube(){
    for (var i = 0; i < PAPER_NUM; i++) {
      cubeParent.children[i].rotation.x += Math.random(1 * 0) * 0.3;
      cubeParent.children[i].rotation.y += Math.random(1 * 0) * 0.3;
      cubeParent.children[i].position.x += Math.random(1 * 0) * 0.3;
      cubeParent.children[i].position.y -= Math.random(1 * 0) * 0.3;
      if(cubeParent.children[i].position.y < -30){
        cubeParent.children[i].position.x = Math.random() * (-200 - 0);
        cubeParent.children[i].position.y = Math.random() * (200 - 30) + 30;
      }
    }
  }

  function update_light(){
    var timer = Date.now();
    // for(var i = 0;i < 8;i++){
    //   var ligth = lightGroup.children[i];
    //   ligth.position.x = (Math.random() * 15) * Math.sin( timer / 10 * Math.PI / 360 );
    //   ligth.position.z = (Math.random() * 15) * Math.cos( timer / 10 * Math.PI / 360 );
    // }
    // lightGroup.rotation.x += Math.random() * 0.05;
    lightGroup.rotation.y += 0.01;
    // lightGroup.rotation.z += Math.random() * 0.05;
  }

  /**
   * stats.js 初期設定
   */
  function stats_init(){
    stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );
  }

  /**
   * stats.js 更新
   */
  function update_stats(){
    stats.begin();
    // monitored code goes here
    stats.end();
  }
});