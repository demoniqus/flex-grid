"use strict";

export function FlexGridDataVisualizationComponentInterface (){
    this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
        throw 'Method \'buildReadForm\' is not implemented';
    };
    this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
        throw 'Method \'buildEditForm\' is not implemented';
    };

}



export function EmptyVisualizationComponent(){
    this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
        DOMContainer.innerHTML = '';
    };
    this.buildEditForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){
        DOMContainer.innerHTML = '';
    };

};
EmptyVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();

export function StringVisualizationComponent(){
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

}
StringVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();

export function TextVisualizationComponent(){
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

}
TextVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();

export function MoneyVisualizationComponent(){
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

}
MoneyVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();

export function BooleanVisualizationComponent(){
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

}
BooleanVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();

export function TreeVisualizationComponent(){
    this.expandedNode = '&#x25BC;';
    this.collapsedNode = '&#x25BA;';
    let f = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData){

        DOMContainer.innerHTML = gridElement.expanded() ?
            this.expandedNode :
            this.collapsedNode;
    };

    this.buildReadForm = f;
    this.buildEditForm = f;

}
TreeVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();

export function NumerableVisualizationComponent(){
    let f = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {GridElement}*/gridElement, /** @type {object}*/headerData, /** @type {int} */ indexRow){
        DOMContainer.innerHTML = indexRow + 1;
    };

    this.buildReadForm = f;
    this.buildEditForm = f;

}
NumerableVisualizationComponent.prototype = new FlexGridDataVisualizationComponentInterface();
