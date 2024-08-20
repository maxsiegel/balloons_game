var jsPsychDotTask = (function (jspsych) {
    "use strict";

    const info = {
        name: "image-task",
        parameters: {
            image_positions: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Image Positions',
                default: undefined,
                description: 'Path to the JSON file containing positions and images.'
            },
            happy_sound: {
                type: jspsych.ParameterType.AUDIO,
                pretty_name: 'Happy sound',
                default: undefined,
                description: 'Sound to play on the first tap.'
            },
            bad_sound: {
                type: jspsych.ParameterType.AUDIO,
                pretty_name: 'Bad sound',
                default: undefined,
                description: 'Sound to play on subsequent taps.'
            }
        }
    };
  
    class imageTaskPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
            this.currentSound = null; // Track the currently playing sound
        }

        trial(display_element, trial) {
            const happy_sound = new Audio(trial.happy_sound);
            const bad_sound = new Audio(trial.bad_sound);

            fetch(trial.image_positions)
                .then(response => response.json())
                .then(data => {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const canvasSize = 600; // Fixed canvas size
                    canvas.width = canvasSize;
                    canvas.height = canvasSize;
                    canvas.style.display = 'block';
                    canvas.style.margin = 'auto';
                    canvas.style.position = 'absolute';
                    canvas.style.top = '50%';
                    canvas.style.left = '50%';
                    canvas.style.transform = 'translate(-50%, -50%)';
                    canvas.style.border = '5px solid black';
                    display_element.innerHTML = '';
                    display_element.appendChild(canvas);

                    const ctx = canvas.getContext('2d');

                    const image_clicks = {};
                    const cellSize = 60; // Fixed image size

                    data.positions.forEach((imageData, index) => {
                        const img = new Image();
                        img.src = imageData.image;
                        img.onload = () => {
                            const x = imageData.x;
                            const y = imageData.y;

                            ctx.drawImage(img, x, y, cellSize, cellSize);

                            canvas.addEventListener('click', (e) => {
                                const rect = canvas.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const clickY = e.clientY - rect.top;

                                if (clickX >= x && clickX <= x + cellSize && clickY >= y && clickY <= y + cellSize) {
                                    if (this.currentSound) {
                                        this.currentSound.pause(); // Pause the current sound if it's playing
                                        this.currentSound.currentTime = 0; // Reset the sound
                                    }

                                    if (!image_clicks[index]) {
                                        image_clicks[index] = 0;
                                    }
                                    image_clicks[index]++;
                                    if (image_clicks[index] === 1) {
                                        happy_sound.play();
                                        this.currentSound = happy_sound;
                                    } else {
                                        bad_sound.play();
                                        this.currentSound = bad_sound;
                                    }
                                }
                            });
                        };
                    });

                    const interval = setInterval(() => {
                        const allClicked = Object.keys(image_clicks).length === data.positions.length && Object.values(image_clicks).every(count => count > 0);
                        if (allClicked) {
                            clearInterval(interval);
                            this.jsPsych.finishTrial();
                        }
                    }, 100);
                });
        }
    }
    imageTaskPlugin.info = info;
  
    return imageTaskPlugin;

})(jsPsychModule);
