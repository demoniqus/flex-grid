(function(){
    let pluginIds = {};
    window.FlexGrid = Object.defineProperties(
        Object.create(null),
        {
            TreeGrid: {
                get: function () {return TreeGrid;},
                configurable: false,
                enumerable: false,
            },
            FlatGrid: {
                get: function () {return FlatGrid;},
                configurable: false,
                enumerable: false,
            }
        }
    );
    function abstractFlexGrid (){
        /**
         * TODO
         * 1. Продумать зависимость дочерный-родительский(-е) гриды
         * 2. Возможно, следует заменить array.splice на использование циклов для повышения быстродействия
         * 3. Устранить утечки памяти: создаем в функции DOM-элемент и устанавливаем на него обработчики событий. При этом
         *      данные обработчики помнят могут хранить значение всех временных переменных, определенных при создании
         *      этих обработчиков, что и может стать утечкой памяти.
         * 4. Заменить undefined на null для возможности сравнения двух пустых значений ( а может и не надо)
         * 5. Колонки "Номер строки" и "Дерево" должны при запросе элементов через getElement-callbsack изменять свою ширину:
         * - "Номер строки" - в зависимости от длины номера
         * - "Дерево" - в зависимости от максимальной глубины запрошенного элемента
         * При этом также надо регулировать ширину их родительских агрегирующих заголовков
         * 6. Возможно, что "Номер строки" должен браться не из набора видимых элементов, а из полного набора данных текущего dataSet,
         * поскольку функция "Перейти к строке..." явно будет обращаться к общему набору данных
         *
         */

        this.id = null;
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

        this.pub = undefined;

        this.filter = new Filter(this);
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

        this.activeRow = undefined;

        this.draggedRow = undefined;


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

        this.visualizer = new DefaultVisualizer();
        
        this.dataVisualizationComponents = {
            // Набор визуализаторов данных
        };
        this.dataFilterComponents = {
            // Набор фильтров данных
        };
        this.setGridElementHtmlHandlers = function(/** @type {GridElement} */ gridElement){
            let grid = this;

            gridElement.DOM.row.addEventListener('contextmenu', function(e){
                console.log(e);
                console.log(this);
            });

            if (this.config.draggableRows === true || this.config.draggableRows === 1) {
                //TODO переделать на dragger
                gridElement.DOM.row.setAttribute('draggable', 'true');

                //https://developer.mozilla.org/ru/docs/Web/API/HTML_Drag_and_Drop_API

                //TODO Можно установить картинку при перетаскивании строки
                gridElement.DOM.row.addEventListener(
                    'dragstart',
                    function(e){
                        grid.draggedRow = e.target || e.srcElement;

                    }
                );
                gridElement.DOM.row.addEventListener(
                    'dragover',
                    function(e){
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';


                    }
                );
                gridElement.DOM.row.addEventListener(
                    'drop',
                    function(e){
                        e.preventDefault();
                        //TODO Если сюда перетащена не строка, не позволять такую операцию (скорее всего просто ее игнорировать (по крайней мере для элементво панелей и самих панелей)
                        let acceptor = this;
                        let dragged = grid.draggedRow;
                        if (!dragged) {
                            return;
                        }
                        if (!dragged.classList.contains('flex-grid-data-row')) {
                            return;
                        }
                        if (typeof grid.config.events.moveItem === typeof function(){}) {
                            grid.config.events.moveItem(
                                acceptor.gridElement.getData(),
                                dragged.gridElement.getData(),
                            )
                        }
                    }
                );
                gridElement.DOM.row.addEventListener(
                    'click',
                    function(e){
                        //TODO запрашивать не от document, а от visualizer.DOM.dataPanel
                        document.body.querySelectorAll('.flex-grid-data-row.selected').forEach(
                            function(selectedRow){
                                selectedRow.classList.remove('selected-row');
                            }
                        );
                        this.classList.add('selected-row');
                        grid.activeRow = this;
                    }
                );


            }
            gridElement.DOM.row.addEventListener(
                'click',
                function(e){
                    //css :hover::after влияет на e.target - вместо ячейки может придти вся строка в том же FF!!
                    console.log('activaterow ', this)
                    console.log(e)
                    grid.activeRow && grid.activeRow.classList.remove('selected-row');
                    grid.activeRow = this;
                    this.classList.add('selected-row');

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
                !config.container ||
                //Селектор
                typeof config.container !== typeof 'aaa' &&
                //DOM-элемент
                (
                    typeof config.container !== typeof {} ||
                    config.container.nodeType !== Node.ELEMENT_NODE
                )
            ) {
                //TODO Более точное определение контейнера для размещения грида
                errors.push('incorrect grid container');
            }

            errors = errors.splice(0, 0, ...this.specificConfigValidation(config));

            return errors.length ? errors : null;
        };

        this.setConfig = function(config){
            for (let key in config) {
                this.config[key] = config[key];
            }

            this.config.treeMaxVisualDepth ||= this.getDefaultConfig().treeMaxVisualDepth;
            this.config.treeLvlPadding ||= this.getDefaultConfig().treeLvlPadding;
            this.config.events ||= {};
            this.styles['.flex-grid-tree-cell'] = '--tree-lvl-padding: ' + this.config.treeLvlPadding + 'px;';
            for (let i = 1; i <= this.config.treeMaxVisualDepth; i++) {
                this.styles['.flex-grid-tree-cell.enclosure-' + i] = 'padding-left: calc(var(--tree-lvl-padding) * ' + i + ');';
            }
            this.styles['.flex-grid-tree-cell.enclosure-exceed'] = 'padding-left: calc(var(--tree-lvl-padding) * ' + this.config.treeMaxVisualDepth + ');';

            this.config.filterMode && this.filter.setMode(this.config.filterMode);
        };

        this.initData = function(){
            if (typeof this.config.data === typeof 'aaa') {
                /**
                 * Загрузка данных с сервера
                 */
                this.loadData(this.config.data);
                return
            }
            if (Array.isArray(this.config.data)) {
                /**
                 * Это плоский массив данных
                 */
                this.prepareData(this.config.data);
            }
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
            this.createHeaders();
            this.updateStyleElement();

            this.initData();
            //TODO В случае загрузки с сервера нужно запускать визуализацию данных только после получения данных
            this.visualizer.setContainer(this.config.container);
            this.visualizer.setHeaders(this.headers.orderedLeafHeaders);
            this.visualizer.setCallbacks(
                {
                    getItemsCount: this.visualizerCallbacks.getItemsCount.bind(this),
                    getElement: this.visualizerCallbacks.getElement.bind(this),
                }
            );
            this.visualizer.init();




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
            else if (header.type instanceof FlexGridDataVisualizationComponentInterface) {
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
                throw 'Incorrect data vizualization component';
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
            else if (header.filter instanceof FlexGridDataFilterComponentInterface) {
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
                    width: '30',
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


        this.createHeaders = function(){
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
            let headers = this.extendsHeaders(this.config.headers);
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
    };

    function pubFlexGrid(priv) {

        this.build = function(config){
            if (errors = this.validateConfig(config)) {
                throw 'Incorrect config: ' + errors.join('; ');
            }
            this.setConfig(config);
            this.init();
        }.bind(priv);

        this.addVisualizationComponent = function(/** @type {string} */alias, /** @type {FlexGridDataVisualizationComponentInterface} */component){
            if (!(component instanceof FlexGridDataVisualizationComponentInterface)) {
                throw 'Data visualization component must be instance of FlexGridDataVisualizationComponentInterface';
            }

            this.dataVisualizationComponents[alias] = component;
        }.bind(priv);

        this.addFilterComponent = function(/** @type {string} */alias, /** @type {FlexGridDataFilterComponentInterface} */component){
            if (!(component instanceof FlexGridDataFilterComponentInterface)) {
                throw 'Data visualization component must be instance of FlexGridDataFilterComponentInterface';
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
            return this.dataVisualizationComponents[alias] || null;
        }.bind(priv);

        this.getFilterComponent = function(/** @type {string} */alias){
            return this.dataFilterComponents[alias] || null;
        }.bind(priv);

        this.updatePreview = function(){
            this.updatePreview();
        }.bind(priv);

        this.destroy = function(){
            throw 'Method \'destroy\' is not implemented for flexGrid';

        }.bind(priv);


        this.addVisualizationComponent('tree', new TreeVisualizationComponent());
        this.addVisualizationComponent('empty', new EmptyVisualizationComponent());
        this.addVisualizationComponent('text', new TextVisualizationComponent());
        this.addVisualizationComponent('string', new StringVisualizationComponent());
        this.addVisualizationComponent('money', new MoneyVisualizationComponent());
        this.addVisualizationComponent('boolean', new BooleanVisualizationComponent());
        this.addVisualizationComponent('numerable', new NumerableVisualizationComponent());


        this.addFilterComponent('string', new StringFilterComponent());


    };

    abstractFlexGrid.prototype = new (function(){
        this.getDefaultConfig = function(){
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
                _headers: 'Иерархический набор заголовков FlexGrid',
                headers: undefined,
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
            };
        };
    })();

    function TreeGrid(){

        let priv = new abstractFlexGrid();
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
                width: '30',
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
                gridElement = new GridElement(this.config, this);
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


    function FlatGrid() {
        let priv = new abstractFlexGrid();
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
    //FlatGrid.prototype = new abstractFlexGrid();


    window.FlexGrid.getDefaultConfig = abstractFlexGrid.prototype.getDefaultConfig;

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

    function FlatDataSet(privFlexGrid){
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

    function TreeDataSet(privFlexGrid){
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

    // function FilteredDataSet(privFlexGrid){
    //     let priv = new abstractDataSet(privFlexGrid);
    //     let pub = new pubDataSet(priv);
    //
    //     Object.defineProperties(
    //         pub,
    //         {
    //             length: {
    //                 configurable: true,
    //                 enumerable: false,
    //                 get: function(){return this.data.current.length;}.bind(priv),
    //             },
    //         }
    //
    //     );
    //
    //     priv.createId();
    //     return pub;
    // };

    function Filter(privFlexGrid){
        let priv = {
            privFlexGrid: privFlexGrid,
            components: {},
            dataSet: undefined,//Tree || Flat??,
            mode: 'onenter',
            layers: {
                /**
                 * Сохраняя в слоях фильтра отфильтрованные наборы данных и подкладывая их в grid.dataset, мы избегаем того,
                 * что пользователь нажмет expand и эти раскрытые/свернутые строки испортят отфильтрованный набор данных
                 */
                /**
                 * @type {FilterLayer[]}
                 */
                dict: {},
                /**
                 * @type {FilterLayer[]}
                 */
                list: []
            }
        };
        let pub = {
            addComponent: function(key, component){
                priv.components[key] = component;
            }.bind(priv),
            setFilter: function(
                fieldName,
                filterValue,
                filterComponent
            ){

                /**
                 * @type {GridElement[]}
                 */
                let data = priv.layers.dict.length ?
                    priv.layers.dict[priv.layers.dict.length - 1].getData() :
                    priv.privFlexGrid.data.current.getData(true);

                data = filterComponent.filtrate(
                    fieldName,
                    filterValue,
                    data
                );


                //В grid.dataset устанавливаем копию отфильтрованных данных, т.к. пользователь может разворачивать
                //строки и портить тем самым результат фильтрации
                let copy = [], i = 0, l = data.length;
                while (i < l)  {
                    copy.push(data[i++]);
                }
                priv.privFlexGrid.data.current.setData(copy);
                /**
                 * expanded просто так менять нельзя на true.
                 * Во-первых, отфильтрованные элементы сами показываются в гриде, но при этом пользователь их еще не раскрывал.
                 * Во-вторых, могут отфильтроваться предок и один/несколько (но не все) его потомки. В этом случае
                 * по идее флаг дерева должен принять вид "Открыто частично"
                 */
                // if (priv.privFlexGrid.data.current instanceof TreeDataSet) {
                //     let i = 0, l = data.length;
                //     while (i < l) {
                //         data[i].expand(true);
                //     }
                // }

                priv.privFlexGrid.updatePreview();

            }
        };


        return pub;
    }

    function FilterLayer(){
        let priv = {
            data: null,
            prevLayer: null,
            nextLayer: null,
        };

        let pub = {
            setData: (data) => priv.data = data,
            getData: () => priv.data,
        };

        return pub;
    }

    function GridElement(config, flexGrid){
        let priv = {
            DOM: {
                row: undefined,
                cells: {},
            },
            data: undefined,
            expanded: {},
            parent: null,
            children: [],
            childrenDict: {},
            config: {
                entityClassField: config.entityClassField,
                entityIdField: config.entityIdField,
                entityParentField: config.entityParentField,
            },
            //priv
            privFlexGrid: flexGrid,
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
            expand: function(dataSetId, /**@type {boolean}*/ expanded){
                this.expanded[dataSetId] = !!expanded;
            }.bind(priv),
            expanded: function(dataSetId){
                !!dataSetId && (dataSetId = priv.privFlexGrid.data.current.id)
                return !!this.expanded[dataSetId];
            }.bind(priv),
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
                let visualizer = header.getVisualizer(propName, item, header);

                visualizer && visualizer.buildReadForm(
                    this.DOM.cells[headerId],
                    headerId,
                    this,
                    header,
                    //index
                );
            }.bind(priv),
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
    };
    function FlexGridDataVisualizationComponentInterface (){
        this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            throw 'Method \'buildReadForm\' is not implemented';
        };
        this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            throw 'Method \'buildEditForm\' is not implemented';
        };

    };



    function EmptyVisualizationComponent(){
        this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            DOMContainer.innerHTML = '';
        };
        this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            DOMContainer.innerHTML = '';
        };

    };
    EmptyVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();
    function StringVisualizationComponent(){
        this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            DOMContainer.innerHTML = gridElement.get(fieldName);
        };
        this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            DOMContainer.innerHTML = '';
            let textBox = document.createElement('input');
            textBox.type = 'text';
            textBox.name = fieldName;
            textBox.classList.add('form-edit-textbox');
            textBox.value  = gridElement.get(fieldName);
            DOMContainer.appendChild(textBox);
        };

    };
    StringVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();

    function TextVisualizationComponent(){
        this.resizable = false;
        this.maxWidth = 100;
        this.maxHeight = 100;
        this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            DOMContainer.innerHTML = gridElement.get(fieldName);
        };
        this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            DOMContainer.innerHTML = '';
            let textBox = document.createElement('textarea');
            textBox.name = fieldName;
            textBox.classList.add('form-edit-textarea');
            textBox.value  = gridElement.get(fieldName);
            textBox.style.resize = this.resizable ? 'enabled' : 'none';

            DOMContainer.appendChild(textBox);
        };

    };
    TextVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();
    function MoneyVisualizationComponent(){
        let locale = 'ru';
        this.currency = 'RUR';
        this.minimumFractionDigits = 0;
        this.maximumFractionDigits = 2;
        this.useGrouping = true;
        this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            let options = {
                style: 'currency',
                currency: this.currency,
                minimumFractionDigits: this.minimumFractionDigits,
                maximumFractionDigits: this.maximumFractionDigits,
                useGrouping: this.useGrouping,
            };
            DOMContainer.innerHTML = '<span style="">' + new Intl.NumberFormat(locale, options).format(gridElement.get(fieldName) || 0);
            DOMContainer.classList.add('money-format');
        };
        this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            DOMContainer.innerHTML = '';
            let textBox = document.createElement('input');
            textBox.type = 'text';
            textBox.name = fieldName;
            textBox.classList.add('form-edit-textbox');
            textBox.value  = gridElement.get(fieldName) || 0;
            textBox.style.resize = this.resizable ? 'enabled' : 'none';

            DOMContainer.appendChild(textBox);
            DOMContainer.classList.add('money-format');
        };

    };
    MoneyVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();
    function BooleanVisualizationComponent(){
        this.trueVisualization = function(){
            return '+';
        };
        this.falseVisualization = function(){
            return '-';
        };
        this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){

            let visualization = gridElement.get(fieldName) ? this.trueVisualization() : this.falseVisualization();
            typeof visualization === typeof 'aaa' ?
                DOMContainer.innerHTML = visualization :
                (DOMContainer.innerHTML = '', DOMContainer.appendChild(visualization));


        };
        this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
            return '<div style="color: red; font-weight: bold; font-size: 2em;">need implement checkbox edit form</div>';
        };

    };
    BooleanVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();

    function TreeVisualizationComponent(){
        this.expandedNode = '&#x25BC;';
        this.collapsedNode = '&#x25BA;';
        let f = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){

            DOMContainer.innerHTML = gridElement.expanded() ?
                this.expandedNode :
                this.collapsedNode;
        };

        this.buildReadForm = f;
        this.buildEditForm = f;

    };
    TreeVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();

    function NumerableVisualizationComponent(){
        let f = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData, /** @type {int} */ indexRow){
            DOMContainer.innerHTML = indexRow + 1;
        };

        this.buildReadForm = f;
        this.buildEditForm = f;

    };
    NumerableVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();


    function FlexGridDataFilterComponentInterface (){
        this.buildFilterForm = function (
            /** @type {Element}*/DOMContainer,
            /** @type {string}*/fieldName,
            /** @type {object}*/headerData,
        ){
            throw 'Method \'buildReadForm\' is not implemented';
        };

        this.buildBaseForm = function(/** @type {Element}*/DOMContainer,){
            while (DOMContainer.lastChild) {
                DOMContainer.removeChild(DOMContainer.firstChild);
            }
            DOMContainer.classList.add('flex-grid-panel');
            DOMContainer.classList.add('flex-grid-filter-panel');
            DOMContainer.classList.add('flex-grid-nowrapped-panel');
            DOMContainer.classList.add('flex-grid-horizontal-panel');
            let componentContainer = document.createElement('div');
            let componentOptionsContainer = document.createElement('div');
            componentContainer.classList.add('flex-grid-filter-component-container');
            componentOptionsContainer.classList.add('flex-grid-filter-component-options-container');

            return {
                componentContainer: componentContainer,
                componentOptionsContainer: componentOptionsContainer
            }

        };

        this.filtrate = function(
            fieldName,
            filterValue,
            gridElements
        ){
            throw 'Method \'filtrate\' of filter component is not implemented'
        };



        this.buildResetOption = function(){
            let container = document.createElement('div');
            container.classList.add('flex-grid-filter-option');
            let button = document.createElement('button');
            button.classList.add('filter-reset-button');
            button.innerHTML = 'X';

            container.appendChild(button);
            return {
                container: container,
                button: button
            };
        };

        this.customizeComponents = function(componentsDict){

        };
        // this.buildResetOption = function(){
        //     let option = document.createElement('div');
        //     option.classList.add('flex-grid-filter-option');
        //     option.innerHTML = 'X';
        //     return option;
        // };
        // this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
        //     throw 'Method \'buildEditForm\' is not implemented';
        // };

        //TODO Для числовых полей и дат в качестве опций можно добавить "Вне диапазона", "В диапазоне", "Точное значение", "Содержит..."
        // Для диапазонов - можно указывать одну из границ - тогда ищем либо больше, либо меньше, либо >=, либо <=

    };

    function StringFilterComponent(){
        let storage = {
            DOM: {},
            mode: 'startWith'
        };
        //TODO Пустая строка - сброс строкового фильтра
        this.buildFilterForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {object}*/headerData){
            let Filter = this.Filter;
            let filterComponent = this;
            let forms = this.buildBaseForm(DOMContainer);

            //events: onchange (minlength >= 0), onenter,

            let div = document.createElement('div');
            let input = document.createElement('input');
            div.classList.add('flex-grid-filter-field');
            div.appendChild(input);
            let resetOption = this.buildResetOption();
            console.log(this.Filter); //(pubFilter)

            forms.componentContainer.appendChild(div);
            forms.componentContainer.appendChild(resetOption.container);

            DOMContainer.appendChild(forms.componentContainer);
            DOMContainer.appendChild(forms.componentOptionsContainer);
            input.addEventListener(
                'keyup',
                function(e){
                    e.keyCode === 13 && Filter.setFilter(fieldName,
                        this.value,
                        filterComponent)
                }
            );

            let random = Math.ceil(Math.random() * 1000000);//TODO Ввести идентификатор для компонента фильтра

            let btnGroupContainer = document.createElement('div');
            btnGroupContainer.classList.add('btn-group');
            btnGroupContainer.setAttribute('role', 'group');

            let radio = document.createElement('input');
            radio.type = 'radio';
            radio.classList.add('btn-check');
            radio.name = 'string-filter-component-mode-' + random;
            radio.id = 'string-filter-component-mode-start-with-' + random;
            radio.dataset.mode = 'startWith';
            radio.autocomplete = 'off';
            let label = document.createElement('label');
            label.classList.add('btn');
            label.classList.add('btn-outline-primary');
            label.classList.add('string-filter-option');
            label.setAttribute('for', radio.id)
            label.textContent = '^*';
            label.title = 'Начинается с ...';
            btnGroupContainer.appendChild(radio);
            btnGroupContainer.appendChild(label);
            radio.onchange = function(){
                storage.mode = this.dataset.mode;
            };

            radio = document.createElement('input');
            radio.type = 'radio';
            radio.classList.add('btn-check');
            radio.name = 'string-filter-component-mode-' + random;
            radio.id = 'string-filter-component-mode-contains-' + random;
            radio.dataset.mode = 'contains';
            radio.autocomplete = 'off';
            label = document.createElement('label');
            label.classList.add('btn');
            label.classList.add('btn-outline-primary');
            label.classList.add('string-filter-option');
            label.setAttribute('for', radio.id)
            label.textContent = '%%';
            label.title = 'Поиск по вхождению';
            btnGroupContainer.appendChild(radio);
            btnGroupContainer.appendChild(label);
            radio.onchange = function(){
                storage.mode = this.dataset.mode;
            };

            radio = document.createElement('input');
            radio.type = 'radio';
            radio.classList.add('btn-check');
            radio.name = 'string-filter-component-mode-' + random;
            radio.id = 'string-filter-component-mode-equals-' + random;
            radio.dataset.mode = 'equals';
            radio.autocomplete = 'off';
            label = document.createElement('label');
            label.classList.add('btn');
            label.classList.add('btn-outline-primary');
            label.classList.add('string-filter-option');
            label.setAttribute('for', radio.id)
            label.textContent = '**';
            label.title = 'Поиск по точному совпадению';
            btnGroupContainer.appendChild(radio);
            btnGroupContainer.appendChild(label);
            radio.onchange = function(){
                storage.mode = this.dataset.mode;
            };

            radio = document.createElement('input');
            radio.type = 'radio';
            radio.classList.add('btn-check');
            radio.name = 'string-filter-component-mode-' + random;
            radio.id = 'string-filter-component-mode-end-with-' + random;
            radio.dataset.mode = 'endWith';
            radio.autocomplete = 'off';
            label = document.createElement('label');
            label.classList.add('btn');
            label.classList.add('btn-outline-primary');
            label.classList.add('string-filter-option');
            label.setAttribute('for', radio.id)
            label.textContent = '*$';
            label.title = 'Заканчивается на...';
            btnGroupContainer.appendChild(radio);
            btnGroupContainer.appendChild(label);
            radio.onchange = function(){
                storage.mode = this.dataset.mode;
            };

            //TODO Компонент может также содержать опции учета регистра, а также инверсии результатов поиска
            // Отдельно продумать поиск пустые / непустые и т.п. - возможно, для компонента надо делать отдельное вспылвающее окошко с расширенными настройками

            forms.componentOptionsContainer.appendChild(btnGroupContainer);



            // let button = document.createElement('button');
            // button.classList.add('string-filter-option');
            // button.classList.add('btn');
            // button.classList.add('btn-outline-info');
            // button.innerHTML = '^*';
            // button.title = 'Начинается с ...';
            // forms.componentOptionsContainer.appendChild(button);
            //
            // button = document.createElement('button');
            // button.classList.add('string-filter-option');
            // button.classList.add('btn');
            // button.classList.add('btn-outline-info');
            // button.innerHTML = '%%';
            // button.title = 'Поиск по вхождению';
            // forms.componentOptionsContainer.appendChild(button);
            //
            // button = document.createElement('button');
            // button.classList.add('string-filter-option');
            // button.classList.add('btn');
            // button.classList.add('btn-outline-info');
            // button.innerHTML = '**';
            // button.title = 'Поиск по точному совпадению';
            // forms.componentOptionsContainer.appendChild(button);
            //
            // button = document.createElement('button');
            // button.classList.add('string-filter-option');
            // button.classList.add('btn');
            // button.classList.add('btn-outline-info');
            // button.innerHTML = '*$';
            // button.title = 'Заканчивается на...';
            // forms.componentOptionsContainer.appendChild(button);

            this.customizeComponents(
                {
                    inputField: input,
                    resetButton: resetOption.button
                }
            );
        };

        this.filtrate = function(
            fieldName,
            filterValue,
            /** @type {GridElement[]} */gridElements
        ){
            let filterCallbacks = {
                startWith: function(gridElement, index){
                    return (gridElement.get(fieldName) ?? '').toString().indexOf(filterValue) === 0;
                },
                endWith: function(gridElement, index){

                    return (gridElement.get(fieldName) ?? '').endsWith(filterValue);
                },

                contains: function(gridElement, index){
                    return (gridElement.get(fieldName) ?? '').toString().indexOf(filterValue) > -1;
                },
                equals: function(gridElement, index){
                    return (gridElement.get(fieldName) ?? '').toString() === filterValue;
                },

            }
            return gridElements.filter(
                filterCallbacks[storage.mode ?? 'startWith']
            );
        };

    };
    StringFilterComponent.prototype = new FlexGridDataFilterComponentInterface();


    Object.defineProperties(
        window.FlexGrid,
        {
            FlexGridDataVisualizationComponentInterface: {
                get: () => FlexGridDataVisualizationComponentInterface,
                configurable: false,
                enumerable: false,
            },
            FlexGridDataFilterComponentInterface: {
                get: () => FlexGridDataFilterComponentInterface,
                configurable: false,
                enumerable: false,
            },
            StringVisualizationComponent: {
                get: () => StringVisualizationComponent,
                configurable: false,
                enumerable: false,
            },
            TextVisualizationComponent: {
                get: () => TextVisualizationComponent,
                configurable: false,
                enumerable: false,
            },
            EmptyVisualizationComponent: {
                get: () => EmptyVisualizationComponent,
                configurable: false,
                enumerable: false,
            },
            MoneyVisualizationComponent: {
                get: () => MoneyVisualizationComponent,
                configurable: false,
                enumerable: false,
            },
            TreeVisualizationComponent: {
                get: () => TreeVisualizationComponent,
                configurable: false,
                enumerable: false,
            },
            BooleanVisualizationComponent: {
                get: () => BooleanVisualizationComponent,
                configurable: false,
                enumerable: false,
            },
            StringFilterComponent: {
                get: () => StringFilterComponent,
                configurable: false,
                enumerable: false,
            },

        }


    )
    


})()