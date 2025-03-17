"use strict";

import {FlexPanel} from "../flexPanel/panel.js";

import {Scroller} from '../scroller/scroller.js';
import {ClassModel} from "./classModel.js";
import {VisualizerInterface} from "./visualizerInterface.js";
import {AbstractVisualizer} from "./abstractVisualizer.js";

export {FlexPanel} from "../flexPanel/panel.js";
export {Scroller} from '../scroller/scroller.js';

function DefaultVisualizer(){
    let pub = this;
    let priv = new AbstractVisualizer();
    priv.pub = pub;

    pub.init = function(){
        priv.wrap();

        priv.updateStyleElement();

        //TODO При перезагрузке грида не только панели с заголовками, фильтрами и данными надо вычищать, но и панели с опциями для грида, т.к. состав опций может поменяться

        //this.panels.leftPanel.setScrollable();
    };

    pub.showData = function(config){
        priv.DOM.dataPanel.classList.remove('spinner');
        priv.DOM.dataPanel.classList.remove('spinner-atomic');
        priv.createScroller(config);
    };



    pub.setHeaders = function(headers){
        //TODO Если данные уже загружены, то их надо либо выгрузить, либо обновить с учетом новых заголовков
        priv.headers.leafs = headers;
        priv.headers.dict = {};

        let nodalHeaders = [];
        let nodalDict = {};
        let c = headers.length;
        for (let i = 0; i < c; i++) {
            let header = headers[i];
            let depth = 0;
            priv.headers.dict[header.id] = header;
            while (header.parent) {
                header = header.parent;
                if (!nodalHeaders[depth]) {
                    nodalHeaders.push([]);

                }
                if (!(header.id in nodalDict))
                {
                    nodalDict[header.id] = header;
                    nodalHeaders[depth].push(header);
                    priv.headers.dict[header.id] = header;
                }

                depth++;
            }
        }

        nodalHeaders.reverse();
        priv.headers.nodes = nodalHeaders;

        priv.createHeaders();
        priv.createFilters();

    };

    pub.setColumnWidth = function(columnId, width){
        priv.setColumnWidth(columnId, width);
    };

    pub.getContainer = () => priv.DOM.container;

    pub.updateColumnsWidth = (columns) => priv.updateColumnsWidth(columns)

    pub.setContainer = function(container){
        if (typeof container === typeof 'aaa') {
            let collection;
            priv.DOM.container = document.getElementById(container) || ((collection = document.getElementsByClassName(container)) ? collection[0] : null) || document.querySelector(container);
        }
        else if (container && typeof container === typeof {} && container.nodeType === Node.ELEMENT_NODE) {
            priv.DOM.container = container;
        }
        else {
            throw 'Incorrect main container';
        }
    };

    pub.setCallbacks = function(
        callback,
        eventName
    ){
        if (typeof callback === typeof function(){} && typeof eventName === typeof 'aaa') {
            priv.callbacks[eventName] = callback
        } else if (callback && typeof callback === typeof {}) {
            for (eventName in callback) {
                priv.callbacks[eventName] = callback[eventName];
            }
        }
    };

    pub.updatePreview = function(){
        priv.scroller.updateItemsCount(priv.callbacks.getItemsCount());
        priv.scroller.reload();
    };

    for (let panelName in priv.panels) {
        Object.defineProperty(
            pub,
            panelName.charAt(0).toUpperCase() + panelName.slice(1),
            {
                // writable: false,
                configurable: false,
                enumerable: false,
                get: (function(){let pn = panelName; return function(){ return priv.panels[pn]};})()
            }
        )
    }
    return this;
}

DefaultVisualizer.prototype = new VisualizerInterface();
DefaultVisualizer.getFlags = function(){
    //Копируем объект с флагами, чтобы снаружи нельзя было изменить исходный объект
    // let flags = {...Scroller.getFlags()};
    let flags = Object.create(Scroller.Flags);
    //Тут можно расширить список флагов
    return flags;
};

Object.defineProperties(
    DefaultVisualizer,
    {
        ClassModel: {
            get: () => ClassModel,
            configurable: false,
            enumerable: false,
        },
        VisualizerInterface: {
            get: () => VisualizerInterface,
            configurable: false,
            enumerable: false,
        },
    }
)

export {DefaultVisualizer}
