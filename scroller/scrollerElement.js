
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

}

export {ScrolledElement}
