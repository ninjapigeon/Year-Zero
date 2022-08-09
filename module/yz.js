// Import Modules
import { YZ } from "./config.js";
import { registerSystemSettings } from "./settings.js";
import YZHooks from "./YZHooks.js";
import { YZActor } from "./actor/actor.js";
import { YZMutantSheet } from "./actor/character-sheet.js";
import { YZAnimalSheet } from "./actor/animal-sheet.js";
import { YZRobotSheet } from "./actor/robot-sheet.js";
import { YZHumanSheet } from "./actor/human-sheet.js";
import { YZNpcSheet } from "./actor/npc-sheet.js";
import { YZArkSheet } from "./actor/ark-sheet.js";
import { YZItem } from "./item/item.js";
import { YZItemSheet } from "./item/item-sheet.js";
import { YZDieBase } from "./YZDice.js";
import { YZDieSkill } from "./YZDice.js";
import { YZDieGear } from "./YZDice.js";

import { DiceRoller } from "./component/dice-roller.js";
import { RollDialog } from "./app/roll-dialog.js";

//import * as migrations from "./migration.js";

/* ------------------------------------ */
/* Setup YZ system	 */
/* ------------------------------------ */

Hooks.once("init", async function () {
    game.YZ = {
        YZ,
        YZActor,
        YZCharacterSheet,
        YZNpcSheet,
        YZArkSheet,
        rollItemMacro,
        DiceRoller,
        RollDialog,
    };
    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d6 + (@attributes.agility.value/10)",
        decimals: 1,
    };

    // Define custom Entity classes
    CONFIG.YZ = YZ;
    CONFIG.Actor.documentClass = YZActor;
    CONFIG.Item.documentClass = YZItem;
    //CONFIG.diceRoller = DiceRoller;

    CONFIG.roller = new DiceRoller();

    CONFIG.Dice.terms["b"] = YZDieBase;
    CONFIG.Dice.terms["s"] = YZDieSkill;
    CONFIG.Dice.terms["g"] = YZDieGear;

    // Register System Settings
    registerSystemSettings();

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("yearzero", YZMCharacterSheet, {
        types: ["mutant"],
        makeDefault: true,
    });
    Actors.registerSheet("yearzero", YZNpcSheet, {
        types: ["npc"],
        makeDefault: true,
    });
    Actors.registerSheet("yearzero", YZArkSheet, {
        types: ["ark"],
        makeDefault: true,
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("yearzero", YZItemSheet, { makeDefault: true });

    /* -------------------------------------------- */
    /*  HANDLEBARS HELPERS      */
    /* -------------------------------------------- */

    _preloadHandlebarsTemplates();

    Handlebars.registerHelper("concat", function () {
        var outStr = "";
        for (var arg in arguments) {
            if (typeof arguments[arg] != "object") {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper("weaponCategory", function (category) {
        category = normalize(category, "melee");
        switch (category) {
            case "melee":
                return game.i18n.localize("YZ.WEAPON_MELEE");
            case "ranged":
                return game.i18n.localize("YZ.WEAPON_RANGED");
        }
    });
    
    Handlebars.registerHelper("armorPart", function (part) {
        part = normalize(part, "armor");
        switch (part) {
            case "armor":
                return game.i18n.localize("YZ.ARMOR_BODY");
            case "shield":
                return game.i18n.localize("YZ.ARMOR_SHIELD");
        }
    });

    Handlebars.registerHelper("isBroken", function (item) {
        let bonus = 0;
        let max = 0;
        if (item.type == "weapon") {
            bonus = item.data.bonus.value;
            max = item.data.bonus.max;
        } else if (item.type == "armor") {
            bonus = item.data.rating.value;
            max = item.data.rating.max;
        } else {
            return false;
        }
        if (parseInt(max, 10) > 0 && parseInt(bonus, 10) === 0) {
            return "broken";
        } else {
            return "";
        }
    });

    Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
        switch (operator) {
            case "==":
                return v1 == v2 ? options.fn(this) : options.inverse(this);
            case "===":
                return v1 === v2 ? options.fn(this) : options.inverse(this);
            case "!=":
                return v1 != v2 ? options.fn(this) : options.inverse(this);
            case "!==":
                return v1 !== v2 ? options.fn(this) : options.inverse(this);
            case "<":
                return v1 < v2 ? options.fn(this) : options.inverse(this);
            case "<=":
                return v1 <= v2 ? options.fn(this) : options.inverse(this);
            case ">":
                return v1 > v2 ? options.fn(this) : options.inverse(this);
            case ">=":
                return v1 >= v2 ? options.fn(this) : options.inverse(this);
            case "&&":
                return v1 && v2 ? options.fn(this) : options.inverse(this);
            case "||":
                return v1 || v2 ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });

    Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);

        return {
            "+": lvalue + rvalue,
            "-": lvalue - rvalue,
            "*": lvalue * rvalue,
            "/": lvalue / rvalue,
            "%": lvalue % rvalue
        }[operator];
    });

    Handlebars.registerHelper("trimString3", function (passedString) {
        var theString = passedString.substring(0, 3);
        return new Handlebars.SafeString(theString);
    });

    Handlebars.registerHelper("createLocalizationString", function () {
        let fullString = "";
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] === "string" || arguments[i] instanceof String) {
                fullString += arguments[i];
                if (i + 2 < arguments.length) {
                    fullString += "_";
                }
            }
        }
        return fullString.toUpperCase();
    });

    Handlebars.registerHelper("toLowerCase", function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper("toUpperCase", function (str) {
        return str.toUpperCase();
    });

    Handlebars.registerHelper("isdefined", function (value) {
        return value !== undefined;
    });

    Handlebars.registerHelper("ifvalue", function (condition, value) {
        return condition == value;
    });

    Handlebars.registerHelper("greaterThan", function (val1, val2) {
        return val1 > val2;
    });

    Handlebars.registerHelper("substract", function (val1, val2) {
        return val1 - val2;
    });

    Handlebars.registerHelper("getAbilitiesTypeName", function (val) {
        if(val=="character"){
            return "YZ.MUTATIONS"
        }else if(val=="animal"){
            return "YZ.ANIMAL_POWERS"
        }else if(val=="robot"){
            return "YZ.MODULES"
        }else if(val=="human"){
            return "YZ.CONTACTS"
        }else{ return ""}
    });
});

Hooks.once("ready", async function () {
    // Determine whether a system migration is required and feasible
    const currentVersion = game.settings.get("yearzero", "systemMigrationVersion");
    const NEEDS_MIGRATION_VERSION = 0.95;
    const COMPATIBLE_MIGRATION_VERSION = 0.5;
    let needMigration = currentVersion < NEEDS_MIGRATION_VERSION || currentVersion === null;

    // ! Perform the migration
    if (needMigration && game.user.isGM) {
        if (currentVersion && currentVersion < COMPATIBLE_MIGRATION_VERSION) {
            ui.notifications.error(
                `Your YZ system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`,
                { permanent: true }
            );
        }
        // UNCOMMENT import * as migrations from "./migration.js";
        // CALL migrations.migrateWorld(); in future if you need migration and delete two lines bellow since they are contained in the migrations.migrateWorld();     
        //migrations.migrateWorld();
        game.settings.set("yearzero", "systemMigrationVersion", game.system.data.version);
        ui.notifications.info(`YZ System Migration to version ${game.system.data.version} completed!`, { permanent: true });
    }
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    //Hooks.on("hotbarDrop", (bar, data, slot) => createYZMacro(data, slot));
});

/* SET CHARACTER TYPE */
/* POPULATE CHARACTER WITH DEFAULT SKILLS */
Hooks.on("createActor", async (actor, options, userId) => YZHooks.onCreateActor(actor, options, userId));
//Hooks.on("preCreateItem", (item, updateData, options) => { YZHooks.onPreCreateItem(item, updateData, options); });
Hooks.on("preCreateItem", YZHooks.onPreCreateItem);
Hooks.on("preUpdateItem", (item, updateData, option, _id) => { YZHooks.onUpdateOwnedItem(item, updateData, option, _id); });

/* -------------------------------------------- */
/*  DsN Hooks                                   */
/* -------------------------------------------- */

Hooks.on("diceSoNiceRollComplete", (chatMessageID) => { });

Hooks.once("diceSoNiceReady", (dice3d) => {
    dice3d.addColorset({
        name: "yellow",
        description: "Yellow",
        category: "Colors",
        foreground: "#b1990f",
        background: "#b1990f",
        outline: "#b1990f",
        texture: "none",
    });
    dice3d.addColorset({
        name: "green",
        description: "Green",
        category: "Colors",
        foreground: "#00810a",
        background: "#00810a",
        outline: "#00810a",
        texture: "none",
    });

    dice3d.addSystem({ id: "yearzero", name: "Year Zero" }, true);
    dice3d.addDicePreset({
        type: "db",
        labels: [
            "systems/yearzero/ui/dice/b1.png",
            "systems/yearzero/ui/dice/b2.png",
            "systems/yearzero/ui/dice/b3.png",
            "systems/yearzero/ui/dice/b4.png",
            "systems/yearzero/ui/dice/b5.png",
            "systems/yearzero/ui/dice/b6.png",
        ],
        colorset: "yellow",
        system: "yearzero",
    });
    dice3d.addDicePreset({
        type: "ds",
        labels: [
            "systems/yearzero/ui/dice/s1.png",
            "systems/yearzero/ui/dice/s2.png",
            "systems/yearzero/ui/dice/s3.png",
            "systems/yearzero/ui/dice/s4.png",
            "systems/yearzero/ui/dice/s5.png",
            "systems/yearzero/ui/dice/s6.png",
        ],
        colorset: "green",
        system: "yearzero",
    });
    dice3d.addDicePreset({
        type: "dg",
        labels: [
            "systems/yearzero/ui/dice/g1.png",
            "systems/yearzero/ui/dice/g2.png",
            "systems/yearzero/ui/dice/g3.png",
            "systems/yearzero/ui/dice/g4.png",
            "systems/yearzero/ui/dice/g5.png",
            "systems/yearzero/ui/dice/g6.png",
        ],
        colorset: "black",
        system: "yearzero",
    });
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createYZMacro(data, slot) {
    //ui.notifications.warn("DRAGGING ITEMS WILL BE IMPLEMENTED IN THE FUTURE");
    return;
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    // Create the macro command
    const command = `game.yearzero.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find((m) => m.name === item.name && m.command === command);
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "yearzero.itemMacro": true },
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find((i) => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    // Trigger the item roll
    return item.roll();
}

/* -------------------------------------------- */
/** LOAD PARTIALS
/* -------------------------------------------- */

function _preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/yearzero/templates/actor/partials/character-header.html",
        "systems/yearzero/templates/actor/partials/attributes.html",
        "systems/yearzero/templates/actor/partials/conditions.html",
        "systems/yearzero/templates/actor/partials/criticals.html",
        "systems/yearzero/templates/actor/partials/rot.html",
        "systems/yearzero/templates/actor/partials/skills.html",
        "systems/yearzero/templates/actor/partials/weapons.html",
        "systems/yearzero/templates/actor/partials/armors.html",
        "systems/yearzero/templates/actor/partials/chassis.html",
        "systems/yearzero/templates/actor/partials/chassis-1row.html",
        "systems/yearzero/templates/actor/partials/gear.html",
        "systems/yearzero/templates/actor/partials/artifacts.html",
        "systems/yearzero/templates/actor/partials/resource-counter.html",
        "systems/yearzero/templates/actor/partials/abilities.html",
        "systems/yearzero/templates/actor/partials/talents.html",
        "systems/yearzero/templates/actor/partials/info.html",
        "systems/yearzero/templates/actor/partials/consumables.html",
        "systems/yearzero/templates/actor/partials/encumbrance.html",
        "systems/yearzero/templates/actor/partials/actor-effects.html",
        "systems/yearzero/templates/actor/partials/special.html",
        "systems/yearzero/templates/item/partials/header-simple.html",
        "systems/yearzero/templates/item/partials/header-physical.html",
        "systems/yearzero/templates/item/partials/tabs.html",
        "systems/yearzero/templates/item/partials/modifiers.html"
        
    ];
    return loadTemplates(templatePaths);
}

function normalize(data, defaultValue) {
    if (data) {
        return data.toLowerCase();
    } else {
        return defaultValue;
    }
}
