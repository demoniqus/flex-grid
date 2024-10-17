"use strict";

import {DataSetInterface} from "./dataSet.js";

export function GridElement(id, config, privFlexGrid, pubFlexGrid){
    let priv = {
        DOM: {
            row: undefined,
            cells: {},
        },
        data: undefined,
        // TODO Также посмотреть в сторону WeakMap для управления памятью и избегания утечек памяти на хранение ссылок на объекты, к которым уже не будет возврата
        expanded: {},
        parent: null,
        children: [],
        childrenDict: {},
        config: {
            entityClassField: config.entityClassField,
            entityIdField: config.entityIdField,
            entityParentField: config.entityParentField,
        },
        id: id,
        privFlexGrid: privFlexGrid,
        pubFlexGrid: pubFlexGrid,
    };

    this.initData = function(/**@type {object}*/data){
        priv.data = data;
    };

    this.setData = function(/**@type {string}*/key, data){
        priv.data[key] = data;
    };

    this.get = function(/**@type {string}*/key) {
        return key in priv.data ? priv.data[key]: undefined;
    };

    this.getData = function(){return priv.data;};

    this.getId = function(){return priv.id};

    this.expand = function(/**@type {DataSetInterface} */dataSet, /**@type {boolean}*/ expanded){
        !dataSet && (dataSet = priv.privFlexGrid.data.current);
        dataSet.expand(this, !!expanded);
    };

    this.expanded = function(/**@type {DataSetInterface} */dataSet){
        !dataSet && (dataSet = priv.privFlexGrid.data.current);
        return dataSet.expanded(this);
    };

    this.inverseExpanded = function(/**@type {DataSetInterface} */dataSet){
        !dataSet && (dataSet = priv.privFlexGrid.data.current);
        return dataSet.inverseExpanded(this);
    };

    this.setParent = function(/** @type {GridElement} */parent){
        if (priv.parent && priv.parent !== parent) {
            //Удаляем из коллекции дочерних элементов старого родителя
            priv.parent.removeChild(priv);
        }

        priv.parent = parent;

        if (priv.parent) {
            //Добавляем в коллекцию дочерних элементов к новому родителю
            parent.addChild(this);
        }
    };

    this.removeChild = function(/** @type {GridElement} */child){
        let iof = priv.children.indexOf(child);
        if (iof > -1) {
            priv.children.splice(iof, 1)
        }
        // let c = priv.children.length;
        // let res = [];
        // for (let i = 0; i < c; i++) {
        //     if (priv.children[i] !== child) {
        //         res.push(priv.children[i]);
        //     }
        // }
        // priv.children = res;
    };

    this.addChild = function(/** @type {GridElement} */child){
        if (!priv.children.includes(child)) {
            priv.children.push(child);
        }
    };

    // this.updateCell = function(propName){
    //     let header = priv.privFlexGrid.headers.dict[propName];
    //     //аргументы могут быть использованы при пользовательской функции, определяющей конкретный visualizer
    //     let visualizer = header.getVisualizer(propName, item, header, privFlexGrid.config);
    //
    //     visualizer && visualizer.buildReadForm(
    //         priv.DOM.cells[headerId],
    //         headerId,
    //         priv,
    //         header,
    //         //index
    //     );
    // };

    this.getGrid = function(){
        return priv.pubFlexGrid
    };

    Object.defineProperties(
        this,
        {
            parent: {
                configurable: false,
                enumerable: false,
                get: function(){return priv.parent;},
            },
            children: {
                configurable: false,
                enumerable: false,
                get: function(){return priv.children;},
            },
            DOM: {
                configurable: false,
                enumerable: false,
                get: function(){return priv.DOM;},
            },
        }

    );
}