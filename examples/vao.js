'use strict';

const webgl = require('..');

const { Document } = require('glfw-raub');

const { mat4 } = require('./libs/glMatrix-0.9.5.min');


Document.setWebgl(webgl);
const document = new Document();
const frame    = document.requestAnimationFrame;

let xRot   = 0;
let xSpeed = 5;
let yRot   = 0;
let ySpeed = -5;
let z      = -5;
let gl;

document.on('resize', evt => {
	gl.viewportWidth = evt.width;
	gl.viewportHeight = evt.height;
});


const shaders = {
	
	vs: `
		attribute vec3 aVertexPosition;
		attribute vec4 aVertexColor;
		uniform mat4 uMVMatrix;
		uniform mat4 uPMatrix;
		varying vec4 vColor;
		void main(void) {
			gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
			vColor = aVertexColor;
		}
	`,
	
	fs : `
		#ifdef GL_ES
			precision mediump float;
		#endif
		varying vec4 vColor;
		void main(void) {
			gl_FragColor = vColor;
		}
	`,
	
};


function initGL(canvas) {
	
	try {
		
		gl = canvas.getContext('webgl');
		
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		
	} catch (e) {
		
		console.error("Could not initialise WebGL, sorry :-(");
		console.error(e);
		process.exit(-1);
		
	}
	
}


function getShader(gl, id) {
	
	const shader = gl.createShader(id === 'vs' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
	
	gl.shaderSource(shader, shaders[id]);
	gl.compileShader(shader);
	
	if ( ! gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
		console.error(gl.getShaderInfoLog(shader));
		return null;
	}
	
	return shader;
	
}


let shaderProgram;

function initShaders() {
	
	const fragmentShader = getShader(gl, 'fs');
	const vertexShader   = getShader(gl, 'vs');
	
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	
	if ( ! gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) ) {
		console.error(
			`Could not initialise shaders. Error: ${
				gl.getProgramInfoLog(shaderProgram)
			}`
		);
	}
	
	gl.useProgram(shaderProgram);
	
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');
	
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
	
}


let mvMatrix = mat4.create();
let pMatrix  = mat4.create();


function setMatrixUniforms() {
	
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	
	const error = gl.getError();
	if (error) {
		console.error("setMatrixUniforms():", gl.viewportWidth, gl.viewportHeight, error);
	}
	
}


function degToRad(degrees) {
	return degrees * Math.PI / 180;
}


const currentlyPressedKeys = {};

document.on('keydown', evt => {
	// console.log('[KEYDOWN]:', evt);
	currentlyPressedKeys[evt.keyCode] = true;
	handleKeys();
});

document.on('keyup', evt => {
	currentlyPressedKeys[evt.keyCode] = false;
});


function handleKeys() {
	
	if (currentlyPressedKeys[219]) { // ]
		z -= 0.05;
	}
	if (currentlyPressedKeys[221]) { // \
		z += 0.05;
	}
	if (currentlyPressedKeys[37]) { // Left cursor key
		ySpeed -= 1;
	}
	if (currentlyPressedKeys[39]) { // Right cursor key
		ySpeed += 1;
	}
	if (currentlyPressedKeys[38]) { // Up cursor key
		xSpeed -= 1;
	}
	if (currentlyPressedKeys[40]) { // Down cursor key
		xSpeed += 1;
	}
	//console.log("speed: "+xSpeed+" "+ySpeed+" "+z);
	
}


let cubeVertexPositionBuffer;
let cubeVerticesColorBuffer;
let cubeVertexIndexBuffer;
let vao;

function initBuffers() {
	
	vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	
	const vertices = [
		// Front face
		-1.0, -1.0, 1.0,
		1.0, -1.0, 1.0,
		1.0, 1.0, 1.0,
		-1.0, 1.0, 1.0,
		
		// Back face
		-1.0, -1.0, -1.0,
		-1.0, 1.0, -1.0,
		1.0, 1.0, -1.0,
		1.0, -1.0, -1.0,
		
		// Top face
		-1.0, 1.0, -1.0,
		-1.0, 1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0, 1.0, -1.0,
		
		// Bottom face
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0, 1.0,
		-1.0, -1.0, 1.0,
		
		// Right face
		1.0, -1.0, -1.0,
		1.0, 1.0, -1.0,
		1.0, 1.0, 1.0,
		1.0, -1.0, 1.0,
		
		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0, 1.0,
		-1.0, 1.0, 1.0,
		-1.0, 1.0, -1.0
	];
	
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 24;
	
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	gl.vertexAttribPointer(
		shaderProgram.vertexPositionAttribute,
		cubeVertexPositionBuffer.itemSize,
		gl.FLOAT,
		false,
		0,
		0
	);
	
	const colors = [
		[ 1.0, 1.0, 1.0, 0.5 ], // Front face: white
		[ 1.0, 0.0, 0.0, 0.5 ], // Back face: red
		[ 0.0, 1.0, 0.0, 0.5 ], // Top face: green
		[ 0.0, 0.0, 1.0, 0.5 ], // Bottom face: blue
		[ 1.0, 1.0, 0.0, 0.5 ], // Right face: yellow
		[ 1.0, 0.0, 1.0, 0.5 ] // Left face: purple
	];
	
	let generatedColors = [];
	
	for (let j = 0; j < 6; j++) {
		const c = colors[j];
		
		for (let i = 0; i < 4; i++) {
			generatedColors = generatedColors.concat(c);
		}
	}
	
	cubeVerticesColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(generatedColors),
		gl.STATIC_DRAW
	);
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	const cubeVertexIndices = [
		0, 1, 2, 0, 2, 3, // Front face
		4, 5, 6, 4, 6, 7, // Back face
		8, 9, 10, 8, 10, 11, // Top face
		12, 13, 14, 12, 14, 15, // Bottom face
		16, 17, 18, 16, 18, 19, // Right face
		20, 21, 22, 20, 22, 23 // Left face
	];
	
	cubeVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	cubeVertexIndexBuffer.itemSize = 1;
	cubeVertexIndexBuffer.numItems = 36;
	
	gl.bindVertexArray(null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	const error = gl.getError();
	if (error) {
		console.error("initBuffers():", error);
	}
	
}


function drawScene() {
	
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, z]);
	mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
	mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
	setMatrixUniforms();
	
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.FRONT);
	
	gl.bindVertexArray(vao);
	
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	gl.cullFace(gl.BACK);
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	
	// cleanup GL state
	gl.bindVertexArray(null);
	
}


let lastTime = 0;
// let fps = 0;

function animate(timeNow) {
	
	if (lastTime) {
		
		const elapsed = timeNow - lastTime;
		// fps = Math.round(1000 / elapsed);
		
		xRot += (xSpeed * elapsed) / 1000.0;
		yRot += (ySpeed * elapsed) / 1000.0;
		
	}
	
	lastTime = timeNow;
	
}


function tick(timeNow) {
	
	drawScene();
	animate(timeNow);
	
	gl.finish(); // for timing
	frame(tick, 0);
	
}


function start() {
	
	const canvas = document.createElement('canvas');
	
	initGL(canvas);
	initShaders();
	initBuffers();
	
	gl.clearColor(255, 0, 0, 1);
	gl.enable(gl.DEPTH_TEST);
	
	tick(Date.now());
	
}

start();

