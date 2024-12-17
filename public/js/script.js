
const hasWebSerial = "serial" in navigator;

let isConnected = false;
let timerInterval;
let footPlayed = false;
let gamePlaying = false;
let level1Done = false
let transitionPlaying = false
let isBackgroundAnimationPlaying = false;
let currentState = "unbroken";
let currentLevelAnimation = null;
let isAudioUnlocked = false;
let selectedMonster = 'monster1';
let footPlaying = false;
let backgroundSound;

let soundInterval;
let connectedArduinoPorts = [];
let winner = "";
let loser = "";
let monsterName = "";

let winnerTransition;
let loserTransition;

const gameState = {
    level: 1,
    points: 0,
    timeLeft: 60,
    timerActive: false,
    currentLevelIndex: 0
};

const levels = [
    { level: 1, points: 50 },
    { level: 2, points: 100 },
    { level: 3, points: 150 },
    { level: 4, points: 0 }
];

const $notSupported = document.getElementById("not-supported");
const $supported = document.getElementById("supported");
const $notConnected = document.getElementById("not-connected");
const $connected = document.getElementById("connected");

const $connectButton = document.getElementById("connectButton");
const $irSensorState = document.getElementById("irSensorState");

const arduinoInfo = {
    usbProductId: 32823,
    usbVendorId: 9025
};

const init = async () => {
    displaySupportedState();
    if (!hasWebSerial) return;
    displayConnectionState();

    initMonsterSelection();
    startGame();
   
    navigator.serial.addEventListener('connect', (e) => {
        const port = e.target;
        const info = port.getInfo();
        console.log('connect', port, info);
        if (isArduinoPort(port)) {
            connectedArduinoPorts.push(port);
            if (!isConnected) {
                connect(port);
            }
        }
    });

    navigator.serial.addEventListener('disconnect', (e) => {
        const port = e.target;
        const info = port.getInfo();
        console.log('disconnect', port, info);
        connectedArduinoPorts = connectedArduinoPorts.filter(p => p !== port);
    });


    const ports = await navigator.serial.getPorts();
    connectedArduinoPorts = ports.filter(isArduinoPort);

    console.log('Ports');
    ports.forEach(port => {
        const info = port.getInfo();
        console.log(info);
    });
    console.log('Connected Arduino ports');
    connectedArduinoPorts.forEach(port => {
        const info = port.getInfo();
        console.log(info);
    });

    if (connectedArduinoPorts.length > 0) {
        connect(connectedArduinoPorts[0]);
    }

    $connectButton.addEventListener("click", handleClickConnect);
};

const isArduinoPort = (port) => {
    const info = port.getInfo();
    return info.usbProductId === arduinoInfo.usbProductId && info.usbVendorId === arduinoInfo.usbVendorId;
};

const handleClickConnect = async () => {
    const port = await navigator.serial.requestPort();
    console.log(port);
    const info = port.getInfo();
    console.log(info);
    await connect(port);
};

const connect = async (port) => {
    isConnected = true;
    displayConnectionState();

    await port.open({ baudRate: 9600 });

    while (port.readable) {
        const decoder = new TextDecoderStream();

        const lineBreakTransformer = new TransformStream({
            transform(chunk, controller) {
                const text = chunk;
                const lines = text.split("\n");
                lines[0] = (this.remainder || "") + lines[0];
                this.remainder = lines.pop();
                lines.forEach((line) => controller.enqueue(line));
            },
            flush(controller) {
                if (this.remainder) {
                    controller.enqueue(this.remainder);
                }
            },
        });

        const readableStreamClosed = port.readable.pipeTo(decoder.writable);
        const inputStream = decoder.readable.pipeThrough(lineBreakTransformer);
        const reader = inputStream.getReader();

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                if (value) {
                    const json = JSON.parse(value.trim());

                    //if (json.button) {
                        processButtonState(value);
                    //} else if (json.sensor !== undefined && json.state) {
                        //processSensorState(value);
                    //}
                }
            }
        } catch (error) {
            console.error("Error reading from port", error);
        } finally {
            reader.releaseLock();
        }
    }
};

const levelAnimations = {
    monster1: {
        1: 'https://lottie.host/e4e0a1a5-a947-4840-8811-f4d69636128c/eArUA3TbYf.json',
        2: 'https://lottie.host/49838bde-6c15-40a3-8080-3beb70d97324/v0JrBmYqQQ.json',
        3: 'https://lottie.host/a50b5754-4764-451b-a300-e4a5fd50f4f0/2nCmcY8sR3.json',
    },
    monster2: {
        1: 'https://lottie.host/8ba859a8-2f5a-42cd-8282-adfc6c30b667/TTbjkMLUtA.json',
        2: 'https://lottie.host/916617e4-d473-4443-b7d3-8edeca5264dc/fyqJQOdDff.json',
        3: 'https://lottie.host/387c93cc-b37a-49cc-86e1-24852c88e8e5/1xHuigzBkt.json',
    },
};

const processSensorState = (value) => {

    //geen weizigingen meer aanbrengen wnr spel gedaan is
    if (gameState.level === 4) return;

    const effects = [
        {
            animationUrl: 'https://lottie.host/8dc6fc1a-4a34-4c08-8279-702325733220/rrCjUfAS99.json',
            points: 20
        },
        {
            animationUrl: 'https://lottie.host/a729197f-ad16-4235-b2e8-3e543f62be78/ZkLKUVklVx.json',
            points: 30
        },
        {
            animationUrl: 'https://lottie.host/3c0bb1f0-4449-4d9f-b412-4f686e4e4479/acvDxGal1i.json',
            points: 40
        },
        {
            animationUrl: 'https://lottie.host/43891e4d-6267-4813-b9ea-5a6b5bcf0914/h7ukx8Y8Bo.json',
            points: 10
        }
    ]

    try {
        //parse de JSON-string die we van de Arduino krijgen
        const data = JSON.parse(value);

        //console.log("Parsed data:", data);
        //console.log(data.sensor)
        //console.log(data.state)

        let sensor = data.sensor;
        let sensorState = data.state;
        console.log("Parsed data:", value);
        console.log("sensor:", data.sensor)

        if (sensorState === "Broken") {
            console.log("broken")
            currentState = "broken";
        } else if (sensorState === "Unbroken" && currentState === "broken") {
            // => betekent dat state van broken naar unbroken is gegaan 

            const animation = effects[sensor];
            if (animation) {
                const container = document.getElementById('effect-container');

                if (container.animation) container.animation.destroy();

                container.style.display = 'block';

                container.animation = lottie.loadAnimation({
                    container: container,
                    renderer: 'svg',
                    loop: false,
                    autoplay: true,
                    path: animation.animationUrl
                });

                gameState.points -= animation.points;

            }
        }

        updatePointsDisplay();

    } catch (error) {
        console.error("Failed to parse JSON:", error);
    }
};

let buttonStates = {}; //actieve staat van knop bijhouden 

const processButtonState = (value) => {
    try {
        // Parse de JSON-string van de knop
        const buttonData = JSON.parse(value.trim());

        if (buttonData.button) {

            const buttonId = buttonData.button

            if (!buttonStates[buttonId]) {
                buttonStates[buttonId] = true;
                console.log("button pressed:", buttonId)
                //handleButtonPressed(buttonId);
            }
        }

    } catch (error) {
        console.error("Error processing button state:", error);
    }
};

// const handleButtonPressed = (buttonId) => {
//     const gameScreen = document.getElementById("game-screen");

//     if (buttonId === 'button1') {
//         selectedMonster = 'monster1';

//         console.log('enemy 1 gekozen')
//     } else if (buttonId === 'button2') {
//         selectedMonster = 'monster2';
//         console.log('enemy 2 gekozen')
//     }

//     startGame();
// }

const startGame = () => {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";

    gameState.level = 1; // starten met level 1 
    gameState.points = levels[0].points;
    gameState.timeLeft = 60;
    gameState.currentLevelIndex = 0;

    updatePointsDisplay();
    updateLevelAnimation(1)

    startTimer();
}

const startTimer = () => {
    if (gameState.timerActive) return; //voorkomen dat de timer meerdere keren start 
    gameState.timerActive = true;

    timerInterval = setInterval(() => {
        if (gameState.timeLeft > 0) {//als er tijd over is 
            gameState.timeLeft--;

            //min and sec 
            const minutes = Math.floor(gameState.timeLeft / 60);
            const seconds = gameState.timeLeft % 60;

            document.getElementById("timerDisplay").textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {//geen tijd meer over 
            clearInterval(timerInterval); //stop timer
            gameState.timerActive = false;
            handleGameOver(); //gameover 
        }
    }, 1000); // update seconden 
}

// const resetTimer = () => {
//   gameState.timeLeft = 60;
//   gameState.timerActive = false;
//   document.getElementById("timerDisplay").textContent = `Time Left: ${gameState.timeLeft}s`;
// }

const handleGameOver = () => {
    //level instellen op level 4 
    gameState.level = 4;
    updatePointsDisplay();//update pointsdisplay naar game over 
    clearInterval(gameState.timerInterval); // stop timer 
    document.getElementById("gameOver").style.display = "block";

    document.getElementById("level-animation-container").style.display = "none"


    setTimeout(() => {
        resetGame();
    }, 5000);
};

//reset spel voor nieuwe speler
const resetGame = () => {
    gameState.level = 1;
    gameState.points = levels[0].points;
    gameState.timeLeft = 60;
    gameState.timerActive = false;
    gameState.currentLevelIndex = 0;

    updatePointsDisplay();
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("start-screen").style.display = "block";
    document.getElementById("level-animation-container").style.display = "block"

    document.getElementById("timerDisplay").textContent = `Time left: ${gameState.timeLeft}s`;
    document.getElementById("pointsDisplay").textContent = `Points: ${gameState.points}`;
    document.getElementById("pointsProgress").value = gameState.points;
    document.getElementById("levelDisplay").textContent = `Level: ${gameState.level}`;

    buttonStates = {};

    const iconsContainer = document.querySelector('.screen__icons div');
    const icons = iconsContainer.querySelectorAll('img');
    icons.forEach(icon => {
        icon.style.display = 'inline'; //level icons terug zichtbaar 
    });
};


const updatePointsDisplay = () => {
    const pointsDisplay = document.getElementById("pointsDisplay");
    const pointsProgress = document.getElementById("pointsProgress");
    document.getElementById("levelDisplay").textContent = `Level ${gameState.level}`;

    gameState.points = Math.max(gameState.points, 0);
    const maxPoints = levels[gameState.currentLevelIndex].points;
    pointsProgress.max = maxPoints;

    pointsProgress.value = gameState.points;
    pointsDisplay.textContent = `Points: ${gameState.points}`;

    if (gameState.level === 4) {
        levelDisplay.style.display = "none";
    } else {
        levelDisplay.style.display = "block";
        levelDisplay.textContent = `Level ${gameState.level}`;
    }

    //checken wnr naar next level
    if (gameState.points <= 0 && gameState.currentLevelIndex < levels.length - 1) {
        // 3 seconden wachten vooraleer naar next level zodat UI kan updaten 
        setTimeout(() => {
            nextLevel();
        }, 1000);
    } else if (gameState.currentLevelIndex === levels.length - 1) {
        document.getElementById("gameWinnaar").style.display = "block";

        clearInterval(timerInterval);
        gameState.timerActive = false;
        setTimeout(() => {
            resetGame();
        }, 5000);
    }
};



const destroyCurrentAnimation = () => {
    if (currentLevelAnimation) {
        currentLevelAnimation.destroy();
        currentLevelAnimation = null;
    }
};


const updateLevelAnimation = (level) => {
    destroyCurrentAnimation();

    //juiste animation voor juiste level
    const animationPath = levelAnimations[selectedMonster][level];

    //checken of er een animation is geselecteerd
    if (animationPath) {
        currentLevelAnimation = lottie.loadAnimation({
            container: document.getElementById('level-animation-container'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: animationPath,
        });
    }
};

const nextLevel = () => {
    if (gameState.currentLevelIndex < levels.length - 1) {
        gameState.currentLevelIndex++;
        gameState.level++;
        gameState.points = levels[gameState.currentLevelIndex].points;
        //resetTimer(); -> OPTIE 
        updatePointsDisplay();
        updateLevelAnimation(gameState.level)
        const iconsContainer = document.querySelector('.screen__icons div');
        const icons = iconsContainer.querySelectorAll('img');

        if (icons.length > gameState.level - 1) {
            icons[gameState.level - 1].style.display = 'none';
        }

    } else {
        console.log("Winnaar");
    }
}

const handleMonsterSelection = (monster) => {
    selectedMonster = monster;
    console.log(`${monster} gekozen`);
    startGame();
};

const initMonsterSelection = () => {
    document.getElementById("chooseMonster1").addEventListener("click", () => {
        handleMonsterSelection('monster1');
    });

    document.getElementById("chooseMonster2").addEventListener("click", () => {
        handleMonsterSelection('monster2');
    });
};

// Call this function during initialization
initMonsterSelection();



const displaySupportedState = () => {
    if (hasWebSerial) {
        $notSupported.style.display = "none";
        $supported.style.display = "block";
    } else {
        $notSupported.style.display = "block";
        $supported.style.display = "none";
    }
};

const displayConnectionState = () => {
    if (isConnected) {
        $notConnected.style.display = "none";
        $connected.style.display = "block";
    } else {
        $notConnected.style.display = "block";
        $connected.style.display = "none";
    }
};

init();
