"use strict";

import {Scroller} from './Scroller.js';
import {FlexPanel} from "./FlexPanel.js";
import {Dragger} from "./dragger/dragger.js";

export {FlexPanel} from "./FlexPanel.js";
export {Scroller} from './Scroller.js';



let pluginIds = {};

let ClassModel = Object.defineProperties(
    Object.create(null),
    {
        FlexGridPanel: {
            get: () => 'flex-grid-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridContainer: {
            get: () => 'flex-grid-container',
            configurable: false,
            enumerable: false,
        },
        FlexGridVerticalPanel: {
            get: () => 'flex-grid-vertical-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridHorizontalPanel: {
            get: () => 'flex-grid-horizontal-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridNowrappedPanel: {
            get: () => 'flex-grid-nowrapped-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridWrappedPanel: {
            get: () => 'flex-grid-wrapped-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridTopPanel: {
            get: () => 'flex-grid-top-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridLeftPanel: {
            get: () => 'flex-grid-left-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridRightPanel: {
            get: () => 'flex-grid-right-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridMiddlePanel: {
            get: () => 'flex-grid-middle-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridBottomPanel: {
            get: () => 'flex-grid-bottom-panel',
            configurable: false,
            enumerable: false,
        },
        FlexGridOptionsPanel: {
            get: () => 'flex-grid-options-panel',
            configurable: false,
            enumerable: false,
        },
    }
);


function VisualizerInterface(){
    this.init = () => {
        throw 'Define init method';
    };
    this.setHeaders = (/**@type {Object[]} */headers) => {
        throw 'Define setHeaders method';
    };
    this.setContainer = (/**@type {DOMElement|string} */container) => {
        throw 'Define setContainer method';
    };
    this.setCallbacks = (/**@type {callable{}}  */callbacks) => {
        throw 'Define setCallbacks method';
    };
    this.updatePreview = () => {
        throw 'Define updatePreview method';
    };
    this.updateColumnsWidth = function(/**@type {Object[]|string[]|null} */columns){
        throw 'Define updateColumnsWidth method';
    };
    this.setColumnWidth = function(/**@type {Object|string} */column, /**@type {int} */width){
        throw 'Define setColumnWidth method';
    };
    this.getContainer = function(){
        throw 'Define getContainer method';
    }

    return this;
};

function abstractVisualizer()
{
    this.id = null;
    this.pub = undefined;
    this.config = {};
    this.DOM = {
        container: undefined,
        middlePanel: undefined,
        topPanel: undefined,
        leftPanel: undefined,
        rightPanel: undefined,
        bottomPanel: undefined,
        contentPanel: undefined,
        centralPanel: undefined,
        headerPanel: undefined,
        filterPanel: undefined,
        dataPanel: undefined,
        footerPanel: undefined,
        contentRightPanel: undefined,
    };
    this.panels = {
        topPanel: undefined,
        leftPanel: undefined,
        rightPanel: undefined,
        bottomPanel: undefined,
        footerPanel: undefined,
        contentRightPanel: undefined,
    };
    this.callbacks = {
        getItemsCount: function(){return 0;},
        getElement: function(){return document.createElement('div');},
        getElements: function(){return [document.createElement('div')];},
    };
    this.styleContainer = null;
    this.sizesStyleContainer = null;
    this.orderStyleContainer = null;
    this.widthUnit = 'px';
    this.headers = {
        leafs: null,
        nodes: null,
        dict: null,
    };
    this.wrapped = false;//Флаг, указывающий, что компоненты обертки созданы

    this.styles = {//TODO Организовать
        '.flex-grid-container': 'display: flex; flex-direction: column; overflow-x: hidden; overflow-y: hidden;',
        '.flex-grid-panel': 'box-sizing: border-box; display: flex; overflow: hidden;',
        '.flex-grid-panel.flex-grid-horizontal-panel': 'flex-direction: row;',
        '.flex-grid-panel.flex-grid-vertical-panel': 'flex-direction: column;',
        '.flex-grid-panel.flex-grid-nowrapped-panel': 'flex-wrap: nowrap; align-items: stretch;',
        '.flex-grid-panel.flex-grid-wrapped-panel': 'flex-wrap: wrap; ',
        '.flex-grid-top-panel' : 'overflow: visible;',
        '.flex-grid-middle-panel' : 'flex-grow: 1;',
        '.flex-grid-bottom-panel' : 'overflow-y: visible;',
        '.flex-grid-left-panel' : '',
        '.flex-grid-central-panel' : 'flex-grow: 1;',
        '.flex-grid-right-panel' : '',
        '.flex-grid-content-panel' : 'flex-grow: 1; overflow-x: visible;',
        '.flex-grid-content-right-panel' : '',
        '.flex-grid-header-panel': 'flex-grow: 0; overflow: visible; /*padding-right: 16px;*/',
        '.flex-grid-filter-panel' : 'overflow: visible;',
        '.flex-grid-data-panel': 'flex-grow:1; overflow-y: hidden; overflow-x: visible;',
        '.flex-grid-footer-panel' : 'overflow: visible;',
        '.flex-grid-row': 'flex-wrap: nowrap; display: flex; align-items: stretch; overflow: visible;',
        '.flex-grid-cell': 'margin: 0 !important; box-sizing: border-box !important; padding: 0px 5px; border: 1px solid grey; overflow: visible; text-wrap: wrap; word-break: break-all;',
        '.flex-grid-header-cell': 'text-align: center; font-weight: bold; background-color: rgba(100, 180, 130, .3);',
        '.flex-grid-header-cell.virtual-header': 'border-bottom-color: transparent;',
        '.flex-grid-header-cell.has-virtual-parent': 'border-top-color: transparent;',
        '.flex-grid-headers-row:not(:first-child) .flex-grid-header-cell.virtual-header': 'border-top-color: transparent;',
        '.flex-grid-data-cell': '',
        '.flex-grid-row.flex-grid-data-row': 'overflow-x: visible; overflow-y: hidden; flex-grow: 0; flex-shrink: 0;',
        '.flex-grid-row.flex-grid-data-row:hover .flex-grid-cell.flex-grid-data-cell': '--brd-clr: lime; border-top-color: var(--brd-clr); border-bottom-color: var(--brd-clr);',
        '.flex-grid-row.flex-grid-data-row.selected-row': 'background-color: rgba(220, 220, 220, .5);',
        '.flex-grid-row.flex-grid-filters-row .flex-grid-filter-cell': 'text-align: center; padding: 5px 0px; display: flex; flex-direction: column; row-gap: 2px;',
        '.flex-grid-filter-panel .flex-grid-filter-component-container': 'display: flex; flex-direction: row; flex-wrap: nowrap; box-sizing: border-box;  align-items: center; width: 100%; min-width: 100%; max-width: 100%; position: relative; column-gap: 2px;',
        '.flex-grid-filter-panel .flex-grid-filter-component-container .flex-grid-filter-field': 'display: flex; flex-direction: row; align-items: stretch; flex-grow: 1; /*padding-right: 16px; width: calc(100% - 4px); min-width: calc(100% - 4px); max-width: calc(100% - 4px);*/',
        '.flex-grid-filter-panel .flex-grid-filter-component-container .flex-grid-filter-field .form-control-container': 'flex-shrink: 100;',
        '.flex-grid-filter-panel .flex-grid-filter-component-container .flex-grid-filter-field .flex-grid-filter-option': 'border: 1px solid #ced4da; padding: 0px; flex-grow: 1;',
        '.flex-grid-filter-panel .flex-grid-filter-component-container input, .flex-grid-filter-panel .flex-grid-filter-component-container select': '/*--w: calc(100% - 20px); max-width: var(--w); min-width: var(--w); var(--w);*/ box-sizing: border-box;',
        '.flex-grid-filter-component-options-container': 'display: flex; justify-content: center; column-gap: 2px; flex-wrap: wrap;',
        '.string-filter-option': 'text-wrap: nowrap !important; font-size: .6rem; padding: 2px; ',
        '.flex-grid-filter-panel .flex-grid-filter-component-container .filter-reset-button': 'padding: 3px; line-height: 1;',
        '.flex-grid-filter-component-container': '',


        '.flex-grid-container .flex-grid-header-panel.spinner': 'display: block; box-sizing: border-box; border: 1px solid lime; height: 20%; min-height: 40px; border-radius: 20px;',
        '.flex-grid-container .flex-grid-data-panel.spinner': 'display: block; box-sizing: border-box; border: 1px solid lime; height: 80%; min-height: 40px; border-radius: 20px;',


        '.flex-grid-footer-panel .button': 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;',
        '.flex-grid-left-panel .button': 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;',
        '.flex-grid-left-panel .button-wrapper': 'display: inline-block; box-sizing: border-box; ',
        '.flex-grid-right-panel .button': 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;',
        '.flex-grid-content-right-panel .button': 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;',
        '.flex-grid-bottom-panel .button': 'display: inline-block; box-sizing: border-box; width: 75px; min-width: 75px; max-width: 75px; height: 25px; min-height: 25px; max-height: 25px; border: 1px solid grey; border-radius: 5px; margin: 5px; text-align: center;',

    };

    this.sizeStyles = {
        /**
         * Размеры компонентов могут активно и часто меняться, поэтому для них выделим отдельный style-объект, чтобы
         * как можно меньше нужно было парсить стилей
         */
    };
    this.orderStyles = {};
    this.initContainer = function(){

        /**
         * Вычищаем всё содержимое
         */
        while (this.DOM.container.firstChild) {
            this.DOM.container.removeChild(this.DOM.container.lastChild);
        }
        this.DOM.container.classList.add(ClassModel.FlexGridContainer);
        this.DOM.container.classList.add(ClassModel.FlexGridPanel);
        this.DOM.container.classList.add(ClassModel.FlexGridVerticalPanel);
        this.DOM.container.classList.add(ClassModel.FlexGridNowrappedPanel);
        this.DOM.container.classList.add(this.getRootClassName());
        // this.styles['.flex-grid-' + this.id] = 'display: flex; flex-direction: column; overflow-x: auto; overflow-y: hidden;'
    };

    this.getRootClassName = function(){
        return 'flex-grid-' + this.id;
    };

    this.createId = function(){
        let r;
        while ((r = 'defaultGridVisualizer_' + (Math.ceil(Math.random() * 1000000) + 1)) in pluginIds) {}
        this.id = r;
        pluginIds[r] = true;// true instead of this to avoid memory leak
    };
    this.createTopPanel = function(){
        this.DOM.topPanel = document.createElement('div');
        this.DOM.topPanel.id = 'top-panel-' + this.id;
        this.DOM.topPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.topPanel.classList.add(ClassModel.FlexGridOptionsPanel);
        this.DOM.topPanel.classList.add(ClassModel.FlexGridTopPanel);
        this.DOM.topPanel.classList.add(ClassModel.FlexGridHorizontalPanel);
        this.DOM.container.appendChild(this.DOM.topPanel);
        this.panels.topPanel = new FlexPanel.Panel(
            {
                panel: this.DOM.topPanel,
                orientation: FlexPanel.OrientationModel.Horizontal,
            }
        );
    };
    this.createMiddlePanel = function(){
        this.DOM.middlePanel = document.createElement('div');
        this.DOM.middlePanel.id = 'middle-panel-' + this.id;
        this.DOM.middlePanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.middlePanel.classList.add('flex-grid-middle-panel');
        this.DOM.middlePanel.classList.add(ClassModel.FlexGridHorizontalPanel);
        this.DOM.middlePanel.classList.add(ClassModel.FlexGridNowrappedPanel);
        this.DOM.container.appendChild(this.DOM.middlePanel);
    };
    this.createBottomPanel = function(){
        this.DOM.bottomPanel = document.createElement('div');
        this.DOM.bottomPanel.id = 'bottom-panel-' + this.id;
        this.DOM.bottomPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.bottomPanel.classList.add(ClassModel.FlexGridOptionsPanel);
        this.DOM.bottomPanel.classList.add('flex-grid-bottom-panel');
        this.DOM.bottomPanel.classList.add(ClassModel.FlexGridHorizontalPanel);
        this.DOM.bottomPanel.classList.add(ClassModel.FlexGridWrappedPanel);
        this.DOM.container.appendChild(this.DOM.bottomPanel);
        this.panels.bottomPanel = new FlexPanel.Panel(
            {
                panel: this.DOM.bottomPanel,
                orientation: FlexPanel.OrientationModel.Horizontal,
            }
        );
        let c = 20;
        while (c) {
            let option = document.createElement('div');
            option.classList.add('button');
            option.innerHTML = c;
            c--;
            this.DOM.bottomPanel.appendChild(option);
        }
    };
    this.createLeftPanel = function(){
        this.DOM.leftPanel = document.createElement('div');
        this.DOM.leftPanel.id = 'left-panel-' + this.id;
        this.DOM.leftPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.leftPanel.classList.add(ClassModel.FlexGridOptionsPanel);
        this.DOM.leftPanel.classList.add('flex-grid-left-panel');
        this.DOM.leftPanel.classList.add(ClassModel.FlexGridVerticalPanel);
        this.DOM.leftPanel.classList.add(ClassModel.FlexGridWrappedPanel);
        this.DOM.middlePanel.appendChild(this.DOM.leftPanel);
        this.panels.leftPanel = new FlexPanel.Panel(
            {
                panel: this.DOM.leftPanel,
                orientation: FlexPanel.OrientationModel.Vertical,
            }
        );
        // let c = 40;
        // let options = [];
        // let i = 0;
        // while (i < c) {
        //     let optionWrapper = document.createElement('div');
        //     let option = document.createElement('div');
        //     optionWrapper.appendChild(option)
        //     optionWrapper.classList.add('button-wrapper');
        //     option.classList.add('button');
        //     option.innerHTML = i;
        //     i++;
        //     this.panels.leftPanel.addItem('option-' + i, optionWrapper);
        //     options.push(option)
        // }
    };
    this.createRightPanel = function(){
        this.DOM.rightPanel = document.createElement('div');
        this.DOM.rightPanel.id = 'right-panel-' + this.id;
        this.DOM.rightPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.rightPanel.classList.add(ClassModel.FlexGridOptionsPanel);
        this.DOM.rightPanel.classList.add('flex-grid-right-panel');
        this.DOM.rightPanel.classList.add(ClassModel.FlexGridVerticalPanel);
        this.DOM.rightPanel.classList.add(ClassModel.FlexGridWrappedPanel);
        this.DOM.middlePanel.appendChild(this.DOM.rightPanel);
        this.panels.rightPanel = new FlexPanel.Panel(
            {
                panel: this.DOM.rightPanel,
                orientation: FlexPanel.OrientationModel.Vertical,
            }
        );
        // let c = 20;
        // while (c) {
        //     let option = document.createElement('div');
        //     option.classList.add('button');
        //     option.innerHTML = c;
        //     c--;
        //     this.DOM.rightPanel.appendChild(option);
        // }
    };
    this.createCentralPanel = function(){
        this.DOM.centralPanel = document.createElement('div');
        this.DOM.centralPanel.id = 'central-panel-' + this.id;
        this.DOM.centralPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.centralPanel.classList.add('flex-grid-central-panel');
        this.DOM.centralPanel.classList.add(ClassModel.FlexGridHorizontalPanel);
        this.DOM.centralPanel.classList.add(ClassModel.FlexGridNowrappedPanel);
        this.DOM.middlePanel.appendChild(this.DOM.centralPanel);
    };
    this.createContentRightPanel = function(){
        this.DOM.contentRightPanel = document.createElement('div');
        this.DOM.contentRightPanel.id = 'contentRight-panel-' + this.id;
        this.DOM.contentRightPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.contentRightPanel.classList.add(ClassModel.FlexGridOptionsPanel);
        this.DOM.contentRightPanel.classList.add('flex-grid-content-right-panel');
        this.DOM.contentRightPanel.classList.add(ClassModel.FlexGridVerticalPanel);
        this.DOM.contentRightPanel.classList.add(ClassModel.FlexGridNowrappedPanel);
        this.DOM.centralPanel.appendChild(this.DOM.contentRightPanel);
        this.panels.contentRightPanel = new FlexPanel.Panel(
            {
                panel: this.DOM.contentRightPanel,
                orientation: FlexPanel.OrientationModel.Vertical,
            }
        );
        let c = 20;
        while (c) {
            let option = document.createElement('div');
            option.classList.add('button');
            option.innerHTML = c;
            c--;
            this.DOM.contentRightPanel.appendChild(option);
        }
    };
    this.createContentPanel = function(){
        this.DOM.contentPanel = document.createElement('div');
        this.DOM.contentPanel.id = 'content-panel-' + this.id;
        this.DOM.contentPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.contentPanel.classList.add('flex-grid-content-panel');
        this.DOM.contentPanel.classList.add(ClassModel.FlexGridVerticalPanel);
        this.DOM.contentPanel.classList.add(ClassModel.FlexGridNowrappedPanel);
        this.DOM.centralPanel.appendChild(this.DOM.contentPanel);
    };
    this.createHeaderPanel = function(){
        this.DOM.headerPanel = document.createElement('div');
        this.DOM.headerPanel.id = 'header-panel-' + this.id;
        this.DOM.headerPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.headerPanel.classList.add('flex-grid-header-panel');
        this.DOM.headerPanel.classList.add(ClassModel.FlexGridVerticalPanel);
        this.DOM.headerPanel.classList.add(ClassModel.FlexGridNowrappedPanel);
        this.DOM.contentPanel.appendChild(this.DOM.headerPanel);
    };
    this.createFilterPanel = function(){
        this.DOM.filterPanel = document.createElement('div');
        this.DOM.filterPanel.id = 'filter-panel-' + this.id;
        this.DOM.filterPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.filterPanel.classList.add('flex-grid-filter-panel');
        this.DOM.filterPanel.classList.add(ClassModel.FlexGridHorizontalPanel);
        this.DOM.filterPanel.classList.add(ClassModel.FlexGridNowrappedPanel);
        this.DOM.contentPanel.appendChild(this.DOM.filterPanel);
    };
    this.createDataPanel = function(){
        this.DOM.dataPanel = document.createElement('div');
        this.DOM.dataPanel.id = 'data-panel-' + this.id;
        this.DOM.dataPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.dataPanel.classList.add('flex-grid-data-panel');
        this.DOM.dataPanel.classList.add(ClassModel.FlexGridVerticalPanel);
        this.DOM.dataPanel.classList.add(ClassModel.FlexGridNowrappedPanel);
        this.DOM.contentPanel.appendChild(this.DOM.dataPanel);
    };
    this.createFooterPanel = function(){
        this.DOM.footerPanel = document.createElement('div');
        this.DOM.footerPanel.id = 'footer-panel-' + this.id;
        this.DOM.footerPanel.classList.add(ClassModel.FlexGridPanel);
        this.DOM.footerPanel.classList.add(ClassModel.FlexGridOptionsPanel);
        this.DOM.footerPanel.classList.add('flex-grid-footer-panel');
        this.DOM.footerPanel.classList.add(ClassModel.FlexGridHorizontalPanel);
        this.DOM.footerPanel.classList.add(ClassModel.FlexGridWrappedPanel);
        this.DOM.contentPanel.appendChild(this.DOM.footerPanel);
        this.panels.footerPanel = new FlexPanel.Panel(
            {
                panel: this.DOM.footerPanel,
                orientation: FlexPanel.OrientationModel.Horizontal,
            }
        );
        let c = 20;
        while (c) {
            let option = document.createElement('div');
            option.classList.add('button');
            option.innerHTML = c;
            c--;
            this.DOM.footerPanel.appendChild(option);
        }
    };


    this.createStyleElement = function(){
        //TODO Добавить префикс - корневой класс типа '.flex-grid-visualizer-' + this.id, чтобы стили влияли только на используемый DOM-контейнер
        this.styleContainer = document.createElement('style');
        this.styleContainer.id = 'flex-grid-visualizer-style-container-' + this.id;
        document.getElementsByTagName('head')[0].appendChild(this.styleContainer);
    };
    this.createOrderStyleElement = function(){
        //TODO Добавить префикс - корневой класс типа '.flex-grid-visualizer-' + this.id, чтобы стили влияли только на используемый DOM-контейнер
        this.orderStyleContainer = document.createElement('style');
        this.orderStyleContainer.id = 'flex-grid-visualizer-order-style-container-' + this.id;
        document.getElementsByTagName('head')[0].appendChild(this.orderStyleContainer);
    };
    this.createSizesStyleElement = function(){
        this.sizesStyleContainer = document.createElement('style');
        this.sizesStyleContainer.id = 'flex-grid-visualizer-sizes-style-container-' + this.id;
        document.getElementsByTagName('head')[0].appendChild(this.sizesStyleContainer);
    };
    this.updateStyleElement = function(){//TODO Возможно, общие для всех экземпляров стили будут вынесены в отдельный CSS-файл
        let styles = '';
        for (let styleId in this.styles) {
            styles += styleId + ' {' + this.styles[styleId] + '}' + "\n"
        }
        this.styleContainer.textContent = styles;
    };
    this.updateSizesStyleElement = function(){
        let styles = '';
        let rootClassName = '.' + this.getRootClassName() + ' ';
        for (let styleId in this.sizeStyles) {
            let selector = styleId
                .split(',')
                .map(function(selector){return rootClassName + selector;})
                .join(',');
            styles += selector + ' {' + this.sizeStyles[styleId] + '}' + "\n"
        }
        this.sizesStyleContainer.textContent = styles;
    };
    this.updateOrderStyleElement = function(){
        let iRow = 0;
        while (iRow < this.headers.nodes.length) {
            let iCell = 0;
            while (iCell < this.headers.nodes[iRow].length) {
                let headerData = this.headers.nodes[iRow][iCell];
                let selector = '.flex-grid-nodal-headers-row-lvl' + iRow +
                    ' .' + headerData.id.replaceAll('.', '_');
                this.orderStyles[selector] = 'order: ' + iCell + ';';
                iCell++;
            }
            iRow++;
        }

        let iCell = 0;
        let selectors = {
            '.flex-grid-row .flex-grid-leaf-header-cell': true,
            '.flex-grid-row .flex-grid-filter-cell': true,
            '.flex-grid-row .flex-grid-data-cell': true,

        };
        while (iCell < this.headers.leafs.length) {
            let headerData = this.headers.leafs[iCell];
            let idClass = headerData.id.replaceAll('.', '_');
            for (let selector in selectors) {

                selector += '.' + idClass;
                this.orderStyles[selector] = 'order: ' + iCell + ';';
            }
            iCell++;

        }
        let styles = '';
        let rootClassName = '.' + this.getRootClassName() + ' ';
        for (let styleId in this.orderStyles) {
            styles += rootClassName + styleId + ' {' + this.orderStyles[styleId] + '}' + "\n"
        }
        this.orderStyleContainer.textContent = styles;
    };
    this.wrap = function(){
        if (!this.wrapped) {

            this.initContainer();
            this.createTopPanel();
            this.createMiddlePanel();
            this.createBottomPanel();
            this.createLeftPanel();
            this.createCentralPanel();
            this.createRightPanel();
            this.createContentPanel();
            this.createContentRightPanel();
            this.createHeaderPanel();
            this.createFilterPanel();
            this.createDataPanel();
            this.createFooterPanel();
            this.createStyleElement();
            this.createSizesStyleElement();
            this.createOrderStyleElement();
            this.wrapped = true;
        }
        this.setSpinners();
    };
    /**
     * TODO Стилизация сортированных заголовков
     *   .flex-grid-cell.flex-grid-header-cell.flex-grid-leaf-header-cell::before {
            content: '';
            position: absolute;
            background-image: url(https://storage.googleapis.com/multi-static-content/thumbs/artage-io-thumb-dbe8894….png);
            background-size: 100%;
            right: 0;
            bottom: 0;
            z-index: 0;
            width: 20px;
            height: 20px;
            max-width: 20px;
            max-height: 20px;
             //min-width: 100%;
             //min-height: 100%;
            display: inline-block;
            opacity: .4;
        }
     */

    /** TODO На ячейках таблицы можно для визуального эффекта поиграться с небольшим (3-5px) скруглением углов ячеек
     *
     */

    this.setSpinners = function(){
        let div;
        /**
         * Вычищаем всё содержимое
         */
        while (this.DOM.headerPanel.firstChild) {
            this.DOM.headerPanel.removeChild(this.DOM.headerPanel.lastChild);
        }
        let caption = 'LOADING'.split('');
        caption = caption.reverse();
        for (let i = 0 ; i < caption.length; i++) {
            div = document.createElement('div');
            div.innerHTML = caption[i];
            this.DOM.headerPanel.appendChild(div);
        }
        this.DOM.headerPanel.classList.add('spinner-loading');
        this.DOM.headerPanel.classList.add('spinner');
        /**
         * Вычищаем всё содержимое
         */
        while (this.DOM.dataPanel.firstChild) {
            this.DOM.dataPanel.removeChild(this.DOM.headerPanel.lastChild);
        }
        let divWrapper = document.createElement('div');
        divWrapper.classList.add('spinner-wrapper')
        this.DOM.dataPanel.appendChild(divWrapper);

        div = document.createElement('div');
        div.classList.add('inner')
        div.classList.add('one');
        divWrapper.appendChild(div);

        div = document.createElement('div');
        div.classList.add('inner')
        div.classList.add('two');
        divWrapper.appendChild(div);

        div = document.createElement('div');
        div.classList.add('inner')
        div.classList.add('three');
        divWrapper.appendChild(div);


        this.DOM.dataPanel.classList.add('spinner-atomic');
        this.DOM.dataPanel.classList.add('spinner');

    };
    this.setHeaderAsDraggable = function(cell){
        let priv = this;
        Dragger
            .initDraw(
                {
                    drawElement: cell
                }
            )
            .initAcceptor(
                {
                    acceptorElement: cell,
                    onDrop: function(draggedCell, acceptorCell){
                        if (
                            !draggedCell.classList.contains('flex-grid-header-cell') ||
                            //Заголовки можно перемещать только внутри одной таблицы
                            draggedCell.parentElement.parentElement !== acceptorCell.parentElement.parentElement
                        ) {
                            //TODO Можно вытащить с отдельную настройку конфига типа isAccepted = function():bool {}
                            //Не принимаем прочие элементы, которые может сюда перетащить пользователь.
                            // Можно даже выбрасывать сообщение, но проще не реагировать на неверные действия
                            return;
                        }
                        let draggedHeader = draggedCell.headerData;
                        let acceptorHeader = acceptorCell.headerData;
                        let changeOrder = false;

                        let reorder = function(collection, d, a){
                            let i = 0;
                            let h;
                            let c = [];
                            while (h = collection[i++]) {
                                if (h === d) {
                                    continue;
                                }
                                c.push(h);
                                if (h === a) {
                                    c.push(d);
                                }
                            }
                            return c;
                        };
                        let reorder2 = function(lvl){
                            let i = lvl;
                            let l = priv.headers.nodes.length - 1;
                            while (i < l) {
                                let c = [];
                                for (let x = 0; x < priv.headers.nodes[i].length; x++) {
                                    c.splice(c.length, 0, ...priv.headers.nodes[i][x].children);
                                }
                                priv.headers.nodes[i + 1] = c;
                                i++;
                            }

                            let c = [];
                            for (let x = 0; x < priv.headers.nodes[l].length; x++) {
                                c.splice(c.length, 0, ...priv.headers.nodes[l][x].children);
                            }
                            priv.headers.leafs = c;
                        };

                        if (draggedHeader.parent === acceptorHeader.parent) {
                            //Общий родитель, либо есть только листовые заголовки
                            if (draggedHeader.parent) {
                                //Переупорядочиваем внутри родителя
                                draggedHeader.parent.children = reorder(draggedHeader.parent.children, draggedHeader, acceptorHeader);
                            }
                            if (draggedHeader.leaf) {
                                // Перемещен листовой заголовок - переупорядочиваем листовые заголовки
                                //parent-уровня может не быть, поэтому тут нельзя применить другую тактику упорядочивания заголовков
                                priv.headers.leafs = reorder(priv.headers.leafs, draggedHeader, acceptorHeader);
                            }
                            else {
                                //Перемещен узловой заголовок - переупорядочиваем заголовки на текущем уровне и ниже
                                priv.headers.nodes[draggedHeader.lvl] = reorder(priv.headers.nodes[draggedHeader.lvl], draggedHeader, acceptorHeader);
                                reorder2(draggedHeader.lvl);
                            }
                            changeOrder = true;
                        }
                        else {
                            let lvl = false;
                            //Родитель отличается. Проверим, находятся ли оба заголовка в одной ветке и если
                            // это так, то какой из заголовков является их общим предком
                            let topAcceptorHeader = acceptorHeader, topDraggedHeader = draggedHeader;
                            while (topAcceptorHeader.parent) {
                                topAcceptorHeader = topAcceptorHeader.parent;
                            }
                            while (topDraggedHeader.parent) {
                                topDraggedHeader = topDraggedHeader.parent;
                            }

                            if (topDraggedHeader === topAcceptorHeader) {
                                //Заголовки находятся в общей ветке
                                //Поищем их общего ближайшего предка
                                let acceptorAncestor = acceptorHeader, draggedAncestor = draggedHeader;
                                while (acceptorAncestor.lvl < draggedAncestor.lvl) {
                                    acceptorAncestor = acceptorAncestor.parent;
                                }

                                while (draggedAncestor.lvl < acceptorAncestor.lvl) {
                                    draggedAncestor = draggedAncestor.parent;
                                }
                                //Теперь draggedAncestor и acceptorAncestor находятся на одном уровне - ищем общего предка
                                // (т.к. есть общий корневой элемент, то и общий предок в любом случае есть, даже если это корневой узел)


                                while (draggedAncestor.parent !== acceptorAncestor.parent) {
                                    draggedAncestor = draggedAncestor.parent;
                                    acceptorAncestor = acceptorAncestor.parent;
                                }

                                if (draggedAncestor.parent === topDraggedHeader) {
                                    //Общим оказался только корневой заголовок - в этом случае нечего переставлять
                                    return;

                                }
                                lvl  = draggedAncestor.lvl
                                topDraggedHeader = draggedAncestor;
                                topAcceptorHeader = acceptorAncestor;
                                // priv.headers.nodes[lvl] = reorder(priv.headers.nodes[lvl], draggedAncestor, acceptorAncestor);
                                // reorder2(lvl);
                                // changeOrder = true;

                                //TODO это заголовки в одной ветке
                                // тут надо перемещать в рамках одного уровня
                                //  еще сделать компонент для ширины колонок в панель ,
                                //  еще сделать кнопки для включения режимов перетаскивания колонок и изменения их ширины
                                // return;
                            }
                            else {
                                //Заголовки в разных ветках.
                                //В этом случае можно переставить местами сразу две ветки заголовков
                                lvl = 0;
                            }
                            priv.headers.nodes[lvl] = reorder(priv.headers.nodes[lvl], topDraggedHeader, topAcceptorHeader);
                            reorder2(lvl);
                            changeOrder = true;


                        }



                        changeOrder && priv.updateOrderStyleElement();


                    }
                }
            )
        ;
    };
    this.setHeadersHandlers = function(){
        let iRow = 0;
        while (iRow < this.headers.nodes.length) {
            let iCell = 0;

            while (iCell < this.headers.nodes[iRow].length) {
                let headerData = this.headers.nodes[iRow][iCell];
                let row = headerData.DOM.row;
                let cell = headerData.DOM.cell;

                if (headerData.draggable) {
                    cell.setAttribute('draggable', 'true');
                    this.setHeaderAsDraggable(cell);
                }


                iCell++;
            }
            iRow++;
        }





        let iCell = 0;
        while (iCell < this.headers.leafs.length) {
            let headerData = this.headers.leafs[iCell];
            let row = headerData.DOM.row;
            let cell = headerData.DOM.cell;
            if (headerData.draggable) {
                cell.setAttribute('draggable', 'true');
                this.setHeaderAsDraggable(cell);
            }

            iCell++;

        }
    };
    this.createFilters = function(){
        let filtersExists = false;

        let filtersRow = document.createElement('div');
        filtersRow.id = 'flex-grid-filters-row-' + this.id;
        filtersRow.classList.add('flex-grid-row');
        filtersRow.classList.add('flex-grid-filters-row');

        let iCell = 0;
        while (iCell < this.headers.leafs.length) {
            let headerData = this.headers.leafs[iCell];
            let cell = document.createElement('div');
            let idClass = headerData.id.replaceAll('.', '_');
            cell.classList.add('flex-grid-cell');
            cell.classList.add('flex-grid-filter-cell');
            cell.classList.add(idClass);
            cell.name = 'flex-grid-filter-' + headerData.id;
            filtersRow.appendChild(cell);
            headerData.DOM.filterCell = cell;
            if (headerData.getFilter)
            {
                /**
                 * @type {FlexGridDataFilterComponentInterface}
                 */
                let filter = headerData.getFilter(
                    headerData.id,
                    headerData
                );
                filter && (filtersExists = true, filter.buildFilterForm(cell, headerData.id, headerData));
            }
            iCell++;

        }

        while (this.DOM.filterPanel.firstChild) {
            this.DOM.headerPanelfilterPanel.removeChild(this.DOM.filterPanel.lastChild);
        }


        this.DOM.filterPanel.appendChild(filtersRow);

        if (!filtersExists) {
            this.DOM.filterPanel.style.display = 'none;'
        }

    };
    this.createHeaders = function(){
        this.DOM.headerPanel.classList.remove('spinner')
        this.DOM.headerPanel.classList.remove('spinner-loading')
        while (this.DOM.headerPanel.firstChild) {
            this.DOM.headerPanel.removeChild(this.DOM.headerPanel.lastChild);
        }
        let iRow = this.headers.nodes.length - 1;
        while (this.headers.nodes[iRow]) {
            let iCell = 0;
            while (iCell < this.headers.nodes[iRow].length) {
                let headerData = this.headers.nodes[iRow][iCell];
                if (
                    // headerData.virtual &&
                    headerData.children.length === 1
                ) {
                    let child = headerData.children[0];
                    if (child.extClass) {
                        headerData.extClass = child.extClass;
                    }
                    else {
                        let extClass = [];
                        extClass.push(child.id);
                        headerData.extClass = extClass;
                    }


                }
                iCell++;
            }

            iRow--;
        }

        iRow = 0;
        while (iRow < this.headers.nodes.length) {
            let headersRow = document.createElement('div');
            headersRow.id = 'flex-grid-nodal-headers-row-lvl' + iRow + '-' + this.id;
            headersRow.classList.add('flex-grid-row');
            headersRow.classList.add('flex-grid-headers-row');
            headersRow.classList.add('flex-grid-headers-row-lvl' + iRow);
            headersRow.classList.add('flex-grid-nodal-headers-row');
            headersRow.classList.add('flex-grid-nodal-headers-row-lvl' + iRow);
            headersRow.dataset.lvl = iRow;
            let iCell = 0;

            while (iCell < this.headers.nodes[iRow].length) {
                let headerData = this.headers.nodes[iRow][iCell];
                headerData.lvl = iRow;
                let cell = document.createElement('div');
                cell.classList.add('flex-grid-cell');
                cell.classList.add('flex-grid-header-cell');
                cell.classList.add('flex-grid-nodal-header-cell');
                cell.classList.add(headerData.id.replaceAll('.', '_'));
                cell.headerData = headerData;
                if (headerData.extClass) {
                    let iClass = 0;
                    while (headerData.extClass[iClass]) {
                        cell.classList.add(headerData.extClass[iClass].replaceAll('.', '_'));
                        iClass++;
                    }
                }

                if (headerData.virtual) {
                    cell.classList.add('virtual-header');
                }
                if (headerData.parent && headerData.parent.virtual) {
                    cell.classList.add('has-virtual-parent');
                }
                cell.innerHTML = headerData.title;
                cell.name = 'flex-grid-header-' + headerData.id;
                headersRow.appendChild(cell);
                headerData.DOM = {
                    cell: cell,
                    row: headersRow,
                };
                iCell++;
            }
            this.DOM.headerPanel.appendChild(headersRow);
            iRow++;
        }

        let headersRow = document.createElement('div');
        headersRow.id = 'flex-grid-leafs-headers-row-' + this.id;
        headersRow.classList.add('flex-grid-row');
        headersRow.classList.add('flex-grid-headers-row');
        headersRow.classList.add('flex-grid-leafs-headers-row');

        let iCell = 0;
        while (iCell < this.headers.leafs.length) {
            let headerData = this.headers.leafs[iCell];
            headerData.lvl = this.headers.nodes.length;
            let cell = document.createElement('div');
            let idClass = headerData.id.replaceAll('.', '_');
            cell.classList.add('flex-grid-cell');
            cell.classList.add('flex-grid-header-cell');
            cell.classList.add('flex-grid-leaf-header-cell');
            cell.classList.add(idClass);
            cell.headerData = headerData;
            //TODO Для экономии места можно сделать длинные заголовки без возможности переноса с text-overflow: ellipsis и text-wrap: nowrap, а также устанавливать title для листовых заголовков

            if (headerData.parent && headerData.parent.virtual) {
                cell.classList.add('has-virtual-parent');
            }

            cell.innerHTML = headerData.title;
            cell.name = 'flex-grid-header-' + headerData.id;
            headersRow.appendChild(cell);

            headerData.DOM = {
                cell: cell,
                row: headersRow,
            };
            iCell++;

        }

        this.DOM.headerPanel.appendChild(headersRow);
        this.updateColumnsWidth();
        this.updateOrderStyleElement();
        this.setHeadersHandlers();
    };
    this.updateColumnsWidth = function (/**@type {Object[]|string[]|null} */columns){
        let totalWidth = 0;
        let iCell = 0;
        let widths = {};
        let leafHeadersWidth = {};

        columns = columns || this.headers.leafs;
        while (iCell < columns.length) {
            let headerData = columns[iCell];
            typeof headerData === typeof 'aaa' && (headerData = this.headers.dict[headerData]);
            if (!headerData.leaf) {
                //Изменить ширину можно только для листового заголовка. Ширина узловых заголовков определяется как сумма дочерних
                throw 'Header must be leaf';
            }
            let width = typeof headerData.width === typeof function(){} ?
                +headerData.width() :
                +headerData.width;

            let idClass = headerData.id.replaceAll('.', '_');
            this.sizeStyles['.flex-grid-cell.' + idClass] = 'width: ' + width + this.widthUnit;
            iCell++;

        }

        //пересчитываем ширину родительских заголовков и общую ширину строки и таблицы
        this.headers.leafs.forEach(
            (leafHeader) => {
                leafHeadersWidth[leafHeader.id] = typeof leafHeader.width === typeof function () {} ?
                    +leafHeader.width() :
                    +leafHeader.width;
                totalWidth += leafHeadersWidth[leafHeader.id];
            }
        );

        iCell = 0;
        let reduce = (header) => {
            return header.leaf ?
                leafHeadersWidth[header.id] :
                (
                    (!(header.id in widths)) && (widths[header.id] = header.children.reduce((accum, child) => accum + reduce(child), 0)),
                    widths[header.id]
                )
        };
        while (iCell < columns.length) {

            let h = columns[iCell];
            while (h.parent) {
                if (h.parent.id in widths) {
                    //Ширина этого заголовка уже посчитана. А значит посчитана и ширина его родителей
                    break;
                }


                widths[h.parent.id] = h.parent.children.reduce(
                    (accum, child) => accum + (child.leaf ? leafHeadersWidth[child.id] : reduce(child)),
                    0
                )

                h = h.parent;
            }
            iCell++;

        }

        for (let headerName in widths)
        {
            if (!this.headers.dict[headerName].extClass) {

                this.sizeStyles['.flex-grid-nodal-header-cell.' + headerName.replaceAll('.', '_')] = 'width: ' + widths[headerName] + this.widthUnit;
            }
        }
        //Полная ширина строки и таблицы
        let tw = totalWidth + this.widthUnit;
        this.sizeStyles['.flex-grid-row'] = 'width: ' + tw + ';';
        this.sizeStyles['.flex-grid-content-panel>.flex-grid-panel'] = 'width: ' + tw + '; min-width: ' + tw + ';';
        this.sizeStyles['.flex-grid-content-panel'] = 'width: ' + tw + '; min-width: ' + tw + ';';

        this.updateSizesStyleElement();
    };

    this.setColumnWidth = function(header, width){
        header = typeof header === typeof 'aaa' ?this.headers.dict[header] : header;
        if (!header.leaf) {
            throw 'Header must be leaf'
        }
        if (typeof function(){} === typeof header.width) {
            throw 'Header \'' + header.id + '\' has dynamically width. Its width can be updated but  can\'t be set'
        }
        header.width = width;
        this.updateColumnsWidth([header]);
    };

    this.createScroller = function(config){
        let scroller = new Scroller(
            {
                firstIndex:0,
                itemsCount: this.callbacks.getItemsCount(),
                DOM: {
                    container: this.DOM.centralPanel,
                    scrolledItemsContainer: this.DOM.dataPanel,
                },
                getElement: this.callbacks.getElement,
                scrollSensitivity: config.scrollSensitivity,
                scrollStepSize: config.scrollStepSize,
                getElements: this.callbacks.getElements
            }
        );
        //window.scrollerInstance = scroller;
        this.scroller = scroller;
        //scroller.goTo(25)
        // console.log(scroller)

        // scroller.goTo(250);

    };

    this.createId();
    // this.wrap();

}


export function DefaultVisualizer(){
    let pub = this;
    let priv = new abstractVisualizer();
    priv.pub = pub;

    pub.init = function(){
        priv.wrap();

        priv.updateStyleElement();

        //TODO При перезагрузке грида не только панели с заголовками, фильтрами и данными надо вычищать, но и панели с опциями для грида, т.к. состав опций может поменяться

        //this.panels.leftPanel.setScrollable();
    };

    pub.showData = function(config){
        priv.DOM.dataPanel.classList.remove('spinner');
        priv.DOM.dataPanel.classList.remove('spinner-atomic');
        priv.createScroller(config);
    };



    pub.setHeaders = function(headers){
        //TODO Если данные уже загружены, то их надо либо выгрузить, либо обновить с учетом новых заголовков
        priv.headers.leafs = headers;
        priv.headers.dict = {};

        let nodalHeaders = [];
        let nodalDict = {};
        let c = headers.length;
        for (let i = 0; i < c; i++) {
            let header = headers[i];
            let depth = 0;
            priv.headers.dict[header.id] = header;
            while (header.parent) {
                header = header.parent;
                if (!nodalHeaders[depth]) {
                    nodalHeaders.push([]);

                }
                if (!(header.id in nodalDict))
                {
                    nodalDict[header.id] = header;
                    nodalHeaders[depth].push(header);
                    priv.headers.dict[header.id] = header;
                }

                depth++;
            }
        }

        nodalHeaders.reverse();
        priv.headers.nodes = nodalHeaders;

        priv.createHeaders();
        priv.createFilters();

    };

    pub.setColumnWidth = function(columnId, width){
        priv.setColumnWidth(columnId, width);
    };

    pub.getContainer = () => priv.DOM.container;

    pub.updateColumnsWidth = (columns) => priv.updateColumnsWidth(columns)

    pub.setContainer = function(container){
        if (typeof container === typeof 'aaa') {
            let collection;
            priv.DOM.container = document.getElementById(container) || ((collection = document.getElementsByClassName(container)) ? collection[0] : null) || document.querySelector(container);
        }
        else if (container && typeof container === typeof {} && container.nodeType === Node.ELEMENT_NODE) {
            priv.DOM.container = container;
        }
        else {
            throw 'Incorrect main container';
        }
    };

    pub.setCallbacks = function(
        callback,
        eventName
    ){
        if (typeof callback === typeof function(){} && typeof eventName === typeof 'aaa') {
            priv.callbacks[eventName] = callback
        } else if (callback && typeof callback === typeof {}) {
            for (eventName in callback) {
                priv.callbacks[eventName] = callback[eventName];
            }
        }
    };

    pub.updatePreview = function(){
        priv.scroller.updateItemsCount(priv.callbacks.getItemsCount());
        priv.scroller.reload();
    };

    for (let panelName in priv.panels) {
        Object.defineProperty(
            pub,
            panelName.charAt(0).toUpperCase() + panelName.slice(1),
            {
                // writable: false,
                configurable: false,
                enumerable: false,
                get: (function(){let pn = panelName; return function(){ return priv.panels[pn]};})()
            }
        )
    }
    return this;
}

DefaultVisualizer.prototype = new VisualizerInterface();
DefaultVisualizer.getFlags = function(){
    //Копируем объект с флагами, чтобы снаружи нельзя было изменить исходный объект
    let flags = {...Scroller.getFlags()};
    //Тут можно расширить список флагов
    return flags;
};

Object.defineProperties(
    DefaultVisualizer,
    {
        ClassModel: {
            get: () => ClassModel,
            configurable: false,
            enumerable: false,
        },
        VisualizerInterface: {
            get: () => VisualizerInterface,
            configurable: false,
            enumerable: false,
        },
    }
)
