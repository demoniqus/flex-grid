"use strict";

import {StringFilterModesModel} from "../stringFilterModesModel.js";

let pluginIds = {};
function abstractFilterComponent(){
    this.DOM = {};
    this.mode = StringFilterModesModel.StartWith
    this.id = null;
    this.createId = function(){
        let r;
        while ((r = 'filter-component_' + (Math.ceil(Math.random() * 1000000) + 1)) in pluginIds) {}
        this.id = r;
        pluginIds[r] = true;// true instead of this to avoid memory leak
    };
    this.init = function(){
        this.createId();
    };

    this.init();
}

export {abstractFilterComponent, pluginIds}
