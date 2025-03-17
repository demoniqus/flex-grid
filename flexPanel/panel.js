"use strict";

import {ClassModel} from "./classModel.js";
import {OrientationModel} from "./orientationModel.js";
import {FlexPanel as PubPanel} from "./flexPanel.js";
import {AbstractPanel} from "./abstractPanel.js";

function Panel(config){
    let priv = new AbstractPanel();
    let pub = new PubPanel(priv);
    priv.pub = pub;
    let errors = priv.validateConfig(config)
    if (errors) {
        throw 'Incorrect config: ' + errors.join('; ');
    }

    priv.setConfig(config);
    priv.init();


    return pub;

}

const FlexPanel = Object.defineProperties(
    Object.create(null),
    {
        Panel: {
            get: function(){return Panel;},
            configurable: false,
            enumerable: false,
        },
        OrientationModel: {
            get: function () { return OrientationModel;},
            configurable: false,
            enumerable: false,
        },
        ClassModel: {
            get: function() {return ClassModel;},
            configurable: false,
            enumerable: false,
        }
    }
);


export {FlexPanel}
