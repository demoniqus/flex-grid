"use strict";

let pluginIds = {};

function abstractDataSet(privGrid){
    let priv = this;
    this.id = undefined;
    this.data = {
        //Базовая структура данных для DataSet. Из нее могут формироваться дополнительные структуры
        data: [],
    };
    this.createId = function(){
        let r;
        while ((r = 'dataSet' + (Math.ceil(Math.random() * 1000000) + 1)) in pluginIds) {}
        this.id = r;
        pluginIds[r] = true;// true instead of this to avoid memory leak
    };

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
};

function pubDataSet(priv){
    this.initData = function(/**@type {[GridElement]}*/data){
        priv.setFullData(data);
        priv.setVisibleData(data);
        // this.configureItems();
    }.bind(priv);

    this.add = function(/**@type {GridElement}*/data){
        this.getFullData().push(data);
        this.getVisibleData().push(data);
        // this.configureItem(data, this.getVisibleData().length);
    }.bind(priv);

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
            iof = this.getFullData().indexOf(dataItem);
            if (iof > -1) {
                this.getFullData()[iof] = null;
                needFiltrate = true;
                //_i < minConfiguredIndex && (minConfiguredIndex = _i);
            }
        }
        needFiltrate && (this.setFullData(this.getFullData().filter((dataItem) => dataItem !== null)));

        /**
         * Вставляем children после указанного родителя в FullData
         */
        iof = this.getFullData().indexOf(parentGridElement) + 1;
        this.getFullData().splice(iof, 0, ...children);

        /**
         * Разбираем VisibleData
         */
        needFiltrate = false;
        i = 0;
        // let minConfiguredIndex = this.getVisibleData().length;

        while (i < l) {
            let dataItem = children[i++];
            iof = this.getVisibleData().indexOf(dataItem);
            if (iof > -1) {
                this.getVisibleData()[iof] = null;
                needFiltrate = true;
                // iof < minConfiguredIndex && (minConfiguredIndex = iof);
            }
        }
        needFiltrate && (this.setVisibleData(this.getVisibleData().filter((dataItem) => dataItem !== null)));

        /**
         * Вставляем children после указанного родителя в VisibleData
         */
        iof = this.getVisibleData().indexOf(parentGridElement) + 1;
        this.getVisibleData().splice(iof, 0, ...children);

        // iof < minConfiguredIndex && (minConfiguredIndex = iof);
        //
        //
        //
        // while (minConfiguredIndex < this.getVisibleData().length) {
        //     this.configureItem(this.getVisibleData()[minConfiguredIndex], minConfiguredIndex);
        //     minConfiguredIndex++;
        // }
    }.bind(priv);
    this.insert_new = function(/**@type {int}*/index, /**@type {GridElement}|{[GridElement]}*/data){
        if (!Array.isArray(data)) {
            data = [data];
        }
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
            let _i = this.getFullData().indexOf(dataItem);
            if (_i > -1) {
                this.getFullData()[_i] = null;
                _i < minConfiguredIndex && (minConfiguredIndex = _i);
            }
        }
        this.getFullData().push(...data);
        this.getVisibleData().splice(index, 0, ...data);

        this.setFullData(this.getFullData().filter((dataItem) => dataItem !== null))
        while (index < this.getVisibleData().length) {
            // this.configureItem(this.getVisibleData()[index], index);
            index++;
        }
    }.bind(priv);
    this.insert = function(/**@type {int}*/index, /**@type {GridElement}|{[GridElement]}*/data){

        /**
         * TODO Здесь надо учитывать возможность, что пользователь будет вставлять уже имеющийся в наборе объект
         * Использовать Weakmap для создания словаря объектов и поиска вхождения
         * МОжно сделать свой объект, похожий на массив (метоыд push, insert, includes и пр.), реализованный в частности
         */
        !this.getFullData().includes(data) && this.getFullData().push(data);
        if (Array.isArray(data)) {
            this.getVisibleData().splice(index, 0, ...data);
        }
        else  {
            this.getVisibleData().splice(index, 0, data);
        }
        while (index < this.getVisibleData().length) {
            // this.configureItem(this.getVisibleData()[index], index);
            index++;
        }
    }.bind(priv);

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

        let tmp = [], i = 0, l = this.getVisibleData().length;//, minConfiguredIndex = null;

        while (i < l)  {
            let dataItem = this.getVisibleData()[i];
            if (!dict.has(dataItem)) {
                tmp.push(dataItem);
            }
            // else if (minConfiguredIndex === null) {
            //     minConfiguredIndex = i;
            // }
            i++;
        }
        this.setVisibleData(tmp);
        // while (minConfiguredIndex < this.getVisibleData().length) {
        //     /**
        //      * Вероятно, такая переконфигурация не нужна, т.к. даже в рамках DataSet GridElement может имерь разные индексы -
        //      * либо в полных базовых данных, либо в отображаемых
        //      */
        //     this.configureItem(this.getVisibleData()[minConfiguredIndex], minConfiguredIndex);
        //     minConfiguredIndex++;
        // }
    }.bind(priv)

    this.remove = function(/**@type {int}|{[int]}*/index){
        //TODO Удалить и getFullData
        if (Array.isArray(index)) {
            let dict = {};
            let res = [];
            index.map(function(i){dict[i] = true;})
            this.getVisibleData().map(function(gridElement, i){
                if (!(i in dict)) {
                    res.push(gridElement);
                }
            });
            this.setVisibleData(res);
            index = 0;
        }
        else  {

            this.data.data.splice(index, 1);
        }
        while (index < this.getVisibleData().length) {
            // this.configureItem(this.getVisibleData()[index], index);
            index++;
        }
    }.bind(priv)

    this.clear = function(){
        //TODO baseData && currentData
        this.data.data.map(function(gridElement){delete gridElement[priv.id];})
        this.data.data = [];
    }.bind(priv);

    this.get = function(/**@type {int}*/key, baseData = false) {
        return baseData ? this.getFullData()[key] : this.getVisibleData()[key] || undefined;
    }.bind(priv);

    this.getData = function(baseData = false){return baseData ? this.getFullData() : this.getVisibleData();}.bind(priv);
    this.setData = function(data, baseData = false){
        baseData ?
            this.setFullData(data) :
            this.setVisibleData(data);
    }.bind(priv);

    Object.defineProperties(
        this,
        {
            length: {
                configurable: true,
                enumerable: false,
                get: function(){return this.getVisibleData().length;}.bind(priv),
            },
            id: {
                configurable: false,
                enumerable: false,
                get: function(){return this.id;}.bind(priv),
            },
        }
    );

}

export function FlatDataSet(privFlexGrid){
    let priv = new abstractDataSet(privFlexGrid);

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

    let pub = new pubDataSet(priv);



    priv.createId();
    return pub;

};

export function TreeDataSet(privFlexGrid){
    let priv = new abstractDataSet(privFlexGrid);

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

    let pub = new pubDataSet(priv);

    pub.initData = function(data){
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
};
