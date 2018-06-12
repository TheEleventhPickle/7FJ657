// jscs:disable
var game = new Phaser.Game(900, 600, Phaser.AUTO, '');

game.state.add('play', {

	preload: function () {

		var enemiesDir = 'assets/meme-clicker/enemies/',
			backgroundsDir = 'assets/meme-clicker/backgrounds/',
			coinsDir = 'assets/meme-clicker/coins/',
			buttonsDir = 'assets/meme-clicker/buttons/';
		/**
		 * Background.
		 */
		this.game.load.image('wc', backgroundsDir + 'b8b.jpg');

		/**
		 * Monsters.
		 *
		 * These need to match the monster names
		 * in var monsterData inside create().
		 */
		this.game.load.image('sonic',   enemiesDir + 'sonic.png');
		this.game.load.image('peter',   enemiesDir + 'peter.png');
		this.game.load.image('shrek',   enemiesDir + 'shrek.png');
		this.game.load.image('lilpump',   enemiesDir + 'lilpump.png');
		this.game.load.image('luckyluciano',   enemiesDir + 'luckyluciano.png');

		/**
		 * Coin.
		 */
		this.game.load.image('bee', coinsDir + 'bee.png');

		/**
		 * Upgrades.
		 */ 
		this.game.load.image('guardian-angel',   buttonsDir + 'guardian-angel.png');
		this.game.load.image('fbi', buttonsDir + 'fbi.png');
		this.game.load.image('wizard',  buttonsDir + 'wizard.png');
		this.game.load.image('B',  buttonsDir + 'b-emoji.png');
		
		// build panel for upgrades
		var bmd = this.game.add.bitmapData(245, 500);
		bmd.ctx.fillStyle = '#eee';
		bmd.ctx.strokeStyle = '#aaa';
		bmd.ctx.lineWidth = 2;
		bmd.ctx.fillRect(0, 0, 245, 500);
		bmd.ctx.strokeRect(0, 0, 245, 500);
		this.game.cache.addBitmapData('upgradePanel', bmd);

		var buttonImage = this.game.add.bitmapData(225, 75);
		buttonImage.ctx.fillStyle = '#ffffff';
		buttonImage.ctx.strokeStyle = '#00000';
		buttonImage.ctx.lineWidth = 2;
		buttonImage.ctx.fillRect(0, 0, 225, 75);
		buttonImage.ctx.strokeRect(0, 0, 225, 75);
		this.game.cache.addBitmapData('button', buttonImage);
   
		// the main player
		this.player = {
			clickDmg: 1,
			gold: 0,
			dps: 0
		};

		// world progression
		this.level = 1;
		// how many monsters have we killed during this level
		this.levelKills = 0;
		// how many monsters are required to advance a level
		this.levelKillsRequired = 10;
	},

	create: function () {
		var state = this;

		/**
		 * Background.
		 */
		this.background = this.game.add.group();
		// setup each of our background layers to take the full screen
		['wc']
			.forEach(function (image) {
				var bg = state.game.add.tileSprite(0, 0, state.game.world.width,
					state.game.world.height, image, '', state.background);
				bg.tileScale.setTo(2, 2);
			});


		/**
		 * Upgrades.
		 */
		this.upgradePanel = this.game.add.image(10, 70, this.game.cache.getBitmapData('upgradePanel'));
		var upgradeButtons = this.upgradePanel.addChild(this.game.add.group());
		upgradeButtons.position.setTo(8, 8);

		var upgradeButtonsData = [
			{
				icon: 'guardian-angel', 
				name: 'gaurdian angel', 
				level: 0, 
				cost: 5, 
				desc: '+1 yeet per click', 
				purchaseHandler: function (button, player) {
					player.clickDmg += 1;
				}
			},
			{
				icon: 'fbi', 
				name: 'fbi', 
				level: 0, 
				cost: 15, 
				desc: '+1 yeet per second', 
				purchaseHandler: function (button, player) {
					player.dps += 1;
				}
			},
		    {
				icon: 'wizard', 
				name: 'wizard', 
				level: 0, 
				cost: 300, 
				desc: '     MEGA UPGRADE YOUR YPS', 
				purchaseHandler: function (button, player) {
					player.dps += 20;
				}
			},
            {
				icon: 'B', 
				name: 'B', 
				level: 0, 
				cost: 400, 
				desc: 'SUPERCHARGE YOUR YEETS', 
				purchaseHandler: function (button, player) {
					player.clickDmg += 20;
				}
			}    
        ];
		
		var button;
		upgradeButtonsData.forEach(function (buttonData, index) {
			button = state.game.add.button(0, (77 * index), state.game.cache.getBitmapData('button'));
			button.icon = button.addChild(state.game.add.image(6, 6, buttonData.icon));
			button.text = button.addChild(state.game.add.text(48, 6, buttonData.name + ': ' + buttonData.level, {font: '14px "Roboto Mono"'}));
			button.details = buttonData;
			button.costText = button.addChild(state.game.add.text(48, 24, 'Cost: ' + buttonData.cost, {font: '14px "Roboto Mono"'}));
			button.desc = button.addChild(state.game.add.text(6, 42, buttonData.desc, {font: '13px "Roboto Mono"'}).addColor( '#000', 0 ));
			button.events.onInputDown.add(state.onUpgradeButtonClick, state);

			upgradeButtons.addChild(button);
		});

		/**
		 * Monsters.
		 */
		var monsterData = [
			{name: 'sonnnic',      image: 'sonic',      maxHealth: 5},
			{name: 'little pump',      image: 'lilpump',      maxHealth: 1},
		    {name: 'peter',      image: 'peter',      maxHealth: 3},
		    {name: 'shrek',      image: 'shrek',      maxHealth: 5},
			{name: 'lucky luciano',      image: 'luckyluciano',      maxHealth: 8}
		];
		this.monsters = this.game.add.group();

		var monster;
		monsterData.forEach(function (data) {
			// create a sprite for them off screen
			monster = state.monsters.create(1500, state.game.world.centerY, data.image);
			// use the built in health component
			monster.health = monster.maxHealth = data.maxHealth;
			// center anchor
			monster.anchor.setTo(0.5, 1);
			// reference to the database
			monster.details = data;
			//enable input so we can click it!
			monster.inputEnabled = true;
			monster.events.onInputDown.add(state.onClickMonster, state);

			// hook into health and lifecycle events
			monster.events.onKilled.add(state.onKilledMonster, state);
			monster.events.onRevived.add(state.onRevivedMonster, state);
		});

		// display the monster front and center
		this.currentMonster = this.monsters.getRandom();
		this.currentMonster.position.set(this.game.world.centerX - 100, this.game.world.centerY + 300);

		this.monsterInfoUI = this.game.add.group();
		this.monsterInfoUI.position.setTo(this.currentMonster.x - 120, 30);
		this.monsterNameText = this.monsterInfoUI.addChild(this.game.add.text(0, 0, this.currentMonster.details.name, {
			font: '45px "Roboto Mono"',
			fill: '#fff',
			strokeThickness: 4
		}));
		this.monsterHealthText = this.monsterInfoUI.addChild(this.game.add.text(0, 75, this.currentMonster.health + ' HP', {
			font: '32px "Roboto Mono"',
			fill: '#1dbf1d',
			strokeThickness: 4
		}));

		this.dmgTextPool = this.add.group();
		var dmgText;
		for (var d = 0; d < 50; d++) {
			dmgText = this.add.text(30, 0, '1', {
				font: '64px "Roboto Mono"',
				fill: '#fff',
				strokeThickness: 4
			});
			// start out not existing, so we don't draw it yet
			dmgText.exists = false;
			dmgText.tween = game.add.tween(dmgText)
				.to({
					alpha: 0,
					y: 100,
					x: this.game.rnd.integerInRange(100, 700)
				}, 1000, Phaser.Easing.Cubic.Out);

			dmgText.tween.onComplete.add(function (text, tween) {
				text.kill();
			});
			this.dmgTextPool.add(dmgText);
		}

		// create a pool of gold coins
		this.coins = this.add.group();
		this.coins.createMultiple(50, 'bee', '', false);
		this.coins.setAll('inputEnabled', true);
		this.coins.setAll('goldValue', 1);
		this.coins.callAll('events.onInputDown.add', 'events.onInputDown', this.onClickCoin, this);

		this.playerGoldText = this.add.text(30, 30, 'bees: ' + this.player.gold, {
			font: '24px "Roboto Mono"',
			fill: '#fff',
			strokeThickness: 4
		});

		// 100ms 10x a second
		this.dpsTimer = this.game.time.events.loop(100, this.onDPS, this);

		// setup the world progression display
		this.levelUI = this.game.add.group();
		this.levelUI.position.setTo(this.game.world.width - 200, 30);
		this.levelText = this.levelUI.addChild(this.game.add.text(0, 0, 'Level: ' + this.level, {
			font: '24px "Roboto Mono"',
			fill: '#fff',
			strokeThickness: 4
		}));
		this.levelKillsText = this.levelUI.addChild(this.game.add.text(0, 30, 'Kills: ' + this.levelKills + '/' + this.levelKillsRequired, {
			font: '24px "Roboto Mono"',
			fill: '#fff',
			strokeThickness: 4
		}));
	},

	onDPS: function () {
		if (this.player.dps > 0) {
			if (this.currentMonster && this.currentMonster.alive) {
				var dmg = this.player.dps / 10;
				this.currentMonster.damage(dmg);

				this.colorHealthText();

				// update the health text
				this.monsterHealthText.text = this.currentMonster.alive ? Math.round(this.currentMonster.health) + ' HP' : 'DEAD';
			}
		}
	},

	onUpgradeButtonClick: function (button, pointer) {
		// make this a function so that it updates after we buy
		function getAdjustedCost() {
			return Math.ceil(button.details.cost + (button.details.level * 1.46));
		}

		if (this.player.gold - getAdjustedCost() >= 0) {
			this.player.gold -= getAdjustedCost();
			this.playerGoldText.text = 'bees: ' + this.player.gold;
			button.details.level++;
			button.text.text = button.details.name + ': ' + button.details.level;
			button.costText.text = 'Cost: ' + getAdjustedCost();
			button.details.purchaseHandler.call(this, button, this.player);
		}
	},

	onClickCoin: function (coin) {
		if (!coin.alive) {
			return;
		}
		// give the player gold
		this.player.gold += coin.goldValue;
		// update UI
		this.playerGoldText.text = 'bees: ' + this.player.gold;
		// remove the coin
		coin.kill();
	},

	onKilledMonster: function (monster) {
		// move the monster off screen again
		monster.position.set(1000, this.game.world.centerY);

		var coin;
		// spawn a coin on the ground
		coin = this.coins.getFirstExists(false);
		coin.reset(this.game.world.centerX + this.game.rnd.integerInRange(-100, 100), this.game.world.centerY);
		coin.goldValue = Math.round(this.level * 1.33);
		this.game.time.events.add(Phaser.Timer.SECOND * 3, this.onClickCoin, this, coin);

		this.levelKills++;

		if (this.levelKills >= this.levelKillsRequired) {
			this.level++;
			this.levelKills = 0;
		}

		this.levelText.text = 'Level: ' + this.level;
		this.levelKillsText.text = 'Kills: ' + this.levelKills + '/' + this.levelKillsRequired;

		// pick a new monster
		this.currentMonster = this.monsters.getRandom();
		// upgrade the monster based on level
		this.currentMonster.maxHealth = Math.ceil(this.currentMonster.details.maxHealth + ((this.level - 1) * 10.6));
		// make sure they are fully healed
		this.currentMonster.revive(this.currentMonster.maxHealth);
	},

	onRevivedMonster: function (monster) {
		monster.position.set(this.game.world.centerX - 100, this.game.world.centerY + 300);
		// update the text display
		this.monsterHealthText.addColor( '#1dbf1d', 0 );
		this.monsterNameText.text = monster.details.name;
		this.monsterHealthText.text = monster.health + 'HP';
	},

	onClickMonster: function (monster, pointer) {
		// apply click damage to monster
		this.currentMonster.damage(this.player.clickDmg);

		// grab a damage text from the pool to display what happened
		var dmgText = this.dmgTextPool.getFirstExists(false);
		if (dmgText) {
			dmgText.text = 'YEET';
			dmgText.reset(pointer.positionDown.x, pointer.positionDown.y);
			dmgText.alpha = 1;
			dmgText.tween.start();
		}
		this.colorHealthText();

		var currHealth = Math.round( this.currentMonster.health );
		// update the health text
		this.monsterHealthText.text = this.currentMonster.alive ? currHealth + ' HP' : 'DEAD';
	},

	colorHealthText: function() {
		/**
		 * Green/Yellow/Red Color Change.
		 */
		var medHealth = Math.ceil(this.currentMonster.maxHealth * 0.6);
		var lowHealth = Math.ceil(this.currentMonster.maxHealth * 0.3);
		if (this.currentMonster.health <= lowHealth ) {
			this.monsterHealthText.addColor( '#ea5311', 0 );
		} else if ( this.currentMonster.health <= medHealth ) {
			this.monsterHealthText.addColor( '#e3da13', 0 );
		}
	}
});

game.state.start('play');
