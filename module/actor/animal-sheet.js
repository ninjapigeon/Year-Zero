import { YZActorSheet } from "./actor-sheet.js";

export class YZAnimalSheet extends YZActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["yearzero", "sheet", "actor"],
            template: "systems/yearzero/templates/actor/animal-sheet.html",
            width: 720,
            height: 720,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "description",
                },
            ],
        });
    }
}
