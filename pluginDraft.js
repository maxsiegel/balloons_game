var jsPsychImageFeedbackTask = (function(jspsych) {
    "use strict";

    const info = {
        name: "image-feedback-task",
        parameters: {
            image_positions: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Image Positions',
                default: undefined,
                description: 'Path to the JSON file containing image positions and URLs.'
            },
            happy_sound: {
                type: jspsych.ParameterType.AUDIO,
                pretty_name: 'Happy sound',
                default: undefined,
                description: 'Sound to play on the first tap in the feedback phase.'
            },
            bad_sound: {
                type: jspsych.ParameterType.AUDIO,
                pretty_name: 'Bad sound',
                default: undefined,
                description: 'Sound to play on subsequent taps in the feedback phase.'
            },
            no_feedback_sound: {
                type: jspsych.ParameterType.AUDIO,
                pretty_name: 'No Feedback sound',
                default: undefined,
                description: 'Sound to play whenever an image is tapped in the test phase.'
            },
            feedback_images: {
                type: jspsych.ParameterType.OBJECT,
                pretty_name: 'Feedback Images',
                default: {
                    single_tap: 'images/inflated_balloon.png',
                    multiple_taps: 'images/popped_balloon.png',
                    no_tap: 'images/deflated_balloon.png'
                },
                description: 'Object containing paths to feedback images for different tap scenarios.'
            }
        }
    };

    class ImageFeedbackTaskPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            const no_feedback_sound = trial.no_feedback_sound;
            let image_clicks = {}; // Reset image_clicks for each trial
            let tapOrder = []; // Array to store the order of taps

            fetch(trial.image_positions)
                .then(response => response.json())
                .then(data => {
                    this.runTestPhase(display_element, trial, data, image_clicks, tapOrder, no_feedback_sound);
                });
        }

        createCanvas(display_element) {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 600;
            canvas.style.display = 'block';
            canvas.style.margin = 'auto';
            // canvas.style.border = '5px solid black';
            display_element.innerHTML = ''; // Clear the display element
            display_element.appendChild(canvas);

            return canvas.getContext('2d');
        }

        addFeedbackButton(display_element, callback) {
            const endFeedbackButton = document.createElement('button');
            endFeedbackButton.textContent = "Next -->";
            endFeedbackButton.style.display = 'block';
            endFeedbackButton.style.margin = '20px auto';
            endFeedbackButton.style.padding = '10px 20px';
            endFeedbackButton.style.fontSize = '16px';
            endFeedbackButton.style.cursor = 'pointer';
            display_element.appendChild(endFeedbackButton);

            endFeedbackButton.addEventListener('click', callback);

            return endFeedbackButton;
        }

        // runTestPhase(display_element, trial, data, image_clicks, tapOrder, no_feedback_sound) {
        //     const ctx = this.createCanvas(display_element); // Create the canvas

        //     const cellSize = 60; // Fixed image size

        //     data.positions.forEach((imageData, index) => {
        //         const img = new Image();
        //         img.src = imageData.image;
        //         img.onload = () => {
        //             const x = imageData.x;
        //             const y = imageData.y;

        //             ctx.drawImage(img, x, y, cellSize, cellSize);

        //             ctx.canvas.addEventListener('click', (e) => {
        //                 const rect = ctx.canvas.getBoundingClientRect();
        //                 const clickX = e.clientX - rect.left;
        //                 const clickY = e.clientY - rect.top;

        //                 if (clickX >= x && clickX <= x + cellSize && clickY >= y && clickY <= y + cellSize) {
        //                     if (!image_clicks[index]) {
        //                         image_clicks[index] = 0;
        //                         tapOrder.push(index); // Record the order of the first tap
        //                     }
        //                     image_clicks[index]++;
        //                     console.log(`Image ${index} clicked ${image_clicks[index]} times`);

        //                     // Play the no_feedback_sound without interrupting any other sounds
        //                     const sound = new Audio(no_feedback_sound);
        //                     sound.play();

        //                     img.classList.add("animate__bounce")
        //                     console.log(img)
        //                     console.log('test')
        //                 }
        //             });
        //         };
        //     });

        //     const doneButton = this.addFeedbackButton(display_element, () => {
        //         this.runFeedbackPhase(display_element, trial, data, image_clicks, tapOrder);
        //     });
        // }

        runTestPhase(display_element, trial, data, image_clicks, tapOrder, no_feedback_sound) {

            const ctx = this.createCanvas(display_element); // Create the canvas
            const canvas = ctx.canvas;

            const cellSize = 60; // Fixed image size
            let images = [];

            // Load and store images along with their positions
            data.positions.forEach((imageObj) => {
                const img = new Image();
                img.src = imageObj.image;
                img.onload = () => {
                    images.push({
                        img,
                        x: imageObj.x,
                        y: imageObj.y
                    });
                    drawImages(); // Draw images after each one loads
                };
            });

            function drawImages() {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                images.forEach(({
                    img,
                    x,
                    y
                }) => {
                    ctx.drawImage(img, x, y, cellSize, cellSize); // Draw each image
                });
            }

            function wiggleImage(imageObj) {
                let startTime = null;
                let angle = 0;
                const wiggleAmplitude = 5;
                const wiggleSpeed = .5;

                function animateWiggle(time) {
                    if (!startTime) startTime = time;
                    const elapsed = time - startTime;

                    // Calculate the current angle for the wiggle effect
                    angle = Math.sin(elapsed * wiggleSpeed) * wiggleAmplitude * Math.PI / 45;

                    drawImages(); // Redraw all images
                    ctx.save();
                    ctx.translate(imageObj.x + cellSize / 2, imageObj.y + cellSize / 2); // Move to the center of the image
                    ctx.rotate(angle); // Rotate the canvas
                    ctx.drawImage(imageObj.img, -cellSize / 2, -cellSize / 2, cellSize, cellSize); // Draw the wiggling image
                    ctx.restore();

                    // Continue the animation for a certain duration (e.g., 1 second)
                    if (elapsed < 275) {
                        requestAnimationFrame(animateWiggle);
                    } else {
                        drawImages(); // Redraw images in their final positions after wiggle ends
                    }
                }

                requestAnimationFrame(animateWiggle);
            }

            canvas.addEventListener('click', (event) => {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                images.forEach((imageObj) => {
                    if (x >= imageObj.x && x <= imageObj.x + cellSize &&
                        y >= imageObj.y && y <= imageObj.y + cellSize) {

                        wiggleImage(imageObj);
                    }
                });
            });

            // Initial drawing of all images
            function animate() {
                drawImages();
                requestAnimationFrame(animate);
            }

            animate();
        }

        runFeedbackPhase(display_element, trial, data, image_clicks, tapOrder) {
            const ctx = this.createCanvas(display_element); // Create the canvas with the same dimensions and position

            const cellSize = 60; // Fixed image size

            const endFeedbackButton = this.addFeedbackButton(display_element, () => {
                this.jsPsych.finishTrial({
                    image_clicks: image_clicks
                });
            });

            // Function to display GIFs/images in the order of taps
            const displayFeedbackItem = (i) => {
                if (i < tapOrder.length) {
                    const index = tapOrder[i];
                    const x = data.positions[index].x;
                    const y = data.positions[index].y;
                    let imgSrc;

                    if (image_clicks[index] === 1) {
                        imgSrc = trial.feedback_images.single_tap;
                        new Audio(trial.happy_sound).play();
                    } else if (image_clicks[index] > 1) {
                        imgSrc = trial.feedback_images.multiple_taps;
                        new Audio(trial.bad_sound).play();
                    }

                    // Force the GIF to reload and play from the start by appending a unique query string
                    const gifElement = document.createElement('img');
                    gifElement.src = imgSrc + '?' + new Date().getTime(); // Appending timestamp to prevent caching
                    gifElement.style.position = 'absolute';
                    gifElement.style.left = `${x + ctx.canvas.offsetLeft + 5}px`; // Adjusted left offset slightly
                    gifElement.style.top = `${y + ctx.canvas.offsetTop + 5}px`; // Adjusted top offset slightly
                    gifElement.style.width = `${cellSize}px`;
                    gifElement.style.height = `${cellSize}px`;
                    display_element.appendChild(gifElement);

                    gifElement.addEventListener('load', () => {
                        setTimeout(() => {
                            displayFeedbackItem(i + 1); // Move to the next item
                        }, 2000); // Adjust based on your GIF duration
                    });
                } else {
                    // After showing all GIFs, display the static images for no-tap positions
                    data.positions.forEach((position, index) => {
                        if (!tapOrder.includes(index)) {
                            const x = position.x;
                            const y = position.y;
                            const imgSrc = trial.feedback_images.no_tap;

                            const img = new Image();
                            img.src = imgSrc;
                            img.onload = () => {
                                console.log(img)
                                ctx.drawImage(img, x, y, cellSize, cellSize);
                            };
                        }
                    });

                    endFeedbackButton.style.display = 'block'; // Make sure the button is visible after all GIFs
                }
            };

            displayFeedbackItem(0);
        }
    }

    ImageFeedbackTaskPlugin.info = info;
    return ImageFeedbackTaskPlugin;
})(jsPsychModule);