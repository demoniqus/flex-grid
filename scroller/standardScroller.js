import {AbstractScroller} from "./abstractScroller.js";

function StandardScroller(p){
    this.config = p;
    this.wrap = function(){

        StandardScroller.prototype.wrap.call(this);

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

}

StandardScroller.prototype = new AbstractScroller();


export {StandardScroller}
