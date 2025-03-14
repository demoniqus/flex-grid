"use strict";

import './dragger.js';
import { DefaultVisualizer, Scroller } from "./flexGridVisualizer.js";

import {DataSetInterface, DataSetManager} from './dataSet.js'
import * as standardVisualComponents from './visualComponents.js'
import * as filter from './filter/filter.js'
import {GridElement} from "./gridElement.js";
import {Storage} from "./storage.js"
import {EventManager} from "./eventManager.js";

export { DefaultVisualizer, FlexPanel } from "./flexGridVisualizer.js";
//export {EventManager} from "./eventManager.js";


let pluginIds = {};

let ClassModel = Object.defineProperties(
    Object.create(null),
    {
        SelectedRow: {
            get: () => 'selected-row',
            configurable: false,
            enumerable: false,
        }
    }
)

function FlexGridEventsModel()
{
    return {

        moveItem: function(acceptorItem, draggedItem, acceptorFlexGridCustomId, sourceFlexGridCustomId){

            typeof this.config.events.moveItem === typeof function (){} &&
            this.config.events.moveItem(...arguments);

        },
        dataAccepted: function(flexGridCustomId){
            typeof this.config.events.dataAccepted === typeof function (){} &&
            this.config.events.dataAccepted(...arguments);
        },
        headersCompleted: function(flexGridCustomId){
            typeof this.config.events.headersCompleted === typeof function (){} &&
            this.config.events.headersCompleted(...arguments);
        },
        completed: function(flexGridCustomId){
            console.log('grid loading completed')
            typeof this.config.events.completed === typeof function (){} &&
            this.config.events.completed(...arguments);
        },
        beforeItemChange: function(eventObj){
            let storage = Storage.get(eventObj.sourceObject);
            eventObj.isGridElement = storage && storage.grids && storage.grids.has(this) && !!storage.grids.get(this).gridElement;
            return typeof this.config.events.beforeItemChange === typeof function (){} ?
                !!this.config.events.beforeItemChange(...arguments):
                true;
        },
        beforeChildItemChange: function(eventObj){
            return typeof this.config.events.beforeItemChange === typeof function (){} ?
                !!this.config.events.beforeItemChange(...arguments):
                true;
        },
        itemChanged: function(eventObj){
            console.log(eventObj)
            let gridElement;
            let sourceEventParams  = eventObj.sourceEventParams;
            let source = eventObj.sourceObject;
            let sourceStorage = Storage.get(source);
            //Если изменился
            if (
                sourceStorage &&
                sourceStorage.grids &&
                sourceStorage.grids.has(this)
            ) {
                gridElement = sourceStorage.grids.get(this).gridElement;
                if (gridElement) {
                    let properties = [sourceEventParams.propertyName];
                    //TODO Выполнить асинхронно?
                    //TODO Выполнить проверку, в каком режиме находится строка и как правильно обновлять ее визуальное представление (и надо ли вообще, чтобы не возникло рекурсии)
                    properties.forEach(propName => gridElement.isVisualized() &&  gridElement.updateCell(propName));
                }
            }

            typeof this.config.events.itemChanged === typeof function (){} &&
            this.config.events.itemChanged(...arguments);
        },
        childItemChanged: function(eventObj){
            console.log(eventObj);
            let gridElement;
            let sourceEventParams  = eventObj.sourceEventParams;
            let source = eventObj.sourceObject;
            let sourceStorage = Storage.get(source);
            //Если изменился
            if (
                sourceStorage &&
                sourceStorage.grids &&
                sourceStorage.grids.has(this)
            ) {
                gridElement = sourceStorage.grids.get(this).gridElement;
                if (gridElement) {
                    let properties = sourceEventParams.properties || [];
                    //TODO Выполнить асинхронно?
                    //TODO Выполнить проверку, в каком режиме находится строка и как правильно обновлять ее визуальное представление (и надо ли вообще, чтобы не возникло рекурсии)
                    properties.forEach(propName => gridElement.isVisualized() &&  gridElement.updateCell(propName));
                }
            }

            typeof this.config.events.childItemChanged === typeof function (){} &&
            this.config.events.childItemChanged(...arguments);

            if (
                !gridElement &&
                sourceStorage.reactive &&
                sourceStorage.reactive.parents instanceof Array
            ) {
                //parent является вложенным элементом. Поэтому событие нужно поднять выше, пока не наткнемся на gridElement
                sourceStorage.reactive.parents.forEach(
                    function(/**@type {ReactiveParentDefinition} */parentDefinition, index){
                        let parent = parentDefinition.getParent();
                        if (!parent) {
                            sourceStorage.reactive.parents[index] = null;
                            return;
                        }
                        let properties = Object.keys(parentDefinition.getReverseProperties());

                        // let properties = Object.keys(parentDefinition.parentPropName);
                        //{childItem: this,  parent, properties}
                        EventManager.fire(parent, 'childItemChanged', {childItem: source, parent, properties/**TODO Нужен ли тут originalEvent, чтобы на уровне gridElement можно было точно понять, какой вложенный объект изменился? */})
                    }
                )
                sourceStorage.reactive.parents = sourceStorage.reactive.parents.filter(definition => !!definition);
            }
        },
    }
}

function FlexGridDefaultConfig()
{
    return {
        __headerFormat: {
            _id: 'Идентификатор заголовка',
            id: 'string',
            _title: 'Наименование заголовка',
            title: '?string',
            _type: 'Наименование пользовательского или предопределенного типа компонента(-ов)',
            type: 'string|object{entityClass : string}',
            _width: 'Ширина заголовка. Указывается только для листовых заголовков',
            width: 'int',
            _children: 'Дочерние заголовки',
            children: '?array',
            _isVirtual: 'Виртуальный заголовок. Используется для заполнения пустых ячеек в иерархических заголовках',
            isVirtual: '?bool',
            filterable: '?bool',
            sortable: '?bool',
            draggable: '?bool',
        },
        _id: 'Пользовательский идентификатор FlexGrid\'а для организации взаимодействия между таблицами',
        id: null,
        _container: 'Контейнер для размещения flexGrid',
        container: undefined,
        _entityClassField: 'Наименование поля с указанием класса сущности',
        entityClassField: 'entityClass',
        _entityIdField: 'Наименование поля с указанием id сущности',
        entityIdField: 'id',
        _entityParentField: 'Наименование поля с указанием родителя сущности',
        entityParentField: 'parent',
        _entityChildrenField: 'Наименование поля с указанием коллекции дочерних элементов',
        entityChildrenField: 'children',
        _treeMaxVisualDepth: 'Максимальная визуальная глубина дерева. Элементы с бОльшим уровнем вложенности не будут смещаться сильнее',
        treeMaxVisualDepth: 5,
        _treeLvlPadding: 'Отступ в пикселях на каждый уровень вложенности',
        treeLvlPadding: 10,
        _draggableColumns: 'Возможно перетаскивание колонок',
        draggableColumns: false,
        _draggableRows: 'Возможно перетаскивание строк',
        draggableRows: false,
        _numerable: 'Колонка с нумерацией строк',
        numerable: true,
        _filterable: 'Локальный фильтр данных',
        filterable: true,
        _visualizer: 'Пользовательский компонент визуализации данных. Должен реализовывать интерфейс DefaultVisualizer.VisualizerInterface',
        visualizer: null,
        _dataProvider: 'Пользовательский компонент передачи данных. Должен реализовывать интерфейс FlexGrid.DataProviderInterface',
        dataProvider: null,
        _events: {
            moveItem: function(acceptorItem, draggedItem, acceptorFlexGridCustomId, sourceFlexGridCustomId){
                try {
                    console.log(
                        `
                        Событие перетаскивания строки грида. На вход принимает аргументы:
                        acceptorItem - принимающий объект данных,
                        draggedItem - перемещаемый объект данных,
                        acceptorFlexGridCustomId - пользовательский идентификатор принимающего грида,
                        sourceFlexGridCustomId - пользовательский идентификатор грида-источника
                         `
                    )
                } catch (e) {

                }
                if (
                    acceptorFlexGridCustomId.gridClass !== sourceFlexGridCustomId.gridClass ||
                    acceptorFlexGridCustomId.id !== sourceFlexGridCustomId.id
                ) {
                    // Из других grid'ов не принимаем строки
                    return;
                }
                try {
                    console.log('element ' + acceptorItem.id + ' accept element ' + draggedItem.id);
                } catch (e) {

                }

            },
            dataAccepted: function(flexGridCustomId){
                try {
                    console.log(
                        `
                        Событие получения всех необходимых для построения грида данных. На вход принимает аргументы:
                        flexGridCustomId - пользовательский идентификатор грида
                         `
                    )
                } catch (e) {

                }
            },
            headersCompleted: function(flexGridCustomId){
                try {
                    console.log(
                        `
                        Событие отрисовки заголовков грида. На вход принимает аргументы:
                        flexGridCustomId - пользовательский идентификатор грида
                         `
                    )
                } catch (e) {

                }
            },
            completed: function(flexGridCustomId){
                try {
                    console.log(
                        `
                        Событие полной загрузки грида. На вход принимает аргументы:
                        flexGridCustomId - пользовательский идентификатор грида
                         `
                    )
                } catch (e) {

                }
            },
            childItemChanged: function(eventObj){
                try {
                    console.log(
                        `
                        Событие изменения дочернего элемента. На вход принимает аргументы:
                        eventObj - параметры события
                        this - текущий родительский элемент
                        childElement - дочерний элемент - источник события
                        flexGridId - грид, в котором произошло событие
                         `
                    )
                } catch (e) {

                }
            },
            beforeItemChange: function(eventObj){
                try {
                    console.log(
                        `
                        Событие перед изменением элемента данных. На вход принимает аргументы:
                        eventObj - параметры события
                        this - текущий родительский элемент
                        childElement - дочерний элемент - источник события
                        flexGridId - грид, в котором произошло событие
                         `
                    )
                } catch (e) {

                }
            },
            beforeChildItemChange: function(eventObj){
                try {
                    console.log(
                        `
                        Событие перед изменением дочернего элемента данных. На вход принимает аргументы:
                        eventObj - параметры события
                        this - текущий родительский элемент
                        childElement - дочерний элемент - источник события
                        flexGridId - грид, в котором произошло событие
                         `
                    )
                } catch (e) {

                }
            },
            itemChanged: function(eventObj){
                try {
                    console.log(
                        `
                        Событие изменения элемента данных. На вход принимает аргументы:
                        eventObj - параметры события
                        this - текущий родительский элемент
                        childElement - дочерний элемент - источник события
                        flexGridId - грид, в котором произошло событие
                         `
                    )
                } catch (e) {

                }
            },
        },
        events: null
    };
}
function FlexGridInterface()
{
    this.build = function(){

        throw 'Method \'build\' is not implemented';
    };

    this.addVisualizationComponent = function(/** @type {string} */alias, /** @type {standardVisualComponents.FlexGridDataVisualizationComponentInterface} */component){
        throw 'Method \'addVisualizationComponent\' is not implemented';
    };

    this.addFilterComponent = function(/** @type {string} */alias, /** @type {filter.FlexGridDataFilterComponentInterface} */component){
        throw 'Method \'addFilterComponent\' is not implemented';
    };

    this.getVisualizationComponent = function(/** @type {string} */alias){
        throw 'Method \'getVisualizationComponent\' is not implemented';
    };

    this.getFilterComponent = function(/** @type {string} */alias){
        throw 'Method \'getFilterComponent\' is not implemented';
    };

    this.updatePreview = function(){
        throw 'Method \'updatePreview\' is not implemented';
    };

    this.destroy = function(){
        throw 'Method \'destroy\' is not implemented';

    };

    this.getId = function(){
        throw 'Method \'getId\' is not implemented';
    };

    this.getContainer = () => {
        throw 'Method \'getContainer\' not implemented'
    };
}

function FlatGridInterface()
{

}


function TreeGridInterface()
{

}

FlatGridInterface.prototype = TreeGridInterface.prototype = new FlexGridInterface();

function abstractFlexGrid (config){
    /**
     * TODO
     * 1. Продумать зависимость дочерний-родительский(-е) гриды
     * 2. Возможно, следует заменить array.splice на использование циклов для повышения быстродействия
     * 3. Устранить утечки памяти: создаем в функции DOM-элемент и устанавливаем на него обработчики событий. При этом
     *      данные обработчики помнят могут хранить значение всех временных переменных, определенных при создании
     *      этих обработчиков, что и может стать утечкой памяти.
     * 4. Заменить undefined на null для возможности сравнения двух пустых значений ( а может и не надо)
     * 5. Колонки "Номер строки" и "Дерево" должны при запросе элементов через getElement-callbsack изменять свою ширину:
     * - "Номер строки" - в зависимости от длины номера (Сделано - text-wrap: nowrap !important)
     * - "Дерево" - в зависимости от максимальной глубины запрошенного элемента
     * При этом также надо регулировать ширину их родительских агрегирующих заголовков
     * 6. Возможно, что "Номер строки" должен браться не из набора видимых элементов, а из полного набора данных текущего dataSet,
     * поскольку функция "Перейти к строке..." явно будет обращаться к общему набору данных
     *
     */

    //Уникальный идентификатор таблицы
    this.id = null;
    //Пользовательский идентификатор таблицы. Используется для организации пользовательского взаимодействия между разными таблицами
    this.customId = null;
    this.headers = {
        /**
         * Оригинальный порядок листовых заголовков
         */
        leafHeaders: null,
        /**
         * Оригинальный порядок узловых заголовков
         */
        nodalHeaders: null,
        /**
         * Словарь заголовков
         */
        dict: null,
        /**
         * Переупорядочиваемый список листовых заголовков
         */
        orderedLeafHeaders: null,
        /**
         * Переупорядочиваемый список узловых заголовков
         */
        orderedNodalHeaders: null,
    };

    /**
     * Ссылка на публичную часть
     * @type {FlexGridInterface}
     */
    this.pub = undefined;
    //Сквозная идентификация gridElement'ов в рамках текущего Grid'а
    this.gridElementIndex = 0;

    this.filter = new filter.Filter(this);
    //DataSet'ы
    this.data = {
        //Плоский упорядоченный набор GridElement'ов - начальное состояние данных
        /**
         * @type DataSetInterface
         */
        flat: undefined,
        // //Словарь объектов
        // objectsDict: undefined,
        //Дерево
        //tree: undefined,
        //Пользовательская сортировка данных
        /**
         * @type DataSetInterface
         */
        sorted: undefined,
        /**
         * Use this.setDataSet() to assigning dataSet !!!!
         */
        //Визуализируемый набор данных
        /**
         * @type DataSetInterface
         */
        current: undefined
    };

    this.events = {};

    this.config = {};

    this.metadata = undefined;

    this.styleContainer = undefined;
    this.styles = {
        '.selected-row': 'background-color: rgba(200, 200, 200, .3);',
        '.filter-reset-button': 'border: 1px solid #fcc; color: red; font-weight: bold;',
        '.flex-grid-row .flex-grid-cell.flexGrid_numerableHeader': 'text-wrap: nowrap !important;',
        ',string-filter-option': '',
        // '.flex-grid-entity-data-cell:hover': 'transition-delay: 5s; position: relative; pointer-events: none;',
        // '.flex-grid-entity-data-cell:hover::after': 'transition-delay: 5s;  position: absolute; content: "\\1F58D"; color: blue; top: 0px; right: 0px; pointer-events: auto;',
        // '.flex-grid-entity-data-cell:hover': 'transition-delay: 1s; position: relative;',
        // '.flex-grid-entity-data-cell:hover :after': 'transition-delay: 1s; position: absolute; content: &#128397; color: blue;',
    };

    this.visualizer = undefined;

    this.dataVisualizationComponents = {
        // Набор визуализаторов данных
    };
    this.dataFilterComponents = {
        // Набор фильтров данных
    };

    this.dataProvider = undefined;
    //Список наименований полей в сущностях, которые являются прямыми ссылками на родителя
    this.directParentFields = undefined;
    //Глобальное хранилище для всех экземпляров grid'ов
    this.globalStorage = undefined;


    this.createStyleElement = function(){
        //TODO Добавить префикс - корневой класс типа '.flex-grid-visualizer-' + this.id, чтобы стили влияли только на используемый DOM-контейнер
        this.styleContainer = document.createElement('style');
        this.styleContainer.id = 'flex-grid-style-container-' + this.id;
        document.getElementsByTagName('head')[0].appendChild(this.styleContainer);
    };

    this.updateStyleElement = function(){
        let styles = '';
        for (let styleId in this.styles) {
            styles += styleId + ' {' + this.styles[styleId] + '}' + "\n"
        }
        this.styleContainer.textContent = styles;
    };


    this.setGridElementHtmlHandlers = function(/** @type {GridElement} */ gridElement){
        let grid = this;

        gridElement.DOM.row.addEventListener('contextmenu', function(e){
            console.log(e);
            console.log(this);
        });

        if (this.config.draggableRows === true || this.config.draggableRows === 1) {
            //https://developer.mozilla.org/ru/docs/Web/API/HTML_Drag_and_Drop_API

            //TODO Можно установить картинку при перетаскивании строки
            window.dragger
                .initDraw(
                    {drawElement: gridElement.DOM.row}
                )
                .initAcceptor(
                    {
                        acceptorElement: gridElement.DOM.row,
                        onDrop: function(draggedRow, acceptorRow){
                            if (!draggedRow.classList.contains('flex-grid-data-row')) {
                                //Не принимаем элементы, не являющиеся строками таблицы.
                                //При этом здесь не проверяем, относятся ли строки к одной таблице, т.к. теоретически может потребоваться взаимодействие между разными таблицами
                                return;
                            }
                            if (typeof grid.config.events.moveItem === typeof function(){}) {
                                grid.config.events.moveItem(
                                    acceptorRow.gridElement.getData(),
                                    draggedRow.gridElement.getData(),
                                    acceptorRow.gridElement.getGrid().getId(),
                                    draggedRow.gridElement.getGrid().getId(),
                                )
                            }
                        }
                    }
                );

        }


        gridElement.DOM.row.addEventListener(
            'click',
            function(e){

                //TODO Можно допускать выделение нескольких ячеек по Ctlr или Shift, например, для удаления или перемещения
                grid.config.container.querySelectorAll('.flex-grid-data-row.' + ClassModel.SelectedRow).forEach(
                    function(selectedRow){
                        selectedRow.classList.remove(ClassModel.SelectedRow);
                    }
                );
                this.classList.add(ClassModel.SelectedRow);
                // grid.activeRow = this;
            }
        );
    };

    this.createGridElementHtml = function(index, /** @type {GridElement} */ gridElement){
        if (gridElement.DOM.row) {
            //Если порядок колонок был изменен, заново сортируем их в строке
            let cells = gridElement.DOM.cells;
            for (let iCol in this.headers.orderedLeafHeaders)
            {
                let h = this.headers.orderedLeafHeaders[iCol];
                gridElement.DOM.row.appendChild(cells[h.id]);
            }

            return;
        }
        let grid = this;
        //TODO Можно настроить грид, чтобы он экономил память и не запоминал DOM-элементы, а всегда их строил заново при выгрузке строк из области видимости
        let DOMElement = document.createElement('div');
        DOMElement.gridElement = gridElement;
        //Класс обозначает, что элемент является строкой грида
        DOMElement.classList.add('flex-grid-row');
        //Класс обозначает, что элемент является строкой грида с даными
        DOMElement.classList.add('flex-grid-data-row');

        gridElement.DOM.cells = {};

        for (let iCol in this.headers.orderedLeafHeaders)
        {
            let h = this.headers.orderedLeafHeaders[iCol];
            let cell = document.createElement('div');
            //Класс обозначает, что элемент является ячейкой грида
            cell.classList.add('flex-grid-cell');
            //Класс обозначает, что элемент является ячейкой грида с данными
            cell.classList.add('flex-grid-data-cell');
            //Класс обозначает, что элемент является ячейкой грида с данными, относящимися непосредственно к сущности
            cell.classList.add('flex-grid-entity-data-cell');
            cell.classList.add(h.id.replaceAll('.', '_'));

            cell.name = 'flex-grid-data-' + h.id;
            DOMElement.appendChild(cell);
            gridElement.DOM.cells[h.id] = cell;
        }

        gridElement.DOM.row = DOMElement;

        this.setGridElementHtmlHandlers(gridElement);


    };

    this.visualizerCallbacks = {
        getItemsCount: function(){
            //TODO Возвращать количество видимых в данный момент элементов, а не всех!!!
            return this.data.current.length;
        },
        getElement: function(index, direction){
            if (index < 0 || index > this.data.current.length - 1)
            {
                return DefaultVisualizer.getFlags().noElements;
            }
            let gridElement = this.data.current.get(index);



            let item = gridElement.getData();

            this.createGridElementHtml(index, gridElement);
            gridElement.DOM.row.setAttribute('row-index', index);




            let cells = gridElement.DOM.cells;

            for (let headerId in cells) {
                let header = this.headers.dict[headerId];
                let visualizer = header.getVisualizer(headerId, item, header, this.config);
                visualizer && visualizer.buildReadForm(
                    cells[headerId],
                    headerId,
                    gridElement,
                    header,
                    index
                );
            }

            if (item.parent) {
                cells['flexGrid.treeHeader'].classList.add('flex-grid-tree-cell');
                let p = item;
                let lvl = 0;
                while ((p = p.parent) && lvl < this.config.treeMaxVisualDepth) {
                    lvl++;
                }
                lvl == this.config.treeMaxVisualDepth && (lvl = 'exceed');
                cells['flexGrid.treeHeader'].classList.add('enclosure-' + lvl);

            }

            return gridElement.DOM.row;
        },
    };

    this.setDataSet = function(dataSet){
        this.data.current = dataSet;
    };

    this.createId = function(){
        let r;
        while ((r = 'flexGrid_' + (Math.ceil(Math.random() * 1000000) + 1)) in pluginIds) {}
        this.id = r;
        pluginIds[r] = this;
    };

    /**
     *
     * @param {object} config
     * @returns {*[]} - errors
     */
    this.specificConfigValidation = function(config){
        //Специфическая валидация.
        return [];
    };

    this.validateConfig = function(config){
        let errors = [];

        if (
            !config ||
            typeof config !== typeof {}
        ) {
            return ['empty config'];
        }

        if (
            config.visualizer &&
            !(config.visualizer instanceof DefaultVisualizer.VisualizerInterface)
        ) {
            errors.push('Visualizer must be instance of DefaultVisualizer.VisualizerInterface');
        }

        if (
            !config.container ||
            typeof config.container === typeof 'aaa' && !config.container.trim() ||

            typeof config.container === typeof {} && config.container.nodeType !== Node.ELEMENT_NODE
        ) {
            errors.push('Incorrect grid container');
        }
        if (
            !config.dataProvider ||
            !(config.dataProvider instanceof FlexGrid.DataProviderInterface)
        ) {
            errors.push('Incorrect data processor');
        }

        if (config.entityParentField && typeof 'aa' !== typeof config.entityParentField) {

            errors.push('Incorrect type of config.entityParentField. Value must be string or null.');
        }

        errors = errors.splice(0, 0, ...this.specificConfigValidation(config));

        return errors.length ? errors : null;
    };

    this.setConfig = function(config){
        let errors = this.validateConfig(config)
        if (errors) {
            throw 'Incorrect config: ' + errors.join('; ');
        }
        config = {...config}
        if (config.id) {
            this.customId = typeof config.id === typeof {} ? {...config.id} : config.id;
            delete config.id;
        }


        if (typeof config.container === typeof 'aaa') {
            let collection;
            config.container = document.getElementById(config.container) || ((collection = document.getElementsByClassName(config.container)) ? collection[0] : null) || document.querySelector(config.container);
            if (!config.container) {
                throw 'Incorrect grid container';
            }
        }

        config.treeMaxVisualDepth ||= FlexGrid.getDefaultConfig().treeMaxVisualDepth;
        config.treeLvlPadding ||= FlexGrid.getDefaultConfig().treeLvlPadding;
        config.events ||= {};
        this.styles['.flex-grid-tree-cell'] = '--tree-lvl-padding: ' + config.treeLvlPadding + 'px;';
        for (let i = 1; i <= config.treeMaxVisualDepth; i++) {
            this.styles['.flex-grid-tree-cell.enclosure-' + i] = 'padding-left: calc(var(--tree-lvl-padding) * ' + i + ');';
        }
        this.styles['.flex-grid-tree-cell.enclosure-exceed'] = 'padding-left: calc(var(--tree-lvl-padding) * ' + config.treeMaxVisualDepth + ');';

        config.filterMode && this.filter.setMode(config.filterMode);

        config.entityParentField && (config.entityParentField = config.entityParentField.trim());
        config.entityParentField === '' && (config.entityParentField = null);

        config.entityChildrenField && (config.entityChildrenField = config.entityChildrenField.trim());
        config.entityChildrenField === '' && (config.entityChildrenField = null);

        this.visualizer = config.visualizer || new DefaultVisualizer();
        this.visualizer.setContainer(config.container);
        this.visualizer.setCallbacks(
            {
                getItemsCount: this.visualizerCallbacks.getItemsCount.bind(this),
                getElement: this.visualizerCallbacks.getElement.bind(this),
            }
        );
        this.visualizer.init();

        delete config.visualizer;

        this.dataProvider = config.dataProvider;
        delete config.dataProvider;

        this.config = config;

        return this;
    };

    this.getContainer = () => this.visualizer.getContainer();

    this.configureEvents = function(){
        let gridEventsModel = new FlexGridEventsModel();
        for (let eventName in gridEventsModel) {
            //TODO Возможно, стоит события также через EventManager настроить
            this.events[eventName] = gridEventsModel[eventName].bind(this);
        }

        return this;
    };

    this.createDefaultMetaada = function(){
        return {
            'tableName': 'Flex grid',
        }
    };


    this.loadData = function(source){
        throw 'Method \'loadData\' is not implemented for specific flexGrid';
        //after data loading it's need to call the method called 'prepareData'
    };

    this.prepareData = function(data){
        throw 'Method \'prepareData\' is not implemented for specific flexGrid';
    };

    this.createGridElements = function (data)
    {
        let gridElement = undefined;
        let gridElements = [];
        let objectsDict = {};
        let c = data.length;
        let ecf = this.config.entityClassField;
        let eif = this.config.entityIdField;
        /**
         * Создаем GridElement'ы
         */
        for (let i = 0; i < c; i++) {
            let entityData = data[i];
            let entityClass = entityData[ecf];
            let entityId = entityData[eif];

            //TODO Возможно, следует сделать проход и собрать просто отдельно классы сущностей, а затем по полученному набору создать в словарях вложенные объекты
            !(entityClass in objectsDict) && (objectsDict[entityClass] = {});

            objectsDict[entityClass][entityId] = entityData;
            gridElement = new GridElement(this.gridElementIndex++, this.config, this, this.pub);
            gridElement.initData(entityData);

            this.createGridStorageIntoObject(entityData);
            this.connectDataItemWithGridElement(entityData, gridElement);
            gridElements.push(gridElement);
        }

        return {
            'gridElements': gridElements,
            'objectsDict': objectsDict
        };
    };

    this.init = function(){
        /**
         * TODO
         * Контейнер грида можно сделать .resizable {resize: both} https://www.w3schools.com/cssref/css3_pr_resize.php
         * Отлавливать событие изменения размера контейнера для перезагрузки строк грида можно вот так
         * https://stackoverflow.com/questions/8082729/how-to-detect-css3-resize-events
         * https://learn.javascript.ru/mutation-observer?ysclid=lxolw91yj9990826844
         */
        this.createId();
        this.createStyleElement();
        this.updateStyleElement();

        this.directParentFields = {};
        this.globalStorage = Storage.create(abstractFlexGrid);
        /**
         * ds - Direct Setter
         * rs - Reverse Setter
         * g - Getter
         */
        !('callbacks' in this.globalStorage) && (this.globalStorage.callbacks = {ds: {}, rs: {}, g: {}});

        //TODO async await
        let headersLoadingPromise = new Promise(
            function(resolve, reject){
                let headersAcceptor = function(headers){
                    // Заголовки не могут быть пустыми
                    headers instanceof Array && headers.length ?
                        resolve(headers):
                        reject();
                }.bind(this);
                this.dataProvider.getHeaders(headersAcceptor);
            }.bind(this)
        )
        .then(function(headers){
            // Переработаем полученные данные в заголовки
            this.createHeaders(headers);
            return this.headers.orderedLeafHeaders;
        }.bind(this))
        .then(function(orderedLeafHeaders){
            // Отрисуем заголовки
            this.visualizer.setHeaders(orderedLeafHeaders);
        }.bind(this))
        .then(function(){
            //Заголовки отрисованы - генерируем событие
            this.events.headersCompleted(this.getId());
        }.bind(this))
        ;

        let dataLoadingPromise = new Promise(
            function(resolve, reject){
                let dataAcceptor = function(data){
                    if (
                        data instanceof Array ||
                        data === null ||
                        data === undefined
                    ) {
                        !data && (data = []);
                        this.prepareData(data);
                        resolve();
                    }
                    else {
                        reject();
                    }
                }.bind(this);
                this.dataProvider.getData(dataAcceptor);
            }.bind(this)
        );

        let metadataLoadingPromise = new Promise(
            function(resolve, reject){
                let metadataAcceptor = function(metadata){
                    if (
                        typeof metadata === typeof {} ||
                        metadata === null ||
                        metadata === undefined
                    ) {
                        !metadata && (metadata = this.createDefaultMetaada());
                        this.metadata = metadata;
                        resolve();
                    }
                    else {
                        reject();
                    }
                }.bind(this);
                this.dataProvider.getMetadata(metadataAcceptor)
            }.bind(this)
        )

        Promise.all(
            [
                headersLoadingPromise,
                dataLoadingPromise,
                metadataLoadingPromise,
            ]
        ).then(
            function(){
                this.events.dataAccepted(this.getId());
            }.bind(this)
        ).then(
            function(){
                //Получены все необходимые данные. Теперь понятно, сколько у нас строк и какую ширину должна иметь колонка с нумерацией
                this.visualizer.updateColumnsWidth(['flexGrid.numerableHeader'])

                this.visualizer.showData(
                    {
                        scrollSensitivity: this.config.scrollSensitivity ?? Scroller.getDefaultConfig().scrollSensitivity,
                        scrollStepSize: this.config.scrollStepSize ?? Scroller.getDefaultConfig().scrollStepSize,
                    }
                );



                let tableHeader = document.createElement('div');
                tableHeader.innerHTML = 'tableName' in this.metadata && this.metadata.tableName !== undefined && this.metadata.tableName !== null ?
                    this.metadata.tableName:
                    this.createDefaultMetaada().tableName;
                tableHeader.style.textAlign = 'center';
                tableHeader.style.width = '100%';
                tableHeader.style.marginBottom = '10px';
                this.visualizer.TopPanel.addItem(
                    'tHeader',
                    tableHeader

                );

                //Данные получены. Можно сделать доступными кнопки для работы с данными
                // this.initOptionPanels();//
            }.bind(this)
        ).then(async function(){
            //TODO Выполнять асинхронно
            //TODO Подумать, может реактивность надо навешивать только при изменении сущностей через пользовательский интерфейс?
            // Хотя, не исключено, что сущности могут меняться и при обновлении с сервака. В этом случае надо как-то это разрулить
            await this.setReactiveData();
        }.bind(this)
        ).then(function(){
            this.events.completed(this.getId());
        }.bind(this))

        ;

        //Данные получены. Можно создать кнопки для работы с данными
        this.initOptionPanels();
    };


    this.setReactiveData = function(){
        let t = (new Date()).getTime();
        let gridElements = this.data.flat.getData();

        let
            i = -1,
            l = gridElements.length,
            parentFields = []
        ;

        this.directParentFields = {};

        this.config.entityParentField && (
            parentFields.push(this.config.entityParentField),
            this.directParentFields[this.config.entityParentField] = true
        );

        while (++i < l) {
            //Элемент грида
            let gridElement = gridElements[i];
            //Элемент данных
            let dataItem = gridElement.getData();
            //TODO Здесь можно разбить данные на более мелкие блоки и выполнить конфигурацию через Promise'ы или setTimeout'ы, чтобы не блокировать интерфейс на большой промежуток времени
            this.config.entityParentField ?
                this.configureDataItemAsReactive(new ReactiveDataItemDefinition(dataItem).addParentDefinition(
                    new ReactiveParentDefinition(
                        /**
                         * Для прямых связей исходное значение извлекается в момент генерации событий прямо из значения поля, поэтому
                         * здесь нет большого смысла передавать это значение. Но пусть будет....
                         * К тому же, т.к. данные могут состоять из сущностей разных типов, то некоторые типы могут вообще
                         * не содержать в себе этого значения
                         */
                        dataItem[this.config.entityParentField]
                    ).addField(this.config.entityParentField, 'd')

                )):
                this.configureDataItemAsReactive(new ReactiveDataItemDefinition(dataItem));

        }

        console.log('reactiveData time ', ((new Date()).getTime() - t));
    };

    this.connectDataItemWithGridElement = function (entityData, gridElement) {
        //В текущем гриде элемент данных представлен элементом GridElement с указанным идентификатором
        let storage = Storage.get(entityData);
        storage.grids.get(this).gridElement = gridElement;
    };

    this.initOptionPanels = function(){
        let grid = this;

        let editBtn = document.createElement('div');
        editBtn.style.cursor = 'pointer';
        editBtn.classList.add('button');
        editBtn.classList.add('edit-button');
        editBtn.style.backgroundImage = 'url("img/pen.png")';
        editBtn.style.backgroundSize = '32px';
        editBtn.style.width = '32px';
        editBtn.style.height = '32px';
        editBtn.style.maxWidth = '32px';
        editBtn.style.maxHeight = '32px';
        editBtn.style.minWidth = '32px';
        editBtn.style.minHeight = '32px';
        this.visualizer.RightPanel.addItem('editBtn', editBtn);
        //TODO Можно добавлять для элементов классы only-vertical, only-horizontal

        let createBtn = document.createElement('div');
        createBtn.style.cursor = 'pointer';
        createBtn.classList.add('button');
        createBtn.classList.add('edit-button');
        createBtn.style.backgroundImage = 'url("img/add.png")';
        createBtn.style.backgroundSize = '32px';
        createBtn.style.width = '32px';
        createBtn.style.height = '32px';
        createBtn.style.maxWidth = '32px';
        createBtn.style.maxHeight = '32px';
        createBtn.style.minWidth = '32px';
        createBtn.style.minHeight = '32px';
        this.visualizer.RightPanel.addItem('createBtn', createBtn);

        let expandBtn = document.createElement('div');
        expandBtn.style.cursor = 'pointer';
        expandBtn.classList.add('button');
        expandBtn.classList.add('edit-button');
        expandBtn.style.backgroundImage = 'url("img/four-arrows.png")';
        expandBtn.style.backgroundSize = '32px';
        expandBtn.style.width = '32px';
        expandBtn.style.height = '32px';
        expandBtn.style.maxWidth = '32px';
        expandBtn.style.maxHeight = '32px';
        expandBtn.style.minWidth = '32px';
        expandBtn.style.minHeight = '32px';
        this.visualizer.RightPanel.addItem('expandBtn', expandBtn);
        expandBtn.addEventListener('click',
            function(){}
        )

        let collapseBtn = document.createElement('div');
        collapseBtn.style.cursor = 'pointer';
        collapseBtn.classList.add('button');
        collapseBtn.classList.add('edit-button');
        collapseBtn.style.backgroundImage = 'url("img/collapse.png")';
        collapseBtn.style.backgroundSize = '32px';
        collapseBtn.style.width = '32px';
        collapseBtn.style.height = '32px';
        collapseBtn.style.maxWidth = '32px';
        collapseBtn.style.maxHeight = '32px';
        collapseBtn.style.minWidth = '32px';
        collapseBtn.style.minHeight = '32px';
        this.visualizer.RightPanel.addItem('collapseBtn', collapseBtn);

        let gridOptionsButton = document.createElement('div');
        gridOptionsButton.style.cursor = 'pointer';
        gridOptionsButton.classList.add('button');
        gridOptionsButton.classList.add('grid-options-button');
        gridOptionsButton.style.backgroundImage = 'url("img/icon-gears.png")';
        gridOptionsButton.style.backgroundSize = '32px';
        gridOptionsButton.style.width = '32px';
        gridOptionsButton.style.height = '32px';
        gridOptionsButton.style.maxWidth = '32px';
        gridOptionsButton.style.maxHeight = '32px';
        gridOptionsButton.style.minWidth = '32px';
        gridOptionsButton.style.minHeight = '32px';
        gridOptionsButton.title = 'Настройки таблицы и ее компонентов';
        this.visualizer.LeftPanel.addItem('gridOptionsBtn', gridOptionsButton);
        gridOptionsButton.addEventListener(
            'click',
            function(){
                // alert('Окно настроек грида и его компонентов')
                //Компонент PopupWindow - всплывающее окно с возможностью стать модальным, с возможностью перемещения
                let popupWindow = document.createElement('div');
                popupWindow.classList.add('popup-window');
                // popupWindow.classList.add('modal');

                let closeWindowBtn = document.createElement('div');
                closeWindowBtn.classList.add('popup-window-close-button');
                closeWindowBtn.innerHTML = 'X';
                popupWindow.appendChild(closeWindowBtn);
                closeWindowBtn.addEventListener(
                    'click',
                    function(){
                        popupWindow.parentElement.removeChild(popupWindow);
                    }
                );


                let windowCover = document.createElement('div');
                windowCover.classList.add('popup-window-cover');
                popupWindow.appendChild(windowCover);

                let windowSpace = document.createElement('div');
                windowSpace.classList.add('popup-window-workspace');
                popupWindow.appendChild(windowSpace);

                document.body.appendChild(popupWindow);
            }
        );
    };

    this.setHeaderVisualizer = function(header){
        if (typeof header.type === typeof 'a') {
            //Алиас зарегистрированного в гриде визуализатора данных
            header.getVisualizer = function(){
                return this.dataVisualizationComponents[header.type];
            }.bind(this);
        }
        else if (header.type instanceof standardVisualComponents.FlexGridDataVisualizationComponentInterface) {
            // Экземпляр визуализатора данных
            header.getVisualizer = function(){
                return header.type;
            };
        }
        else if (typeof header.type === typeof function(){}) {
            //Метод, решающий по факту, какой визуализатор следует использовать
            header.getVisualizer = function(itemData){
                return header.type.bind(this.pub)(header.id, itemData, header, {...this.config});
            }.bind(this);
        }
        else {
            throw 'Incorrect data visualization component';
        }
    };
    this.setHeaderFilter = function(header){

        if (typeof header.filter === typeof 'a') {
            if (!(header.filter in this.dataFilterComponents)) {
                throw 'Incorrect data filter component';
            }
            //Алиас зарегистрированного в гриде фильтра данных
            header.getFilter = function(){
                return this.dataFilterComponents[header.filter];
            }.bind(this);
        }
        else if (header.filter instanceof filter.FlexGridDataFilterComponentInterface) {
            // Экземпляр фильтра данных
            header.getFilter = function(){
                return header.filter;
            };
        }
        /** Визуализатор для данных учитывает параметры каждой строки. Поэтому там может потребоваться callback,
         * который и решает, как именно визуализировать данные.
         * Форма отображения локальных фильтров никак не зависит от строк данных. ПОэтому здесь callback не нужен.
         * Нужен лишь конкретный компонент
         */

        // else if (typeof header.filter === typeof function(){}) {
        //     //Метод, решающий по факту, какой фильтр следует использовать
        //     header.getFilter = header.filter.bind(this.pub);
        // }
    };


    this.normalizeHeadersStructure = function(headers){
        let leafHeaders = [];
        /**
         * Получим уровень вложенности заголовков
         * 0 - только листовые заголовки
         * 1+ - иерархические заголовки
         */
        let maxDepth = 0;
        let i = 0, l = headers.length;
        let getDepth = function(headerData, currentDepth = 0){
            if (headerData.children && headerData.children.length) {
                let i = 0,
                    l = headerData.children.length,
                    nextDepth = currentDepth + 1
                ;
                while (i < l) {
                    headerData.children[i].parent = headerData;
                    getDepth(headerData.children[i], nextDepth);
                    i++;
                }
            }
            else {
                leafHeaders.push(headerData);
                maxDepth = maxDepth < currentDepth ? currentDepth : maxDepth;
            }
        };

        while (i < l) {
            /**
             * Заголовок верхнего уровня, поэтому принудительно ставим parent = null
             * @type {null}
             */
            headers[i].parent = null;
            getDepth(headers[i]);
            i++;
        }
        /**
         * Получили уровень вложенности заголовков, а также дополнили ссылками на родителя.
         * Теперь дополним заголовки недостающими виртуальными заголовками, чтобы везде был единый уровень вложенности
         */
        i = 0, l = leafHeaders.length;

        let result = [], dict = {};

        let virtualHeadersIndex = 1;

        while (i < l) {
            let leafHeader = leafHeaders[i];
            let p = leafHeader;
            let currentDepth = 0;
            while (currentDepth < maxDepth) {
                if (!p.parent) {
                    p.parent = {
                        id: 'virtual-header-' + (virtualHeadersIndex++),
                        title: '',
                        children: [],
                        isVirtual: true,
                        draggable: leafHeader.system === true ?
                            !!leafHeader.draggable :
                            !!leafHeader.draggable || !!config.draggableColumns,


                    }
                }
                if (!p.parent.children.includes(p)) {
                    p.parent.children.push(p);
                }

                if (!p.draggable) {
                    /**
                     * Если хоть один заголовок из группы не draggable, то и все его роидети тоже не draggable
                     * @type {boolean}
                     */
                    p.parent.draggable = false;
                }
                p = p.parent;

                currentDepth++;
            }
            /**
             * Формируем новую последовательность заголовков
             */
            if (!(p.id in dict)) {
                result.push(p);
                dict[p.id] = p;
            }

            i++;
        }

        return result;


    };

    this.extendsHeaders = function(headers){
        if (this.config.numerable) {
            headers.splice(0, 0, {
                id: 'flexGrid.numerableHeader',
                title: '',
                type: 'numerable',
                width: function(){
                    //Размер колонки зависит от количества элементов в гриде
                    return this.getEnumerableColumnSize() * parseFloat(getComputedStyle(document.documentElement).fontSize);
                }.bind(this),
                isVirtual: false,
                filterable: false,
                sortable: false,
                draggable: false,
                system: true,
                filter: null,
            });
        }
        return headers;
    };

    this.getEnumerableColumnSize = function(){
        return this.data.flat ? (this.data.flat.length + '').length : 1;
    };


    this.createHeaders = function(/**@type {Object[]} */headers){
        let leafHeaders = [];
        let headersDict = {};
        let nodalHeaders = [];
        let orderedLeafHeaders = [];
        let orderedNodalHeaders = [];
        let nodalHeadersDict = {};
        let nodalHeadersDictByLvl = [];
        let leafTreeHeader = undefined;
        let nodalTreeHeader = undefined;
        let config = this.config;
        headers = this.extendsHeaders(headers);
        headers = this.normalizeHeadersStructure(headers);



        let createHeader = function(headerData, parent){
            let header = {
                id: headerData.id,
                title: headerData.title,
                parent: parent || null,//нельзя использовать undefined
                children: [],
                type: headerData.type || 'string',
                width: ('width' in headerData) ? headerData.width : null, //TODO нужно при отсутствии ширины рассчитать ширину пропорционально количеству колонок для листового заголовка, чтобы заголовки не отличались по ширине от ячеек с данными
                leaf: false,
                virtual: !!headerData.isVirtual,
                draggable: headerData.system === true ?
                    !!headerData.draggable :
                    !!headerData.draggable || !!config.draggableColumns,
                system: !!headerData.system,
                filter: false,
            };
            /**
             * Если заголовок виртуальный, то и все его родители тоже
             */
            if (header.virtual) {
                let p = header.parent;
                while (p) {
                    p.virtual = true;
                    p = p.parent;
                }
            }
            /**
             * Общий словарь всех заголовков
             * @type {{parent: null, virtual: boolean, draggable: boolean, children: *[], width: (*|null), id, title, type: string, leaf: boolean}}
             */
            headersDict[header.id] = header;
            if (!headerData.children) {
                /**
                 * Заголовок является листовым
                 */
                leafHeaders.push(header);
                orderedLeafHeaders.push(header);
                header.leaf = true;
                header.virtual = false;
                config.filterable && (header.filter = headerData.filter);
            }
            else {
                /**
                 * Заголовок является узловым
                 * @type {undefined}
                 */
                header.type = undefined;
                header.width = 0;
                for (let i in headerData.children) {
                    header.children.push(createHeader(headerData.children[i], header));
                }
            }

            return header;
        };

        for (let i in headers) {
            createHeader(headers[i]);
        }

        for (let i in leafHeaders) {
            let header = leafHeaders[i];
            this.setHeaderVisualizer(header);
            this.setHeaderFilter(header);
            let depth = 0;
            while (header.parent) {
                header = header.parent;
                if (!nodalHeaders[depth]) {
                    nodalHeaders.push([]);
                    orderedNodalHeaders.push([]);
                    nodalHeadersDictByLvl.push({});
                }
                if (!(header.id in nodalHeadersDictByLvl[depth])) {
                    nodalHeaders[depth].push(header);
                    orderedNodalHeaders[depth].push(header);
                    nodalHeadersDictByLvl[depth][header.id] = header;
                }
                depth++;
            }
        }

        nodalHeaders.reverse();
        orderedNodalHeaders.reverse();
        this.headers.leafHeaders = leafHeaders;
        this.headers.orderedLeafHeaders = orderedLeafHeaders;
        this.headers.dict = headersDict;
        this.headers.nodalHeaders = nodalHeaders;
        this.headers.orderedNodalHeaders = orderedNodalHeaders;

        // if (this.config.numerable) {
        //     this.createNumerableHeaders();
        // }

    };

    this.updatePreview = function (){
        //return;
        this.visualizer.updatePreview();
    };



    this.addVisualizationComponent = function(/** @type {string} */alias, /** @type {standardVisualComponents.FlexGridDataVisualizationComponentInterface} */component){
        if (!(component instanceof standardVisualComponents.FlexGridDataVisualizationComponentInterface)) {
            throw 'Data visualization component must be instance of FlexGridDataVisualizationComponentInterface';
        }

        this.dataVisualizationComponents[alias] = component;
    };

    this.addFilterComponent = function(/** @type {string} */alias, /** @type {filter.FlexGridDataFilterComponentInterface} */component){
        if (!(component instanceof filter.FlexGridDataFilterComponentInterface)) {
            //TODO Подумать о множественном наследовании интерфейсов
            throw 'Data visualization component must be instance of filter.FlexGridDataFilterComponentInterface';
        }

        this.dataFilterComponents[alias] = component;
        Object.defineProperties(
            component,
            {
                Filter: {
                    get: function(){return this.filter;}.bind(this),
                    configurable: false,
                    enumerable: false,
                }
            }
        );
    };

    this.getVisualizationComponent = function(/** @type {string} */alias){
        return this.dataVisualizationComponents[alias] || null;
    };

    this.getFilterComponent = function(/** @type {string} */alias){
        return this.dataFilterComponents[alias] || null;
    };


    this.getId = function(){
        return this.customId &&  typeof this.customId === typeof {} ? {...this.customId} : this.customId;
    };

    this.registerDefaultComponents = function(){
        this.addVisualizationComponent('tree', new standardVisualComponents.TreeVisualizationComponent());
        this.addVisualizationComponent('empty', new standardVisualComponents.EmptyVisualizationComponent());
        this.addVisualizationComponent('text', new standardVisualComponents.TextVisualizationComponent());
        this.addVisualizationComponent('string', new standardVisualComponents.StringVisualizationComponent());
        this.addVisualizationComponent('money', new standardVisualComponents.MoneyVisualizationComponent());
        this.addVisualizationComponent('boolean', new standardVisualComponents.BooleanVisualizationComponent());
        this.addVisualizationComponent('numerable', new standardVisualComponents.NumerableVisualizationComponent());


        this.addFilterComponent('string', new filter.StringFilterComponent());
    };

    this.createGridStorageIntoObject = function(object){
        let storage = Storage.create(object);
        if (!('grids' in storage)) {
            storage.grids = new WeakMap();
        }
        if (!storage.grids.has(this)) {
            storage.grids.set(this, {})
        }

    };

    this.fire = function(
        /**@type {Object} */ sourceObj,
        /**@type {string} */ eventName,
        /**@type {Object|null} */ eventParams
    ){
        let eventRes = EventManager.fire(sourceObj, eventName, eventParams);

        return eventRes instanceof Array ?
            eventRes.reduce((accum, eventResItem) => eventResItem !== false && accum !== false) :
            eventRes;
    }

    this.directSetter = function(value, propName, sourceObj){
        let eventRes;
        let storage = Storage.get(sourceObj);
        let origValue = storage.original[propName];
        let parents = [];
        let i;
        let priv = this;

        if (origValue === value) {
            //Смены родителя фактически не произошло.
            return;
        }

        if (origValue) {
            //Старый родитель
            parents.push({
                parent: origValue,
                properties: [propName],
                eventSubtype: 'removeParent',
            });
        }

        if (value) {
            //Новый родитель
            parents.push({
                parent: value,
                properties: [propName],
                eventSubtype: 'setParent',
            });
            EventManager.subscribe(value, 'beforeChildItemChange', priv.events.beforeChildItemChange, {grid: priv.pub}, {returnResult: true});
            EventManager.subscribe(value, 'childItemChanged', priv.events.childItemChanged, {grid: priv.pub});
        }


        //TODO Здесь можно вообще реализовать отдельные события типа removeChild и addChild, но есть ли смысл и не усложнит ли это понимание алгоритма?


        let eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
        };

        //Здесь идет обработка смены родителя.
        //Обработка изменений других полей будет реализована далее.
        // Генерируем событие накануне изменения текущего элемента
        if (this.fire(sourceObj, 'beforeItemChange', eventParams) === false) {
            return;
        }

        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
            object: sourceObj
        };
        i = -1;
        while (++i < parents.length) {
            let parent = parents[i].parent;
            //Событие накануне изменения родителя дочерним элементом у старого и нового родителя
            /**
             *Т.к. связь реализована непосредственно от дочернего элемента к родителю, то родитель не имеет
             * прямой ссылки на дочерний элемент, поэтому нет возможности определить свойство родителя, в
             * котором произошло изменение. Ставим properties: null
             */

            eventParams.eventSubtype = parents[i].eventSubtype;

            if (this.fire(parent, 'beforeChildItemChange', {child: {...eventParams}, properties: null}) === false) {
                return;
            }
        }

        //TODO Было бы неплохо придумать способ обновлять сущность не отдельными полями, а сначала обновить, потом выполнить события
        // В этом случае пользователь может внести изменения, которые по отдельности запрещены, а вместе допустимы
        // Возможно, надо создавать в этом случае виртуальные сущности и прогонять их через валидации - в случае успеха уже менять реальные сущности
        // Для этого делать обертку над сущностью, в эту обертку в ее собственные поля ставить значения, блокировать их изменение и отдавать на валидацию.


        //Проверки выполнены. Теперь меняем значение свойства
        //Никакого дополнительного конфигурирования значения тут не требуется, реактивность для родителя настраивается отдельно, как для отдельной строки грида,
        // а не вложенного объекта

        Storage.get(sourceObj).original[propName] = value;
        //eventParams генерируем заново, т.к. предыдущий экземпляр мог быть изменен в предыдущем событии
        // TODO Можно также сделать немодифицируемый экземпляр eventParams
        //Значение изменено. Генерируем события
        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
            child: sourceObj
        };
        EventManager.fire(sourceObj, 'itemChanged', eventParams);

        i = -1;
        while (++i < parents.length) {
            let parent = parents[i].parent;
            eventParams.eventSubtype = parents[i].eventSubtype;
            /**
             *Т.к. связь реализована непосредственно от дочернего элемента к родителю, то родитель не имеет
             * прямой ссылки на дочерний элемент, поэтому нет возможности определить свойство родителя, в
             * котором произошло изменение. Ставим properties: null
             */
            EventManager.fire(parent, 'childItemChanged', {child: {...eventParams}, properties: null});
        }

        storage.reactive.parents = storage.reactive.parents.filter(parent => !!parent);

    };

    this.getReverseReferences = function(storage, sourceObj){
        /**
         * Список уникальных родителей, всё еще ссылающихся на настоящий момент на текущий обрабатываемый объект,
         * которых надо известить о событиях
         * @type {Map}
         */
        let parents = new Map();
        let i = -1;
        /*
            Получим parent'ов, которых надо известить об изменениях в текущей сущности
         */
        while (++i < storage.reactive.parents.length) {
            /**
             * @type {ReactiveParentDefinition}
             */
            let parentDefinition = storage.reactive.parents[i];
            let parent = parentDefinition.getParent();
            if (!parent) {
                //Этот parent уже почил
                continue;
            }
            if (!parentDefinition.hasReverseProperties()) {
                //В этом definition'е не определены reverse-связи
                continue;
            }
            /**
             * Список свойств, через которые указанный родитель всё еще ссылается на текущий обрабатываемый объект
             * @type {Set}
             */
            let properties = new Set();
            /**
             * Список свойств, по которым связь с предполагаемым родителем уже отсутствует
             * @type {Set}
             */
            let brokenProperties = new Set();
            let stack;
            for (let propName in parentDefinition.getReverseProperties()) {
                (
                    //Наиболее вероятно, что данный объект является непосредственно дочерним для parent,
                    // но также может быть, что является частью набора дочерних элементов
                    //Поэтому сначала проверяем просто на равенство, а лишь потом проверяем, является ли parent[propName] массивом
                    sourceObj === parent[propName] ||
                    (
                        parent[propName] instanceof Array &&
                        (
                            stack = [...parent[propName]],
                            stack.find(function(item){
                                item instanceof Array &&
                                    item.forEach(sumItem => stack.push(subItem));
                                //TODO По идее достаточно первого совпадения и надо переходить к проверке следующего propName

                                return item === sourceObj;
                            })
                        )
                        //parent[propName].find(item => item === sourceObj)//TODO Иерархия теоретически может иметь более одного уровня вложенности, но скорее всего позволять иерархию глубиной более 1
                    )
                ) ?
                    properties.add(propName):
                    brokenProperties.add(propName)
            }

            if (properties.size) {
                if (parents.has(parent)) {
                    let o = parents.get(parent);
                    properties.forEach(propName => o.properties.set(propName))
                }
                else {
                    parents.set(parent, {parent, properties}); //Текущий изменяемый объект все еще связан с указанным parent'ом через его поля properties
                }
            }

            /**
             * brokenProperties - список полей, по которым сущность уже фактически не связана с указанными родителями.
             * Убираем эти связи.
             */
            brokenProperties.forEach(propName => parentDefinition.deleteReverseProperty(propName))
        }

        return parents;
    }

    this.reverseSetter = function(value, propName, sourceObj){
        let storage = Storage.get(sourceObj);
        let origValue = storage.original[propName];
        let priv = this;
        let stop = false;
        /**
         * Список уникальных родителей, всё еще ссылающихся на настоящий момент на текущий обрабатываемый объект,
         * которых надо известить о событиях
         * @type {Map}
         */
        let parents = this.getReverseReferences(storage, sourceObj);

        for (let directParentField in storage.reactive.directParentFields) {
            let parent = sourceObj[directParentField];
            if (
                !parent ||
                parents.has(parent)
            ) {
                continue;
            }
            //parent не имеет полей, ссылающихся на child, поэтому properties = null
            parents.set(parent, {parent, properties: null});
        }
        /*
            При изменении свойства объекта первая проверка должна производиться в рамках самого объекта.
            Далее, если изменяемый объект является частью других (родительских) объектов, то необходимо
            провести также проверки в рамках этих объектов
         */

        let eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
        };

        if (this.fire(sourceObj, 'beforeItemChange', eventParams) === false) {
            return;
        }

        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
            object: sourceObj
        };

        parents.forEach(function(parent){
            if (stop) return;
            if (priv.fire(parent, 'beforeChildItemChange', {child: {...eventParams}, properties: parent.properties}) === false) {
                stop = true;
            }
        })

        if (stop) return;

        //TODO Было бы неплохо придумать способ обновлять сущность не отдельными полями, а сначала обновить, потом выполнить события
        // В этом случае пользователь может внести изменения, которые по отдельности запрещены, а вместе допустимы
        // Возможно, надо создавать в этом случае виртуальные сущности и прогонять их через валидации - в случае успеха уже менять реальные сущности
        // Для этого делать обертку над сущностью, в эту обертку в ее собственные поля ставить значения, блокировать их изменение и отдавать на валидацию.


        //Проверки выполнены. Теперь меняем значение свойства

        if (value && typeof value === typeof {}) {
            let rdid = new ReactiveDataItemDefinition(value)
                .addParentDefinition(new ReactiveParentDefinition(sourceObj).addField(propName, 'r'));
            
            value instanceof Array ?
                priv.reactiveArray(rdid):
                priv.configureDataItemAsReactive(rdid);

        }
//         if (value && typeof value === typeof {}) {
//            priv.configureDataItemAsReactive(
//                new ReactiveDataItemDefinition(value)
//                    .addParentDefinition(new ReactiveParentDefinition(sourceObj).addField(propName, 'r'))
//
//            );
//
//        }

        Storage.get(sourceObj).original[propName] = value;
        //Значение изменено. Генерируем события
        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
        };
        EventManager.fire(sourceObj, 'itemChanged', eventParams);

        eventParams = {
            origValue,
            newValue: value,
            propertyName: propName,
            object: sourceObj
        }

        parents.forEach(parent => EventManager.fire(parent.parent, 'childItemChanged', {child: {...eventParams}, properties: parent.properties}))

        storage.reactive.parents = storage.reactive.parents.filter(
            (/**@type ReactiveParentDefinition */parent) =>
                parent &&
                !!parent.getParent() &&
                (
                    parent.hasReverseProperties() ||
                    parent.hasDirectProperties()
                )
        );

    };

    this.createGetterCallback = function(propName){

        return this.globalStorage.callbacks.g[propName] ||
        function(){
            //this - это объект данных, а не grid
            return Storage.get(this).original[propName];
        }
    };

    this.createDirectSetterCallback = function(propName){

        let priv = this;
        return function(value){
            //this - это объект данных, а не grid
            priv.directSetter(value, propName, this);
        }
    };

    this.createReverseSetterCallback = function(propName){

        let priv = this;
        return function(value){
            //this - это объект данных, а не grid
            priv.reverseSetter(value, propName, this);
        };
    };
    
    this.reactiveArray = function(/**@type {ReactiveDataItemDefinition} */ reactiveDataItemDefinition){
        
         let priv = this,
            dataItem = reactiveDataItemDefinition.getDataItem(),//Объект данных
            parentDefinitions = reactiveDataItemDefinition.getParentDefinitions(), //Список всех родительских связей
            evConf = {returnResult: true},//Теоретически можно вытащить из этого метода вверх evConf и evExtParams
            evExtParams = {grid: this.pub},//Сделать неизменяемым объект
            reactiveConfig = {enumerable: true},
            arrayMethodName,
            stackArrays = [dataItem],
            stackArraysCounter = -1,
            rdid
        ;
         /**
          * Массивы могут содержать в себе примитивные значения, объекты, вложенные массивы.
          * Проверяем полученный массив. Примитивные значения не конфигурируем никак. 
          * Если пользователь захочет изменить их, ему надо будет воспользоваться методом set, который будет 
          * добавлен массиву, вместо доступа по индексу.  В этом случае массив сможет сгенерировать событие 
          * изменения.
          * Объектные значения отправляем на конфигурацию в configureDataItemAsReactive и конфигурируем
          * таким образом, чтобы если у массива есть родительский объект (не массив, а объект), то события
          * изменения дочерних элементов пробрасывались сразу к ним. Для самого массива состояние элемента
          * не имеет значения - важны лишь порядок, количество.
          * Если вложенные элементы сами являются массивами, мы их также конфигурируем как массивы.
          * Для массива мы конфигурируем методы, которые влияют на состав и порядок элементов. При этом,
          * если у массива есть родительский объект, то его также надо уведомлять об изменениях структуры 
          * массива. При этом 
          */
        while (++stackArraysCounter < stackArrays.length) {
            let arr = stackArrays[stackArraysCounter];
            arr.forEach(function(item){
                if (!item || !(typeof item === 'object')) return;
                (item instanceof Array) ?
                    stackArrays.push(item) :
                    (
                        rdid = new ReactiveDataItemDefinition(item),
                        reactiveDataItemDefinition.getParentDefinitions().forEach((rpd) => rdid.addParentDefinition(rpd)),
                        priv.configureDataItemAsReactive(rdid)
                    ) ;
                
            });
        }
        
        let i = -1;
        while (++stackArraysCounter < stackArrays.length) {
            let arr = stackArrays[stackArraysCounter];
            this.configureArrayAsReactive(arr, reactiveDataItemDefinition.getParentDefinitions() )
        }
    };
    
    this.configureArrayAsReactive = function(/**@type {array} */ dataItem, /**@type {ReactiveParentDefinition[]} */ parentDefinitions){
        //TODO Может еще быть массив массивов
         let priv = this,
            evConf = {returnResult: true},//Теоретически можно вытащить из этого метода вверх evConf и evExtParams
            evExtParams = {grid: this.pub},//Сделать неизменяемым объект
            reactiveConfig = {enumerable: true},
            arrayMethodName
        ;
        
        
        
        this.createGridStorageIntoObject(dataItem);

        let storage = Storage.get(dataItem);

        !('reactive' in storage) && (
            storage.reactive = {
                parents: [], 
                methods: {}
            }
        );

        let commonHandler = function(storage, sourceObj, origValue, index, item, eventSubtype, specHandler, specHandlerArguments){
            /**
             * Список родителей, всё еще ссылающихся на настоящий момент на текущий обрабатываемый массив
             * @type Map
             */
            let parents = priv.getReverseReferences(storage, sourceObj);

            let eventParams = {
                origValue,
                newValue: item,
                index,
                eventSubtype,
            };

            let stop = false;

            parents.forEach(function(parent){
                if (stop) return;

                if (priv.fire(parent, 'beforeChildItemChange', {child: {...eventParams}, properties: parent.properties}) === false) {
                    stop = true;
                }
            });

            if (stop) return;

            let result = specHandler(...arguments);

            parents.forEach(parent => EventManager.fire(parent, 'childItemChanged', {child: {...eventParams}, properties: parent.properties}));

            storage.reactive.parents = storage.reactive.parents.filter(
                (/**@type ReactiveParentDefinition */parent) =>
                    parent &&
                    !!parent.getParent() &&
                    (
                        parent.hasReverseProperties() ||
                        parent.hasDirectProperties()
                    )
            );

            return result;
        };

        arrayMethodName = 'set';
        !(arrayMethodName in storage.reactive.methods) && (
            dataItem[arrayMethodName] = function(item, index){
                let origValue = this.length > index ? this[index] : undefined;
                let sourceObj = this;

                let specHandler = function(){
                    sourceObj[index] = item;
                };

                commonHandler(storage, sourceObj, origValue, index, item, 'set', specHandler, []);
            },
            storage.reactive.methods[arrayMethodName] = true
            
        );

   
        arrayMethodName = 'push';
        !(arrayMethodName in storage.reactive.methods) && (
                dataItem[arrayMethodName] = function(){
                    let index = this.length;
                    let item = arguments[0];
                    let origValue = undefined;
                    let sourceObj = this;

                    let specHandler = function(){
                        Array.prototype.push.apply(sourceObj, arguments);
                    };

                    commonHandler(storage, sourceObj, origValue, index, item, 'push', specHandler, arguments);
                },
                storage.reactive.methods[arrayMethodName] = true
            
        );

        arrayMethodName = 'unshift';
        !(arrayMethodName in storage.reactive.methods) && (
                dataItem[arrayMethodName] = function(){
                    let index = 0;
                    let item = arguments[0];
                    let origValue = undefined;
                    let sourceObj = this;

                    let specHandler = function(){
                        Array.prototype.unshift.apply(sourceObj, arguments);
                    };

                    commonHandler(storage, sourceObj, origValue, index, item, 'unshift', specHandler, arguments);
                },
                storage.reactive.methods[arrayMethodName] = true
            
        );


        arrayMethodName = 'shift';
        !(arrayMethodName in storage.reactive.methods) && (
                dataItem[arrayMethodName] = function(){
                    let index = 0;
                    let item = undefined;
                    let origValue = this[index];
                    let sourceObj = this;

                    let specHandler = function(){
                        return Array.prototype.shift.apply(sourceObj, arguments);
                    };

                    return commonHandler(storage, sourceObj, origValue, index, item, 'shift', specHandler, arguments);
                    
                },
                storage.reactive.methods[arrayMethodName] = true
            
        );


        arrayMethodName = 'pop';
        !(arrayMethodName in storage.reactive.methods) && (
                dataItem[arrayMethodName] = function(){
                    let index = this.length ? (this.length - 1) : 0;
                    let item = undefined;
                    let origValue = this[index];
                    let sourceObj = this;

                    let specHandler = function(){
                        return Array.prototype.pop.apply(sourceObj, arguments);
                    };

                    return commonHandler(storage, sourceObj, origValue, index, item, 'pop', specHandler, arguments);

                },
                storage.reactive.methods[arrayMethodName] = true
            
        );

        arrayMethodName = 'splice';
        !(arrayMethodName in storage.reactive.methods) && (
                dataItem[arrayMethodName] = function(){
                    /**
                     * item - добавляемые элементы
                     */
                    let item = [...arguments];
                    let index = item.splice(0, 2);
                    let origValue = [...this];
                    let sourceObj = this;

                    let specHandler = function(){
                        return Array.prototype.splice.apply(sourceObj, arguments);
                    };

                    return commonHandler(storage, sourceObj, origValue, index, item, 'splice', specHandler, arguments);

                },
                storage.reactive.methods[arrayMethodName] = true

        );

        arrayMethodName = 'delete';
        !(arrayMethodName in storage.reactive.methods) && (
                dataItem[arrayMethodName] = function(index){
                    let item = undefined;
                    let origValue = [...this];
                    let sourceObj = this;

                    let specHandler = function(){
                        return Array.prototype.splice.apply(sourceObj, arguments);
                    };

                    return commonHandler(storage, sourceObj, origValue, index, item, 'splice', specHandler, arguments);

                },
                storage.reactive.methods[arrayMethodName] = true

        );
        /**
         * TODO
         * splice - change original array
         * push - change original array
         * set - change original array, replace [] of original Array
         * map / forEach - doesn't change original array
         * sort - change original array
         * shift - change original array
         * pop - change original array
         * unshift - change original array
         * reverse - change original array
         * fill???
         * delete (index, collapse = true) - удаление элемента со схлопыванием пустого пространства
         * concat - doesn't change original array
         * .length - change original array
         * 
         */

         for (let i in parentDefinitions) {
            /**
             * @type {ReactiveParentDefinition}
             */
            let sourceParentDefinition = parentDefinitions[i];
            // EventManager.subscribe(sourceParentDefinition.getParent(), 'childItemChanged', priv.events.childItemChanged, {grid: this.pub});

            let reactive = storage.reactive;
            /**
             *
             * @type {ReactiveParentDefinition}
             */
            let targetParentDefinition = reactive.parents.find((/**@type {ReactiveParentDefinition} */parentItem) => parentItem.getParent() === sourceParentDefinition.getParent())
            if (!targetParentDefinition) {
                targetParentDefinition = sourceParentDefinition;
                reactive.parents.push(targetParentDefinition);
            }
            else {
                targetParentDefinition.merge(sourceParentDefinition);
            }
        }
    
    };

    this.configureDataItemAsReactive = function(/**@type {ReactiveDataItemDefinition} */ reactiveDataItemDefinition){
        let priv = this,
            dataItem = reactiveDataItemDefinition.getDataItem(),//Объект данных
            parentDefinitions = reactiveDataItemDefinition.getParentDefinitions(), //Список всех родительских связей
            evConf = {returnResult: true},//Теоретически можно вытащить из этого метода вверх evConf и evExtParams
            evExtParams = {grid: this.pub}//Сделать неизменяемым объект
        ;


        /**
         * Одно и то же поле в одной и той же сущности могут попытаться сконфигурировать несколько Grid'ов
         * При этом следует понимать, что фактически вся конфигурация поля состоит из:
         * - callback'а, который хранит наименование поля и ссылку на метод Grid'а
         * - хранилище параметров, в котором хранятся непосредственно прочие параметры (флаги, ссылки на родителей, значения полей и т.д.)
         *
         * Поэтому, если поле сконфигурировано должным образом, то следующие Grid'ы могут лишь добавить необходимые параметры.
         * Callback при этом не меняется. Исключение составляет случай, когда поле сущности становится прямой ссылкой
         * на родителя - в этом случае setter-callback заменяется на соответствующий.
         *
         * Callback'и устроены таким образом, что для свойства создается функция, в области видимости которой записано
         * наименование свойства. Эта функция устанавливается как callback во все объекты, где встречается указанное свойство.
         * Таким образом не создается для каждого нового объекта для каждого свойства новый экземпляр функции, а используется
         * единственный. This устанавливается при вызове.
         */

        this.createGridStorageIntoObject(dataItem);

        /**
         * Здесь может быть как реальных dataItem, так и вложенный объект, который в свою очередь также может быть в т.ч. и dataItem
         */
        EventManager.subscribe(dataItem, 'beforeItemChange', this.events.beforeItemChange, evExtParams, evConf);
        EventManager.subscribe(dataItem, 'beforeChildItemChange', this.events.beforeChildItemChange, evExtParams, evConf);
        EventManager.subscribe(dataItem, 'itemChanged', this.events.itemChanged, evExtParams);
        EventManager.subscribe(dataItem, 'childItemChanged', this.events.childItemChanged, {grid: this.pub});


        let storage = Storage.get(dataItem);
        //Параметры реактивности
        //storage.original - Хранилище значений
        //storage.reactive.parents - Список родителей для текущего объекта
        //storage.reactive.directParentFields - Список полей, хранящих прямые ссылки из объекта на его родителя child.parentField = parent
        //storage.reactive.fields - Список сконфигурированных реактивных полей объекта
        !('reactive' in storage) && (
            storage.reactive = {
                    parents: [], 
                    directParentFields: {},
                    fields: {}
                },
                storage.original = {}
        );

        for (let propName in this.directParentFields) {
            //TODO Надо сгенерировать единственный объект, т.к. для грида список полей,способных содержать прямые ссылки на родителя, единый
            // но у разных гридов могут быть разные поля
            storage.reactive.directParentFields[propName] = true;
        }

        let reactiveConfig = {enumerable: true};

        //TODO Продумать возможность добавления пользователем в сущность новых реактивных полей

        /**
         * Эти свойства являются прямой ссылкой из дочернего элемента к родителю.
         * Изменение значения этих свойств приводят к смене родителя у дочернего элемента
         */
        for (let propName in this.directParentFields) {
            if (!(propName in dataItem)) {
                continue;
            }
            !(propName in storage.reactive.fields) && (storage.reactive.fields[propName] = {});
            if (
                storage.reactive.fields[propName].type === 1 //1 = direct
            ) {
                //Это свойство уже сконфигурировано должным образом
                continue;
            }

            storage.reactive.fields[propName].type = 1;//1 = direct

            //Запоминаем оригинальное значение
            storage.original[propName] = dataItem[propName];
            !(propName in priv.globalStorage.callbacks.ds) &&
            (
                //Свойство с таким наименованием еще не конфигурировалось как direct
                //При этом высока вероятность, что Getter для него тоже еще не создавался, т.к. вероятность
                // одновременного использования свойства как direct и reverse не очень высока

                //Такой подход позволяет сократить число проверок существования callback'ов для propName
                priv.globalStorage.callbacks.g[propName] = priv.createGetterCallback(propName),
                priv.globalStorage.callbacks.ds[propName] = priv.createDirectSetterCallback(propName)
            );
            //По умолчанию родитель не должен извещать потомков о своем изменении, но при необходимости можно это событие сгенерировать
            // Например, смета может передать фрагментам свой номер

            //Здесь уже точно существуют необходимые callback'и для propName, поэтому не проверяем их наличие
            reactiveConfig.get = priv.globalStorage.callbacks.g[propName];

            reactiveConfig.set = priv.globalStorage.callbacks.ds[propName];

            Object.defineProperty(dataItem, propName, reactiveConfig);
        }

        for (let propName in dataItem) {
            if (propName in storage.reactive.fields ) {
                //Это свойство уже сконфигурировано
                continue;
            }

            let v = dataItem[propName];
            //Запоминаем оригинальное значение
            storage.original[propName] = v;
            storage.reactive.fields[propName] = {
                type: 0// 0 = 'reverse'
            };
            //Если значение является объектом или набором объектов, делаем их также реактивными
            if (v && typeof {} === typeof v) {
                //Все элементы массива находятся в одних и тех же свойствах родителя, что и сам массив. 
                //Поэтому им можно единый ReactiveParentDefinition прописать
                let rpd  = new ReactiveParentDefinition(dataItem).addField(propName, 'r')
                //TODO Сделать реактивными массивы. Массивы могут включать как реактивные элементы, так и примитивные значения
                v instanceof Array ?
                    this.reactiveArray(
                        new ReactiveDataItemDefinition(v)
                            .addParentDefinition(rpd)
                    ):
//                    (
////                            rpd = new ReactiveParentDefinition(dataItem).addField(propName, 'r'),
//                    
//                            v.forEach(function(itemArray){
//                                return itemArray && typeof {} === typeof itemArray ?
//                                    (
//                                        
//                                        this.configureDataItemAsReactive(
//                                            new ReactiveDataItemDefinition(itemArray)
//                                                .addParentDefinition(rpd)
//                                        )
//                                    ):
//                                    itemArray;
//                            }.bind(this))
//                    ) :
                    this.configureDataItemAsReactive(
                        new ReactiveDataItemDefinition(v)
                            .addParentDefinition(rpd)
                    );
            }

            !(propName in priv.globalStorage.callbacks.rs) &&
            (
                priv.globalStorage.callbacks.g[propName] = priv.createGetterCallback(propName),
                priv.globalStorage.callbacks.rs[propName] = priv.createReverseSetterCallback(propName)
            );
            reactiveConfig.get = priv.globalStorage.callbacks.g[propName];

            reactiveConfig.set = priv.globalStorage.callbacks.rs[propName];
            //Конфигурирование выполняем сразу, не накапливаем. Таким образом нам не надо создавать временное хранилище для набора конфигураций
            Object.defineProperty(dataItem, propName, reactiveConfig);
        }

        for (let i in parentDefinitions) {
            /**
             * @type {ReactiveParentDefinition}
             */
            let sourceParentDefinition = parentDefinitions[i];
            // EventManager.subscribe(sourceParentDefinition.getParent(), 'childItemChanged', priv.events.childItemChanged, {grid: this.pub});

            let reactive = storage.reactive;
            /**
             *
             * @type {ReactiveParentDefinition}
             */
            let targetParentDefinition = reactive.parents.find((/**@type {ReactiveParentDefinition} */parentItem) => parentItem.getParent() === sourceParentDefinition.getParent())
            if (!targetParentDefinition) {
                targetParentDefinition = sourceParentDefinition;
                reactive.parents.push(targetParentDefinition);
            }
            else {
                targetParentDefinition.merge(sourceParentDefinition);
            }
        }
    }

    //Методы установлены, начинаем конфигурирование

    this.setConfig(config);

    this.configureEvents();
};


function TreeGrid(config){
    config = config && typeof config === typeof {} ?
        {...config} :
        {}
    ;


    let priv = new abstractFlexGrid(config);



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
};

TreeGrid.prototype = new TreeGridInterface();


function FlatGrid(config) {
    config = config && typeof config === typeof {} ?
        {...config} :
        {}
    ;
    //У плоской таблицы нет понятия parent для сущностей
    config.entityParentField = null;

    let priv = new abstractFlexGrid(config);
    priv.pub = this;

    priv.prepareData = function(data){
        let {gridElements, objectsDict} = this.createGridElements(data);

        this.data.flat = this.data.current = DataSetManager.createFlatDataSet(priv);
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
};

FlatGrid.prototype = new FlatGridInterface();

const GridManager = {
    createFlatGrid: (config) => new FlatGrid(config),
    createTreeGrid: (config) => new TreeGrid(config),
};

export let FlexGrid = Object.defineProperties(
    Object.create(null),
    {
        GridManager: {
            get: () => GridManager,
            configurable: false,
            enumerable: false,
        },
        getDefaultConfig: {
            get: () => FlexGridDefaultConfig,
            configurable: false,
            enumerable: false,
        },
        FlexGridDataVisualizationComponentInterface: {
            get: () => standardVisualComponents.FlexGridDataVisualizationComponentInterface,
            configurable: false,
            enumerable: false,
        },
        FlexGridDataFilterComponentInterface: {
            get: () => filter.FlexGridDataFilterComponentInterface,
            configurable: false,
            enumerable: false,
        },
        FlexGridInterface: {
            get: () => FlexGridInterface,
            configurable: false,
            enumerable: false,
        },
        TreeGridInterface: {
            get: () => TreeGridInterface,
            configurable: false,
            enumerable: false,
        },
        FlatGridInterface: {
            get: () => FlatGridInterface,
            configurable: false,
            enumerable: false,
        },
        StringVisualizationComponent: {
            get: () => standardVisualComponents.StringVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        TextVisualizationComponent: {
            get: () => standardVisualComponents.TextVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        EmptyVisualizationComponent: {
            get: () => standardVisualComponents.EmptyVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        MoneyVisualizationComponent: {
            get: () => standardVisualComponents.MoneyVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        TreeVisualizationComponent: {
            get: () => standardVisualComponents.TreeVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        BooleanVisualizationComponent: {
            get: () => standardVisualComponents.BooleanVisualizationComponent,
            configurable: false,
            enumerable: false,
        },
        StringFilterComponent: {
            get: () => filter.StringFilterComponent,
            configurable: false,
            enumerable: false,
        },
        ClassModel: {
            get: () => ClassModel,
            configurable: false,
            enumerable: false,
        },
        DataProviderInterface: {
            get: () => function(){
                this.getData = function(/**@type {function} */dataAcceptor){throw 'Method getData not implemented'};
                this.getHeaders = function(/**@type {function} */headersAcceptor){throw 'Method getData not implemented'};
                this.getEntity = function(/**@type {function} */headersAcceptor, /**@type {string}*/entityId,/**@type {string}*/entityClass){throw 'Method getData not implemented'};

            },
            configurable: false,
            enumerable: false,
        }
    }
);


function ReactiveParentDefinition(/**@type {Object} */parent)
{
    let priv = {
        properties: {
            d: {},
            r: {}
        },
        //В случае с прямыми ссылками значение parent извлекается не из этого поля, а из поля редактируемой сущности.
        //Поэтому тут вполне может быть null
        parent: parent ? new WeakRef(parent) : null,
    };

    this.getParent = () => priv.parent ? priv.parent.deref() : null;
    /**
     * Тип ссылки на родителя:
     * - d - direct - прямая ссылка, т.е. дочерний элемент содержит ссылку на родителя (child.parentField = parent).
     *          При этом родитель может не иметь ссылки на дочерний элемент
     * - r - reverse - обратная ссылка, т.е. родитель содержит ссылку на дочерний элемент, но дочерний элемент не имеет ссылки на родителя (parent.someProp = {childProp1: childVal1, ...})
     */
    this.addField = function(/**@type {string} */ propName, /**@type {string} */type = 'd') {
        priv.properties[type][propName] = true;

        return this;
    }

    this.merge = function(/**@type {ReactiveParentDefinition} */ source){
        for (let propName in source.getDirectProperties()) {
            priv.properties.d[propName] = true;
        }
        for (let propName in source.getReverseProperties()) {
            priv.properties.r[propName] = true;
        }
    }

    this.getDirectProperties = () => priv.properties.d;
    this.getReverseProperties = () => priv.properties.r;
    this.hasDirectProperties = () => {for (let propName in priv.properties.d) {return true;} return false;};
    this.hasReverseProperties = () => {for (let propName in priv.properties.r) {return true;} return false;};
    this.deleteReverseProperty = function (/** @type {string} */ propName)
    {
        delete priv.properties.r[propName];

        return this;
    }
    this.deleteDirectProperty = function (/** @type {string} */ propName)
    {
        delete priv.properties.d[propName];

        return this;
    }


}

function ReactiveDataItemDefinition(/**@type {Object} */dataItem)
{
    let priv = {
        dataItem,
        parentDefinitions: [],
    };

    this.getDataItem = () => priv.dataItem;
    this.getParentDefinitions = () => priv.parentDefinitions;
    this.addParentDefinition = function( /**@type {ReactiveParentDefinition} */parentDefinition){
        let existsDefinition = priv.parentDefinitions.find((/**@type {ReactiveParentDefinition} */ source) => source.getParent() === parentDefinition.getParent());
        existsDefinition ?
            existsDefinition.merge(parentDefinition) :
            priv.parentDefinitions.push(parentDefinition);
        return this;
    }
}
