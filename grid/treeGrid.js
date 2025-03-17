import {Storage} from "../storage/storage.js";
import {DataSetManager} from "../dataSet/dataSetManager.js";
import {TreeGridInterface} from "./flexGridInterface.js";
import {AbstractFlexGrid} from "./abstractFlexGrid.js";

function TreeGrid(config){
    config = config && typeof config === typeof {} ?
        {...config} :
        {}
    ;


    let priv = new AbstractFlexGrid(config);



    priv.pub = this;

    // Выполняем дополнительную настройку приватной части
    let setGridElementHtmlHandlers = priv.setGridElementHtmlHandlers.bind(priv);
    priv.setGridElementHtmlHandlers = function(/** @type {GridElement} */ gridElement){
        gridElement.DOM.cells['flexGrid.treeHeader'].addEventListener('click', function(e){
            if (!Array.isArray(gridElement.children) || !gridElement.children.length) {
                return;
            }
            e.preventDefault();
            e.cancelBubble = true;
            let state = gridElement.inverseExpanded(priv.data.current);
            if (state === true) {
                //Индекс получаем из атрибута строки, т.к. теоретически позиция строки в наборе может измениться, например в результате сортировки или т.п.
                // +1 - вставляем в следующую за текущим элементом позицию
                //По идее все открываемые потомки уже должны быть в fullData, однако может получиться такая ситуация,
                // что fullData не обновлено
                this.data.current.insertAfter(gridElement, gridElement.children);
                // gridElement.children.map((/** @type {GridElement} */child) => child.expand(priv.data.current.id, true))
                // this.data.current.insert((+gridElement.DOM.row.getAttribute('row-index')) + 1, gridElement.children);
            } else {
                let stack = [];
                gridElement.children.map(function(childGridElement){
                    stack.push(childGridElement);
                });

                let collapsedItems = [];
                let i = 0;
                let childGridElement = undefined;
                while (childGridElement = stack[i++]) {
                    if(childGridElement.expanded(priv.data.current)) {
                        childGridElement.children.map((childChildGridElement) => stack.push(childChildGridElement));
                        childGridElement.expand(priv.data.current, false);
                    }
                    collapsedItems.push(childGridElement);
                }
                this.data.current.hide(collapsedItems);
            }

            this.visualizer.updatePreview();
        }.bind(this));
        setGridElementHtmlHandlers(gridElement);
    };


    let baseExtendsHeaders = priv.extendsHeaders.bind(priv);
    priv.extendsHeaders = function(headers){
        headers.splice(0, 0, {
            id: 'flexGrid.treeHeader',
            title: '',
            type: 'tree',
            isVirtual: false,
            filterable: false,
            sortable: false,
            draggable: false,
            width: this.config.treeMaxVisualDepth * this.config.treeLvlPadding + 30,
            system: true,
            filter: null,
        });

        headers = baseExtendsHeaders(headers);

        return headers;
    };



    priv.prepareData = function(data){
        let {gridElements, objectsDict} = this.createGridElements(data);

        let c = data.length;
        let ecf = this.config.entityClassField;
        let eif = this.config.entityIdField;
        let epf = this.config.entityParentField;
        let echldf = this.config.entityChildrenField;


        /**
         * Устанавливаем parent-child связи
         */
        for (let i = 0; i < c; i++) {
            /**@type {Object} */
            let entityData = data[i];

            if (entityData[epf]) {
                let storage = Storage.get(entityData);
                let gridElement = storage.grids.get(this).gridElement;
                /**
                 * @type {Object}
                 * Указатель на родителя - объект, содержащий в себе класс и идентификатор родительской сущности.
                 * Также не запрещено передавать другие поля
                 */
                let parentEntityData = entityData[epf];
                let parentEntityClass = parentEntityData[ecf];
                let parentEntityId = parentEntityData[eif];
                let parentEntity = objectsDict[parentEntityClass][parentEntityId];
                let parentStorage = Storage.get(parentEntity);
                let parentGridElement = parentStorage.grids.get(this).gridElement;
                for (let key in parentEntityData) {
                    /**
                     * Если внутри object.parent указаны какие-то дополнительные данные помимо entityId и entityClass, доавляем
                     * их в родителя
                     */
                    //TODO А если сущность участвует в нескольких точках, стоит ли переносить в нее дополнительные ключи. которые уже в ней самой имеют какое-то значение
                    parentEntity[key] = parentEntityData[key];
                }
                /**
                 * устанавливаем связь с реальным объектом-родителем вместо указателя
                 */
                entityData[epf] = parentEntity;
                !(echldf in parentEntity) && (Object.defineProperty(parentEntity, echldf, {enumerable: false, writable: true, configurable: false}));
                parentEntity[echldf] = parentEntity[echldf] || []; //TODO Может эта коллекция не так уж и нужна, а достаточно связей внутри parentGridElement->childrenGridElements ?
                parentEntity[echldf].push(entityData);
                gridElement.setParent(parentGridElement);
            }
        }
        /**
         * Базовое древовидное представление данных для грида
         * @type {pubDataSet}
         */
        this.data.current = DataSetManager.createTreeDataSet(priv);
        this.data.current.initData(gridElements);
        /**
         * Все данные грида
         * @type {pubDataSet}
         */
        this.data.flat = DataSetManager.createFlatDataSet(priv);
        this.data.flat.initData(gridElements);

    };

    this.build = function(){priv.init();};

    this.addVisualizationComponent = function(/** @type {string} */alias, /** @type {standardVisualComponents.FlexGridDataVisualizationComponentInterface} */component){
        priv.addVisualizationComponent(alias, component);
    };

    this.addFilterComponent = function(/** @type {string} */alias, /** @type {filter.FlexGridDataFilterComponentInterface} */component){
        priv.addFilterComponent(alias, component);
    };

    this.getVisualizationComponent = function(/** @type {string} */alias){
        return priv.getVisualizationComponent(alias);
    };

    this.getFilterComponent = function(/** @type {string} */alias){
        return priv.getFilterComponent(alias)
    };

    this.updatePreview = function(){priv.updatePreview();};

    this.destroy = function(){
        throw 'Method \'destroy\' is not implemented for flexGrid';

    };

    this.getContainer = () => priv.getContainer();

    this.getId = function(){return priv.getId();};

    priv.registerDefaultComponents();
}

TreeGrid.prototype = new TreeGridInterface();

export {TreeGrid}
