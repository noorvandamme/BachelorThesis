
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

const time = 30;
const levelTransition = {
    1: 'https://lottie.host/de8fa9ec-b640-4882-9bd2-ec15a966268f/aGPMSLZBIk.json',
    2: 'https://lottie.host/a06e2e4e-1c90-4922-a2bf-a60795e11032/txJeE3vkvt.json',
};

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


const $startScreen = document.querySelector(".start__screen");
const $gameScreen = document.querySelector(".game__screen");
const $gameEnd = document.querySelector(".game__end");

const $imageCruncher = document.querySelector(".image--character1");
const $selectedImageCruncher = document.querySelector(".image--character1--selected");
const $animationCruncher = document.querySelector(".animation--character1");

const $animationMuncher = document.querySelector(".animation--character2");
const $imageMuncher = document.querySelector(".image--character2");
const $selectedImageMuncher = document.querySelector(".image--character2--selected");

const $transitionContainer = document.querySelector(".transition__screen");
const $footContainer1 = document.querySelector(".foot__container--1");
const $footContainer2 = document.querySelector(".foot__container--2");
const $levelTransitionContainer = document.querySelector(".transition__animation--level");
const $level1TransitionContainer = document.querySelector(".transition__animation--level1");

const $startRevealAnimation = document.querySelector(".start__title--animation");
const $startTitleImage = document.querySelector(".start__title--image");
$startRevealAnimation.style.display = "none"

const loadLottieAnimation = ({ container, path }) =>
    lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path,
    });

const animations = {
    transitionPlayer: loadLottieAnimation({
        container: document.getElementById('lottie-animation'),
        path: 'https://lottie.host/548d045f-bd88-4b62-8835-b02cc4bc11da/iEhg4NT9Qr.json',
    }),
    footPlayer1: loadLottieAnimation({
        container: $footContainer1,
        path: 'https://lottie.host/f1f71a76-5b8f-4d8b-a287-06644e5b777b/DUrJNLnDXl.json',
    }),
    footPlayer2: loadLottieAnimation({
        container: $footContainer2,
        path: 'https://lottie.host/c4887fe8-09d2-44da-b5b6-b7e61aa54f61/oQJuw6AhqD.json',
    }),
    revealStart: loadLottieAnimation({
        container: $animationCruncher,
        path: 'https://lottie.host/e098f130-0d01-4396-acc0-d9ebe75a6a4d/zerVhZMzwP.json',
    }),
    revealStart2: loadLottieAnimation({
        container: $animationMuncher,
        path: 'https://lottie.host/fef76a33-4854-4faa-85a9-705fcadb0d02/dB4Kb30GSV.json',
    }),
    revealStartTitle: loadLottieAnimation({
        container: $startRevealAnimation,
        path: 'https://lottie.host/960e2f34-0ea7-4565-98fc-778164d042c4/Jxn7Q1BqTu.json',
    }),
    transitionLevel1: loadLottieAnimation({
        container: $level1TransitionContainer,
        path: 'https://lottie.host/f97390a3-e23b-4a2f-8d63-d5bcdbead272/uFxBgLYzGt.json',
    }),
};

const levelAnimationsWithPoints = {
    monster1: {
        1: {
            34: 'https://lottie.host/19679a60-a111-4dd0-856f-066907769a48/UnYV64c0iT.json',//state 1 (-34)
            18: 'https://lottie.host/91762797-c81c-4c40-a53c-62331474bf84/8URX15niqk.json',//state 2 (34-18)
            0: 'https://lottie.host/e88a5e44-2477-4eb8-a947-05b1a908758f/CRDLf2bQwI.json',//state 3 (18-0)
        },
        2: {
            67: 'https://lottie.host/8cdf3599-4f5b-40fa-a0cb-3b6f4af76f9c/uhR9qibePP.json',
            34: 'https://lottie.host/bd581f17-aaea-4641-bad7-1a041fe18c49/s4ybPbWNrK.json',
            0: 'https://lottie.host/8d16dcf4-12fc-4eb9-a5e6-d4a6b6a615c5/ek8da0dorl.json',
        },
        3: {
            100: 'https://lottie.host/36f21aee-77ee-485d-ac8e-7e85c343abdd/fGD4Ht3YfT.json',
            50: 'https://lottie.host/23c1c717-8c4a-4a69-877a-267514a80513/2uecOkVTLW.json',
            0: 'https://lottie.host/85eadd4e-4958-430b-8428-650ee2fbfe87/BWYfCg6iCN.json',

        }
    },
    monster2: {
        1: {
            34: 'https://lottie.host/2839362c-c8fa-4f3a-8ab4-14a426c2b343/fMa15mSuAz.json',
            18: 'https://lottie.host/4abb9bb8-3196-42f1-b7a9-845f5eb57f2e/DZnHgwFnr8.json',
            0: 'https://lottie.host/ccd07379-d28c-4378-b729-583b704cd026/UAUDAchMKl.json',
        },
        2: {
            67: 'https://lottie.host/4bf3249f-fe8a-4fe1-bf34-ee2548aa808c/ZmuF7EDCJS.json',
            34: 'https://lottie.host/201c6a97-993d-44de-8187-f56bbc98e9be/tby0eju8oH.json',
            0: 'https://lottie.host/3973fab6-3a33-4dd3-a35c-9290e8176a6f/B96sAzRR5I.json',
        },
        3: {
            100: 'https://lottie.host/69a53502-7c82-41d1-b304-2de1bea921d4/SoS84jyRod.json',
            50: 'https://lottie.host/2075f2c4-4f72-4acc-83a0-df4c2a952080/lCVCkKenIb.json',
            0: 'https://lottie.host/4d2d3ab0-4b33-4a2c-8e46-1820b5d798fc/GZaD2D9WEu.json',
        }
    },
};

const arduinoInfo = {
    usbProductId: 32823,
    usbVendorId: 9025
};

const init = async () => {
    displaySupportedState();
    if (!hasWebSerial) return;
    displayConnectionState();

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

    //ontgrendel audio met connect button 
    if (!isAudioUnlocked) {
        try {
            if (!backgroundSound) {
                backgroundSound = new Audio('assets/backgroundmusic_Stiller.mp3');
                backgroundSound.loop = true;
                await backgroundSound.play();
            }
            console.log(isAudioUnlocked);
            isAudioUnlocked = true;
        } catch (error) {
            console.warn("Audio ontgrendelen mislukt", error);
        }
    }

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

                    if (json.button) {
                        processButtonState(value);
                    } else if (json.sensor !== undefined && json.state) {
                        processSensorState(value);
                    }
                }
            }
        } catch (error) {
            console.error("Error reading from port", error);
        } finally {
            reader.releaseLock();
        }
    }
};

const processSensorState = (value) => {
    if (footPlaying) return;
    if (!gamePlaying) return;
    if (transitionPlaying) return;
    if (gameState.level === 4) return;

    const effects = [
        {
            animationUrl: 'https://lottie.host/b44cf3e3-ee4f-4118-8cbc-6182b90178e0/crQIiQbzlB.json',
            points: 30,
            soundUrl: 'assets/sparkle.mp3',
        },
        {
            animationUrl: 'https://lottie.host/ee443e85-635a-4f9d-8c68-2a73f0200651/sSQMUAU6T1.json',
            points: 10,
            soundUrl: 'assets/waterStronger.mp3',
        },
        {
            animationUrl: 'https://lottie.host/3c0bb1f0-4449-4d9f-b412-4f686e4e4479/acvDxGal1i.json',
            points: 40,
            soundUrl: 'assets/explosion.mp3',
        },
        {
            animationUrl: 'https://lottie.host/5293b4e0-55df-450c-9ecb-9d89cfa2db6e/fiF4b3ypTo.json',
            points: 20,
            soundUrl: 'assets/smoke.mp3',
        }
    ];

    try {
        //parse de JSON-string die we van de Arduino krijgen
        const data = JSON.parse(value);

        let sensor = data.sensor;
        let sensorState = data.state;

        console.log("Parsed data:", value);
        console.log("sensor:", data.sensor);

        if (sensorState === "Broken") {
            console.log("broken");
            currentState = "broken";
        } else if (sensorState === "Unbroken" && currentState === "broken") {
            //state is van "Broken" naar "Unbroken" gegaan
            const effect = effects[sensor];
            if (effect) {
                const container = document.getElementById('effect-container');

                if (container.animation) container.animation.destroy();

                container.style.display = 'block';

                const sound = new Audio(effect.soundUrl);
                sound.play();

                container.animation = lottie.loadAnimation({
                    container: container,
                    renderer: 'svg',
                    loop: false,
                    autoplay: true,
                    path: effect.animationUrl,
                });

                gameState.points -= effect.points;
                updatePointsDisplay();

                container.animation.addEventListener('complete', () => {
                    updateLevelAnimation(gameState.level);
                });

                if (isBackgroundAnimationPlaying) return;

                isBackgroundAnimationPlaying = true;

                //effect scherm aanpassen
                const effectScreenAnimation1 = document.querySelector('.effect__screen--animations--1');
                const effectScreenAnimation2 = document.querySelector('.effect__screen--animations--2');
                effectScreenAnimation1.style.display = 'block';
                effectScreenAnimation2.style.display = 'block';

                const backgroundAnimation1 = lottie.loadAnimation({
                    container: effectScreenAnimation1,
                    renderer: 'svg',
                    loop: false,
                    autoplay: true,
                    path: 'https://lottie.host/0c64c3f9-cbd9-408a-9c91-8610a8c0fde3/lbKnFNzij8.json',
                });

                const backgroundAnimation2 = lottie.loadAnimation({
                    container: effectScreenAnimation2,
                    renderer: 'svg',
                    loop: false,
                    autoplay: true,
                    path: 'https://lottie.host/0c64c3f9-cbd9-408a-9c91-8610a8c0fde3/lbKnFNzij8.json',
                });

                backgroundAnimation1.goToAndStop(0, true);
                backgroundAnimation1.play();

                backgroundAnimation2.goToAndStop(0, true);
                backgroundAnimation2.play();

                const screenInterface = document.querySelector('.screen__interface');
                const hiddenElements = Array.from(screenInterface.children).filter(child => {
                    if (!child.classList.contains('game__animations') &&
                        !child.classList.contains('effect__screen--animations--1') &&
                        !child.classList.contains('effect__screen--animations--2')) {
                        child.style.display = 'none';
                        return child;
                    }
                });

                const resetAnimation = () => {
                    hiddenElements.forEach(child => child.style.display = 'block');
                    effectScreenAnimation1.style.display = 'none';
                    effectScreenAnimation2.style.display = 'none';
                    backgroundAnimation1.destroy();
                    backgroundAnimation2.destroy();
                    isBackgroundAnimationPlaying = false; // Reset de lock
                };

                backgroundAnimation1.addEventListener('complete', resetAnimation);
                backgroundAnimation2.addEventListener('complete', resetAnimation);

                screenInterface.querySelector('.game__animations').style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Failed to parse JSON:", error);
    }
};

let buttonStates = {}; //actieve staat van knop bijhouden 

const processButtonState = (value) => {
    if (gamePlaying) return;
    if (transitionPlaying) return;
    try {
        //parse de JSON-string van de knop
        const buttonData = JSON.parse(value.trim());

        if (buttonData.button) {

            const buttonId = buttonData.button

            if (!buttonStates[buttonId]) {
                buttonStates[buttonId] = true;
                console.log("button pressed:", buttonId)
                if (buttonId === 'button1') {
                    $imageCruncher.style.display = "none"
                    $selectedImageCruncher.style.display = "block"
                    const clickSound = new Audio('assets/click1.mp3');
                    clickSound.play();
                    if (backgroundSound) backgroundSound.pause();

                    setTimeout(() => {
                        handleMonsterSelection(buttonId);

                    }, 500);

                }

                if (buttonId === 'button2') {
                    $imageMuncher.style.display = "none"
                    $selectedImageMuncher.style.display = "block"
                    const clickSound = new Audio('assets/click1.mp3');
                    clickSound.play();
                    if (backgroundSound) backgroundSound.pause();

                    setTimeout(() => {
                        handleMonsterSelection(buttonId);
                    }, 700);
                }
            }
        }

    } catch (error) {
        console.error("Error processing button state:", error);
    }
};

const startGame = () => {
    gamePlaying = true

    $startScreen.style.display = "none"
    $gameScreen.style.display = "block"
    $transitionContainer.style.display = "none";

    gameState.level = 1; // starten met level 1 
    gameState.points = levels[0].points;
    gameState.timeLeft = time;
    gameState.currentLevelIndex = 0;

    updatePointsDisplay();
    updateLevelAnimation(1)
    startTimer();

    backgroundSound.play();
}

const startTimer = () => {
    if (gameState.timerActive) return; //voorkomen dat de timer meerdere keren start 
    gameState.timerActive = true;

    timerInterval = setInterval(() => {
        if (gameState.timeLeft > 0) { //als er tijd over is 
            gameState.timeLeft--;

            if (gameState.timeLeft <= 10) {
                timerDisplay.classList.add("red-timer");
                timerDisplay.classList.add("timer__animation");
            } else {
                timerDisplay.classList.remove("red-timer");
                timerDisplay.classList.remove("timer__animation");
            }

            //min and sec 
            const minutes = Math.floor(gameState.timeLeft / 60);
            const seconds = gameState.timeLeft % 60;

            document.getElementById("timerDisplay").textContent = `0${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {//geen tijd meer over 
            clearInterval(timerInterval); //stop timer
            gameState.timerActive = false;
            handleGameEnd();
        }
    }, 1000); //update seconden 
}

const resetTimer = () => {
    gameState.timeLeft = time;
    gameState.timerActive = false;
    document.getElementById("timerDisplay").textContent = `${gameState.timeLeft}s`;
}

const handleGameEnd = () => {
    $gameScreen.style.display = "none"
    document.querySelector(".transition__end").style.display = 'block'
    clearInterval(timerInterval);//stoptimer
    gameState.timerActive = false;

    gamePlaying = false

    if (gameState.points <= 0) {
        if (winnerTransition) {
            winnerTransition.destroy();
        }

        console.log('winnaar')
        document.querySelector(".transition__winner").style.display = "block"
        winnerTransition = lottie.loadAnimation({
            container: document.querySelector('.transition__winner'),
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: 'https://lottie.host/0b361482-2134-4eaf-bdd7-04d516288aad/uCKSEQkzMt.json',
        });

        winnerTransition.goToAndStop(0, true);
        winnerTransition.play();

        const gameWinnerSound = new Audio('assets/victory_nomusic.mp3');
        gameWinnerSound.play();

        winnerTransition.addEventListener('complete', playCredits);

    } else if (gameState.points > 0) {
        if (loserTransition) {
            loserTransition.destroy();
        }

        document.querySelector(".transition__loser").style.display = "block"
        console.log('verliezer')
        loserTransition = lottie.loadAnimation({
            container: document.querySelector('.transition__loser'),
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: 'https://lottie.host/16a73070-b9ec-477e-9310-bf824376d0f1/VZthi42TwX.json',
        });

        loserTransition.goToAndStop(0, true);
        loserTransition.play();

        const gameOverSound = new Audio('assets/gameOver_nomusic.mp3');
        gameOverSound.play();

        loserTransition.addEventListener('complete', playCredits);
    }
};

const playCredits = () => {
    if (gamePlaying) return;
    document.querySelector(".transition__end").style.display = 'none'
    $gameEnd.style.display = "flex";
    if (selectedMonster === "monster1") {
        monsterName = "Cruncher"
    } else monsterName = "Muncher";

    const winnaarText = document.querySelector(".role__person--winner");
    const loserText = document.querySelector(".role__person--loser");
    const monsterText = document.querySelector(".role__person--monster");

    monsterText.textContent = `${monsterName}`;

    if (gameState.points <= 0) {

        document.querySelector(".game__winnaar").style.display = "block";
        $gameScreen.style.display = "none"
        console.log('winnaar')
        winnaarText.textContent = 'Jij';
        loserText.textContent = `${monsterName}`;

    } else if (gameState.points > 0) {
        document.querySelector(".game__over").style.display = "flex";
        $gameScreen.style.display = "none";
        console.log('gameover')
        winnaarText.textContent = `${monsterName}`;
        loserText.textContent = 'Jij';
    }

    setTimeout(() => {
        resetGame();
    }, 10000);
}
//reset spel voor nieuwe speler
const resetGame = () => {
    gameState.level = 1;
    gameState.points = levels[0].points;
    gameState.timeLeft = time;
    gameState.timerActive = false;
    gameState.currentLevelIndex = 0;

    level1Done = false
    transitionPlaying = false
    isBackgroundAnimationPlaying = false;
    footPlayed = false;
    gamePlaying = false;
    footPlaying = false;

    buttonStates = {};

    updatePointsDisplay();

    $gameEnd.style.display = "none"
    $gameScreen.style.display = "none";

    $animationCruncher.style.display = "block"
    $startScreen.style.display = "block"
    $imageCruncher.style.display = "none";
    $selectedImageCruncher.style.display = "none"

    animations.revealStart.goToAndStop(0, true);
    animations.revealStart.play();
    animations.revealStart.addEventListener('complete', () => {
        $imageCruncher.style.display = "block";
        $animationCruncher.style.display = "none"
    })

    $animationMuncher.style.display = "block"
    $imageMuncher.style.display = "none"
    $selectedImageMuncher.style.display = "none"

    animations.revealStart2.goToAndStop(0, true);
    animations.revealStart2.play();
    animations.revealStart2.addEventListener('complete', () => {
        $imageMuncher.style.display = "block";
        $animationMuncher.style.display = "none";
    })

    $startRevealAnimation.style.display = "block"
    $startTitleImage.style.display = "none"

    animations.revealStartTitle.goToAndStop(0, true);
    animations.revealStartTitle.play();
    animations.revealStartTitle.addEventListener('complete', () => {
        $startRevealAnimation.style.display = "none"
        $startTitleImage.style.display = "block"
    })

    document.getElementById("level-animation-container").style.display = "block"
    document.querySelector(".game__winnaar").style.display = "none";
    document.querySelector(".game__over").style.display = "none";
    document.querySelector(".transition__winner").style.display = "none"
    document.querySelector(".transition__loser").style.display = "none"
    document.querySelector(".transition__end").style.display = 'none'


    document.querySelector(".timer__number").textContent = `${gameState.timeLeft}s`;
    document.getElementById("pointsDisplay").textContent = `Points: ${gameState.points}`;
    document.getElementById("pointsProgress").value = gameState.points;
    document.getElementById("levelDisplay").textContent = `Level: ${gameState.level}`;

    const $iconsContainer = document.querySelector('.screen__icons div');
    const $icons = $iconsContainer.querySelectorAll('img');
    const defaultIconSrc = 'assets/icon.png';
    const redIconSrc = 'assets/iconRed.png';

    $icons.forEach((icon, index) => {
        icon.style.display = 'inline';
        if (index === 0) {
            icon.src = redIconSrc;
        } else {
            icon.src = defaultIconSrc;
        }
    });
};

const updatePointsDisplay = () => {
    if (!gamePlaying) return;

    const pointsDisplay = document.getElementById("pointsDisplay");
    const pointsProgress = document.getElementById("pointsProgress");

    //update level info 
    document.getElementById("levelDisplay").textContent = `Level ${gameState.level}`;

    //update score 
    gameState.points = Math.max(gameState.points, 0);
    const maxPoints = levels[gameState.currentLevelIndex].points;
    pointsProgress.max = maxPoints;

    pointsProgress.value = gameState.points;
    pointsDisplay.textContent = `Points: ${gameState.points}`;

    //checken wanneer naar next level
    if (gameState.points <= 0 && gameState.currentLevelIndex < levels.length - 1) {
        //seconde wachten vooraleer naar next level zodat UI kan updaten 
        setTimeout(() => {
            playLevelTransition();
        }, 500);
    } else if (gameState.currentLevelIndex === levels.length - 1) {
        handleGameEnd();
    }
};

const destroyCurrentAnimation = () => {
    if (currentLevelAnimation) {
        currentLevelAnimation.destroy();
        currentLevelAnimation = null;
    }
};

const getMonsterAnimation = (monsterName, level, hp) => {
    const monsterData = levelAnimationsWithPoints[monsterName];
    if (!monsterData) {
        console.log("Monster not found.");
        return;
    }

    const levelData = monsterData[level];
    if (!levelData) {
        return;
    }

    //zoek de animatie door de HP-drempels
    const hpThresholds = Object.keys(levelData).map(Number).sort((a, b) => b - a);
    let chosenAnimation = levelData[hpThresholds[hpThresholds.findIndex(threshold => hp >= threshold)]];

    //als geen drempel overeenkomt (hp < laagste drempel), geef de animatie voor 0 HP
    if (!chosenAnimation) {
        chosenAnimation = levelData[0];
    }

    return chosenAnimation;
}

const updateLevelAnimation = (level) => {
    if (!gamePlaying) return;

    destroyCurrentAnimation();

    //juiste animatie selecteren op basis van punten 
    let animationPath = getMonsterAnimation(selectedMonster, level, gameState.points);

    //check of er animatie is geselecteerd en laad deze in
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
    if (!gamePlaying) return;

    if (gameState.currentLevelIndex < levels.length - 1) {
        $gameScreen.style.display = "block"
        gameState.currentLevelIndex++;
        gameState.level++;
        gameState.points = levels[gameState.currentLevelIndex].points;
        resetTimer();
        updatePointsDisplay();
        updateLevelAnimation(gameState.level)

        const iconsContainer = document.querySelector('.screen__icons div');
        const icons = iconsContainer.querySelectorAll('img');

        if (icons.length >= gameState.level) {
            const iconToReplace = icons[gameState.level - 1];
            iconToReplace.src = 'assets/iconRed.png';
        }

    } else {
        console.log("Winnaar");
    }
}

const footScene = () => {
    if (transitionPlaying) return;
    footPlayed = true
    footPlaying = true

    const footSound = new Audio('assets/intro-sound.mp3');
    footSound.play();

    let selectAnimation = animations.footPlayer1
    if (selectedMonster === 'monster1') {
        selectAnimation = animations.footPlayer1
        $footContainer1.style.display = "flex";
    } else if (selectedMonster === 'monster2') {
        selectAnimation = animations.footPlayer2
        $footContainer2.style.display = "flex";
    }

    selectAnimation.goToAndStop(0, true);
    selectAnimation.play();

    selectAnimation.addEventListener('complete', () => {
        playTransitionLevel1();
        $footContainer1.style.display = "none";
        $footContainer2.style.display = "none";

        footPlaying = false;
    });
};

const playLevelTransition = () => {
    if (transitionPlaying) return;
    transitionPlaying = true;

    const nextLevelIndex = gameState.level;
    console.log(gameState.level)

    const animationPath = levelTransition[nextLevelIndex];

    if (!animationPath) {
        nextLevel();
        return;
    }

    const sound = new Audio('assets/levelup.mp3');
    sound.play();

    $gameScreen.style.display = "none"
    $levelTransitionContainer.style.display = "flex";

    const levelAnimation = lottie.loadAnimation({
        container: $levelTransitionContainer,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: animationPath,
    });

    levelAnimation.addEventListener('complete', () => {
        $levelTransitionContainer.style.display = "none";
        levelAnimation.destroy();
        transitionPlaying = false;

        nextLevel();
    });
};

const playTransitionAnimation = () => {
    if (transitionPlaying) return;
    transitionPlaying = true;

    $transitionContainer.style.display = "flex";

    animations.transitionPlayer.goToAndStop(0, true);
    animations.transitionPlayer.play();
    animations.transitionPlayer.addEventListener('complete', () => {
        $transitionContainer.style.display = "none";
        transitionPlaying = false;

        footScene();
    });
};

const playTransitionLevel1 = () => {
    if (transitionPlaying) return;
    if (!gamePlaying) return;

    transitionPlaying = true;

    $gameScreen.style.display = "none"
    $level1TransitionContainer.style.display = "block";

    animations.transitionLevel1.goToAndStop(0, true);
    animations.transitionLevel1.play();

    const sound = new Audio('assets/levelup.mp3');
    sound.play();

    animations.transitionLevel1.addEventListener('complete', () => {
        $level1TransitionContainer.style.display = "none";
        startGame();
        transitionPlaying = false;
    });
}


const handleMonsterSelection = (buttonId) => {

    //DEMO WITHOUT ARDUINO
    gamePlaying = true
    // if (buttonId === 'monster1') {
    //     selectedMonster = 'monster1';
    //     console.log('enemy 1 gekozen')
    // } else if (buttonId === 'monster2') {
    //     selectedMonster = 'monster2';
    //     console.log('enemy 2 gekozen')
    // }

    if (buttonId === 'button1') {
        selectedMonster = 'monster1';
        console.log('enemy 1 gekozen')
    } else if (buttonId === 'button2') {
        selectedMonster = 'monster2';
        console.log('enemy 2 gekozen')
    }
    $startScreen.style.display = "none"

    playTransitionAnimation();
};

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
