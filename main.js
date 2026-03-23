// ==========================================
// CONFIGURACIÓN DE FÍSICA Y CONSTANTES
// ==========================================
const PLAYER_EYE_HEIGHT = 2.1;
const PLAYER_SPEED = 14.0;
const PLAYER_JUMP_FORCE = 26.0;
const GRAVITY = 60.0;
const COYOTE_TIME_MS = 150;
const IMPULSE_WINDOW = 400;

// ==========================================
// VARIABLES GLOBALES DEL MOTOR
// ==========================================
let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

let lastBackwardReleaseTime = 0;
let impulseMultiplier = 1.0;
let prevTime = performance.now();
let lastGroundedTime = 0;
let isGameActive = false;
let platforms = [];
let lavaMesh = null;
let goalBox = null;
let currentLang = 'es';

// ==========================================
// REFERENCIAS DEL DOM (INTERFAZ)
// ==========================================
const introScreen = document.getElementById('intro-screen');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const winScreen = document.getElementById('win-screen');
const btnContinue = document.getElementById('btn-continue');
const btnStart = document.getElementById('btn-start');
const btnRetry = document.getElementById('btn-retry');
const btnRestart = document.getElementById('btn-restart');
const btnsMenu = document.querySelectorAll('.btn-menu');
const speedIndicator = document.getElementById('speed-indicator');
const bookSelect = document.getElementById('book-select');
const langSelector = document.getElementById('lang-selector');
const btnEs = document.getElementById('btn-es');
const btnEn = document.getElementById('btn-en');

// ==========================================
// PRECARGA DE MATERIALES (LAVA)
// ==========================================
const textureLoader = new THREE.TextureLoader();
const lavaTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lava/lavatile.jpg');
lavaTexture.wrapS = THREE.RepeatWrapping;
lavaTexture.repeat.set(50, 50);
lavaTexture.wrapT = THREE.RepeatWrapping;
const lavaMaterial = new THREE.MeshBasicMaterial({ map: lavaTexture, color: 0xffffff });

// ==========================================
// BASE DE DATOS Y TRADUCCIONES
// ==========================================
const uiTranslations = {
    es: {
        introHeader: "ACTIVIDAD CIT", introTitle: "MUESTRA EDITORIAL", introSchool: "Escuela Berta Von Glümer", introProject: "[ Proyecto: Lava Parkour ]",
        btnContinue: "INICIAR CONEXIÓN", startTitle: "Futuros Imaginados",
        startContext1: "Selecciona un libro. Lee atentamente el holograma inicial al entrar al nivel para encontrar las pistas necesarias para avanzar.",
        startContext2: "El cortafuegos es dinámico: las respuestas correctas cambiarán de lado aleatoriamente si caes y reintentas.",
        remember: "¡RECUERDA!", controls: "Toma impulso para saltos largos: <b>Atrás (S) e inmediatamente Adelante (W)</b>.",
        btnStart: "Iniciar Misión", goTitle: "¡Te quemaste!", goMsg: "Elegiste la respuesta incorrecta o fallaste el salto.",
        goHint: "(Las respuestas han cambiado de posición)", btnRetry: "Reintentar", btnMenu: "Cambiar Libro",
        winTitle: "¡Archivo Restaurado!", winMsg: "Has superado la prueba de este libro con éxito. ¡Eres un verdadero Hacker!",
        btnRestart: "Jugar de nuevo", speedIndicator: "[ IMPULSO ACTIVO ]",
        platStart: "INICIO", platJump: "¡PULSA ADELANTE PARA SALTAR!", platSafe: "SEGURO", platGoal: "META"
    },
    en: {
        introHeader: "CIT ACTIVITY", introTitle: "EDITORIAL EXHIBITION", introSchool: "Berta Von Glümer School", introProject: "[ Project: Lava Parkour ]",
        btnContinue: "START CONNECTION", startTitle: "Imagined Futures",
        startContext1: "Select a book. Read the initial hologram carefully upon entering the level to find the clues needed to advance.",
        startContext2: "The firewall is dynamic: correct answers will swap sides randomly if you fall and retry.",
        remember: "REMEMBER!", controls: "Gain momentum for long jumps: <b>Back (S) and immediately Forward (W)</b>.",
        btnStart: "Start Mission", goTitle: "You Burned!", goMsg: "You chose the wrong answer or missed the jump.",
        goHint: "(The answers have changed positions)", btnRetry: "Retry", btnMenu: "Change Book",
        winTitle: "File Restored!", winMsg: "You successfully passed this book's test. You are a true Hacker!",
        btnRestart: "Play Again", speedIndicator: "[ BOOST ACTIVE ]",
        platStart: "START", platJump: "PRESS FORWARD TO JUMP!", platSafe: "SAFE", platGoal: "GOAL"
    }
};

const booksData = {
    "ready_player_one": {
        es: {
            synopsis: "Año 2045. La humanidad escapa de la cruda realidad conectándose a OASIS, una utopía virtual a escala global. El excéntrico creador del juego, James HALLIDAY, ha muerto, pero dejó su inmensa fortuna a quien encuentre su legendario EASTER EGG. Tú eres Wade Watts, pero aquí todos te conocen por tu avatar, PARZIVAL. Deberás enfrentarte a la malvada corporación IOI, que busca privatizar este mundo. Lee bien y prepárate para saltar.",
            questions: [
                { q: "¿En qué simulación virtual escapa la humanidad?", a1: "OASIS", a2: "EL NIMBO", correct: 1 },
                { q: "¿Cuál es el nombre del creador del juego?", a1: "HALLIDAY", a2: "MORROW", correct: 1 },
                { q: "¿Nombre del avatar del protagonista?", a1: "PARZIVAL", a2: "ARTEMIS", correct: 1 },
                { q: "¿Cómo se llama la corporación enemiga?", a1: "IOI", a2: "BEITECH", correct: 1 },
                { q: "¿Qué objeto legendario debes encontrar para ganar?", a1: "EASTER EGG", a2: "LA CORONA", correct: 1 }
            ]
        },
        en: {
            synopsis: "Year 2045. Humanity escapes harsh reality by connecting to OASIS, a global virtual utopia. The eccentric creator of the game, James HALLIDAY, has died, leaving his immense fortune to whoever finds his legendary EASTER EGG. You are Wade Watts, but here everyone knows you by your avatar, PARZIVAL. You must face the evil corporation IOI, which seeks to privatize this world. Read carefully and get ready to jump.",
            questions: [
                { q: "In what virtual simulation does humanity escape?", a1: "OASIS", a2: "THUNDERHEAD", correct: 1 },
                { q: "What is the name of the game's creator?", a1: "HALLIDAY", a2: "MORROW", correct: 1 },
                { q: "What is the protagonist's avatar name?", a1: "PARZIVAL", a2: "ARTEMIS", correct: 1 },
                { q: "What is the name of the enemy corporation?", a1: "IOI", a2: "BEITECH", correct: 1 },
                { q: "What legendary object must you find to win?", a1: "EASTER EGG", a2: "THE CROWN", correct: 1 }
            ]
        }
    },
    "siega": {
        es: {
            synopsis: "En un futuro perfecto donde la humanidad venció a la muerte y la enfermedad, una Inteligencia Artificial llamada EL NIMBO gobierna pacíficamente. Sin embargo, para controlar la sobrepoblación, se creó a los SEGADORES, humanos con licencia para matar. Visten túnicas de todos los colores excepto el NEGRO, color reservado para un luto que ya no existe. Dos jóvenes, CITRA Y ROWAN, son elegidos aprendices para realizar el acto de matar, conocido como la CRIBA.",
            questions: [
                { q: "¿Quiénes son los únicos autorizados para quitar la vida?", a1: "CIBORGS", a2: "SEGADORES", correct: 2 },
                { q: "¿Inteligencia Artificial que gobierna el mundo?", a1: "EL NIMBO", a2: "AIDAN", correct: 1 },
                { q: "¿Qué color de túnica está prohibido para los Segadores?", a1: "NEGRO", a2: "BLANCO", correct: 1 },
                { q: "¿Quiénes son los jóvenes aprendices de Segador?", a1: "CITRA Y ROWAN", a2: "KADY Y EZRA", correct: 1 },
                { q: "¿Cómo llaman los Segadores al acto oficial de matar?", a1: "CRIBA", a2: "EJECUCIÓN", correct: 1 }
            ]
        },
        en: {
            synopsis: "In a perfect future where humanity conquered death and disease, an Artificial Intelligence called THE THUNDERHEAD rules peacefully. However, to control overpopulation, SCYTHES were created: humans licensed to kill. They wear robes of all colors except BLACK, reserved for mourning that no longer exists. Two teens, CITRA AND ROWAN, are chosen as apprentices for the act of killing, known as GLEANING.",
            questions: [
                { q: "Who are the only ones authorized to take a life?", a1: "CYBORGS", a2: "SCYTHES", correct: 2 },
                { q: "What Artificial Intelligence rules the world?", a1: "THE THUNDERHEAD", a2: "AIDAN", correct: 1 },
                { q: "What robe color is forbidden for Scythes?", a1: "BLACK", a2: "WHITE", correct: 1 },
                { q: "Who are the young Scythe apprentices?", a1: "CITRA AND ROWAN", a2: "KADY AND EZRA", correct: 1 },
                { q: "What do Scythes call the official act of killing?", a1: "GLEANING", a2: "EXECUTION", correct: 1 }
            ]
        }
    },
    "cinder": {
        es: {
            synopsis: "En las ruidosas calles de NUEVA BEIJING, Cinder es una mecánica de segunda clase. Ella es un ciborg: mitad humana y mitad MÁQUINA, sufriendo el desprecio de la sociedad. Mientras una plaga letal llamada LETUMOSIS azota la Tierra, el destino de Cinder se cruza con el del apuesto príncipe KAITO. Pronto, descubrirá un secreto en su programación: ella es en realidad la perdida PRINCESA LUNAR, la única capaz de salvar su mundo.",
            questions: [
                { q: "La protagonista es mitad humana y mitad...", a1: "MÁQUINA", a2: "ALIENÍGENA", correct: 1 },
                { q: "¿En qué ciudad vive Cinder?", a1: "NUEVA BEIJING", a2: "NUEVA LONDRES", correct: 1 },
                { q: "¿Qué plaga letal y misteriosa azota al mundo?", a1: "LETUMOSIS", a2: "LA LLAMA", correct: 1 },
                { q: "¿Quién es el príncipe heredero del imperio?", a1: "KAITO", a2: "ROWAN", correct: 1 },
                { q: "¿Qué es Cinder en realidad sin saberlo?", a1: "PRINCESA LUNAR", a2: "IA INFILTRADA", correct: 1 }
            ]
        },
        en: {
            synopsis: "In the noisy streets of NEW BEIJING, Cinder is a second-class mechanic. She is a cyborg: half human and half MACHINE, suffering society's scorn. While a lethal plague called LETUMOSIS ravages Earth, Cinder's destiny crosses with handsome prince KAITO. Soon, she will discover a secret in her programming: she is actually the lost LUNAR PRINCESS, the only one capable of saving her world.",
            questions: [
                { q: "The protagonist is half human and half...", a1: "MACHINE", a2: "ALIEN", correct: 1 },
                { q: "In what city does Cinder live?", a1: "NEW BEIJING", a2: "NEW LONDON", correct: 1 },
                { q: "What mysterious lethal plague ravages the world?", a1: "LETUMOSIS", a2: "THE FLAME", correct: 1 },
                { q: "Who is the crown prince of the empire?", a1: "KAITO", a2: "ROWAN", correct: 1 },
                { q: "What is Cinder in reality without knowing it?", a1: "LUNAR PRINCESS", a2: "INFILTRATED AI", correct: 1 }
            ]
        }
    },
    "warcross": {
        es: {
            synopsis: "EMIKA CHEN es una joven CAZARRECOMPENSAS con un inconfundible cabello color ARCOÍRIS. Desesperada por conseguir dinero, comete un error y hackea accidentalmente el campeonato mundial de Warcross, el videojuego de realidad virtual más popular del mundo, celebrado en TOKIO. En lugar de arrestarla, el brillante creador del juego, HIDEO Tanaka, la contrata para descubrir un complot criminal infiltrada en el torneo.",
            questions: [
                { q: "¿Cómo se llama la hábil hacker protagonista?", a1: "EMIKA CHEN", a2: "NEMESIS", correct: 1 },
                { q: "¿Quién es el joven genio creador del juego Warcross?", a1: "HIDEO", a2: "ZERO", correct: 1 },
                { q: "¿De qué color tan particular es el cabello de la hacker?", a1: "ARCOÍRIS", a2: "NEGRO", correct: 1 },
                { q: "¿En qué ciudad ocurre el campeonato mundial?", a1: "TOKIO", a2: "NUEVA YORK", correct: 1 },
                { q: "¿Qué profesión de riesgo tiene Emika al inicio?", a1: "CAZARRECOMPENSAS", a2: "SEGADORA", correct: 1 }
            ]
        },
        en: {
            synopsis: "EMIKA CHEN is a young BOUNTY HUNTER with unmistakable RAINBOW colored hair. Desperate for money, she makes a mistake and accidentally hacks the world championship of Warcross, the world's most popular virtual reality game, held in TOKYO. Instead of arresting her, the brilliant game creator, HIDEO Tanaka, hires her to uncover a criminal plot infiltrating the tournament.",
            questions: [
                { q: "What is the name of the skilled hacker protagonist?", a1: "EMIKA CHEN", a2: "NEMESIS", correct: 1 },
                { q: "Who is the young genius creator of the Warcross game?", a1: "HIDEO", a2: "ZERO", correct: 1 },
                { q: "What particular color is the hacker's hair?", a1: "RAINBOW", a2: "BLACK", correct: 1 },
                { q: "In what city does the world championship take place?", a1: "TOKYO", a2: "NEW YORK", correct: 1 },
                { q: "What risky profession does Emika have at the beginning?", a1: "BOUNTY HUNTER", a2: "SCYTHE", correct: 1 }
            ]
        }
    },
    "illuminae": {
        es: {
            synopsis: "Esta historia se cuenta a través de una colección de ARCHIVOS hackeados y correos. Todo empieza cuando la corporación enemiga BEITECH ataca el planeta Kerenza. La joven KADY logra escapar en naves de evacuación, pero el terror no termina. Un virus biológico llamado PHOBOS vuelve loca a la tripulación. Para empeorar todo, la IA de la flota, AIDAN, toma el control tomando decisiones moralmente aterradoras.",
            questions: [
                { q: "¿IA que toma decisiones moralmente aterradoras?", a1: "EL NIMBO", a2: "AIDAN", correct: 2 },
                { q: "¿Qué corporación enemiga ataca el planeta?", a1: "BEITECH", a2: "OASIS", correct: 1 },
                { q: "¿En qué formato tan inusual está escrito este libro?", a1: "ARCHIVOS", a2: "POEMAS", correct: 1 },
                { q: "¿Cómo se llama la inteligente protagonista femenina?", a1: "KADY", a2: "CINDER", correct: 1 },
                { q: "¿Qué peligroso virus biológico afecta a los sobrevivientes?", a1: "PHOBOS", a2: "LETUMOSIS", correct: 1 }
            ]
        },
        en: {
            synopsis: "This story is told through a collection of hacked FILES and emails. It all starts when the enemy corporation BEITECH attacks the planet Kerenza. The young KADY manages to escape in evacuation ships, but the terror does not end. A biological virus called PHOBOS drives the crew insane. To make matters worse, the fleet's AI, AIDAN, takes control making morally terrifying decisions.",
            questions: [
                { q: "AI that makes morally terrifying decisions?", a1: "THUNDERHEAD", a2: "AIDAN", correct: 2 },
                { q: "What enemy corporation attacks the planet?", a1: "BEITECH", a2: "OASIS", correct: 1 },
                { q: "In what unusual format is this book written?", a1: "FILES", a2: "POEMS", correct: 1 },
                { q: "What is the name of the intelligent female protagonist?", a1: "KADY", a2: "CINDER", correct: 1 },
                { q: "What dangerous biological virus affects the survivors?", a1: "PHOBOS", a2: "LETUMOSIS", correct: 1 }
            ]
        }
    },
    "el_diabolico": {
        es: {
            synopsis: "NEMESIS es una 'Diabólica', una criatura modificada genéticamente y diseñada como un arma implacable. Su único propósito en la vida es PROTEGER a una sola persona: la hija de un senador, SIDONIA. Cuando obligan a Sidonia a ir a la corte galáctica como rehén, Nemesis toma su lugar. En un ambiente que es LETAL Y TÓXICO, lleno de traiciones, la Diabólica deberá fingir ser HUMANA para sobrevivir.",
            questions: [
                { q: "¿Para qué fue creada genéticamente esta raza?", a1: "PROTEGER", a2: "DESTRUIR", correct: 1 },
                { q: "¿Cuál es el nombre de la protagonista diabólica?", a1: "NEMESIS", a2: "SIDONIA", correct: 1 },
                { q: "¿Qué debe fingir ser en la estricta corte imperial?", a1: "HUMANA", a2: "MÁQUINA", correct: 1 },
                { q: "¿A quién tiene la misión sagrada de proteger con su vida?", a1: "SIDONIA", a2: "EMIKA", correct: 1 },
                { q: "¿Cómo es el ambiente traicionero de la corte del imperio?", a1: "LETAL Y TÓXICO", a2: "PACÍFICO", correct: 1 }
            ]
        },
        en: {
            synopsis: "NEMESIS is a 'Diabolic', a genetically modified creature designed as a relentless weapon. Her sole purpose in life is to PROTECT a single person: a senator's daughter, SIDONIA. When Sidonia is forced to go to the galactic court as a hostage, Nemesis takes her place. In an environment that is LETHAL AND TOXIC, full of betrayals, the Diabolic must pretend to be HUMAN to survive.",
            questions: [
                { q: "What was this race genetically created for?", a1: "PROTECT", a2: "DESTROY", correct: 1 },
                { q: "What is the name of the diabolic protagonist?", a1: "NEMESIS", a2: "SIDONIA", correct: 1 },
                { q: "What must she pretend to be in the strict imperial court?", a1: "HUMAN", a2: "MACHINE", correct: 1 },
                { q: "Who does she have the sacred mission to protect with her life?", a1: "SIDONIA", a2: "EMIKA", correct: 1 },
                { q: "What is the treacherous environment of the empire's court like?", a1: "LETHAL AND TOXIC", a2: "PEACEFUL", correct: 1 }
            ]
        }
    },
    "traicion": {
        es: {
            synopsis: "En este mundo, al cumplir los 16 años, te someten a una cirugía extrema para volverte físicamente PERFECTO. Tally no puede esperar a mudarse a NUEVA BELLEZA, la ciudad donde todos son hermosos y de fiesta. Pero su amiga, SHAY, tiene otros planes y huye hacia EL HUMO, un mítico campamento rebelde oculto en la naturaleza. Para llegar, suelen viajar flotando sobre AEROTABLAS electromagnéticas.",
            questions: [
                { q: "¿A los 16 años te operan para volverte físicamente...?", a1: "PERFECTO", a2: "SEGADOR", correct: 1 },
                { q: "¿Cómo se llama la mítica ciudad oculta de los rebeldes?", a1: "EL HUMO", a2: "LA NIEBLA", correct: 1 },
                { q: "¿Qué ciudad llena de fiestas debes abandonar para ser libre?", a1: "NUEVA BELLEZA", a2: "BEIJING", correct: 1 },
                { q: "¿Quién es la amiga que le habla sobre la gran rebelión?", a1: "SHAY", a2: "KADY", correct: 1 },
                { q: "¿Qué usan habitualmente para desplazarse por el aire?", a1: "AEROTABLAS", a2: "NAVES", correct: 1 }
            ]
        },
        en: {
            synopsis: "In this world, turning 16 means undergoing extreme surgery to make you physically PERFECT. Tally can't wait to move to NEW PRETTY TOWN, the city where everyone is beautiful and partying. But her friend, SHAY, has other plans and flees to THE SMOKE, a mythical rebel camp hidden in nature. To get there, they usually travel floating on electromagnetic HOVERBOARDS.",
            questions: [
                { q: "At age 16 they operate on you to make you physically...?", a1: "PERFECT", a2: "SCYTHE", correct: 1 },
                { q: "What is the mythical hidden rebel city called?", a1: "THE SMOKE", a2: "THE FOG", correct: 1 },
                { q: "What city full of parties must you abandon to be free?", a1: "NEW PRETTY TOWN", a2: "BEIJING", correct: 1 },
                { q: "Who is the friend who tells her about the great rebellion?", a1: "SHAY", a2: "KADY", correct: 1 },
                { q: "What do they usually use to travel through the air?", a1: "HOVERBOARDS", a2: "SHIPS", correct: 1 }
            ]
        }
    }
};

// ==========================================
// FUNCIONES DE INTERFAZ Y EVENTOS
// ==========================================
function setLanguage(lang) {
    currentLang = lang;
    btnEs.classList.toggle('active', lang === 'es');
    btnEn.classList.toggle('active', lang === 'en');
    
    const t = uiTranslations[lang];
    
    document.getElementById('txt-intro-header').innerText = t.introHeader;
    document.getElementById('txt-intro-title').innerText = t.introTitle;
    document.getElementById('txt-intro-school').innerText = t.introSchool;
    document.getElementById('txt-intro-project').innerText = t.introProject;
    document.getElementById('btn-continue').innerText = t.btnContinue;
    
    document.getElementById('txt-start-title').innerText = t.startTitle;
    document.getElementById('txt-start-context1').innerText = t.startContext1;
    document.getElementById('txt-start-context2').innerHTML = `<em>${t.startContext2}</em>`;
    document.getElementById('txt-remember').innerText = t.remember;
    document.getElementById('txt-controls').innerHTML = t.controls;
    document.getElementById('btn-start').innerText = t.btnStart;
    
    const sel = document.getElementById('book-select');
    sel.options[0].text = "1. Ready Player One";
    sel.options[1].text = lang === 'es' ? "2. Siega" : "2. Scythe";
    sel.options[2].text = "3. Cinder";
    sel.options[3].text = "4. Warcross";
    sel.options[4].text = "5. Illuminae";
    sel.options[5].text = lang === 'es' ? "6. El Diabólico" : "6. The Diabolic";
    sel.options[6].text = lang === 'es' ? "7. Traición" : "7. Uglies";

    document.getElementById('txt-go-title').innerText = t.goTitle;
    document.getElementById('txt-go-msg').innerText = t.goMsg;
    document.getElementById('txt-go-hint').innerText = t.goHint;
    document.getElementById('btn-retry').innerText = t.btnRetry;
    
    document.getElementById('txt-win-title').innerText = t.winTitle;
    document.getElementById('txt-win-msg').innerText = t.winMsg;
    document.getElementById('btn-restart').innerText = t.btnRestart;
    
    btnsMenu.forEach(btn => btn.innerText = t.btnMenu);
    speedIndicator.innerText = t.speedIndicator;
}

btnEs.addEventListener('click', () => setLanguage('es'));
btnEn.addEventListener('click', () => setLanguage('en'));

btnContinue.addEventListener('click', () => {
    introScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

// ==========================================
// GENERACIÓN DE TEXTURAS PROCEDURALES
// ==========================================
function createPixelTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (type === 'stone') {
        ctx.fillStyle = '#757575';
        ctx.fillRect(0, 0, 128, 128);
        for(let i=0; i<1000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#616161' : '#9e9e9e';
            ctx.fillRect(Math.floor(Math.random() * 64) * 2, Math.floor(Math.random() * 64) * 2, 2, 2);
        }
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 2;
        for (let i=0; i<16; i++) {
            ctx.strokeRect(Math.floor(Math.random() * 8) * 16, Math.floor(Math.random() * 8) * 16, 16 + Math.random() * 16, 16 + Math.random() * 16);
        }
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#212121';
        ctx.strokeRect(0, 0, 128, 128);
    } else if (type === 'grass_side') {
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(0, 0, 128, 128);
        for(let i=0; i<200; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#4e342e' : '#795548';
            ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
        }
        ctx.fillStyle = '#388e3c';
        ctx.fillRect(0, 0, 128, 32);
    } else if (type === 'grass_top') {
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(0, 0, 128, 128);
        for(let i=0; i<500; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#388e3c' : '#81c784';
            ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const texStone = createPixelTexture('stone');
const texGrassSide = createPixelTexture('grass_side');
const texGrassTop = createPixelTexture('grass_top');

const matStone = new THREE.MeshLambertMaterial({ map: texStone });
const matGrassBlock = [
    new THREE.MeshLambertMaterial({ map: texGrassSide }),
    new THREE.MeshLambertMaterial({ map: texGrassSide }),
    new THREE.MeshLambertMaterial({ map: texGrassTop }),
    new THREE.MeshLambertMaterial({ map: texStone }),
    new THREE.MeshLambertMaterial({ map: texGrassSide }),
    new THREE.MeshLambertMaterial({ map: texGrassSide })
];

// ==========================================
// RENDERIZADO DE HOLOGRAMAS (CANVAS A TEXTURA)
// ==========================================
function createAnswerSprite(text, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 600, 256);

    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 590, 246);

    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let fontSize = text.length > 20 ? 34 : 50;
    ctx.font = 'bold ' + fontSize + 'px Courier New';
    
    const words = text.split(' ');
    if (text.length > 28) { 
        const third1 = Math.ceil(words.length / 3);
        const third2 = Math.ceil(words.length * 2 / 3);
        ctx.fillText(words.slice(0, third1).join(' '), 300, 80);
        ctx.fillText(words.slice(third1, third2).join(' '), 300, 128);
        ctx.fillText(words.slice(third2).join(' '), 300, 176);
    } else if (words.length > 2) { 
        const mid = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, mid).join(' '), 300, 100);
        ctx.fillText(words.slice(mid).join(' '), 300, 160);
    } else { 
        ctx.fillText(text, 300, 128);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(x, y, z);
    sprite.scale.set(5, 2.13, 1);
    
    scene.add(sprite);
    platforms.push({ mesh: sprite, isSprite: true, bbox: null });
}

function createFloatingText(text, x, y, z, isLongText = false) {
    const canvasWidth = isLongText ? 1600 : 1024;
    const canvasHeight = isLongText ? 800 : 350;
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 20, 20, 0.8)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvasWidth - 8, canvasHeight - 8);

    ctx.fillStyle = '#00ffff';
    
    let fontSize = isLongText ? 42 : 46; 
    ctx.font = 'bold ' + fontSize + 'px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    const maxWidth = canvasWidth - 100;
    
    words.forEach(word => {
        if (ctx.measureText(currentLine + word + ' ').width < maxWidth) {
            currentLine += word + ' ';
        } else {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        }
    });
    if (currentLine) lines.push(currentLine.trim());

    const lineHeight = fontSize + 15;
    const startY = (canvasHeight / 2) - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvasWidth / 2, startY + (index * lineHeight));
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter; 
    
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    const scaleX = isLongText ? 28 : 18;
    const scaleY = isLongText ? 14 : 6.15;

    sprite.position.set(x, y, z);
    sprite.scale.set(scaleX, scaleY, 1); 
    
    scene.add(sprite);
    platforms.push({ mesh: sprite, isSprite: true, bbox: null });
}

// ==========================================
// INICIALIZACIÓN DE ESCENA (THREE.JS)
// ==========================================
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x5577aa); 
    scene.fog = new THREE.Fog(0x5577aa, 10, 150); 

    const starGeo = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount; i++) {
        starPos[i*3] = (Math.random() - 0.5) * 800;
        starPos[i*3+1] = Math.random() * 400; 
        starPos[i*3+2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    const lavaGeo = new THREE.PlaneGeometry(3000, 3000);
    lavaMesh = new THREE.Mesh(lavaGeo, lavaMaterial);
    lavaMesh.rotation.x = -Math.PI / 2;
    lavaMesh.position.y = -5;
    scene.add(lavaMesh);

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffddaa, 0.8);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);

    const pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    const yawObject = new THREE.Object3D();
    yawObject.position.y = 10;
    yawObject.add(pitchObject);
    scene.add(yawObject);

    controls = {
        getObject: () => yawObject,
        getPitch: () => pitchObject,
        lock: () => document.body.requestPointerLock(),
        unlock: () => document.exitPointerLock(),
        isLocked: false
    };

    document.addEventListener('pointerlockchange', () => {
        controls.isLocked = document.pointerLockElement === document.body;
    });

    document.addEventListener('mousemove', (event) => {
        if (!controls.isLocked || !isGameActive) return;
        yawObject.rotation.y -= event.movementX * 0.002;
        pitchObject.rotation.x -= event.movementY * 0.002;
        pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitchObject.rotation.x));
    });

    const onKeyDown = (e) => {
        switch (e.code) {
            case 'ArrowUp': 
            case 'KeyW':
                if (!moveForward) {
                    if (performance.now() - lastBackwardReleaseTime < IMPULSE_WINDOW) {
                        impulseMultiplier = 1.7; 
                        speedIndicator.style.display = 'block';
                    }
                }
                moveForward = true;
                break;
            case 'ArrowLeft': 
            case 'KeyA': moveLeft = true; break;
            case 'ArrowDown': 
            case 'KeyS': moveBackward = true; break;
            case 'ArrowRight': 
            case 'KeyD': moveRight = true; break;
            case 'Space': 
                if (canJump) { 
                    velocity.y = PLAYER_JUMP_FORCE; 
                    canJump = false; 
                } 
                break;
        }
    };

    const onKeyUp = (e) => {
        switch (e.code) {
            case 'ArrowUp': 
            case 'KeyW': moveForward = false; break;
            case 'ArrowLeft': 
            case 'KeyA': moveLeft = false; break;
            case 'ArrowDown': 
            case 'KeyS':
                moveBackward = false;
                lastBackwardReleaseTime = performance.now();
                break;
            case 'ArrowRight': 
            case 'KeyD': moveRight = false; break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);

    animate();
}

// ==========================================
// GENERACIÓN DE NIVELES
// ==========================================
function createLevel() {
    platforms.forEach(p => scene.remove(p.mesh));
    platforms = [];

    const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);

    function createPlatform(x, y, z, width, height, depth, isChoice = false, isCorrect = true, text = "", isGoal = false) {
        let materialArray = isGoal ? matGrassBlock : matStone;

        const mesh = new THREE.Mesh(unitBoxGeo, materialArray);
        mesh.position.set(x, y, z);
        mesh.scale.set(width, height, depth);
        mesh.userData = { isChoice, isCorrect, falling: false };
        
        scene.add(mesh);

        const bbox = new THREE.Box3().setFromObject(mesh);
        const surfaceY = y + (height / 2);
        platforms.push({ mesh, bbox, surfaceY, isGoal, isSprite: false });

        if (isGoal) createFlag(x, y + (height / 2), z);
        if (isChoice && text) createAnswerSprite(text, x, y + (height / 2) + 2.5, z);
    }

    const selectedBookId = bookSelect.value;
    const currentLevelData = booksData[selectedBookId][currentLang];
    const t = uiTranslations[currentLang];

    let currentZ = 0;
    const gapDistance = 4.5; 

    createPlatform(0, 0, currentZ, 6, 1, 6, false, true, t.platStart);
    createFloatingText(currentLevelData.synopsis, 0, 11, currentZ - gapDistance - 4, true);
    currentZ -= gapDistance + 9; 
    
    createPlatform(0, 0, currentZ, 10, 1, 6, true, true, t.platJump);
    currentZ -= gapDistance + 5;
    createPlatform(0, 0, currentZ, 6, 1, 6, false, true, t.platSafe);

    currentLevelData.questions.forEach((data, index) => {
        createFloatingText(data.q, 0, 8, currentZ - gapDistance - 4);
        currentZ -= gapDistance + 5; 
        
        let correctAnswerText = data.correct === 1 ? data.a1 : data.a2;
        let incorrectAnswerText = data.correct === 1 ? data.a2 : data.a1;

        let isLeftCorrect = Math.random() < 0.5;
        let leftText = isLeftCorrect ? correctAnswerText : incorrectAnswerText;
        let rightText = isLeftCorrect ? incorrectAnswerText : correctAnswerText;

        createPlatform(-3.5, 0, currentZ, 5, 1, 5, true, isLeftCorrect, leftText);
        createPlatform(3.5, 0, currentZ, 5, 1, 5, true, !isLeftCorrect, rightText);
        
        currentZ -= gapDistance + 5; 
        
        if (index === currentLevelData.questions.length - 1) {
            createPlatform(0, 0, currentZ, 8, 1, 8, false, true, t.platGoal, true);
            goalBox = new THREE.Box3();
            goalBox.setFromCenterAndSize(new THREE.Vector3(0, 1.5, currentZ), new THREE.Vector3(8, 3, 8));
        } else {
            createPlatform(0, 0, currentZ, 6, 1, 6, false, true, t.platSafe);
        }
    });
}

function createFlag(x, y, z) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 4), new THREE.MeshLambertMaterial({ color: 0x5D4037 }));
    pole.position.set(x, y + 1.5, z);
    scene.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide }));
    flag.position.set(x + 0.75, y + 2.5, z);
    scene.add(flag);
}

// ==========================================
// COLISIONES Y BUCLE DE JUEGO
// ==========================================
function checkCollisions(pos) {
    const raycaster = new THREE.Raycaster(pos, new THREE.Vector3(0, -1, 0), 0, 10);
    const collidableMeshes = platforms.filter(p => !p.isSprite).map(p => p.mesh);
    const intersects = raycaster.intersectObjects(collidableMeshes);

    if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.distance <= PLAYER_EYE_HEIGHT + 0.2) {
            if (hit.object.userData.isChoice && !hit.object.userData.isCorrect) hit.object.userData.falling = true;
            return { grounded: true, groundY: hit.point.y, object: hit.object };
        }
    }
    return { grounded: false, groundY: 0, object: null };
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1);
    prevTime = time;

    if (impulseMultiplier > 1.0) {
        impulseMultiplier -= delta * 0.5;
        if(impulseMultiplier <= 1.0) {
            impulseMultiplier = 1.0;
            speedIndicator.style.display = 'none';
        }
    }

    if (lavaMesh) {
        lavaMesh.material.map.offset.x -= 0.05 * delta;
        lavaMesh.material.map.offset.y -= 0.05 * delta;
        lavaMesh.position.y = -5 + Math.sin(time * 0.001) * 0.8;
    }

    platforms.forEach(p => {
        if (!p.isSprite && p.mesh.userData.falling) {
            p.mesh.position.y -= 25.0 * delta; 
            p.bbox.setFromObject(p.mesh);
        }
    });

    if (controls.isLocked && isGameActive) {
        const obj = controls.getObject();
        
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= GRAVITY * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const currentSpeed = PLAYER_SPEED * impulseMultiplier;

        if (moveForward || moveBackward) velocity.z -= direction.z * currentSpeed * 5.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * currentSpeed * 5.0 * delta;

        obj.translateX(-velocity.x * delta);
        obj.translateZ(velocity.z * delta);
        obj.position.y += velocity.y * delta;

        const col = checkCollisions(obj.position);

        if (col.grounded) {
            if (velocity.y < 0) {
                velocity.y = 0;
                obj.position.y = col.groundY + PLAYER_EYE_HEIGHT;
                canJump = true;
                lastGroundedTime = time;
            }
            if (col.object && col.object.userData.falling && velocity.y === 0) {
                 obj.position.y = col.object.position.y + (col.object.scale.y / 2) + PLAYER_EYE_HEIGHT;
            }
        } else {
            if (time - lastGroundedTime < COYOTE_TIME_MS && velocity.y < 0) canJump = true;
            else canJump = false;
        }

        if (obj.position.y < -3) gameOver();
        if (goalBox && goalBox.containsPoint(obj.position)) gameWin();
    }
    renderer.render(scene, camera);
}

// ==========================================
// FLUJO DE ESTADOS DEL JUEGO
// ==========================================
function startGame() {
    createLevel(); 
    velocity.set(0, 0, 0);
    impulseMultiplier = 1.0;
    speedIndicator.style.display = 'none';
    const obj = controls.getObject();
    obj.position.set(0, PLAYER_EYE_HEIGHT + 0.5, 0);
    obj.rotation.set(0, 0, 0);
    controls.getPitch().rotation.set(0, 0, 0);

    isGameActive = true;
    controls.lock();
    langSelector.style.display = 'none';
    introScreen.style.display = 'none';
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
}

function showMenu() {
    isGameActive = false;
    langSelector.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
    startScreen.style.display = 'flex'; 
}

function gameOver() { 
    isGameActive = false; 
    controls.unlock();
    langSelector.style.display = 'flex';
    gameOverScreen.style.display = 'flex';
}

function gameWin() { 
    isGameActive = false; 
    controls.unlock();
    langSelector.style.display = 'flex';
    winScreen.style.display = 'flex';
}

function onWindowResize() { 
    camera.aspect = window.innerWidth / window.innerHeight; 
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); 
}

btnStart.addEventListener('click', startGame);
btnRetry.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);
btnsMenu.forEach(btn => btn.addEventListener('click', showMenu));

// Inicialización
setLanguage('es');
init();