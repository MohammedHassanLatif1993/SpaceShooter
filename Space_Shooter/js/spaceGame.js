export default class SpaceGame extends Phaser.Scene {
    constructor() {
        super('spaceGame');
    }
}

let player;
let boss;
let greenEnemies;
let blueEnemies;
let blueEnemyBullets;
let enemyBullets;
let starfield;
let cursors;
let bank;
let shipTrail;
let explosions;
let playerDeath;
let bullets;
let fireButton;
let fireButton1;
let fireButton2;
let fireButton3;
let fireButton4;
let bulletTimer = 0;
let shields;
let score = 0;
let scoreText;
let greenEnemyLaunchTimer;
let greenEnemySpacing = 1000;
let blueEnemyLaunchTimer;
let blueEnemyLaunched = false;
let blueEnemySpacing = 2500;
let bossLaunchTimer;
let bossLaunched = false;
let bossSpacing = 20000;
let bossBulletTimer = 0;
let bossYdirection = -1;
let gameOver;

let ACCLERATION = 600;
let DRAG = 400;
let MAXSPEED = 400;

function preload() {
    this.load.image('enemy-green', '../assets/images/asteroid.png');
    this.load.image('blueEnemyBullet', '../assets/images/enemy-blue-bullet.png');
    this.load.spritesheet('explosion', '../assets/images/explode.png', 128, 128);
    this.load.bitmapFont('spacefont', '../assets/fonts/spacefont/spacefont.png', '../assets/fonts/spacefont/spacefont.xml');
    this.load.image('deathRay', '../assets/images/death-ray.png');

    //load custom images
    this.load.image('player', '../assets/images/player.png');
    this.load.image('background', '../assets/images/background.jpg');
    this.load.image('bullet', '../assets/images/red-bullet.gif');
    this.load.image('enemy-blue', '../assets/images/alien-ship.png');
    this.load.image('boss', '../assets/images/boss.png');
}

function create() {
    //  The scrolling starfield background
    starfield = this.add.tileSpacing(0, 0, 800, 600, 'background');

    //  the bullet group
    bullets = this.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.Arcade;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    //  The player
    player = this.add.sprite(400, 500, 'player');
    player.health = 1000;
    player.anchor.setTo(0.5, 0.5);
    this.physics.enable(player, Phaser.Physics.Arcade);
    player.body.maxVelocity.setTo(MAXSPEED, MAXSPEED);
    player.body.drag.setTo(DRAG, DRAG);
    player.weaponLevel = 1
    player.events.onKilled.add(function(){
        shipTrail.kill();
    });
    player.events.onRevived.add(function(){
        shipTrail.start(false, 5000, 10);
    });

    //  The enemeies (greenEnemies group only below)
    greenEnemies = this.add.group();
    greenEnemies.enableBody = true;
    greenEnemies.physicsBodyType = Phaser.Physics.Arcade;
    greenEnemies.createMultiple(5, 'enemy-green');
    greenEnemies.setAll('anchor.x', 0.5);
    greenEnemies.setAll('anchor.y', 0.5);
    greenEnemies.setAll('scale.x', 0.5);
    greenEnemies.setAll('scale.y', 0.5);
    greenEnemies.setAll('angle', 180);
    greenEnemies.forEach(function(enemy){
        addEnemyEmitterTrail(enemy);
        enemy.body.setSize(enemy.width * 3 / 4, enemy.height * 3 / 4);
        enemy.damageAmount = 20;
        enemy.events.onKilled.add(function(){
            enemy.trail.kill();
        });
    });

    game.time.events.add(1000, launchGreenEnemy);

    //  Blue enemy's bullets
    blueEnemyBullets = game.add.group();
    blueEnemyBullets.enableBody = true;
    blueEnemyBullets.physicsBodyType = Phaser.Physics.Arcade;
    blueEnemyBullets.createMultiple(30, 'blueEnemyBullet');
    blueEnemyBullets.callAll('crop', null, {x: 90, y: 0, width: 90, height: 70});
    blueEnemyBullets.setAll('alpha', 0.9);
    blueEnemyBullets.setAll('anchor.x', 0.5);
    blueEnemyBullets.setAll('anchor.y', 0.5);
    blueEnemyBullets.setAll('outOfBoundsKill', true);
    blueEnemyBullets.setAll('checkWorldBounds', true);
    blueEnemyBullets.forEach(function(enemy){
        enemy.body.setSize(20, 20);
    });

    //  More enemies
    blueEnemies = game.add.group();
    blueEnemies.enableBody = true;
    blueEnemies.physicsBodyType = Phaser.Physics.Arcade;
    blueEnemies.createMultiple(30, 'enemy-blue');
    blueEnemies.setAll('anchor.x', 0.5);
    blueEnemies.setAll('anchor.y', 0.5);
    blueEnemies.setAll('scale.x', 0.5);
    blueEnemies.setAll('scale.y', 0.5);
    blueEnemies.setAll('angle', 180);
    blueEnemies.forEach(function(enemy){
        enemy.damageAmount = 40;
    });

    //  The boss
    boss = game.add.sprite(0, 0, 'boss');
    boss.exists = false;
    boss.alive = false;
    boss.anchor.setTo(0.5, 0.5);
    boss.damageAmount = 50;
    boss.angle = 180;
    boss.scale.x = 0.6;
    boss.scale.y = 0.6;
    game.physics.enable(boss, Phaser.Physics.Arcade);
    boss.body.maxVelocity.setTo(100, 80);
    boss.dying = false;
    boss.finishOff = function() {
        if (!boss.dying) {
            boss.dying = true;
            bossDeath.x = boss.x;
            bossDeath.y = boss.y;
            bossDeath.start(false, 1000, 50, 20);

            //  kill boss after explosions
            game.time.events.add(1000, function(){
                var explosion = explosions.getFirstExists(false);
                var beforeScaleX = explosions.scale.x;
                var beforeScaleY = explosions.scale.y;
                var beforeAlpha = explosions.alpha;
                explosion.reset(boss.body.x + boss.body.halfWidth, boss.body.y + boss.body.halfHeight);
                explosion.alpha = 0.4;
                explosion.scale.x = 3;
                explosion.scale.y = 3;
                var animation = explosion.play('explosion', 30, false, true);
                animation.onComplete.addOnce(function(){
                    explosion.scale.x = beforeScaleX;
                    explosion.scale.y = beforeScaleY;
                    explosion.alpha = beforeAlpha;
                });
                boss.kill();
                booster.kill();
                boss.dying = false;
                bossDeath.on = false;
                //  queue next boss
                bossLaunchTimer = game.time.events.add(game.rnd.integerInRange(bossSpacing, bossSpacing + 5000), launchBoss);
            });

            //  reset pacing for other enemies
            blueEnemySpacing = 2500;
            greenEnemySpacing = 1000;

            //  give some bonus health
            player.health = Math.min(100, player.health + 40);
            shields.render();
        }
    };

    //  Boss death ray
    function addRay(leftRight) {
        let ray = game.add.sprite(leftRight * boss.width * 0.75, 0, 'deathRay');
        ray.alive = false;
        ray.visible = false;
        boss.addChild(ray);
        ray.crop({x: 0, y: 0, width: 40, height: 40});
        ray.anchor.x = 0.5;
        ray.anchor.y = 0.5;
        ray.scale.x = 2.5;
        ray.damageAmount = boss.damageAmount;
        this.physics.enable(ray, Phaser.Physics.ARCADE);
        ray.body.setSize(ray.width / 2, ray.height / 4);
        ray.update = function() {
            this.alpha = game.rnd.realInRange(0.6, 1);
        };
        boss['ray' + (leftRight > 0 ? 'Right' : 'Left')] = ray;
    }
    addRay(1);
    addRay(-1);
    //  need to add the ship texture to the group so it renders over the rays
    let ship = game.add.sprite(0, 0, 'boss');
    ship.anchor = {x: 0.5, y: 0.5};
    boss.addChild(ship);

    boss.fire = function() {
        if (game.time.now > bossBulletTimer) {
            let raySpacing = 3000;
            let chargeTime = 1500;
            let rayTime = 1500;

            function chargeAndShoot(side) {
                ray = boss['ray' + side];
                ray.name = side
                ray.revive();
                ray.y = 80;
                ray.alpha = 0;
                ray.scale.y = 13;
                game.add.tween(ray).to({alpha: 1}, chargeTime, Phaser.Easing.Linear.In, true).onComplete.add(function(ray){
                    ray.scale.y = 150;
                    game.add.tween(ray).to({y: -1500}, rayTime, Phaser.Easing.Linear.In, true).onComplete.add(function(ray){
                        ray.kill();
                    });
                });
            }
            chargeAndShoot('Right');
            chargeAndShoot('Left');

            bossBulletTimer = game.time.now + raySpacing;
        }
    };

    boss.update = function() {
        if (!boss.alive) return;

        boss.rayLeft.update();
        boss.rayRight.update();

        if (boss.y > 140) {
            boss.body.acceleration.y = -50;
        }
        if (boss.y < 140) {
            boss.body.acceleration.y = 50;
        }
        if (boss.x > player.x + 50) {
            boss.body.acceleration.x = -50;
        } else if (boss.x < player.x - 50) {
            boss.body.acceleration.x = 50;
        } else {
            boss.body.acceleration.x = 0;
        }

        //  Squish and rotate boss for illusion of "banking"
        var bank = boss.body.velocity.x / MAXSPEED;
        boss.scale.x = 0.6 - Math.abs(bank) / 3;
        boss.angle = 180 - bank * 20;

        booster.x = boss.x + -5 * bank;
        booster.y = boss.y + 10 * Math.abs(bank) - boss.height / 2;

        //  fire if player is in target
        var angleToPlayer = Phaser.Math.RAD_TO_DEG(game.physics.arcade.angleBetween(boss, player)) - 90;
        var anglePointing = 180 - Math.abs(boss.angle);
        if (anglePointing - angleToPlayer < 18) {
            boss.fire();
        }
    }

    //  boss's boosters
    booster = game.add.emitter(boss.body.x, boss.body.y - boss.height / 2);
    booster.width = 0;
    booster.makeParticles('blueEnemyBullet');
    booster.forEach(function(p){
        p.crop({x: 120, y: 0, width: 45, height: 50});
        //  clever way of making 2 exhaust trails by shifing particles randomly left or right
        p.anchor.x = game.rnd.pick([1,-1]) * 0.95 + 0.5;
        p.anchor.y = 0.75;
    });
    booster.setXSpeed(0, 0);
    booster.setRotation(0,0);
    booster.setYSpeed(-30, -50);
    booster.gravity = 0;
    booster.setAlpha(1, 0.1, 400);
    booster.setScale(0.3, 0, 0.7, 0, 5000, Phaser.Easing.Quadratic.Out);
    boss.bringToTop();

    //  And some controls to play the game with
    cursors = game.input.keyboard.createCursorKeys();
    fireButton1 = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
    fireButton2 = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
    fireButton3 = game.input.keyboard.addKey(Phaser.Keyboard.THREE);
    fireButton4 = game.input.keyboard.addKey(Phaser.Keyboard.FOUR);


    //  Add an emitter for the player's trail
    shipTrail = game.add.emitter(player.x, player.y + 20, 400);
    shipTrail.width = 10;
    shipTrail.makeParticles('bullet');
    shipTrail.setXSpeed(30, -30);
    shipTrail.setYSpeed(200, 180);
    shipTrail.setRotation(50,-50);
    shipTrail.setAlpha(1, 0.01, 800);
    shipTrail.setScale(0.05, 0.4, 0.05, 0.4, 2000, Phaser.Easing.Quintic.Out);
    shipTrail.start(false, 5000, 10);

    //  An explosion pool
    explosions = game.add.group();
    explosions.enableBody = true;
    explosions.physicsBodyType = Phaser.Physics.ARCADE;
    explosions.createMultiple(30, 'explosion');
    explosions.setAll('anchor.x', 0.5);
    explosions.setAll('anchor.y', 0.5);
    explosions.forEach( function(explosion) {
        explosion.animations.add('explosion');
    });

    //  Big explosion
    playerDeath = game.add.emitter(player.x, player.y);
    playerDeath.width = 50;
    playerDeath.height = 50;
    playerDeath.makeParticles('explosion', [0,1,2,3,4,5,6,7], 10);
    playerDeath.setAlpha(0.9, 0, 800);
    playerDeath.setScale(0.1, 0.6, 0.1, 0.6, 1000, Phaser.Easing.Quintic.Out);

    //  Big explosion for boss
    bossDeath = game.add.emitter(boss.x, boss.y);
    bossDeath.width = boss.width / 2;
    bossDeath.height = boss.height / 2;
    bossDeath.makeParticles('explosion', [0,1,2,3,4,5,6,7], 20);
    bossDeath.setAlpha(0.9, 0, 900);
    bossDeath.setScale(0.3, 1.0, 0.3, 1.0, 1000, Phaser.Easing.Quintic.Out);

    //  Shields stat
    shields = game.add.bitmapText(game.world.width - 250, 10,  'spacefont', + player.health +'%', 50);
    shields.render = function () {
        shields.text = 'Shields: ' + Math.max(player.health, 0) +'%';
    };
    shields.render();

    //  Score
    scoreText = game.add.bitmapText(10, 10, 'spacefont', '', 50);
    scoreText.render = function () {
        scoreText.text = 'Score: ' + score;
    };
    scoreText.render();

    //  Game over text
    gameOver = game.add.bitmapText(game.world.centerX, game.world.centerY, 'spacefont', 'GAME OVER MAN!', 100);
    gameOver.x = gameOver.x - gameOver.textWidth / 2;
    gameOver.y = gameOver.y - gameOver.textHeight / 3;
    gameOver.visible = false;
}

function update() {
    //  Scroll the background
    starfield.tilePosition.y += 0.5;

    //  Reset the player, then check for movement keys
    player.body.acceleration.x = 0;
    player.body.acceleration.y = 0;

    if (cursors.left.isDown)
    {
        player.body.acceleration.x = -ACCLERATION;
    }
    else if (cursors.right.isDown)
    {
        player.body.acceleration.x = ACCLERATION;
    }
    else if (cursors.up.isDown)
    {
        player.body.acceleration.y = -ACCLERATION;
    }
    else if (cursors.down.isDown)
    {
        player.body.acceleration.y = ACCLERATION;
    }

    //  Stop at screen edges
    if (player.x > game.width - 50) {
        player.x = game.width - 50;
        player.body.acceleration.x = 0;
    }
    if (player.x < 50) {
        player.x = 50;
        player.body.acceleration.x = 0;
    }

    if (player.y > game.height - 50) {
        player.y = game.height - 50;
        player.body.acceleration.y = 0;
    }

    if(player.y < 50 ) {
        player.y = 50;
        player.body.acceleration.y = 0;
    }

    //  Fire bullet
    if (player.alive && fireButton1.isDown) {
        fireBullet1();
    }

    if (player.alive && (fireButton2.isDown || game.input.activePointer.isDown)) {
        fireBullet2();
    }

    if (player.alive && fireButton3.isDown) {
        fireBullet3();
    }

    if (player.alive && fireButton4.isDown) {
        fireBullet4();
    }



    //  Move ship towards mouse pointer
    if (game.input.x < game.width - 20 &&
        game.input.x > 20 &&
        game.input.y > 20 &&
        game.input.y < game.height - 20) {
        let minimumDistance = 200;
        let distance = game.input.x - player.x;
        player.body.velocity.x = MAXSPEED * game.Math.clamp(distance / minimumDistance, -1, 1);
    }

    //  Squish and rotate ship for illusion of "banking"
    bank = player.body.velocity.x / MAXSPEED;
    player.scale.x = 1 - Math.abs(bank) / 2;
    player.angle = bank * 30;

    //  Keep the shipTrail lined up with the ship
    shipTrail.x = player.x;
    shipTrail.y = player.y;

    //  Check collisions
    this.physics.add.overlap(player, greenEnemies, shipCollide, null, this);
    this.physics.add.overlap(greenEnemies, bullets, hitEnemy, null, this);

    this.physics.add.overlap(player, blueEnemies, shipCollide, null, this);
    this.physics.add.overlap(blueEnemies, bullets, hitEnemy, null, this);

    this.physics.add.overlap(boss, bullets, hitEnemy, bossHitTest, this);
    this.physics.add.overlap(player, boss.rayLeft, enemyHitsPlayer, null, this);
    this.physics.add.overlap(player, boss.rayRight, enemyHitsPlayer, null, this);

    this.physics.add.overlap(blueEnemyBullets, player, enemyHitsPlayer, null, this);

    //  Game over?
    if (! player.alive && gameOver.visible === false) {
        gameOver.visible = true;
        gameOver.alpha = 0;
        let fadeInGameOver = game.add.tween(gameOver);
        fadeInGameOver.to({alpha: 1}, 1000, Phaser.Easing.Quintic.Out);
        fadeInGameOver.onComplete.add(setResetHandlers);
        fadeInGameOver.start();
        function setResetHandlers() {
            //  The "click to restart" handler
            tapRestart = game.input.onTap.addOnce(_restart,this);
            spaceRestart = fireButton.onDown.addOnce(_restart,this);
            function _restart() {
                tapRestart.detach();
                spaceRestart.detach();
                restart();
            }
        }
    }
}

function render() {
    // for (var i = 0; i < greenEnemies.length; i++)
    // {
    //     game.debug.body(greenEnemies.children[i]);
    // }
    // game.debug.body(player);
}

function fireBullet2() {
    switch (player.weaponLevel) {
        case 1:
            //  To avoid them being allowed to fire too fast we set a time limit
            if (game.time.now > bulletTimer) {
                let BULLET_SPEED = 400;
                let BULLET_SPACING = 250;
                //  Grab the first bullet we can from the pool
                let bullet = bullets.getFirstExists(false);

                if (bullet) {
                    //  And fire it
                    //  Make bullet come out of tip of ship with right angle
                    let bulletOffset = 20 * Math.sin(Phaser.Math.RAD_TO_DEG(player.angle));
                    bullet.reset(player.x + bulletOffset, player.y);
                    bullet.angle = player.angle;
                    Phaser.Physics.Arcade.velocityFromAngle(bullet.angle - 90, BULLET_SPEED, bullet.body.velocity);
                    bullet.body.velocity.x += player.body.velocity.x;

                    bulletTimer = game.time.now + BULLET_SPACING;
                }
            }
            break;

        case 2:
            if (game.time.now > bulletTimer) {
                BULLET_SPEED = 2000;
                BULLET_SPACING = 550;

                for (let i = 0; i < 9; i++) {
                    let bullet = bullets.getFirstExists(false);
                    if (bullet) {
                        //  Make bullet come out of tip of ship with right angle
                        let bulletOffset = 20 * Math.sin(game.Phaser.Math.RAD_TO_DEG(player.angle));
                        bullet.reset(player.x + bulletOffset, player.y);
                        //  "Spread" angle of 1st and 3rd bullets
                        let spreadAngle;
                        if (i === 0) spreadAngle = -20;
                        if (i === 1) spreadAngle = -15;
                        if (i === 2) spreadAngle = -10;
                        if (i === 3) spreadAngle = -5;
                        if (i === 4) spreadAngle = 0;
                        if (i === 5) spreadAngle = 5;
                        if (i === 6) spreadAngle = 10;
                        if (i === 7) spreadAngle = 15;
                        if (i === 8) spreadAngle = 20;

                        bullet.angle = player.angle + spreadAngle;
                        this.physics.arcade.velocityFromAngle(spreadAngle - 90, BULLET_SPEED, bullet.body.velocity);
                        bullet.body.velocity.x += player.body.velocity.x;
                    }
                    bulletTimer = game.time.now + BULLET_SPACING;
                }
            }
    }
}
function fireBullet3() {
    let bulletOffset;
    let bullet;
    let BULLET_SPEED;
    let BULLET_SPACING;
    switch (player.weaponLevel) {
        case 1:
            //  To avoid them being allowed to fire too fast we set a time limit
            if (game.time.now > bulletTimer)
            {
                BULLET_SPEED = 400;
                BULLET_SPACING = 250;
                //  Grab the first bullet we can from the pool
                bullet = bullets.getFirstExists(false);

                if (bullet)
                {
                    //  And fire it
                    //  Make bullet come out of tip of ship with right angle
                    bulletOffset = 20 * Math.sin(Phaser.Math.RAD_TO_DEG(player.angle));
                    bullet.reset(player.x + bulletOffset, player.y);
                    bullet.angle = player.angle;
                    Phaser.Physics.Arcade.velocityFromAngle(bullet.angle - 0, BULLET_SPEED, bullet.body.velocity);
                    bullet.body.velocity.x += player.body.velocity.x;

                    bulletTimer = game.time.now + BULLET_SPACING;
                }
            }
            break;

        case 2:
            if (game.time.now > bulletTimer) {
                BULLET_SPEED = 2000;
                BULLET_SPACING = 550;


                for (let i = 0; i < 9; i++) {
                    bullet = bullets.getFirstExists(false);
                    if (bullet) {
                        //  Make bullet come out of tip of ship with right angle
                        bulletOffset = 20 * Math.sin(Phaser.Math.RAD_TO_DEG(player.angle));
                        bullet.reset(player.x + bulletOffset, player.y);
                        //  "Spread" angle of 1st and 3rd bullets
                        let spreadAngle;
                        if (i === 0) spreadAngle = -20;
                        if (i === 1) spreadAngle = -15;
                        if (i === 2) spreadAngle = -10;
                        if (i === 3) spreadAngle = -5;
                        if (i === 4) spreadAngle = 0;
                        if (i === 5) spreadAngle = 5;
                        if (i === 6) spreadAngle = 10;
                        if (i === 7) spreadAngle = 15;
                        if (i === 8) spreadAngle = 20;
                        bullet.angle = player.angle + spreadAngle;
                        Phaser.Physics.Arcade.velocityFromAngle(spreadAngle, BULLET_SPEED, bullet.body.velocity);
                        bullet.body.velocity.x += player.body.velocity.x;
                    }
                    bulletTimer = game.time.now + BULLET_SPACING;
                }
            }
    }
}
function fireBullet1() {
    let bulletOffset;
    let bullet;
    let BULLET_SPACING;
    let BULLET_SPEED;
    switch (player.weaponLevel) {
        case 1:
            //  To avoid them being allowed to fire too fast we set a time limit
            if (game.time.now > bulletTimer)
            {
                BULLET_SPEED = 400;
                BULLET_SPACING = 250;
                //  Grab the first bullet we can from the pool
                bullet = bullets.getFirstExists(false);

                if (bullet)
                {
                    //  And fire it
                    //  Make bullet come out of tip of ship with right angle
                    bulletOffset = 20 * Math.sin(Phaser.Math.RAD_TO_DEG(player.angle));
                    bullet.reset(player.x + bulletOffset, player.y);
                    bullet.angle = player.angle;
                    Phaser.Physics.Arcade.velocityFromAngle(bullet.angle - 180, BULLET_SPEED, bullet.body.velocity);
                    bullet.body.velocity.x += player.body.velocity.x;

                    bulletTimer = game.time.now + BULLET_SPACING;
                }
            }
            break;

        case 2:
            if (game.time.now > bulletTimer) {
                BULLET_SPEED = 2000;
                BULLET_SPACING = 550;


                for (let i = 0; i < 9; i++) {
                    bullet = bullets.getFirstExists(false);
                    if (bullet) {
                        //  Make bullet come out of tip of ship with right angle
                        bulletOffset = 20 * Math.sin(Phaser.Math.RAD_TO_DEG(player.angle));
                        bullet.reset(player.x + bulletOffset, player.y);
                        //  "Spread" angle of 1st and 3rd bullets
                        let spreadAngle;
                        if (i === 0) spreadAngle = -20;
                        if (i === 1) spreadAngle = -15;
                        if (i === 2) spreadAngle = -10;
                        if (i === 3) spreadAngle = -5;
                        if (i === 4) spreadAngle = 0;
                        if (i === 5) spreadAngle = 5;
                        if (i === 6) spreadAngle = 10;
                        if (i === 7) spreadAngle = 15;
                        if (i === 8) spreadAngle = 20;
                        bullet.angle = player.angle + spreadAngle;
                        Phaser.Physics.Arcade.velocityFromAngle(spreadAngle - 180, BULLET_SPEED, bullet.body.velocity);
                        bullet.body.velocity.x += player.body.velocity.x;
                    }
                    bulletTimer = game.time.now + BULLET_SPACING;
                }
            }
    }
}


function launchGreenEnemy() {
    let ENEMY_SPEED = 300;

    let enemy = greenEnemies.getFirstExists(false);
    if (enemy) {
        enemy.reset(game.rnd.integerInRange(0, game.width), -20);
        enemy.body.velocity.x = game.rnd.integerInRange(-300, 300);
        enemy.body.velocity.y = ENEMY_SPEED;
        enemy.body.drag.x = 100;

        enemy.trail.start(false, 800, 1);

        //  Update function for each enemy ship to update rotation etc
        enemy.update = function(){
            enemy.angle = 180 - Phaser.Math.RAD_TO_DEG(Math.atan2(enemy.body.velocity.x, enemy.body.velocity.y));

            enemy.trail.x = enemy.x;
            enemy.trail.y = enemy.y -10;

            //  Kill enemies once they go off screen
            if (enemy.y > game.height + 200) {
                enemy.kill();
                enemy.y = -20;
            }
        }
    }

    //  Send another enemy soon
    greenEnemyLaunchTimer = game.time.events.add(game.rnd.integerInRange(greenEnemySpacing, greenEnemySpacing + 1000), launchGreenEnemy);
}

function launchBlueEnemy() {
    let startingX = game.rnd.integerInRange(100, game.width - 100);
    let verticalSpeed = 180;
    let spread = 60;
    let frequency = 70;
    let verticalSpacing = 70;
    let numEnemiesInWave = 5;

    //  Launch wave
    for (let i =0; i < numEnemiesInWave; i++) {
        const enemy = blueEnemies.getFirstExists(false);
        if (enemy) {
            enemy.startingX = startingX;
            enemy.reset(game.width / 2, -verticalSpacing * i);
            enemy.body.velocity.y = verticalSpeed;

            //  Set up firing
            let bulletSpeed = 400;
            let firingDelay = 2000;
            enemy.bullets = 1;
            enemy.lastShot = 0;

            //  Update function for each enemy
            enemy.update = function(){
                //  Wave movement
                this.body.x = this.startingX + Math.sin((this.y) / frequency) * spread;

                //  Squish and rotate ship for illusion of "banking"
                bank = Math.cos((this.y + 60) / frequency)
                this.scale.x = 0.5 - Math.abs(bank) / 8;
                this.angle = 180 - bank * 2;

                //  Fire
                let enemyBullet = blueEnemyBullets.getFirstExists(false);
                if (enemyBullet &&
                    this.alive &&
                    this.bullets &&
                    this.y > game.width / 8 &&
                    game.time.now > firingDelay + this.lastShot) {
                    this.lastShot = game.time.now;
                    this.bullets--;
                    enemyBullet.reset(this.x, this.y + this.height / 2);
                    enemyBullet.damageAmount = this.damageAmount;
                    let angle = game.physics.arcade.moveToObject(enemyBullet, player, bulletSpeed);
                    enemyBullet.angle = Phaser.Math.RAD_TO_DEG(angle);
                }

                //  Kill enemies once they go off screen
                if (this.y > game.height + 200) {
                    this.kill();
                    this.y = -20;
                }
            };
        }
    }

    //  Send another wave soon
    blueEnemyLaunchTimer = game.time.events.add(game.rnd.integerInRange(blueEnemySpacing, blueEnemySpacing + 4000), launchBlueEnemy);
}

function launchBoss() {
    boss.reset(game.width / 2, -boss.height);
    booster.start(false, 1000, 10);
    boss.health = 501;
    bossBulletTimer = game.time.now + 5000;
}

function addEnemyEmitterTrail(enemy) {
    let enemyTrail = game.add.emitter(enemy.x, player.y - 10, 100);
    enemyTrail.width = 10;
    enemyTrail.makeParticles('explosion', [1,2,3,4,5]);
    enemyTrail.setXSpeed(20, -20);
    enemyTrail.setRotation(50,-50);
    enemyTrail.setAlpha(0.4, 0, 800);
    enemyTrail.setScale(0.01, 0.1, 0.01, 0.1, 1000, Phaser.Easing.Quintic.Out);
    enemy.trail = enemyTrail;
}


function shipCollide(player, enemy) {
    enemy.kill();

    player.damage(enemy.damageAmount);
    shields.render();

    if (player.alive) {
        let explosion = explosions.getFirstExists(false);
        explosion.reset(player.body.x + player.body.halfWidth, player.body.y + player.body.halfHeight);
        explosion.alpha = 0.7;
        explosion.play('explosion', 30, false, true);
    } else {
        playerDeath.x = player.x;
        playerDeath.y = player.y;
        playerDeath.start(false, 1000, 10, 10);
    }
}


function hitEnemy(enemy, bullet) {
    let explosion = explosions.getFirstExists(false);
    explosion.reset(bullet.body.x + bullet.body.halfWidth, bullet.body.y + bullet.body.halfHeight);
    explosion.body.velocity.y = enemy.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
    if (enemy.finishOff && enemy.health < 5) {
        enemy.finishOff();
    } else {
        enemy.damage(enemy.damageAmount);
    }
    bullet.kill();

    // Increase score
    score += enemy.damageAmount * 10;
    scoreText.render();

    //  Pacing

    //  Enemies come quicker as score increases
    greenEnemySpacing *= 0.9;

    //  Blue enemies come in after a score of 1000
    if (!blueEnemyLaunched && score > 1000) {
        blueEnemyLaunched = true;
        launchBlueEnemy();
        //  Slow green enemies down now that there are other enemies
        greenEnemySpacing *= 2;
    }

    //  Launch boss
    if (!bossLaunched && score > 15000) {
        greenEnemySpacing = 5000;
        blueEnemySpacing = 12000;
        //  dramatic pause before boss
        game.time.events.add(2000, function(){
            bossLaunched = true;
            launchBoss();
        });
    }

    //  Weapon upgrade
    if (score > 5000 && player.weaponLevel < 2) {
        player.weaponLevel = 2;
    }
}

//  Don't count a hit in the lower right and left quarants to aproximate better collisions
function bossHitTest(boss, bullet) {
    return !((bullet.x > boss.x + boss.width / 5 &&
        bullet.y > boss.y) ||
        (bullet.x < boss.x - boss.width / 5 &&
            bullet.y > boss.y));
}

function enemyHitsPlayer (player, bullet) {
    bullet.kill();

    player.damage(bullet.damageAmount);
    shields.render()

    if (player.alive) {
        let explosion = explosions.getFirstExists(false);
        explosion.reset(player.body.x + player.body.halfWidth, player.body.y + player.body.halfHeight);
        explosion.alpha = 0.7;
        explosion.play('explosion', 30, false, true);
    } else {
        playerDeath.x = player.x;
        playerDeath.y = player.y;
        playerDeath.start(false, 1000, 10, 10);
    }
}


function restart () {
    //  Reset the enemies
    greenEnemies.callAll('kill');
    game.time.events.remove(greenEnemyLaunchTimer);
    game.time.events.add(1000, launchGreenEnemy);
    blueEnemies.callAll('kill');
    blueEnemyBullets.callAll('kill');
    game.time.events.remove(blueEnemyLaunchTimer);
    boss.kill();
    booster.kill();
    game.time.events.remove(bossLaunchTimer);

    blueEnemies.callAll('kill');
    game.time.events.remove(blueEnemyLaunchTimer);
    //  Revive the player
    player.weaponLevel = 1;
    player.revive();
    player.health = 100;
    shields.render();
    score = 0;
    scoreText.render();

    //  Hide the text
    gameOver.visible = false;

    //  Reset pacing
    greenEnemySpacing = 1000;
    blueEnemyLaunched = false;
    bossLaunched = false;
}