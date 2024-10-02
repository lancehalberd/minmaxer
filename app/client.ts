import {registerMouseEventHandlers} from 'app/mouse';
import {startRendering} from 'app/render';
import {startUpdating} from 'app/update';

// Begin updating the game state.
startUpdating();

// Begin rendering the game to the canvas.
startRendering();

// Regoster event handlers for the mouse.
registerMouseEventHandlers();


// Add tasks to github project and assign some tasks
/*
* Fix clicking:
    Problem: If you click on an enemy and drag 1 pixel, you won't attack them.
    Problem: If you click and hold but don't move the mouse, the hero stops moving towards the mouse.
* Make the game reset when the Nexus dies.
    Transition to game over screen:
        Stop regular updates to the scene
        Pan camera back to the nexus
        Fade everything to black except the Nexus (eventually the nexus would show a destruction animation during this)
        Fade in text "Nexus Destroyed"
        Maybe add some statistics from the run like hero level, enemies defeated
        Click on Nexus to rewind to the start of the game
            For now just reset the game state to the initial state when they click the Nexus.
                Except fade the world in to the new state.
            Eventually we will need to only reset the state for the world itself, but not data that is tracked between runs.
            This would also play the destroyed nexus animation in reverse as we fade the world back in to its new state
* Implement experience gain and leveling up for the hero.
    * Derive stats from level to be close to these values with linear easing between:
        * level 1: health: 20, damage: 2, aps: 2, ms: 100
        * level 20: health: 400, damage: 40, aps: 2, ms: 150
    * Experience per level 10 * level ^ 2 (10 XP to reach level 2, 40XP to reach level 3, 90XP...)
    * 10% XP penalty per level over enemy. If an enemy is 5 levels below the hero, the hero only gains 50% as much experience from defeating it.
* Show Nexus Essence bar at the top of the screen with current/target taking about about 1/3 of the screen.
    * Essence should increase slowly over time.
    * Defeating monsters should increase essence.
    * Essence functions as life/money/experience for the Nexus
    * Add function for previewing essence costs that colors in the part of the bar that will be lost if essence colored orange or yellow.
    * Essence numbers
        Start with 100 Essence
        First goal is 200, 1000, 5k, 10k goals after that
        Unlock building a tower at 200 essence
        Unlock equipment creation at 1000 essence
        Unlock essence -> hero XP ability at 5K essence
        Unlock second champion slot at 10K essence
        Up 5 champions can be controlled eventually.
        Cost of anointing champion is based on the champion. Starter champions all cost 50 essence.
            More advanced champions might have higher base level and initial essence cost.
* Implement hero selection at the start of the game.
    * Add attack range stat to hero+monsters
        * 10px for melee hero/monster
        * ~50px for ranged attacks for now.
    * Create three starter hero definitions: Melee, Ranged, Magic
        * Eventually should have a tooltip on hover that describes the hero and stats and abilities.
        * Add hero definition, this should include functions for determining states from level
        * Add support for ranged attacks for Ranged+Magic hero, set attack type in hero definition
        * Don't include hero abilities yet, that is in a separate task.
    * Add uncontrolled heroes around the Nexus to the initial state.
        Each hero has a button over them labeled "Anoint Champion for 100 essence"
        Mouse over the button should preview the 50 essence cost on the essense bar HUD element
        Clicking this button will convert the champion to be controlled and make it selected
        The selected champion responds to clicks that don't interact with specific UI buttons.
    * Add an action to an uncontrolled hero to gain control of it.
* Implement hero death and respawn mechanics.
    * When a hero dies the Nexus has an ability for respawning them.
        * Add a hud element for each controlled hero to the left side
        * Clicking a hero hud element selects that hero if unselected, or pans camera to them if already selected
        * When a hero is dead, render a button over the hud element with essence cost for reviving.
            * Essence cost is (5 + hero level) essence per second left on cooldown
            * cooldown is 5 seconds per hero level
            * cooldown scales by 10% each time revive is used during the current run, so the more heroes are revived,
                the more expensive it is to revive for the rest of the run. This cost is additive, so on three revives, it is 30% more expensive.
* Implement hero abilities
    * use on cooldown for now
    * eventually we will want to be able to choose when and where to use this and be able to turn off autocasting.
    Melee
        Active: Spin Strike
            AoE circle attack that does 25/35/45/55/65% increased base damage, and radius is 1.1/1.2/1.3/1.4/1.5x base radius
            Cooldown is 5s
        Passive: Battle Rager
            Attack speed increase by 5%/6%/7%/8%/10% per hit up to 30%/35/40/45/50 increased attack speed
            This effect ends if the character does not attack for 2 seconds.
    Range
        Active: Piercing Shot
            Piercing skill shot with 80/90/100/110/120 range that does 1.5/1.7/1.9/2.1/2.3
            Cooldown is 8s
        Passive: Critical Shot
            20/21/22/23/25% chance to deal 1.5/1.6/1.7/1.8/2x damage
    Magic
        Active: Fire ball
            Area of Effect skill that does 40/45/50/55/60% increased damage over an area that is 1.4/1.55/1.70/1.85/2x base radius
                Range is 80
            Cooldown is 10s
        Passive: Fortress
            Prevents 50/55/60/65/70% incoming damage from the next 1/2/2/3/3 sources
            Barrier refreshes to full after 3/3/3/4/4 seconds since last damage instance
* Implement secondary resources
    * Types:
        Metal
        Wood
        Stone
    * Have these sources on the world for hero/villager farming (hero skills/passives are not triggered when farming)
    * Nexus abilities can use these resources
        * Building a nexus wall can cost X essence and Y stone
        * Nexus tower can cost X essence, Y stone, Z metal
*/


