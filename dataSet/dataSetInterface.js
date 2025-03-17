"use strict";

function DataSetInterface()
{
    this.initData = function(/**@type {[GridElement]}*/data){
        throw 'Method \'initData\' is not implemented';
    };

    this.add = function(/**@type {GridElement}*/data){
        throw 'Method \'add\' is not implemented';
    };

    /**
     * Возможно этот метод должен называться не insert, а showChildren, т.к. вызывается он только при разворачивании
     * узла дерева.
     * Вставка данных - это совсем другое действие. Хотя вообще данные могли измениться и отображаемые потомки реально
     * могли переместиться в нового родителя, а потому операция их отображения требует изменения данных. Но это измменений,
     * вероятно, следует производить не в DataSet'е, а снаружи.
     */
    this.insertAfter = function(/**@type {GridElement}*/parentGridElement, /**@type {GridElement}|{[GridElement]}*/children){
        throw 'Method \'insertAfter\' is not implemented';
    };

    this.insert = function(/**@type {int}*/index, /**@type {GridElement}|{[GridElement]}*/data){
        throw 'Method \'insert\' is not implemented';
    };

    this.hide = function(/**@type {GridElement}|{[GridElement]}*/elements){
        throw 'Method \'hide\' is not implemented';
    };

    this.remove = function(/**@type {int}|{[int]}*/index){
        throw 'Method \'remove\' is not implemented';
    };

    this.clear = function(){
        throw 'Method \'clear\' is not implemented';
    };

    this.get = function(/**@type {int}*/key, baseData = false) {
        throw 'Method \'get\' is not implemented';
    };

    this.getData = function(baseData = false){
        throw 'Method \'getData\' is not implemented';
    };
    this.setData = function(data, baseData = false){
        throw 'Method \'setData\' is not implemented';
    };
    this.expand = function(/**@type {GridElement} */gridElement, /**@type {boolean}*/ expanded){
        throw 'Method \'expand\' is not implemented';
    };
    this.expanded = function(/**@type {GridElement} */gridElement){
        throw 'Method \'expanded\' is not implemented';
    };
    this.inverseExpanded = function(/**@type {GridElement} */gridElement){
        throw 'Method \'inverseExpanded\' is not implemented';
    };


}

export {DataSetInterface}
