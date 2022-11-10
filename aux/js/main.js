$(document).ready(function(){
    var AudioContext = window.AudioContext || window.webkitAudioContext || false;
    var mainAudio = new AudioContext();
    mainAudio.suspend();
    var frequencies = [329.63,261.63,220,164.81];
    var errOsc = mainAudio.createOscillator();
    errOsc.type = 'triangle';
    errOsc.frequency.value = 110;
    errOsc.start(0.0);     
    var errNode = mainAudio.createGain();
    errOsc.connect(errNode);
    errNode.gain.value = 0;
    errNode.connect(mainAudio.destination);

    var ramp = 0.1;
    var vol = 0.5;

    var game = {};
    game.restart = () =>{
        this.start();
    }  
    game.start = () =>{
        this.sequence = [];   
        this.count = 0;
        this.lock = false;
        this.tStepInd = 0;
        this.index = 0;
        this.lastPush = $('#comp1')
    }

    var oscillators = frequencies.map(function(frq){
        var osc = mainAudio.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frq;
        osc.start(0.0);
        return osc;
    });
  
    var gainNodes = oscillators.map(function(osc){
        var g = mainAudio.createGain();
        osc.connect(g);
        g.connect(mainAudio.destination);
        g.gain.value = 0;
        return g;
    });

    function playGoodTone(num){
        gainNodes[num].gain.linearRampToValueAtTime(vol, mainAudio.currentTime + ramp);
        gameStatus.currPush = $('#comp'+num);
        gameStatus.currPush.style.opacity = 1;
    };

    function stopGoodTones(){
        if(gameStatus.currPush){
            gameStatus.currPush.style.opacity = .4;
        }
        gainNodes.forEach(function(g){
            g.gain.linearRampToValueAtTime(0, mainAudio.currentTime + ramp);
        });
        gameStatus.currPush = undefined;
        gameStatus.currOsc = undefined;
    };

    function playErrTone(){
        errNode.gain.linearRampToValueAtTime(vol, mainAudio.currentTime + ramp);
    };
  
    function stopErrTone(){
        errNode.gain.linearRampToValueAtTime(0, mainAudio.currentTime + ramp);
    };

    function gameStart(){
        mainAudio.resume();
        resetTimers();
        stopGoodTones();
        stopErrTone();
        $('#scoreIndicatorText').text('0');
        gameStatus.start();
        addStep();
    }

    function setTimeStep(num){
        var tSteps = [1250 , 1000 , 750, 500 ];
        if (num < 4)
            return tSteps[0];
        if (num < 8)
            return tSteps[1];
        if (num < 12)
            return tSteps[2];
        return tSteps[3];
    }

    function notifyError(pushObj){
        gameStatus.lock = true;
        $('.component').removeClass('clickable').addClass('unclickable');
        playErrTone();
        if(pushObj){
            pushObj.style.opacity = 1;
        }
        gameStatus.toHndl = setTimeout(function(){
            stopErrTone();
            if(pushObj){
                pushObj.style.opacity = .4;
            }
           
            gameStatus.toHndlSt = setTimeout(function(){
            if(gameStatus.strict){
                gameStart()
            }
            else{
                playSequence();
            }
          },1000);
        },1000);
    };

    function displayCount(){
        var p = (gameStatus.count < 10) ? '0' : '';
        $('#scoreIndicatorText').text(p+(gameStatus.count+''));
    }

    function playSequence(){
        var i = 0;
        gameStatus.index = 0;
        gameStatus.seqHndl = setInterval(function(){
            displayCount();
            gameStatus.lock = true;
            playGoodTone(gameStatus.sequence[i]);
            gameStatus.toHndl = setTimeout(stopGoodTones,gameStatus.timeStep/2 - 10);
            i++;
            if(i === gameStatus.sequence.length){
                clearInterval(gameStatus.seqHndl);
                $('.component').removeClass('unclickable').addClass('clickable');
                gameStatus.lock = false;
                gameStatus.toHndl = setTimeout(notifyError,5*gameStatus.timeStep);
            } 
        },gameStatus.timeStep);
    };

    function addStep(){
        gameStatus.timeStep = setTimeStep(gameStatus.count++);
        gameStatus.sequence.push(Math.floor(Math.random()*4 + 1));
        gameStatus.toHndl=setTimeout(playSequence,500);
    };

    function resetTimers(){
        clearInterval(gameStatus.seqHndl);
        clearInterval(gameStatus.flHndl);
        clearTimeout(gameStatus.toHndl);
        clearTimeout(gameStatus.toHndlFl);
        clearTimeout(gameStatus.toHndlSt);
    };
    
    function pushColor(pushObj){
        if(!gameStatus.lock) {
            clearTimeout(gameStatus.toHndl);
            var pushNr = pushObj.attr('id');
            if( pushNr == gameStatus.sequence[gameStatus.index] && gameStatus.index < gameStatus.sequence.length){
                playGoodTone(pushNr);
                gameStatus.lastPush = pushObj;
                gameStatus.index++;
                if(gameStatus.index < gameStatus.sequence.length){
                    gameStatus.toHndl = setTimeout(notifyError,5*gameStatus.timeStep);
                }else if (gameStatus.index == 20){
                    $('.component').removeClass('clickable').addClass('unclickable');
                    gameStatus.toHndl = setTimeout(notifyWin,gameStatus.timeStep);
                }else{
                    $('.component').removeClass('clickable').addClass('unclickable');
                    addStep();
                }
            }else{
                $('.component').removeClass('clickable').addClass('unclickable');
                notifyError(pushObj);
            }
        }
    }

    $('.component').mousedown(function(){
        pushColor($(this));
    });
  
    $('*').mouseup(function(e){
        e.stopPropagation();
        if(!gameStatus.lock)
            stopGoodTones();
    });
});

/*

const startButton = document.getElementById("startButton");
const start = document.getElementById("start");
const main = document.getElementById("main");
const scoreIndicatorText = document.getElementById("scoreIndicatorText");
const simonBlock = document.getElementById("simonBlock");

var comp1 = document.getElementById("comp1");
var comp2 = document.getElementById("comp2");
var comp3 = document.getElementById("comp3");
var comp4 = document.getElementById("comp4");
comp1.style.backgroundColor = "#62C988";
comp2.style.backgroundColor = "#CC5A59";
comp3.style.backgroundColor = "#D2D44A";
comp4.style.backgroundColor = "#138FCE";
comp1.style.opacity = .4;
comp2.style.opacity = .4;
comp3.style.opacity = .4;
comp4.style.opacity = .4;



function sleep(time) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });
}

startButton.addEventListener("click", ()=>{
    start.classList.add("active");
    main.style.opacity = 1;
    start.style.zIndex = -1;
    if(!inGame)
        startGame();
});
  

async function startGame() {
    inGame = true;
    await sleep(1500);
    start.style.display = "none";
    generator();
}

let inGame = false;
let pattern = "";
let playerTime = false;
let animationSpeed = 500;
let animationSpeed2 = 150;
let roundMoves = 0;
let round = 0;
const generator = ()=>{
    let aux = Math.floor(Math.random() * 4);
    pattern += aux;
    animation(pattern);
}

async function loseAnimation(){
    for(let i = 0; i < 3; i++){
        comp1.style.opacity = 1;
        await sleep(animationSpeed2);
        comp1.style.opacity = .4;
        comp2.style.opacity = 1;
        await sleep(animationSpeed2);
        comp2.style.opacity = .4;
        comp4.style.opacity = 1;
        await sleep(animationSpeed2);
        comp4.style.opacity = .4;
        comp3.style.opacity = 1;
        await sleep(animationSpeed2);
        comp3.style.opacity = .4;
    }
}

function playerMove(i){
    simonBlock.style.display = "none";
    return new Promise(resolve => {
        comp1.addEventListener("mousedown", async function(){
            
            if(pattern[i] == "0"){
                resolve(false);
            }else{
                resolve(true);
            }
        });
        comp2.addEventListener("mousedown", async function(){
            
            if(pattern[i] == "1"){
                resolve(false);
            }else{
                resolve(true);
            }
        });
        comp3.addEventListener("mousedown", async function(){
            
            if(pattern[i] == "2"){
                resolve(false);
            }else{
                resolve(true);
            }
        });
        comp4.addEventListener("mousedown", async function(){
            
            if(pattern[i] == "3"){
                resolve(false);
            }else{
                resolve(true);     
            }
        });     
        comp1.addEventListener("mouseenter", ()=>{
            comp1.style.opacity = 1;
        });
        comp1.addEventListener("mouseleave", ()=>{
            comp1.style.opacity = .4;
        });
        comp2.addEventListener("mouseenter", ()=>{
            comp2.style.opacity = 1;
        });
        comp2.addEventListener("mouseleave", ()=>{
            comp2.style.opacity = .4;
        });
        comp3.addEventListener("mouseenter", ()=>{
            comp3.style.opacity = 1;
        });
        comp3.addEventListener("mouseleave", ()=>{
            comp3.style.opacity = .4;
        });
        comp4.addEventListener("mouseenter", ()=>{
            comp4.style.opacity = 1;
        });
        comp4.addEventListener("mouseleave", ()=>{
            comp4.style.opacity = .4;
        });
    });  
}

async function userInput(pattern){
    playerTime = true;
    let flagAux = false;
    for(let i = 0; i < pattern.length && !flagAux; i++){
        let result = await playerMove(i);
        if(result){
            flagAux = true;
            break;
        }
    }
    simonBlock.style.display = "block";
    if(flagAux){
        await sleep(animationSpeed);
        loseAnimation();
    }else{
        await sleep(animationSpeed);
        round++;
        scoreIndicatorText.innerHTML = round;
        generator();
    }
}

async function animation(code){
    for(let i = 0; i < code.length; i++){
        await sleep(animationSpeed);
        if(code[i] == "0"){
            comp1.style.opacity = 1;
            await sleep(animationSpeed);
            comp1.style.opacity = .4;
        }else if(code[i] == "1"){
            comp2.style.opacity = 1;
            await sleep(animationSpeed);
            comp2.style.opacity = .4;
        }else if(code[i] == "2"){
            comp3.style.opacity = 1;
            await sleep(animationSpeed);
            comp3.style.opacity = .4;
        }if(code[i] == "3"){
            comp4.style.opacity = 1;
            await sleep(animationSpeed);
            comp4.style.opacity = .4;
        }
    }
    userInput(code);
}


*/
