"use strict";

import './dragger.js';
//TODO
// - можно попробовать реализовать вычисление отображаемых элементов по другому алгоритму
// - - создать копию контейнера, реально содержащего скроллируемые элементы.
// - - Эта копия должна иметь все те же стили и размеры, что и оригинал (поэтому стили должны определяться только через css-классы),
//     но при этом ее содержимое должно быть полностью прозрачным (opacity: 0 important) и не влиять на основное HTML-дерево страницы
// - - В эту копию контейнера помещаются создаваемые строки по одной
// - - затем высчитывается высота строки
// - - строка убирается из контейнера и помещается следующая до тех пор, пока суммарная высота не будет достаточной
// - - при необходимости "отматываем" вверх
// - - когда подобран набор строк для заполнения рабочей области, тогда уже созданные строки выводим в видимый контейнер
// Это может решить такие проблемы, как проявление в конце прокрутки сначала конечных строк, а потом начальных (при медленной
// системе у пользователя)
// - -
// - -
// - -
// - -
// -
// -

let pluginIds = {};

let ClassModel = Object.defineProperties(
    Object.create(null),
    {
        RootScrolledContainer: {
            get: () => 'root-scrolled-container',
            configurable: false,
            enumerable: false
        },
        ScrolledDataContainer: {
            get: () => 'scrolled-data-container',
            configurable: false,
            enumerable: false
        },
        NoScrollbar: {
            get: () => 'no-scrollbar',
            configurable: false,
            enumerable: false
        },
        ScrolledItemsContainer: {
            get: () => 'scrolled-items-container',
            configurable: false,
            enumerable: false
        },
        ScrollerWrapper: {
            get: () => 'scroller-wrapper',
            configurable: false,
            enumerable: false
        },
        ScrollerScrollbarContainer: {
            get: () => 'scroller-scrollbar-container',
            configurable: false,
            enumerable: false
        },
        ScrollerScrollbar: {
            get: () => 'scroller-scrollbar',
            configurable: false,
            enumerable: false
        },
        ScrollerDataContainer: {
            get: () => 'scroller-data-container',
            configurable: false,
            enumerable: false
        },
        ModeScroll: {
            get: () => 'mode-scroll',
            configurable: false,
            enumerable: false
        },
        Transparent: {
            get: () => 'transparent',
            configurable: false,
            enumerable: false
        },
    }
);

export function Scroller(/** @type Object */ config){


    if (!config || typeof config !== typeof {}) {
        throw 'Incorrect config';
    }


    let p = Scroller.getDefaultConfig();
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

    pub.reload = function(){priv.reload();};

    return pub;
}

function ScrollerDefaultConfig()
{
    /**
     * С помощью этой функции можно предоставить пользователю образец конфига с пояснениями, а также
     * получить базовый конфиг для компонента, на который сверху можно наложить конфиг пользователя
     */
    return {
        _getElement: 'Метод, возвращающий DOM-объект для отображения пользователю. Используется при построчной загрузке данных с неизвестной заранее высотой строки.',
        getElement: function(/** @type {number} */index, /** @type {string} */direction){

        },
        _getElements: 'Метод, возвращающий массив DOM-объектов для отображения пользователю. Используется при пакетной загрузке данных с предопределенной высотой строк, передаваемой через параметр predefinedRowHeight',
        getElements: function(/** @type {number} */index, /** @type {number} */count){

        },
        // _direction: 'Способ прокрутки контейнера. По умолчанию - прокрутка в одном измерении, вертикальном',
        // direction: ScrollerConstants().directions.onlyVertical,
        _firstIndex: 'Индексный номер первого элемента в наборе. Можно задавать отличный от нуля, если предполагается выводить дополнительные элементы типа заголовков, не входящие в основной набор данных',
        firstIndex: 0,
        _itemsCount: 'Количество элементов',
        itemsCount: 0,
        _scrollSensitivity: 'Чувствительность скроллбара - количество пикселей, которые надо прокрутить для прокрутки на один элемент. Влияет на отображение полосы вертикальной прокрутки',
        scrollSensitivity: 10,
        _scrollStepSize: 'Количество прокручиваемых колесом мыши за один раз строк',
        scrollStepSize: 1,
        _noScrollbar: 'Не показывать полосу прокрутки',
        noScrollbar: false,
        _alwaysFillContainer: 'При прокрутке всегда стараться максимально заполнять контейнер данными. При false возможен вариант, когда в контейнере будет отображаться только последний элемент несмотря на наличие свободного места для вывода и предыдущих элементов',
        alwaysFillContainer: false,
        _minExpectedRowHeight: 'Для строк с данными есть минимальная ожидаемая высота. Вряд ли можно разместить данные в строке с высотой к примеру в 1-2 px. Поэтому , если в контейнере свободного места осталось меньше, нет смысла пытаться туда загрузить еще одну строку и тратить на это время  Данный параметр устанавливает минимально возможную ожидаемую высоту строк.',
        minExpectedRowHeight: 15,
        _predefinedRowHeight: 'Для строк таблицы задана предопределенная высота. В этом случае при прокрутке можно сразу определить, сколько строк поместятся в области просмотра',
        predefinedRowHeight: 0,
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
}

Object.defineProperties(
    Scroller,
    {
        //именно getDefaultConfig, а не DefaultConfig, т.к. каждый раз возвращается НОВЫЙ объект, а не один и тот же
        getDefaultConfig :
            {
                get: () => ScrollerDefaultConfig,
                configurable: false,
                enumerable: false,
            },
        getFlags: {
            get: () => ScrollerFlags,
            configurable: false,
            enumerable: false
        },
        ClassModel: {
            get: () => ScrollerFlags,
            configurable: false,
            enumerable: false
        },
    }
);


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

function abstractScroller (){
    /**
     * Список загруженных элементов
     */
    this.items = {
        /** Словарь загруженных элементов */
        dict: {},
        /** Список загруженных элементов */
        list: []
    };

    this.init = function(){
        this.createId();
        this.createStyleElement();
        this.updateStyleElement();
        this.wrap();
        this.updateScrollbarHeight();
        this.loadItemsFromIndex(this.config.firstIndex ||  0);
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
    this.wrap_new = function(){//TODO Заготовка под скроллер без полосы прокрутки
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
        scrolledContainer.classList.add(ClassModel.RootScrolledContainer);
        scrolledContainer.classList.add(ClassModel.ScrolledDataContainer);
        if (this.config.noScrollbar) {
            scrolledContainer.classList.add(ClassModel.NoScrollbar);
        }

        scrolledItemsContainer.classList.add(ClassModel.ScrolledItemsContainer);

        let scrollerWrapper = document.createElement('div');
        scrollerWrapper.className = ClassModel.ScrollerWrapper;
        this.DOM.wrapper = scrollerWrapper;

        // let dataContainer = document.createElement('div');
        // dataContainer.className = ClassModel.ScrollerDataContainer;
        // this.DOM.dataContainer = dataContainer;

        let scrollbarContainer = document.createElement('div');
        scrollbarContainer.className = ClassModel.ScrollerScrollbarContainer
        this.DOM.scrollbarContainer = ClassModel.ScrollerScrollbarContainer;

        let scrollbar = document.createElement('div');
        scrollbar.className = ClassModel.ScrollerScrollbar;
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
        scrolledContainer.classList.add(ClassModel.RootScrolledContainer);

        scrolledItemsContainer.classList.add(ClassModel.ScrolledItemsContainer);

        let scrollerWrapper = document.createElement('div');
        scrollerWrapper.className = ClassModel.ScrollerWrapper;
        this.DOM.wrapper = scrollerWrapper;

        let dataContainer = document.createElement('div');
        dataContainer.className = ClassModel.ScrollerDataContainer;
        this.DOM.dataContainer = dataContainer;
        dataContainer.style.flexDirection = scrolledContainer.style.flexDirection;

        let scrollbarContainer = document.createElement('div');
        scrollbarContainer.className = ClassModel.ScrollerScrollbarContainer
        this.DOM.scrollbarContainer = scrollbarContainer;

        let scrollbar = document.createElement('div');
        scrollbar.className =ClassModel.ScrollerScrollbar;
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
            this.DOM.scrollbarContainer.scrollTop += direction * this.config.scrollSensitivity * this.config.scrollStepSize;
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
        this.loadItemsFromIndex(firstItemIndex);
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
    this.loadItemsFromIndex = function(/** @type {number} */ firstItemIndex){
        let requestIndex = firstItemIndex;
        /**
         *
         * @type {ScrolledElement}|{undefined}
         */
        let elementInfo = undefined;
        let h = 0;
/* TODO
        Пока возникает проблема с firstItemIndex - в зависимости от интенсивности прокрутки каждый раз он может быть разным:
        - например, при плавной прокрутке он не успеет приблизиться к концу на момент запроса последнего элемента, а при резкой прокрутке
        он может оставить на экране половину незаполненного свободного пространства контейнера
        if (
            (firstItemIndex in this.items.dict) &&
            this.items.list[this.items.list.length - 1].getIndex() >= this.config.itemsCount - 1
        ) {
            /!**
             * Если мы уже загрузили последний элемент, а полученный firstItemIndex входит в число уже загруженных, то
             * по идее ничего не надо перезагружать
             *!/
            return;

        }*/
        /**
         * Начинаем загружать элементы заново. Поэтому очищаем список загруженных элементов.
         * @type {*[]}
         */
        this.items.list = [];
        this.items.dict = {};

        while (this.DOM.scrolledItemsContainer.firstElementChild) {
            /** TODO теоретически можно не удалять все строки, а потом заново отрисовывать, а запрашивать по инедксам и по какому-нибудь признаку,
             *    определяющему, изменилась ли строка и есть ли она в текущей выборке. Если строка не изменилась и не исчезла из выборки, то ее можно не
             *    перезагружать и не тратить время на ее отрисовку, а запрашивать следующую
             */
            this.DOM.scrolledItemsContainer.removeChild(this.DOM.scrolledItemsContainer.lastElementChild);
        }
        /**
         * Перезагружаем каждый раз весь список отображаемых строк, т.к. источник мог измениться и scroller не может
         * решить, какие строки можно оставить при прокрутке без обновления, а какие строки надо обновлять.
         * Сам источник должен решать, какие строки можно закешировать, а какие нет.
         */

        this.DOM.wrapper.classList.add(ClassModel.ModeScroll);

        this.config.predefinedRowHeight ?
            this.loadPackageItems(requestIndex) :
            this.loadItemsOneByOne(requestIndex);

        /**
         * Если не загрузили ни одного элемента, надо попробовать в обратную сторону
         */

        this.DOM.wrapper.classList.remove(ClassModel.ModeScroll);

    };

    this.loadPackageItems = function(/** @type {number} */ requestIndex){
        let controlHeight = this.DOM.scrolledItemsContainer.offsetHeight;
        let elementsInfo = this.loadItems(requestIndex, Math.ceil(controlHeight / this.config.predefinedRowHeight));
        let i = 0;
        while (i < elementsInfo.length) {
            let elementInfo = elementsInfo[i++];
            elementInfo.getElement().classList.add(ClassModel.Transparent);
            this.appendOnViewportEnd(elementInfo.getElement());

            elementInfo.getElement().classList.remove(ClassModel.Transparent);
        }
    };
    this.loadItemsOneByOne = function(/** @type {number} */ requestIndex){
        let controlHeight = this.DOM.scrolledItemsContainer.offsetHeight;
        /**
         *
         * @type {ScrolledElement}|{undefined}
         */
        let elementInfo = undefined;
        let h = 0;

        controlHeight -= this.config.minExpectedRowHeight;

        while (h < controlHeight && (elementInfo = this.loadNextElement(requestIndex))) {
            /** Индекс первого элемента передали, после этого нужно позволить алгоритму самому инкрементировать индексные номера следующих загружаемых элементов набора, сбросив firstItemIndex в undefined */
            requestIndex = elementInfo.getIndex() + 1;

            elementInfo.getElement().classList.add(ClassModel.Transparent);
            this.appendOnViewportEnd(elementInfo.getElement());
            h += elementInfo.getOffsetHeight();
            elementInfo.getElement().classList.remove(ClassModel.Transparent);
        }
        /**
         * Если не нашли ни одного элемента, двигаясь вперед, двинемся назад и найдем хотя бы один элемент для отображения.
         */

        if (!this.items.list.length) {
            elementInfo = this.loadPrevElement(firstItemIndex - 1)
            if (elementInfo) {
                elementInfo.getElement().classList.add(ClassModel.Transparent);
                this.appendOnViewportEnd(elementInfo.getElement());
                elementInfo.getElement().classList.remove(ClassModel.Transparent);
            }
        }
        /**
         * Если у нас есть флаг максимального заполнения контейнера данными, будем запрашивать элементы из начала до тех пор,
         * пока они либо не закончатся, либо не заполнят область просмотра
         */
        if (
            this.config.alwaysFillContainer &&
            h < controlHeight
        ) {
            requestIndex = this.items.list[0].getIndex() - 1;
            while (h < controlHeight && (elementInfo = this.loadPrevElement(requestIndex))) {
                /** Индекс первого элемента передали, после этого нужно позволить алгоритму самому инкрементировать индексные номера следующих загружаемых элементов набора, сбросив firstItemIndex в undefined */
                requestIndex = elementInfo.getIndex() - 1;

                elementInfo.getElement().classList.add(ClassModel.Transparent);
                this.appendOnViewportBegin(elementInfo.getElement());
                h += elementInfo.getOffsetHeight();
                /**
                 * Здесь выполняем сравнение именно с высотой контейнера, а не с controlHeight, т.к. элемент вполне может поместиться
                 * в контейнер, оставив разницу менее minExpectedRowHeight
                 */
                if (h >= this.DOM.scrolledItemsContainer.offsetHeight) {
                    //С этим элементом контейнер уже переполнен - удалим его его
                    this.DOM.scrolledItemsContainer.removeChild(elementInfo.getElement());
                    delete this.items.dict[elementInfo.getIndex()];
                    this.items.list.shift();
                    break;
                }
                else {
                    elementInfo.getElement().classList.remove(ClassModel.Transparent);
                }
            }
        }
    };

    /**
     * Метод обеспечивает загрузку следующего элемента набора
     * Возвращает ScrolledElement в случае успеха и false, если элемент не был загружен
     * @returns {boolean|ScrolledElement}
     */
    this.loadNextElement = function(/** @type {number} */ nextItemIndex = undefined){
        return this.loadItem(1, nextItemIndex, false);
    };
    /**
     * Метод обеспечивает загрузку предыдущего элемента набора
     * Возвращает ScrolledElement в случае успеха и false, если элемент не был загружен
     * @returns {boolean|ScrolledElement}
     */
    this.loadPrevElement = function(/**@type {number} */prevItemIndex = undefined){
        return this.loadItem(-1, prevItemIndex , true);
    };

    this.loadItem = function(/** @type {number} */incrementValue, /** @type ScrolledElement|{number} */ refElement, /** @type {boolean} */ isToBegin){
        let element, elementInfo, elementIndex;
        /** Ищем индекс для следующего элемента */
        elementIndex = refElement instanceof ScrolledElement ? refElement.getIndex() + incrementValue : (refElement || 0);
        while (true) {
            element = /*this.items.items[elementIndex] || */this.config.getElement.call(this, elementIndex, incrementValue > 0? 'forward': 'backward');
            if (element === Scroller.getFlags().noElements) {
                /** Больше нет элементов, которые можно загрузить */
                return false;
            }
            else if (element !== Scroller.getFlags().skip) {
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
        /**
         * @type {ScrolledElement}
         */
        elementInfo = this.createLoadedElementInfoStorageItem(elementIndex, element);

        incrementValue > 0 ?
            this.items.list.push(elementInfo):
            this.items.list.unshift(elementInfo);

        this.items.dict[elementInfo.getIndex()] = elementInfo;

        elementInfo.getElement().classList.add('scrolled-item');

        return elementInfo;
    };

    this.loadItems = function(/** @type ScrolledElement|{number} */ refElement, /** @type {number} */ count){
        let element, elements, elementInfo, elementsInfo, elementIndex;
        /** Ищем индекс для следующего элемента */
        elementIndex = refElement instanceof ScrolledElement ? refElement.getIndex() : (refElement || 0);

        elements = /*this.items.items[elementIndex] || */this.config.getElements.call(this, elementIndex, count);
        if (elements === Scroller.getFlags().noElements) {
            /** Больше нет элементов, которые можно загрузить */
            return false;
        }
        if (elements === null || typeof elements === typeof undefined) {
            /** Больше нет элементов, которые можно загрузить */
            return false;
        }
        let i = 0;
        elementsInfo = []
        while (i < elements.length) {
            let element = elements[i];
            if (
                typeof element !== typeof {} ||
                element.nodeType !== Node.ELEMENT_NODE
            ) {
                throw 'Element must be a HTML node!';
            }
            /**
             * @type {ScrolledElement}
             */
            elementInfo = this.createLoadedElementInfoStorageItem(elementIndex + i, element);

            this.items.list.push(elementInfo);

            this.items.dict[elementInfo.getIndex()] = elementInfo;

            elementInfo.getElement().classList.add('scrolled-item');
            i++;
            elementsInfo.push(elementInfo);

        }

        return elementsInfo;
    };

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
                this.object.removeEventListener(this.type, this.callback);
            })
        }
    };

    this.resize = function(){
        this.updateScrollbarHeight();
        if (this.items.list.length) {
            this.loadItemsFromIndex(this.items.list[0].getIndex());
        }
    };

    this.getScrolledItemsContainer = function(){
        return this.config.DOM.scrolledItemsContainer;
    };
    /**
     * Метод возвращает список загруженных индексов
     * @returns {[]}
     */
    // this.getLoadedIndexes = function(){
    //     let res = [];
    //     for (let index in this.items.items) {
    //         res.push(index);
    //     }
    //
    //     return res;
    // };//Пока не используется нигде.
};


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
    //Количество прокручиваемых колесом мыши за один раз элементов
    this.scrollStepSize = 1;
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
        '.scroller-data-container .scrolled-item:last-child': 'flex-shrink: 1;',
        '.root-scrolled-container.no-scrollbar .scroller-scrollbar-container': 'width: 1px; opacity: 0; scrollbar-width: none;/**TODO position: absolute; heaight: 100%; opacity: 0;*/'
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
