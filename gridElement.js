"use strict";

import {DataSetInterface} from "./dataSet.js";

export function GridElement(config, privFlexGrid, pubFlexGrid){
    let priv = {
        DOM: {
            row: undefined,
            cells: {},
        },
        data: undefined,
        //TODO Такие параметры, как expanded, должны храниться, скорее всего непосредственно в конкретном dataSet. Тогда при удалении всего dataSet эта информация
        // и ссылки на этот dataSet удалятся автоматически.
        // При привязывании gridElement в dataSet должен создаваться dataSetElement с prototype (__proto__) = gridElement и собственными свойствами типа expanded.
        // DataSetElement - это представление gridElement в конкретном dataSet
        // Также посмотреть в сторону WeakMap для управления памятью и избегания утечек памяти на хранение ссылок на объекты, к которым уже не будет возврата
        expanded: {},
        parent: null,
        children: [],
        childrenDict: {},
        config: {
            entityClassField: config.entityClassField,
            entityIdField: config.entityIdField,
            entityParentField: config.entityParentField,
        },
        privFlexGrid: privFlexGrid,
        pubFlexGrid: pubFlexGrid,
    };

    let pub = {
        initData: function(/**@type {object}*/data){
            this.data = data;
        }.bind(priv),
        setData: function(/**@type {string}*/key, data){
            this.data[key] = data;
        }.bind(priv),
        get: function(/**@type {string}*/key) {
            return key in this.data ? this.data[key]: undefined;
        }.bind(priv),
        getData: function(){return this.data;}.bind(priv),
        expand: function(/**@type {DataSetInterface} */dataSet, /**@type {boolean}*/ expanded){
            !dataSet && (dataSet = priv.privFlexGrid.data.current);
            dataSet.expand(this, !!expanded);
        },
        expanded: function(/**@type {DataSetInterface} */dataSet){
            !dataSet && (dataSet = priv.privFlexGrid.data.current);
            return dataSet.expanded(this);
        },
        inverseExpanded: function(/**@type {DataSetInterface} */dataSet){
            !dataSet && (dataSet = priv.privFlexGrid.data.current);
            return dataSet.inverseExpanded(this);
        },
        setParent: function(/** @type {GridElement} */parent){
            if (this.parent && this.parent !== parent) {
                //Удаляем из коллекции дочерних элементов старого родителя
                this.parent.removeChild(this);
            }

            this.parent = parent;

            if (this.parent) {
                //Добавляем в коллекцию дочерних элементов к новому родителю
                parent.addChild(pub);
            }
        }.bind(priv),
        removeChild: function(/** @type {GridElement} */child){
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
        }.bind(priv),
        addChild: function(/** @type {GridElement} */child){
            if (!priv.children.includes(child)) {
                priv.children.push(child);
            }
        }.bind(priv),

        updateCell: function(propName){
            let header = this.privFlexGrid.headers.dict[propName];
            //аргументы могут быть использованы при пользовательской функции, определяющей конкретный visualizer
            let visualizer = header.getVisualizer(propName, item, header, privFlexGrid.config);

            visualizer && visualizer.buildReadForm(
                this.DOM.cells[headerId],
                headerId,
                this,
                header,
                //index
            );
        }.bind(priv),

        getGrid: function(){
            return this.pubFlexGrid
        }.bind(priv)
    };

    Object.defineProperties(
        pub,
        {
            parent: {
                configurable: false,
                enumerable: false,
                get: function(){return this.parent;}.bind(priv),
            },
            children: {
                configurable: false,
                enumerable: false,
                get: function(){return this.children;}.bind(priv),
            },
            DOM: {
                configurable: false,
                enumerable: false,
                get: function(){return this.DOM;}.bind(priv),
            },
        }

    );

    return pub;
}