"use strict";

export {DataSetInterface} from "./dataSetInterface.js";
import {AbstractDataSet} from "./abstractDataSet.js";
import {DataSet} from "./dataSet.js";

const DataSetManager = {
    createFlatDataSet: function(privFlexGrid){
        let priv = new AbstractDataSet(privFlexGrid);

        priv.getFullData = function(){
            return this.data.flat;
        };
        priv.setFullData = function(data){
            this.data.flat = data;
        };

        priv.getVisibleData = function(){
            return this.data.data;
        };
        priv.setVisibleData = function(data){
            this.data.data = data;
        };

        let pub = new DataSet(priv);



        priv.createId();
        return pub;

    },
    createTreeDataSet: function(privFlexGrid){
        let priv = new AbstractDataSet(privFlexGrid);

        priv.getFullData = function(){
            return this.data.flat;
        };
        priv.setFullData = function(data){
            this.data.flat = data;
        };

        priv.getVisibleData = function(){
            return this.data.data;
        };
        priv.setVisibleData = function(data){
            this.data.data = data;
        };

        let pub = new DataSet(priv);

        pub.initData = function(data){
            data.forEach(priv.convertGridElementToDataSetElement);
            this.setFullData(data);
            let treeDataSetData = [];
            let l = data.length, i = 0;
            while (i < l) {
                if (!data[i].parent) {
                    treeDataSetData.push(data[i]);
                }
                i++;
            }
            this.setVisibleData(treeDataSetData);

            // this.configureItems();
        }.bind(priv);

        Object.defineProperties(
            this,
            {
                lengthTotal: {
                    configurable: true,
                    enumerable: false,
                    get: function(){return this.getFullData().length;}.bind(priv),
                },
                id: {
                    configurable: false,
                    enumerable: false,
                    get: function(){return this.id;}.bind(priv),
                },
            }

        );


        //Здесь как минимум два набора данных - видимые строки и общий набор, по которому можно вычислить количество строк для компонента "Количество строк / перейти к строке"

        priv.createId();
        return pub;
    }
};

export {DataSetManager}
