(function(){
    let pluginIds = {};
    window.Scroller = function(/** @type Object */ config){


        if (!config || typeof config !== typeof {}) {
            throw 'Incorrect config';
        }


        let p = this.getDefaultConfig();
        config = config === null || typeof config === typeof undefined ? {} : config;

        for (let key in config) { p[key] = config[key]; }

        if (
            !config.DOM ||
            !config.DOM.container ||
            typeof config.DOM.container !== typeof {} ||
            config.DOM.container.nodeType !== Node.ELEMENT_NODE ||
            !(config.DOM.container.tagName.toLowerCase() in {div: true, p: true}) ||
            !config.DOM.scrolledItemsContainer ||
            typeof config.DOM.scrolledItemsContainer !== typeof {} ||
            config.DOM.scrolledItemsContainer.nodeType !== Node.ELEMENT_NODE ||
            !(config.DOM.scrolledItemsContainer.tagName.toLowerCase() in {div: true, p: true})
        )
        {
            throw 'Can\'t use selected items for Scroller';
        }

        let priv = new standardScroller(p);

        config.scrollSensitivity = config.scrollSensitivity < 1 ? priv.scrollSensitivity : config.scrollSensitivity;

        priv.init();

        let pub = {};

        pub.goTo = function(index){
            this.reloadWith(index);
        }.bind(priv);

        pub.updateItemsCount = function(newItemsCount){
            if (newItemsCount < 0) {
                return;
            }
            priv.config.itemsCount = newItemsCount;
            priv.updateScrollbarHeight();
        };

        pub.resize = function(){
            priv.resize();
        };
        pub.destroy = function(){
            priv.destroy();
        };

        pub.reload = function(){this.reload();}.bind(priv);


        return pub;
    }

    window.Scroller.prototype = new (function(){
        function f (){
            this.getDefaultConfig = function() {
                /**
                 * С помощью этой функции можно предоставить пользователю образец конфига с пояснениями, а также
                 * получить базовый конфиг для компонента, на который сверху можно наложить конфиг пользователя
                 */
                return {
                    _getElement: 'Метод, возвращающий DOM-объект для отображения пользователю',
                    getElement: function(/** @type {number} */index){

                    },
                    // _direction: 'Способ прокрутки контейнера. По умолчанию - прокрутка в одном измерении, вертикальном',
                    // direction: ScrollerConstants().directions.onlyVertical,
                    _firstIndex: 'Индексный номер первого элемента в наборе. Можно задавать отличный от нуля, если предполагается выводить дополнительные элементы типа заголовков, не входящие в основной набор данных',
                    firstIndex: 0,
                    _itemsCount: 'Количество элементов',
                    itemsCount: 0,
                    _scrollSensitivity: 'Чувствительность скроллбара - количество пикселей, которые надо прокрутить для прокрутки на один элемент. Влияет на отображение полосы вертикальной прокрутки',
                    scrollSensitivity: 10,
                    // _minIndex: 'Минимально возможный индекс в наборе. При загрузке компонента Scroller не с первого элемента возникает ситуация, что под предыдущие элементы не выделяется никакого места и становится невозможно выполнить прокрутку вверх. Поэтому необходимо выделять место под "виртуальные" элементы, которые еще ни разу не были загружены в Scroller',
                    // minIndex: 0, //TODO А нужен ли? Или всегда считать, что минимальный индекс равен нулю, т.к. индексы всегда числовые и всегда должны быть упорядоченными

                    /*
                     *Элементы пагинации не ограничивают количество выводимых на страницу элементов. Они лишь помогают навигации и быстрой прокрутке
                     * к нужной точке набора элементов
                     *
                     */
                    // pageSize: 10,
                    // pagination: false,

                };

            };
        };
        f.prototype = new ScrollerConstants();
        return f;
    }());

    window.Scroller.getDefaultConfig = window.Scroller.prototype.getDefaultConfig;
    window.Scroller.getFlags = function(){return this.prototype.flags;}; //TODO Use Object.DefineProperty to denied redefine method and properties


    /**
     * Класс, описывающий элемент скроллируемого набора
     */
    function ScrolledElement(/** @type {number} */index, /** @type Element */element){
        let privateStorage = {
            /**
             * Индекс в массиве данных
             */
            index: index,
            /**
             * DOM-element
             */
            element: element,
        };


        /**
         *
         * @returns Element
         */
        this.getElement = function () {
            return privateStorage.element;
        };

        this.setElement = function(element){
            privateStorage.element = element;
        };

        /**
         *
         * @returns {number}
         */
        this.getIndex = function(){
            return privateStorage.index;
        };

        /**
         *
         * @returns {number}
         */
        this.getOffsetHeight = function(){
            return privateStorage.element.offsetHeight;
        };

    };

    function ScrollerFlags() {
        /**
         * Класс, содержащий набор специальных значений, которые можно вернуть из функции создания элемента скроллируемого набора помимо самого элемента набора
         */
        return Object.defineProperties(
            Object.create(null),
            {
                /**
                 * Флаг указывает, что в данную сторону (вперед или назад) в наборе больше нет элементов
                 */
                noElements: {
                    value: 0,
                    writable: false,
                    configurable: false,
                    enumerable: false
                },
                /**
                 * Флаг указывает, что данный элемент следует пока не показывать.
                 * Однако это порождает поблемы с прокруткой - scrollbar вхолостую крутится между двумя видимыми элементами, между которых много
                 * скрытых. Особенно это заметно при пркрутке колесом мыши. Поэтому данный флаг, скорее всего,
                 * нужно отменять.
                 */
                skip: {
                    value: 1,
                    writable: false,
                    configurable: false,
                    enumerable: false
                }
            }
        );
    }


    function ScrollerConstants() {
        /**
         * Различные константы Scroller'а
         */
        return Object.defineProperties(
            Object.create(null),
            {
                flags: {
                    value: ScrollerFlags(),
                    writable: false,
                    configurable: false,
                    enumerable: false
                },
            }
        );

    }


    function abstractScroller (){

        this.init = function(){
            this.createId();
            this.createStyleElement();
            this.updateStyleElement();
            this.wrap();
            this.updateScrollbarHeight();
            this.initPage(this.config.firstIndex ||  0);
            this.initSrollbarSizes();

            this.setHandlers();
        };
        this.createId = function(){
            let r = undefined
            while ((r = Math.ceil(Math.random() * 1000000) + 1) in pluginIds) {}
            this.id = r;
            pluginIds[r] = true; //true instead of this to avoid memory leak
        };

        this.createStyleElement = function(){
            this.styleContainer = document.createElement('style');
            this.styleContainer.id = 'scroller-style-container-' + this.id;
            document.getElementsByTagName('head')[0].appendChild(this.styleContainer);
        };
        this.updateStyleElement = function(){
            let rootClassName = '.' + this.getRootClassName() + ' ';
            let styles = '';
            for (let styleId in this.styles) {
                styles += rootClassName + styleId + '{' + this.styles[styleId] + '}' + "\n";
            }
            this.styleContainer.textContent = styles;
        };
        this.getRootClassName = function(){
            return 'scroller-container-' + this.id;
        };

        /**
         * Метод для элемента набора создает объект, содержащий необходимую информацию для скроллинга
         * @param index
         * @param element
         * @returns {ScrolledElement}
         */
        this.createLoadedElementInfoStorageItem = function(/** @type {number} */index, /** @type Element */element){
            return new ScrolledElement(index, element);
        };
        this.wrap_new = function(){
            /**
             * Контейнер
             */
            let scrolledContainer = this.config.DOM.container;
            this.DOM.scrolledContainer = scrolledContainer;
            /**
             * В этом контейнере реально содержатся элементы для прокрутки
             */
            let scrolledItemsContainer = this.config.DOM.scrolledItemsContainer;
            this.DOM.scrolledItemsContainer = scrolledItemsContainer;


            scrolledContainer.classList.add(this.getRootClassName());
            scrolledContainer.classList.add('root-scrolled-container');
            scrolledContainer.classList.add('scrolled-data-container');

            scrolledItemsContainer.classList.add('scrolled-items-container');

            let scrollerWrapper = document.createElement('div');
            scrollerWrapper.className = 'scroller-wrapper';
            this.DOM.wrapper = scrollerWrapper;

            // let dataContainer = document.createElement('div');
            // dataContainer.className = 'scroller-data-container';
            // this.DOM.dataContainer = dataContainer;

            let scrollbarContainer = document.createElement('div');
            scrollbarContainer.className = 'scroller-scrollbar-container'
            this.DOM.scrollbarContainer = scrollbarContainer;

            let scrollbar = document.createElement('div');
            scrollbar.className = 'scroller-scrollbar';
            this.DOM.scrollbar = scrollbar;

            scrollbarContainer.appendChild(scrollbar);

            this.config.viewport = scrollerWrapper;

            // while (scrolledContainer.firstElementChild) {
            //     dataContainer.appendChild(scrolledContainer.firstElementChild)
            // }
            // scrolledContainer.appendChild(scrollerWrapper);
            scrolledContainer.parentElement.insertBefore(scrollerWrapper, scrolledContainer);
            scrollerWrapper.appendChild(scrolledContainer);
            scrollerWrapper.appendChild(scrollbarContainer);
        };
        this.wrap = function(){
            /**
             * Контейнер
             */
            let scrolledContainer = this.config.DOM.container;
            this.DOM.scrolledContainer = scrolledContainer;
            /**
             * В этом контейнере реально содержатся элементы для прокрутки
             */
            let scrolledItemsContainer = this.config.DOM.scrolledItemsContainer;
            this.DOM.scrolledItemsContainer = scrolledItemsContainer;


            scrolledContainer.classList.add(this.getRootClassName());
            scrolledContainer.classList.add('root-scrolled-container');

            scrolledItemsContainer.classList.add('scrolled-items-container');

            let scrollerWrapper = document.createElement('div');
            scrollerWrapper.className = 'scroller-wrapper';
            this.DOM.wrapper = scrollerWrapper;

            let dataContainer = document.createElement('div');
            dataContainer.className = 'scroller-data-container';
            this.DOM.dataContainer = dataContainer;
            dataContainer.style.flexDirection = scrolledContainer.style.flexDirection;

            let scrollbarContainer = document.createElement('div');
            scrollbarContainer.className = 'scroller-scrollbar-container'
            this.DOM.scrollbarContainer = scrollbarContainer;

            let scrollbar = document.createElement('div');
            scrollbar.className = 'scroller-scrollbar';
            this.DOM.scrollbar = scrollbar;

            scrollbarContainer.appendChild(scrollbar);

            this.config.viewport = scrollerWrapper;

            while (scrolledContainer.firstElementChild) {
                dataContainer.appendChild(scrolledContainer.firstElementChild)
            }
            scrolledContainer.appendChild(scrollerWrapper);

            scrollerWrapper.appendChild(dataContainer);
            scrollerWrapper.appendChild(scrollbarContainer);
        };

        this.setHandlers = function(){
            this.DOM.scrolledItemsContainer.addEventListener('wheel', function(e){
                let direction = e.deltaY > 0 ? 1 : (e.deltaY < 0 ? -1 : 0);
                if (!direction) {
                    return;
                }
                this.DOM.scrollbarContainer.scrollTop += direction * this.config.scrollSensitivity;
            }.bind(this));



            this.DOM.scrollbarContainer.addEventListener('scroll', function(e){
                /**
                 * Непосредственно здесь нельзя прописывать никакой логики, т.к. бывают ситуации, когда реакцию на  событие
                 * прокрутки надо вызывать без непосредственной прокрутки.
                 */


                this.scroll();
            }.bind(this))

            let resizeCallback = function(){
                if (resizeCallback.timeout) {
                    clearTimeout(resizeCallback.timeout);
                }
                let f = function(){
                    this.scroll();
                }.bind(this);

                resizeCallback.timeout = setTimeout(f, 100);
            }.bind(this);

            let o = {
                type: 'resize',
                object: window,
                callback: resizeCallback
            };
            this.callbacks[o.type] = this.callbacks[o.type] || {};
            this.callbacks[o.type]['window'] = this.callbacks[o.type]['window'] || [];
            this.callbacks[o.type]['window'].push(o);
            o.object.addEventListener(o.type, o.callback);
        };
        this.scroll = function(){
            let firstItemIndex = Math.floor(this.DOM.scrollbarContainer.scrollTop / this.config.scrollSensitivity);
            firstItemIndex = firstItemIndex >= this.config.itemsCount ? this.config.itemsCount - 1 : (firstItemIndex < 0 ? 0 : firstItemIndex);
            this.initPage(firstItemIndex);
        };

        this.initSrollbarSizes = function(){
            this.updateScrollbarHeight();
            this.DOM.scrollbarContainer.scrollTop = this.config.scrollSensitivity * (this.config.firstIndex || 0);
        };

        this.updateScrollbarHeight = function(){
            let h = (this.config.itemsCount * this.config.scrollSensitivity + this.DOM.scrollbarContainer.offsetHeight) + 'px'
            this.DOM.scrollbar.style.height = h;
            this.DOM.scrollbar.style.maxHeight = h;
            this.DOM.scrollbar.style.minHeight = h;
        };

        /**
         * Инициация страницы при первой загрузке
         */
        this.initPage = function(/** @type {number} */ firstItemIndex){
            let requestIndex = firstItemIndex;
            let elementInfo = undefined;
            let h = 0;
            let loadedItems = false;

            this.items = {
                items: {},
            };

            while (this.DOM.scrolledItemsContainer.firstElementChild) {
                this.DOM.scrolledItemsContainer.removeChild(this.DOM.scrolledItemsContainer.lastElementChild);
            }


            this.DOM.wrapper.classList.add('mode-scroll');

            while (h < this.DOM.scrolledItemsContainer.offsetHeight && (elementInfo = this.loadNextElement(requestIndex))) {
                /** Индекс первого элемента передали, после этого нужно позволить алгоритму самому инкрементировать индексные номера следующих загружаемых элементов набора, сбросив firstItemIndex в undefined */
                requestIndex = elementInfo.getIndex() + 1;

                elementInfo.getElement().classList.add('transparent');
                this.appendOnViewportEnd(elementInfo.getElement());
                h += elementInfo.getOffsetHeight();
                elementInfo.getElement().classList.remove('transparent');
            }
            /**
             * Если не нашли ни одного элемента, двигаясь вперед, двинемся назад и найдем хотя бы один элемент для отображения.
             */
            for (let key in this.items.items) {
                loadedItems = true;
                break;
            }
            while (!loadedItems &&  (elementInfo = this.loadPrevElement(firstItemIndex - 1))) {
                elementInfo.getElement().classList.add('transparent');
                this.appendOnViewportEnd(elementInfo.getElement());
                elementInfo.getElement().classList.remove('transparent');
            }

            /**
             * Если не загрузили ни одного элемента, надо попробовать в обратную сторону
             */

            this.DOM.wrapper.classList.remove('mode-scroll');

        };

        /**
         * Метод обеспечивает загрузку следующего элемента набора
         * Возвращает ScrolledElement в случае успеха и false, если элемент не был загружен
         * @returns {boolean|ScrolledElement}
         */
        this.loadNextElement = function(/** @type {number} */ nextItemIndex = undefined){
            return this.loadItem(
                1,
                nextItemIndex !== undefined ? nextItemIndex : (this.items.last || this.items.first),
                false
            );
        };
        /**
         * Метод обеспечивает загрузку предыдущего элемента набора
         * Возвращает ScrolledElement в случае успеха и false, если элемент не был загружен
         * @returns {boolean|ScrolledElement}
         */
        this.loadPrevElement = function(/**@type {number} */prevItemIndex = undefined){
            return this.loadItem(
                -1,
                prevItemIndex !== undefined ? prevItemIndex : this.items.first,
                true
            );

        };

        this.loadItem = function(/** @type {number} */incrementValue, /** @type ScrolledElement|{number} */ refElement, /** @type {boolean} */ isToBegin){
            let element, elementInfo, elementIndex;
            /** Ищем индекс для следующего элемента */
            elementIndex = refElement instanceof ScrolledElement ? refElement.getIndex() + incrementValue : (refElement || 0);
            while (true) {
                element = /*this.items.items[elementIndex] || */this.config.getElement.call(this, elementIndex);
                if (element === this.flags.noElements) {
                    /** Больше нет элементов, которые можно загрузить */
                    return false;
                }
                else if (element !== this.flags.skip) {
                    /** Получен элемент, который можно отобразить */
                    break;
                }
                /** Получен флаг, что данный индекс в настоящий момент следует пропустить и искать следующий */
                elementIndex += incrementValue;
            }
            if (element === null || typeof element === typeof undefined) {
                /** Больше нет элементов, которые можно загрузить */
                return false;
            }

            if (
                typeof element !== typeof {} ||
                element.nodeType !== Node.ELEMENT_NODE
            ) {
                throw 'Element must be a HTML node!';
            }
            elementInfo = this.createLoadedElementInfoStorageItem(elementIndex, element);

            this.items.items[elementIndex] = elementInfo;
            elementInfo.getElement().classList.add('scrolled-item');

            return elementInfo;
        },

        /**
         * Метод вызывает сброс и новую загрузку данных в scroller
         */
        this.reload = function () {
            this.scroll();
            //TODO Если scrollTop уже равен 0, то надо как-то иначе вызывать событие прокрутки
            // if (this.DOM.scrollbarContainer.scrollTop === 0) {
            //     this.scroll();
            // }
            // else {
            //
            //     this.DOM.scrollbarContainer.scrollTop = 0;
            // }
            /** Загрузка новых элементов будет вызвана автоматически, т.к. сработает событие скроллинга... если элементов было достаточно  */
        };

        this.reloadWith = function (/** @type {number} */indexWith) {
            this.DOM.scrollbarContainer.scrollTop = indexWith * (this.config.scrollSensitivity || this.scrollSensitivity);
        };

        this.appendOnViewportEnd = function(element){
            this.DOM.scrolledItemsContainer.appendChild(element);
        };

        this.appendOnViewportBegin = function (element) {
            this.DOM.scrolledItemsContainer.insertBefore(
                element,
                this.DOM.scrolledItemsContainer.children.length ? this.DOM.scrolledItemsContainer.children[0] : null);
        }

        this.destroy = function(){
            if (this.callbacks.resize && this.callbacks.resize.window) {
                this.callbacks.resize.window.map(function(){
                    thos.object.removeEventListener(this.type, this.callback);
                })
            }
        };

        this.resize = function(){
            this.updateScrollbarHeight();
            if (this.items.first) {
                this.initPage(this.items.first.bgetIndex());
            }
        };

        this.getScrolledItemsContainer = function(){
            return this.config.DOM.scrolledItemsContainer;
        };
        /**
         * Метод возвращает список загруженных индексов
         * @returns {[]}
         */
        this.getLoadedIndexes = function(){
            let res = [];
            for (let index in this.items.items) {
                res.push(index);
            }

            return res;
        };
    };
    abstractScroller.prototype = new ScrollerConstants();


    function standardScroller(p){
        this.config = p;
        this.wrap = function(){

            standardScroller.prototype.wrap.call(this);

        };

        this.id = undefined;
        /**
         * Callback'и, навешанные на систему. При удалении экземпляра компонента эти callback'и следует также удалять.
         */
        this.callbacks = {};
        /**
         * Высота виртуального элемента
         * @type {number}
         */
        this.virtualElementSize = 40;//??remove
        this.scrollSensitivity = 40;
        this.scrollForwardEnough = true; //Флаг, указывающий, что при очередной прокрутке вперед элементов было достаточно для заполнения области просмотра
        this.currentScroll = 0; //Величина текущей прокрутки обертки //??remove
        this.scrollDirection = 0; // Направление прокрутки 1, -1 //??remove
        this.styleContainer = undefined;
        this.styles = {//TODO Теоретически можно использовать единый объект style для подобных стилей, которые не обязательно должны быть связаны с конкретным экземпляром
            '.root-scrolled-container': 'display: flex; flex-direction: column;',
            '.scroller-wrapper': 'display: flex; margin: 0px; padding: 0px; border: 0px none; flex-grow: 1; flex-wrap: nowrap; flex-direction: row; overflow: hidden;',
            '.scroller-data-container': 'display: flex; /*flex-direction: column;*/ flex-wrap: nowrap; overflow-y: hidden; overflow-x: scroll;',
            '.scroller-scrollbar-container': 'overflow-x: hidden; overflow-y: scroll; min-width: 18px; max-width: 18px; width: 18px;',
            '.scroller-scrollbar': 'display: inline-block; min-width: 1px; width: 1px; max-width: 1px; opacity: 0;',
            '.transparent': 'opacity: 0;',
            '.mode-scroll .scroller-data-container .scrolled-item': 'flex-grow: 0 !important; flex-shrink: 0 !important;',
            '.scroller-data-container .scrolled-item:last-child': 'flex-shrink: 1;'
        };

        this.items = {
            items: {}, //Загруженные в настоящий момент элементы по индексам - пока не используется. Возможно, может обновляться асинхронно, но функции обновления должны работать в порядке очередности
        };
        this.DOM = {
            wrapper: undefined,
            dataContainer: undefined,
            scrollbarContainer: undefined,
            scrollbar: undefined,
            scrolledContainer: undefined,
            scrolledItemsContainer: undefined,
        };

    };
    standardScroller.prototype = new abstractScroller();
})();