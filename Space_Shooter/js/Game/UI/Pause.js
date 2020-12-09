/**
 *Pause.js
 *
 * Manages the whole pause menu panel in the game
 * @author UWS Student Web Games Development 1 (2020-2021).
 * @creation 05/12/2020
*/

//Variable used just to hide the parameters button
let parametersButtonHidden = false;
let TEXT_PAUSE = "PAUSE";

/**
 * Creating the pause menu panel and the pause menu objects
*/

function createPausePanel(context) {

    let pause = {

        //Current played status.
        currentSceneContext : null,

        //Adding a darker background to show when the player presses the pause button.
        backgroundImage : null,
        backgroundObject : null,
        backgroundAlpha : 0.5,

        //Menu Panel object
        panelImage : null,
        panelObject : null,

        //Button object.
        pauseImage : "pause",
        pauseGameObject : null,

        //Pause menu text object.
        pauseTextObject : null,
        pauseTextIndex : 0,

        //Changing the keyboard layout
        keyBoardMoveImage : "KeyBoardWASD",
        keyBoardMoveGameObject : null,
        keyBoardMoveTextObject : null,
        keyBoardMoveTextValue : "Change keyboard",
        keyBoardDown : false,

        //Music button.
        musicButtonImage : "music",
        musicButtonGameObject : null,

        //Sound button.
        soundButtonImage : "sound",
        soundButtonGameObject : null,

        //Resume button.
        resumeButtonImage : "resume",
        resumeButtonGameObject : null,

        //Back to the main menu object with text.
        exitToMenuButtonImage : "exit",
        exitToMenuButtonGameObject : null,
        exitToMenuButtonTextObject : null,
        exitToMenuButtonTextValue : "Exit to menu",

        /**
         * Initialising the pause menu objects
         * */
        init : function(context) {

            //Creating and setting the background in the pause menu
            this.backgroundImage = "space" + difficulty;
            this.backgroundObject = context.physics.add.image(canvasWidth / 2, canvasHeightMiddle, this.backgroundImage);
            this.backgroundObject.setDisplaySize(canvasWidth, canvasHeight);
            this.backgroundObject.alpha = 0;
            this.backgroundObject.setInteractive();

            //If the player clicks out or exits the pause box, leave and exit the pause menu.
            this.backgroundObject.on('pointerdown', () => {
                isPaused = false;
                audio.pauseMenu(isPaused);
            });

            //Creating and setting the main menu panel object.
            this.panelImage = "window";
            this.panelObject = context.physics.add.image(canvasWidth /2, canvasHeightMiddle, this.panelImage);
            this.panelObject.setDisplaySize(200, 300);
            this.panelObject.alpha = 0;

            //Creating the panel title.
            this.pauseTextObject = createText(context, "", canvasWidth /2 - (4*16), 105, 40, blueColor);

            //Initialising the buttons for getting to the pause menu or exiting it.
            this.initButtons(context);

            //Initialising the button to change to keyboard controls for user.
            this.initKeyBoard(context);

            //Initialising both the two sound button managers. Turning them ON/OFF.
            this.initSoundManager(context);
        },

        /**
        * Initialising the pause menu objects
        * */
        initButtons : function(context) {
            //Creating and setting the button to access the pause menu in the game.
            this.pauseGameObject = context.physics.add.image(canvasWidth - 50, 50, this.pauseImage);
            this.pauseGameObject.setDisplaySize(50, 50);
            activateButton(this.pauseGameObject, this.pauseImage, false);
            this.pauseGameObject.on('pointerdown', () => {
                isPaused = !isPaused;
                //Play the audio.
                audio.pauseMenu(isPaused);
            });

            //Creates and sets the button to get back to the main game.
            this.resumeButtonGameObject = context.physics.add.image(this.panelObject.x + 100, this.panelObject.y + 150, this.resumeButtonImage);
            this.resumeButtonGameObject.alpha = 0;
            this.resumeButtonGameObject.setDisplaySize(80, 80);
            activateButton(this.resumeButtonGameObject, this.resumeButtonImage, false);
            this.resumeButtonGameObject.on('pointerdown', () => {
                isPaused = false;
                //Plays the associated audio.
                audio.pauseMenu(isPaused);
            });

            //Creating and setting the button to get back to the main menu.
            this.exitToMenuButtonGameObject = context.physics.add.image(this.panelObject.x - 40, this.panelObject.y + this.panelObject.displayWidth - 45, this.exitToMenuButtonImage);
            this.exitToMenuButtonGameObject.alpha = 0;
            this.exitToMenuButtonGameObject.setDisplaySize(200, 70);
            this.exitToMenuButtonTextObject = createText(context, this.exitToMenuButtonTextValue, this.exitToMenuButtonGameObject.x - this.exitToMenuButtonTextValue.length*5.8 , this.exitToMenuButtonGameObject.y - 13, 20, whiteColor);
            this.exitToMenuButtonTextObject.gameObject.alpha = 0;
            activateButton(this.exitToMenuButtonGameObject, this.exitToMenuButtonImage, false);
            this.exitToMenuButtonGameObject.on("pointerdown", () => {
                //Reset the game.
                resetGame();
                changeScene(this.currentSceneContext, "MenuScene");
                isPaused = false;
            });
        },

        /**
         * Initialising the button for switching the keyboard layout
         * Going from QWERTY to DVORAK
         */
        initKeyBoard : function(context) {

            //Initialises the image button.
            this.keyBoardMovGameObject = context.physics.add.image(this.panelObject.x, this.panelObject.y - 70, this.keyBoardMoveImage);
            this.keyBoardMovGameObject.setDisplaySize(150, 99);
            this.keyBoardMovGameObject.setInteractive();
            this.keyBoardMovGameObject.on("pointerover", () => {
                this.keyBoardMoveGameObject.setTexture(this.keyBoardMoveImage + "Over");
            });

            this.keyBoardMoveGameObject.on("pointerout", () => {
                this.keyBoardMoveGameObject.setTexture(this.keyBoardMoveImage);
            });

            this.keyBoardMoveGameObject.on("pointerdown", () => {
                //Manage the possible multi click.
                if(!this.keyBoardDown) {

                    //Switch the keyboard.
                    if(this.keyBoardMoveImage === "KeyBoardZQSD") {
                        this.keyBoardMoveImage = "KeyBoardWASD";
                        changeKeyBoard(true);
                    } else {
                        this.keyBoardMoveImage = "KeyBoardZQSD";
                        changeKeyBoard(false);
                    }
                    this.keyBoardDown = true;
                    //Switch the image.
                    this.keyBoardMoveGameObject.setTexture(this.keyBoardMoveImage);
                }
            });

            //Manage to be able to click again on the button after outclick it.
            this.keyBoardMoveGameObject.on("pointerup", () => {
                this.keyBoardDown = false;
            });

            //Creates the text object associated.
            this.keyBoardMoveTextObject = createText(context, this.keyBoardMoveTextValue, this.panelObject.x - 90, this.panelObject.y -140, 20, whiteColor);
            this.keyBoardMoveTextObject.gameObject.alpha = 0;
            this.keyBoardMoveGameObject.alpha = 0;
    }
}