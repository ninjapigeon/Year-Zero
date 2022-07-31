import { MYZActorSheet } from "./actor-sheet.js";

export class MYZRobotSheet extends MYZActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["yearzero", "sheet", "actor"],
            template: "systems/yearzero/templates/actor/robot-sheet.html",
            width: 720,
            height: 720,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
        });
    }
}
