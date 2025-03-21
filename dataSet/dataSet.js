"use strict";

import {GridElement} from "../gridElement/gridElement.js";
import {DataSetInterface} from "./dataSetInterface.js";
export {DataSetInterface} from "./dataSetInterface.js";





function DataSet(priv){
    this.initData = function(/**@type {[GridElement]}*/data){
        /*
        Обязательно клонируем массив, т.к. внутри dataSet'а в нем могут меняться данные и это не должно затрагивать другие наборы строк.
        При этом сами элементы должны реагировать на изменения
         */
        data = [...data];
        data.forEach(priv.convertGridElementToDataSetElement);
        priv.setFullData(data);
        priv.setVisibleData(data);
        // priv.configureItems();
    };

    this.add = function(/**@type {GridElement}*/data){
        priv.convertGridElementToDataSetElement(data);
        priv.getFullData().push(data);
        priv.getVisibleData().push(data);
        // priv.configureItem(data, priv.getVisibleData().length);
    };

    /**
     * Возможно этот метод должен называться не insert, а showChildren, т.к. вызывается он только при разворачивании
     * узла дерева.
     * Вставка данных - это совсем другое действие. Хотя вообще данные могли измениться и отображаемые потомки реально
     * могли переместиться в нового родителя, а потому операция их отображения требует изменения данных. Но это измменений,
     * вероятно, следует производить не в DataSet'е, а снаружи.
     */
    this.insertAfter = function(/**@type {GridElement}*/parentGridElement, /**@type {GridElement}|{[GridElement]}*/children){
        if (!Array.isArray(children)) {
            children = [children];
        }
        children.forEach(priv.convertGridElementToDataSetElement);
        /**
         * TODO Возможно следует использовать WeakMap для определения наличия объекта в коллекции и ее позиции
         */
        /**
         * Проверим, имеются ли добавляемые элементы в коллекциях. Если имеются, эти позиции поставим в null, чтобы
         * переместить из них элементы в новые позиции. А потом вообще удалим из массива эти позиции.
         */
        let i = 0, l = children.length, needFiltrate = false, iof;
        //let minConfiguredIndex = index;

        while (i < l) {
            let dataItem = children[i++];
            iof = priv.getFullData().indexOf(dataItem);
            if (iof > -1) {
                priv.getFullData()[iof] = null;
                needFiltrate = true;
                //_i < minConfiguredIndex && (minConfiguredIndex = _i);
            }
        }
        needFiltrate && (priv.setFullData(priv.getFullData().filter((dataItem) => dataItem !== null)));

        /**
         * Вставляем children после указанного родителя в FullData
         */
        iof = priv.getFullData().indexOf(parentGridElement) + 1;
        priv.getFullData().splice(iof, 0, ...children);

        /**
         * Разбираем VisibleData
         */
        needFiltrate = false;
        i = 0;
        // let minConfiguredIndex = priv.getVisibleData().length;

        while (i < l) {
            let dataItem = children[i++];
            iof = priv.getVisibleData().indexOf(dataItem);
            if (iof > -1) {
                priv.getVisibleData()[iof] = null;
                needFiltrate = true;
                // iof < minConfiguredIndex && (minConfiguredIndex = iof);
            }
        }
        needFiltrate && (priv.setVisibleData(priv.getVisibleData().filter((dataItem) => dataItem !== null)));

        /**
         * Вставляем children после указанного родителя в VisibleData
         */
        iof = priv.getVisibleData().indexOf(parentGridElement) + 1;
        priv.getVisibleData().splice(iof, 0, ...children);

        // iof < minConfiguredIndex && (minConfiguredIndex = iof);
        //
        //
        //
        // while (minConfiguredIndex < priv.getVisibleData().length) {
        //     priv.configureItem(priv.getVisibleData()[minConfiguredIndex], minConfiguredIndex);
        //     minConfiguredIndex++;
        // }
    };

    this.insert_new = function(/**@type {int}*/index, /**@type {GridElement}|{[GridElement]}*/data){
        if (!Array.isArray(data)) {
            data = [data];
        }
        data.forEach(priv.convertGridElementToDataSetElement)
        /**
         * TODO Возможно следует использовать WeakMap для определения наличия объекта в коллекции и ее позиции
         */
        /**
         * Проверим, имеются ли добавляемые элементы в коллекциях. Если имеются, эти позиции поставим в null, чтобы
         * переместить из них элементы в новые позиции. А потом вообще удалим из массива эти позиции.
         *
         * Также найдем минимальную позицию, с которой следует пересчитать нумерацию GridElement'ов
         */
        let i = 0, l = data.length;
        let minConfiguredIndex = index;
        while (i < l) {
            let dataItem = data[i++];
            let _i = priv.getFullData().indexOf(dataItem);
            if (_i > -1) {
                priv.getFullData()[_i] = null;
                _i < minConfiguredIndex && (minConfiguredIndex = _i);
            }
        }
        priv.getFullData().push(...data);
        priv.getVisibleData().splice(index, 0, ...data);

        priv.setFullData(priv.getFullData().filter((dataItem) => dataItem !== null))
        while (index < priv.getVisibleData().length) {
            // priv.configureItem(priv.getVisibleData()[index], index);
            index++;
        }
    };

    this.insert = function(/**@type {int}*/index, /**@type {GridElement}|{[GridElement]}*/data){
        if (Array.isArray(data)) {
            data.forEach(priv.convertGridElementToDataSetElement)
        }
        else {
            priv.convertGridElementToDataSetElement(data);
        }

        /**
         * TODO Здесь надо учитывать возможность, что пользователь будет вставлять уже имеющийся в наборе объект
         * Использовать Weakmap для создания словаря объектов и поиска вхождения
         * МОжно сделать свой объект, похожий на массив (метоыд push, insert, includes и пр.), реализованный в частности
         */
        !priv.getFullData().includes(data) && priv.getFullData().push(data);
        if (Array.isArray(data)) {
            priv.getVisibleData().splice(index, 0, ...data);
        }
        else  {
            priv.getVisibleData().splice(index, 0, data);
        }
        while (index < priv.getVisibleData().length) {
            // priv.configureItem(priv.getVisibleData()[index], index);
            index++;
        }
    };

    this.hide = function(/**@type {GridElement}|{[GridElement]}*/elements){
        /**
         * Здесь удаляем только из набора отображаемых данных, т.к. этот метод пока вызывается только при сворачивании
         * узлов дерева, которое по идее не влияет на основной набор данных
         */
        if (!Array.isArray(elements)) {
            elements = [elements];
        }
        let dict = new Map();
        elements.map((element) => dict.set(element, true));

        let tmp = [], i = 0, l = priv.getVisibleData().length;//, minConfiguredIndex = null;

        while (i < l)  {
            let dataItem = priv.getVisibleData()[i];
            if (!dict.has(dataItem)) {
                tmp.push(dataItem);
            }
            // else if (minConfiguredIndex === null) {
            //     minConfiguredIndex = i;
            // }
            i++;
        }
        priv.setVisibleData(tmp);
        // while (minConfiguredIndex < priv.getVisibleData().length) {
        //     /**
        //      * Вероятно, такая переконфигурация не нужна, т.к. даже в рамках DataSet GridElement может имерь разные индексы -
        //      * либо в полных базовых данных, либо в отображаемых
        //      */
        //     priv.configureItem(priv.getVisibleData()[minConfiguredIndex], minConfiguredIndex);
        //     minConfiguredIndex++;
        // }
    };

    this.remove = function(/**@type {int}|{[int]}*/index){
        //TODO Удалить и getFullData
        if (Array.isArray(index)) {
            let dict = {};
            let res = [];
            index.map(function(i){dict[i] = true;})
            priv.getVisibleData().map(function(gridElement, i){
                if (!(i in dict)) {
                    res.push(gridElement);
                }
            });
            priv.setVisibleData(res);
            index = 0;
        }
        else  {

            priv.data.data.splice(index, 1);
        }
        while (index < priv.getVisibleData().length) {
            // priv.configureItem(priv.getVisibleData()[index], index);
            index++;
        }
    };

    this.clear = function(){
        //TODO baseData && currentData
        priv.data.data.map(function(gridElement){delete gridElement[priv.id];})
        priv.data.data = [];
        priv.data.dataSetElements = {};
        priv.dataSetElementIndex = 0;
    };

    this.get = function(/**@type {int}*/key, baseData = false) {
        return baseData ? priv.getFullData()[key] : priv.getVisibleData()[key] || undefined;
    };

    this.getData = function(baseData = false){return baseData ? priv.getFullData() : priv.getVisibleData();};

    this.setData = function(data, baseData = false){
        Array.isArray(data) ?
            data.forEach(priv.convertGridElementToDataSetElement) :
            priv.convertGridElementToDataSetElement(data);
        baseData ?
            priv.setFullData(data) :
            priv.setVisibleData(data);
    };

    this.expand = function(/**@type {GridElement} */gridElement, /**@type {boolean}*/ expanded){
        let dataSetElement = priv.getDataSetElement(gridElement);
        if (dataSetElement) {
            dataSetElement.Expanded = expanded;
        }
    };

    this.expanded = function(/**@type {GridElement} */gridElement){
        let dataSetElement = priv.getDataSetElement(gridElement);
        return dataSetElement ?
            dataSetElement.Expanded :
            undefined;
    };

    this.inverseExpanded = function(/**@type {GridElement} */gridElement){
        let dataSetElement = priv.getDataSetElement(gridElement);
        if (dataSetElement) {
            dataSetElement.Expanded = !dataSetElement.Expanded;
            return dataSetElement.Expanded;
        }
        return undefined;
    };

    Object.defineProperties(
        this,
        {
            length: {
                configurable: true,
                enumerable: false,
                get: function(){return priv.getVisibleData().length;},
            },
            id: {
                configurable: false,
                enumerable: false,
                get: function(){return priv.id;},
            },
        }
    );

}

DataSet.prototype = new DataSetInterface();

export {DataSet}
