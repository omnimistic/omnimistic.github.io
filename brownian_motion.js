(function() {
    const fCanvas = document.getElementById('brownian-canvas');
    if (!fCanvas) return;
    const fGl = fCanvas.getContext('webgl');

    if (fGl) {
        function resizeFCanvas() {
            fCanvas.width = window.innerWidth;
            fCanvas.height = window.innerHeight;
            fGl.viewport(0, 0, fCanvas.width, fCanvas.height);
        }
        window.addEventListener('resize', resizeFCanvas);
        resizeFCanvas();

        const vsSource = `
            attribute vec4 aVertexPosition;
            void main() { gl_Position = aVertexPosition; }
        `;

        const fsSource = `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;

            float random (in vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float noise (in vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            float fbm (in vec2 st) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 5; i++) {
                    value += amplitude * noise(st);
                    st *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }

            void main() {
                vec2 st = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
                
                if (u_resolution.y > u_resolution.x) {
                    st *= 2.5; 
                }

                vec2 q = vec2(0.0);
                q.x = fbm(st + 0.05 * u_time);
                q.y = fbm(st + vec2(1.0));

                vec2 r = vec2(0.0);
                r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
                r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.15 * u_time);

                float f = fbm(st + r);

                vec3 color1 = vec3(0.08, 0.18, 0.24);
                vec3 color2 = vec3(0.757, 0.271, 0.271);
                vec3 color3 = vec3(0.98, 0.957, 0.816);

                vec3 color = mix(color1, color2, smoothstep(0.1, 0.6, f));
                color = mix(color, color3, smoothstep(0.4, 1.0, f));

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        }

        const shaderProgram = fGl.createProgram();
        fGl.attachShader(shaderProgram, createShader(fGl, fGl.VERTEX_SHADER, vsSource));
        fGl.attachShader(shaderProgram, createShader(fGl, fGl.FRAGMENT_SHADER, fsSource));
        fGl.linkProgram(shaderProgram);
        fGl.useProgram(shaderProgram);

        const positionBuffer = fGl.createBuffer();
        fGl.bindBuffer(fGl.ARRAY_BUFFER, positionBuffer);
        fGl.bufferData(fGl.ARRAY_BUFFER, new Float32Array([-1,1, 1,1, -1,-1, 1,-1]), fGl.STATIC_DRAW);

        const vertexPosition = fGl.getAttribLocation(shaderProgram, 'aVertexPosition');
        fGl.enableVertexAttribArray(vertexPosition);
        fGl.vertexAttribPointer(vertexPosition, 2, fGl.FLOAT, false, 0, 0);

        const resolutionLocation = fGl.getUniformLocation(shaderProgram, 'u_resolution');
        const timeLocation = fGl.getUniformLocation(shaderProgram, 'u_time');

        function render(time) {
            if (document.body.classList.contains('show-fluid')) {
                fGl.uniform2f(resolutionLocation, fCanvas.width, fCanvas.height);
                fGl.uniform1f(timeLocation, time * 0.001);
                fGl.drawArrays(fGl.TRIANGLE_STRIP, 0, 4);
            }
            requestAnimationFrame(render);
        }
        
        requestAnimationFrame(render);
    }
})();