"use strict";

import {DataSetElement} from "./dataSetElement.js";

let pluginIds = {};

function AbstractDataSet(privGrid){
    let priv = this;
    this.id = undefined;
    this.data = {
        //Базовая структура данных для DataSet. Из нее могут формироваться дополнительные структуры
        data: [],
        dataSetElements: {},
    };
    this.createId = function(){
        let r;
        while ((r = 'dataSet' + (Math.ceil(Math.random() * 1000000) + 1)) in pluginIds) {}
        this.id = r;
        pluginIds[r] = true;// true instead of this to avoid memory leak
    };

    this.dataSetElementIndex = 0;

    // this.configureItems = function(item){
    //     this.data.data.map(this.configureItem);
    // };
    // this.configureItem = function(gridElement, index){
    //     !(priv.id in gridElement) && (gridElement[priv.id] = {});
    //     gridElement[priv.id].index = index;
    //     //TODO При обновлении после вставки/удаления элементов в/из набора надо пересчитывать их индексы и обновлять, если есть колонка с нумерацией
    // };

    this.getFullData = function(){
        /**
         * Полные данные dataSet'a
         * Например, у дерева не отображаются потомки свернутых узлов. Поэтому для тех же фильтров надо брать полные
         * данные
         */
        throw 'Method \'getFullData\' is not implemented'
    };
    this.setFullData = function(data){
        throw 'Method \'setFullData\' is not implemented'
    };

    this.getVisibleData = function(){
        /**
         * Отображаемые данные dataSet'а
         */
        throw 'Method \'getVisibleData\' is not implemented'
    };
    this.setVisibleData = function(data){
        throw 'Method \'setVisibleData\' is not implemented'
    };

    this.reserveCurrentData = function(){
        this.data.reserve  = this.getVisibleData();
    };

    this.restoreFromReserve = function() {
        this.setVisibleData(this.data.reserve);
        privGrid.updatePreview();
    };

    this.privGrid = privGrid;
    /**
     * Метод может использоваться в качестве lambda без this. Поэтому
     * используем priv вместо this
     * @param gridElement
     */
    this.convertGridElementToDataSetElement = function(/**@type {GridElement}*/ gridElement) {
        !('_ds' in gridElement) && (gridElement._ds = {});
        if (!(priv.id in gridElement._ds))
        {
            let dataSetElement = new DataSetElement({id: priv.dataSetElementIndex++});
            priv.data.dataSetElements[dataSetElement.Id] = dataSetElement;
            gridElement._ds[priv.id] = dataSetElement.Id;
        }
    };

    this.getDataSetElement = function(/**@type {GridElement}*/ gridElement) {
        if (
            !('_ds' in gridElement) ||
            !(this.id in gridElement._ds) ||
            !this.data.dataSetElements[gridElement._ds[this.id]]
        )
        {
            return null;
        }
        return this.data.dataSetElements[gridElement._ds[this.id]];
    }
}

export {AbstractDataSet}
