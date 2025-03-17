import {ScrollerFlags} from "./scrollerFlags.js";
import {ClassModel} from "./classModel.js";
import {ScrolledElement} from "./scrollerElement.js";

let pluginIds = {};
function AbstractScroller (){
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
            elementInfo = this.loadPrevElement(requestIndex - 1)
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
     * Метод обеспечивает загрузку следующего элемента набора.
     * Возвращает ScrolledElement в случае успеха и false, если элемент не был загружен
     * @returns {boolean|ScrolledElement}
     */
    this.loadNextElement = function(/** @type {number} */ nextItemIndex = undefined){
        return this.loadItem(1, nextItemIndex, false);
    };
    /**
     * Метод обеспечивает загрузку предыдущего элемента набора.
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
            if (element === ScrollerFlags.noElements) {
                /** Больше нет элементов, которые можно загрузить */
                return false;
            }
            else if (element !== ScrollerFlags.skip) {
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
        if (elements === ScrollerFlags.noElements) {
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
}

export {AbstractScroller}
