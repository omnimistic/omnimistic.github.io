/*  WEBGL 3RD DEGREE JULIA SET   */

const canvas = document.getElementById('fractal-canvas');
const gl = canvas.getContext('webgl');

if (gl) {
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const vsSource = `
        attribute vec4 aVertexPosition;
        void main() {
            gl_Position = aVertexPosition;
        }
    `;

    const fsSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;

        // Complex cubic function: z^3
        vec2 cube(vec2 z) {
            return vec2(
                z.x * z.x * z.x - 3.0 * z.x * z.y * z.y,
                3.0 * z.x * z.x * z.y - z.y * z.y * z.y
            );
        }

        void main() {
            // Center and normalize coordinates
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);

            // Zoom level
            vec2 z = uv * 2.5;

            // This is the core morphing logic! 
            // Instead of panning, we orbit the 'C' parameter in the complex plane over time.
            vec2 c = vec2(
                0.35 * cos(u_time * 0.3), 
                0.55 * sin(u_time * 0.3)
            );

            float iter = 0.0;
            const float maxIter = 40.0;

            for(float i = 0.0; i < maxIter; i++) {
                z = cube(z) + c;
                if(dot(z,z) > 4.0) break;
                iter++;
            }

            // Smooth coloring interpolation
            float smoothIter = iter - log2(max(1.0, log2(dot(z,z))));
            float t = smoothIter / maxIter;

            // Your color palette
            vec3 bgColor = vec3(0.98, 0.957, 0.816);     // #FAF4D0
            vec3 accentColor = vec3(0.757, 0.271, 0.271); // #C14545

            // Blend based on iterations
            vec3 color = mix(bgColor, accentColor, t * 0.2);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1.0,  1.0,
         1.0,  1.0,
        -1.0, -1.0,
         1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
    const timeLocation = gl.getUniformLocation(shaderProgram, 'u_time');

    function render(time) {
        time *= 0.001;

        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(timeLocation, time);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}