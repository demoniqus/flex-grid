import * as filter from "../filter/filter.js";
import {Dragger} from "../dragger/dragger.js";
import {ClassModel} from "./classModel.js";
import {FlexGridEventsModel} from "./flexGridEventsModel.js";
import {GridElement} from "../gridElement/gridElement.js";
import {Storage} from "../storage/storage.js";
import {Scroller} from "../scroller/scroller.js";
import * as standardVisualComponents from "../visualization/visualComponents.js";
import {EventManager} from "../event/eventManager.js";
import {DataProviderInterface} from "./dataProviderInterface.js";
import {FlexGridDefaultConfig} from "./flexGridDefaultConfig.js";
import {DefaultVisualizer} from "../visualization/flexGridVisualizer.js";
import {StylesManager} from "../styles/stylesManager.js";
import {Reactivator} from "../react/reactivator.js";

let pluginIds = {};



function AbstractFlexGrid (config){
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
        //Отображаемый набор данных
        /**
         * @type DataSetInterface
         */
        current: undefined
    };

    this.events = {};

    this.config = {};

    this.metadata = undefined;

    this.stylesManager = undefined

    this.visualizer = undefined;

    this.dataVisualizationComponents = {
        // Набор визуализаторов данных
    };
    this.dataFilterComponents = {
        // Набор фильтров данных
    };

    this.dataProvider = undefined;

    this.reactivator = null;

    this.createStylesManager = function() {
        this.stylesManager = new StylesManager(
            {
                baseId: this.id
            }
        );
    };

    this.getStyleContext = function(){
        return '.' + this.id + ' ';
    };

    this.setDefaultStyles = function(){
        this.stylesManager.setStyle(
            '.flex-grid-tree-cell',
            '--tree-lvl-padding: ' + this.config.treeLvlPadding + 'px;',
            null,
            this.getStyleContext()
        );
        for (let i = 1; i <= config.treeMaxVisualDepth; i++) {
            this.stylesManager.setStyle(
                '.flex-grid-tree-cell.enclosure-' + i,
                'padding-left: calc(var(--tree-lvl-padding) * ' + i + ');',
                null,
                this.getStyleContext()
            );
        }
        this.stylesManager.setStyle(
            '.flex-grid-tree-cell.enclosure-exceed',
            'padding-left: calc(var(--tree-lvl-padding) * ' + config.treeMaxVisualDepth + ');',
            null,
            this.getStyleContext()
        );

        this.stylesManager.update()
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
            Dragger
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

    this.identifyContainer = function(){
        /**
         * Устанавливаем уникальный класс для привязки индивидуальных стилей конкретного грида
         */
        this.config.container.classList.add(this.id);
    }

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
            !(config.dataProvider instanceof DataProviderInterface)
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
        config = {...config}//TODO Конфиг копируется в публичной части. Здесь копирование может быть уже избыточным
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

        config.treeMaxVisualDepth ||= FlexGridDefaultConfig().treeMaxVisualDepth;
        config.treeLvlPadding ||= FlexGridDefaultConfig().treeLvlPadding;
        config.events ||= {};


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

    this.getContainer = function() {
        return this.visualizer.getContainer();
    }

    this.configureEvents = function(){
        let gridEventsModel = new FlexGridEventsModel();
        for (let eventName in gridEventsModel) {
            //TODO Возможно, стоит события также через EventManager настроить
            this.events[eventName] = gridEventsModel[eventName].bind(this);
        }

        return this;
    };

    this.createDefaultMetadata = function(){
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
        this.identifyContainer();
        this.createStylesManager();
        this.setDefaultStyles()

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
                        !metadata && (metadata = this.createDefaultMetadata());
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
                    this.createDefaultMetadata().tableName;
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

        this.reactivator = new Reactivator(
            {
                entityParentFields: this.config.entityParentField,
                events: {
                    beforeItemChange: {
                        callback: this.events.beforeItemChange,
                        evExtParams: {grid: this.pub},
                        evConf: {returnResult: true}
                    },
                    beforeChildItemChange: {
                        callback: this.events.beforeChildItemChange,
                        evExtParams: {grid: this.pub},
                        evConf: {returnResult: true}
                    },
                    itemChanged: {
                        callback: this.events.itemChanged,
                        evExtParams: {grid: this.pub}
                    },
                    childItemChange: {
                        callback: this.events.childItemChange,
                        evExtParams: {grid: this.pub}
                    }
                },
                beforeEntityReactivation: function(dataItem){this.createGridStorageIntoObject(dataItem);}.bind(this),

            }
        )

        let t = (new Date()).getTime();
        let gridElements = this.data.flat.getData();

        let
            i = -1,
            l = gridElements.length
        ;

        while (++i < l) {
            //Элемент грида
            let gridElement = gridElements[i];
            //Элемент данных
            let dataItem = gridElement.getData();

            this.reactivator.reactivate(dataItem);

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

    //Методы установлены, начинаем конфигурирование

    this.setConfig(config);

    this.configureEvents();
}

export {AbstractFlexGrid}
