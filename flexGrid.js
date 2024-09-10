"use strict";

import './dragger.js';
import { DefaultVisualizer, Scroller } from "./flexGridVisualizer.js";

import {FlatDataSet, TreeDataSet} from './dataSet.js'
import * as standardVisualComponents from './visualComponents.js'
import * as filter from './filter.js'
import {GridElement} from "./gridElement.js";

export { DefaultVisualizer, FlexPanel } from "./flexGridVisualizer.js";


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
        _dataProcessor: 'Пользовательский компонент загрузки данных. Должен реализовывать интерфейс FlexGrid.DataLoaderInterface',
        dataProcessor: null,
    };
}

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
    /**@type {pubFlexGrid} */
    this.pub = undefined;

    this.filter = new filter.Filter(this);
    //DataSet'ы
    this.data = {
        //Плоский упорядоченный набор GridElement'ов - начальное состояние данных
        /**
         * @type TreeDataSet|FlatDataSet
         */
        flat: undefined,
        // //Словарь объектов
        // objectsDict: undefined,
        //Дерево
        //tree: undefined,
        //Пользовательская сортировка данных
        sorted: undefined,
        /**
         * Use this.setDataSet() to assigning dataSet !!!!
         */
        //Визуализируемый набор данных
        /**
         * @type TreeDataSet|FlatDataSet
         */
        current: undefined
    };

    this.config = {};

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

    this.dataProcessor = undefined;


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
                let visualizer = header.getVisualizer(headerId, item, header);
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
        pluginIds[r] = true;// true instead of this to avoid memory leak
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
            !config.dataProcessor ||
            !(config.dataProcessor instanceof FlexGrid.DataProcessorInterface)
        ) {
            errors.push('Incorrect data processor');
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
            this.customId = config.id
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

        this.visualizer = config.visualizer || new DefaultVisualizer();
        this.visualizer.setContainer(config.container);
        this.visualizer.setCallbacks(
            {
                getItemsCount: this.visualizerCallbacks.getItemsCount.bind(this),
                getElement: this.visualizerCallbacks.getElement.bind(this),
            }
        );

        delete config.visualizer;

        this.dataProcessor = config.dataProcessor;
        delete config.dataProcessor;

        this.config = config;
    };


    this.loadData = function(source){
        throw 'Method \'loadData\' is not implemented for specific flexGrid';
        //after data loading it's need to call the method called 'prepareData'
    };

    this.prepareData = function(data){
        throw 'Method \'prepareData\' is not implemented for specific flexGrid';
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
        //TODO async await
        let headersProcessingPromise = new Promise(
            function(resolve, reject){
                let headersAcceptor = function(headers){
                    this.createHeaders(headers);
                    resolve();
                }.bind(this);
                this.dataProcessor.getHeaders(headersAcceptor);
            }.bind(this)
        );
        let dataProcessingPromise = new Promise(
            function(resolve, reject){
                let dataAcceptor = function(data){
                    this.prepareData(data);
                    resolve();
                }.bind(this);
                this.dataProcessor.getData(dataAcceptor);
            }.bind(this)
        );

        Promise.all(
            [
                headersProcessingPromise,
                dataProcessingPromise
            ]
        ).then(
            function(){
                this.visualizer.setHeaders(this.headers.orderedLeafHeaders);

                this.visualizer.init(
                    {
                        scrollSensitivity: this.config.scrollSensitivity ?? Scroller.getDefaultConfig().scrollSensitivity,
                        scrollStepSize: this.config.scrollStepSize ?? Scroller.getDefaultConfig().scrollStepSize,
                    }
                );
            }.bind(this)
        )




        //TODO
        // анимация CSS https://doka.guide/css/animation/
        // реализовать promises - загрузка заголовков и данных, инициализация визуализатора

        //TODO В случае загрузки с сервера нужно запускать визуализацию данных только после получения данных




        let tableHeader = document.createElement('div');
        tableHeader.innerHTML = 'Test Tree Flex Grid';
        tableHeader.style.textAlign = 'center';
        tableHeader.style.width = '100%';
        tableHeader.style.marginBottom = '10px';
        this.visualizer.TopPanel.addItem(
            'tHeader',
            tableHeader

        )

        this.initOptionPanels();


        // this.setReactiveData();


    };

    // this.setReactiveData = function(){
    //     let t = (new Date()).getTime();
    //     let gridElements = this.data.flat;
    //     let grid = this;
    //     let headers = this.headers.orderedLeafHeaders;
    //     headers = headers.filter(
    //         function(header){ return !header.system}
    //     );
    //     let i = 0, l = gridElements.length, hl = headers.length;
    //     while (i < l) {
    //         let gridElement = gridElements[i++];
    //         let dataItem = gridElement.getData();
    //         let config = {};
    //         let x = 0;
    //         while (x < hl) {
    //             header = headers[x++];
    //             //скорее всего тут просто берем и все свойства объекта данных переделываем на getters/setters
    //             //TODO Колонка в сущности может отсутствовать явно, но иметь всё же какую-то визуализацию
    //             // в этом случае скорее всего надо на вспомогательные поля тоже вешать свои обработчики change
    //             if (header.id in dataItem) {
    //                 let propName = '_' + header.id;
    //                 dataItem[propName] = dataItem[header.id];
    //                 config[header.id] = {
    //                     // get: function(value){
    //                     //
    //                     //     return this[propName];
    //                     //
    //                     // },
    //                     // set: function(value){
    //                     //
    //                     //     this[propName] = value;
    //                     //     gridElement.updateCell(propName);
    //                     //
    //                     // },
    //                     get: (function(propName){
    //                         return function(value){
    //
    //                             return this[propName];
    //
    //                         };
    //                     })(propName),
    //                     set: (function(propName, gridElement, hId){
    //                         return function(value){
    //
    //                             this[propName] = value;
    //                             gridElement.updateCell(hId);
    //
    //                         };
    //                     })(propName, gridElement, header.id),
    //                     enumerable: true,
    //                     configurable: false,
    //                 }
    //
    //             }
    //         }
    //         Object.defineProperties(dataItem, config);
    //     }
    //
    //     window.gridData = gridElements;
    //
    //     gridElements[0].setData('number', '123, 456')
    //     console.log('reactiveData time ', ((new Date()).getTime() - t));
    //
    // };

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



    };

    //this.setReactive

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
            header.getVisualizer = header.type.bind(this.pub);
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
                    return (this.data.flat.length + '').length * parseFloat(getComputedStyle(document.documentElement).fontSize);
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


    this.createHeaders = function(headers){
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
        this.visualizer.updatePreview();
    };
    //Методы установлены, начинаем конфигурирование

    this.setConfig(config);
};

function pubFlexGrid(/**@type {abstractFlexGrid} */priv) {

    this.build = function(){

        priv.init();
    };

    this.addVisualizationComponent = function(/** @type {string} */alias, /** @type {standardVisualComponents.FlexGridDataVisualizationComponentInterface} */component){
        if (!(component instanceof standardVisualComponents.FlexGridDataVisualizationComponentInterface)) {
            throw 'Data visualization component must be instance of FlexGridDataVisualizationComponentInterface';
        }

        priv.dataVisualizationComponents[alias] = component;
    };

    this.addFilterComponent = function(/** @type {string} */alias, /** @type {filter.FlexGridDataFilterComponentInterface} */component){
        if (!(component instanceof filter.FlexGridDataFilterComponentInterface)) {
            throw 'Data visualization component must be instance of filter.FlexGridDataFilterComponentInterface';
        }

        this.dataFilterComponents[alias] = component;
        Object.defineProperties(
            component,
            {
                Filter: {
                    get: function(){return this.filter;}.bind(priv),
                    configurable: false,
                    enumerable: false,
                }
            }
        );
    }.bind(priv);

    this.getVisualizationComponent = function(/** @type {string} */alias){
        return priv.dataVisualizationComponents[alias] || null;
    };

    this.getFilterComponent = function(/** @type {string} */alias){
        return priv.dataFilterComponents[alias] || null;
    };

    this.updatePreview = function(){
        priv.updatePreview();
    };

    this.destroy = function(){
        throw 'Method \'destroy\' is not implemented for flexGrid';

    };

    this.getId = function(){
        return priv.customId &&  typeof priv.customId === typeof {} ? {...priv.customId} : priv.customId;
    };


    this.addVisualizationComponent('tree', new standardVisualComponents.TreeVisualizationComponent());
    this.addVisualizationComponent('empty', new standardVisualComponents.EmptyVisualizationComponent());
    this.addVisualizationComponent('text', new standardVisualComponents.TextVisualizationComponent());
    this.addVisualizationComponent('string', new standardVisualComponents.StringVisualizationComponent());
    this.addVisualizationComponent('money', new standardVisualComponents.MoneyVisualizationComponent());
    this.addVisualizationComponent('boolean', new standardVisualComponents.BooleanVisualizationComponent());
    this.addVisualizationComponent('numerable', new standardVisualComponents.NumerableVisualizationComponent());


    this.addFilterComponent('string', new filter.StringFilterComponent());


};

function TreeGrid(config){

    let priv = new abstractFlexGrid(config);
    let pub = new pubFlexGrid(priv);
    priv.pub = pub;

    let setGridElementHtmlHandlers = priv.setGridElementHtmlHandlers.bind(priv);
    priv.setGridElementHtmlHandlers = function(/** @type {GridElement} */ gridElement){
        gridElement.DOM.cells['flexGrid.treeHeader'].addEventListener('click', function(e){
            if (!Array.isArray(gridElement.children) || !gridElement.children.length) {
                return;
            }
            e.preventDefault();
            e.cancelBubble = true;
            gridElement.expand(priv.data.current.id, !gridElement.expanded(priv.data.current.id));
            if (gridElement.expanded(priv.data.current.id)) {
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
                while (childGridElement = stack[i]) {
                    i++;
                    if(childGridElement.expanded(priv.data.current.id)) {
                        childGridElement.children.map((childChildGridElement) => stack.push(childChildGridElement));
                        childGridElement.expand(priv.data.current.id, !childGridElement.expanded(priv.data.current.id));
                    }
                    collapsedItems.push(childGridElement);
                }
                this.data.current.hide(collapsedItems);

            }
            // } else {
            //     let stack = [];
            //     gridElement.children.map(function(childGridElement){
            //         stack.push(childGridElement);
            //     });
            //
            //     let collapsedIndexes = [];
            //     let i = 0;
            //     let childGridElement = undefined;
            //     while (childGridElement = stack[i]) {
            //         i++;
            //         childGridElement/**gridElement*/.children.map(function(childGridElement){
            //             if(childGridElement.expanded(priv.data.current.id)) {
            //
            //                 stack.push(childGridElement);
            //             }
            //         });
            //         collapsedIndexes.push(childGridElement[this.data.current.id].index);
            //     }
            //     this.data.current.remove(collapsedIndexes);
            //
            // }

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
        let gridElement = undefined;
        let gridElements = [];
        let gridElementsDict = {};
        let objectsDict = {};
        let c = data.length;
        let ecf = this.config.entityClassField;
        let eif = this.config.entityIdField;
        let epf = this.config.entityParentField;
        /**
         * Создаем GridElement'ы
         */
        for (let i = 0; i < c; i++) {
            let entityData = data[i];
            let entityClass = entityData[ecf];
            let entityId = entityData[eif];

            //TODO Возможно, следует сделать проход и собрать просто отдельно классы сущностей, а затем по полученному набору создать в словарях вложенные объекты
            !(entityClass in objectsDict) && (objectsDict[entityClass] = {}, gridElementsDict[entityClass] = {});

            objectsDict[entityClass][entityId] = entityData;
            gridElement = new GridElement(this.config, this, pub);
            gridElement.initData(entityData);

            gridElementsDict[entityClass][entityId] = gridElement;
            gridElements.push(gridElement)
        }

        /**
         * Устанавливаем parent-child связи
         */
        for (let i = 0; i < c; i++) {
            let entityData = data[i];
            if (entityData[epf]) {
                let entityClass = entityData[ecf];
                let entityId = entityData[eif];
                let parentEntityData = entityData[epf];
                let gridElement = gridElementsDict[entityClass][entityId];
                let parentEntityClass = parentEntityData[ecf];
                let parentEntityId = parentEntityData[eif];
                let parentEntity = objectsDict[parentEntityClass][parentEntityId];
                let parentGridElement = gridElementsDict[parentEntityClass][parentEntityId];
                for (let key in parentEntityData) {
                    /**
                     * Если внутри object.parent указаны какие-то дополнительные данные помимо entityId и entityClass, доавляем
                     * их в родителя
                     */
                    parentEntity[key] = parentEntityData[key];
                }
                /**
                 * устанавливаем связь с реальным объектом-родителем
                 */
                entityData[epf] = parentEntity;
                parentEntity.children = parentEntity.children || [];
                parentEntity.children.push(entityData);
                gridElement.setParent(parentGridElement);
            }

        }
        /**
         * Базовое древовидное представление данных для грида
         * @type {pubDataSet}
         */
        this.data.current = new TreeDataSet(priv);
        this.data.current.initData(gridElements);
        /**
         * Все данные грида
         * @type {pubDataSet}
         */
        this.data.flat = new FlatDataSet(priv);
        this.data.flat.initData(gridElements);

    };

    return pub;
};


function FlatGrid(config) {
    let priv = new abstractFlexGrid(config);
    let pub = new pubFlexGrid(priv);
    priv.pub = pub;

    priv.initData = function(){
        throw 'Method \'initData\' is not implemented for FLAT flexGrid';
        if (typeof this.config.data === typeof 'aaa') {
            /**
             * Загрузка данных с сервера
             */
        }
        else if (Array.isArray(this.config.data)) {
            /**
             * Это плоский массив данных
             */
            let data = [];

            let i = 0;

            while (i < this.config.data.length) {
                let gridElement = new GridElement(this.config, this);
                gridElement.initData(this.config.data[i]);
                data.push(gridElement)
                i++;
            }
            //this.config.data = data;
            this.data.flat = data;


        }
    };

    priv.prepareData = function(data){
        let gridElement = undefined;
        let gridElements = [];
        let gridElementsDict = {};
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
            !(entityClass in objectsDict) && (objectsDict[entityClass] = {}, gridElementsDict[entityClass] = {});

            objectsDict[entityClass][entityId] = entityData;
            gridElement = new GridElement(this.config, this);
            gridElement.initData(entityData);

            gridElementsDict[entityClass][entityId] = gridElement;
            gridElements.push(gridElement)
        }


        this.data.flat = this.data.current = new FlatDataSet(priv);
        this.data.flat.initData(gridElements);

    };

    return pub;
};

export let FlexGrid = Object.defineProperties(
    Object.create(null),
    {
        TreeGrid: {
            get: () => TreeGrid,
            configurable: false,
            enumerable: false,
        },
        FlatGrid: {
            get: () =>  FlatGrid,
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
        DataProcessorInterface: {
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


