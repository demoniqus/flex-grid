"use strict";

import './dragger.js';
import {Scroller} from './Scroller.js';

let pluginIds = {};
let draggedPanelItem = undefined;
/**
 * TODO Не факт, что панельки допустимо перемещать - тут и вопрос с их возвратом обратно на пустое место, и со сменой ориентации (горизонт- вертикаль) и пр.
 */
let draggedPanel = undefined;

let ClassModel = Object.defineProperties(
    Object.create(null),
    {
        PanelItem: {
            get: () =>  'panel-item',
            configurable: false,
            enumerable: false,
        },
        OnlyVerticalItem: {
            get: () => 'only-vertical-panel-item',
            configurable: false,
            enumerable: false
        },
        OnlyHorizontalItem: {
            get: () => 'only-horizontal-panel-item',
            configurable: false,
            enumerable: false
        },
    }
);

let OrientationModel = Object.defineProperties(
    Object.create(null),
    {
        Vertical: {
            get: () => 'vertical',
            configurable: false,
            enumerable: false,
        },
        Horizontal: {
            get: () => 'horizontal',
            configurable: false,
            enumerable: false,
        }
    }
);

export let FlexPanel = Object.defineProperties(
    Object.create(null),
    {
        Panel: {
            get: function(){return Panel;},
            configurable: false,
            enumerable: false,
        },
        OrientationModel: {
            get: function () { return OrientationModel;},
            configurable: false,
            enumerable: false,
        },
        ClassModel: {
            get: function() {return ClassModel;},
            configurable: false,
            enumerable: false,
        }
    }
);

function abstractPanel() {
    this.items = {},
        this.config = {};
    this.DOM = {
        panel: undefined,
    };
    this.pub = undefined;

    this.setConfig = function(config){
        let collection;
        let defConfig = this.getDefaultConfig();
        config = Object.assign(defConfig, config);
        this.config = config;

        this.DOM.panel =
            typeof config.panel === typeof 'aaa' ?
                document.getElementById(config.panel) || ((collection = document.getElementsByClassName(config.panel)) ? collection[0] : null) || document.querySelector(config.panel) :
                config.panel
        ;

    };

    this.init = function(){
        this.setPanelAsDroppable();
    };

    this.specificConfigValidation = function(){
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

            errors.push('Incorrect panel container');
        }

        if (
            !config.orientation ||
            ! (
                config.orientation === OrientationModel.Horizontal ||
                config.orientation === OrientationModel.Vertical
            )
        ) {
            errors.push('Incorrect panel orientation');
        }

        errors = errors.splice(0, 0, ...this.specificConfigValidation(config));

        return errors.length ? errors : null;
    };

    this.setPanelAsDroppable = function(){
        window.dragger.initAcceptor(
            {
                acceptorElement: this.DOM.panel,
                onDrop: function(drawElement, acceptorElement){
                    if (!drawElement.classList.contains(ClassModel.PanelItem)) {
                        //Не принимаем прочие элементы, которые может сюда перетащить пользователь.
                        // Можно даже выбрасывать сообщение, но проще не реагировать на неверные действия
                        return;
                    }

                    if (
                        drawElement.classList.contains(ClassModel.OnlyVerticalItem) &&
                        this.config.orientation === OrientationModel.Horizontal ||
                        drawElement.classList.contains(ClassModel.OnlyHorizontalItem) &&
                        this.config.orientation === OrientationModel.Vertical
                    ) {
                        alert(
                            'Элемент панели не имеет представления для ' +
                            (
                                this.config.orientation === OrientationModel.Horizontal ?
                                    'горизонтальной' :
                                    'вертикальной'
                            ) +
                            ' ориентации'
                        );
                        return;
                    }
                    acceptorElement.appendChild(drawElement);
                }
            }
        );
    };

    this.setPanelItemAsDraggable = function(panelItem)
    {
        window.dragger
            .initDraw(
                {
                    drawElement: panelItem
                }
            )
            .initAcceptor(
                {
                    acceptorElement: panelItem,
                    onDrop: function(drawElement, acceptorElement){
                        if (!drawElement.classList.contains(ClassModel.PanelItem)) {
                            //Не принимаем прочие элементы, которые может сюда перетащить пользователь.
                            // Можно даже выбрасывать сообщение, но проще не реагировать на неверные действия
                            return;
                        }

                        if (
                            drawElement.classList.contains(ClassModel.OnlyVerticalItem) &&
                            priv.config.orientation === OrientationModel.Horizontal ||
                            drawElement.classList.contains(ClassModel.OnlyHorizontalItem) &&
                            priv.config.orientation === OrientationModel.Vertical
                        ) {
                            alert(
                                'Элемент панели не имеет представления для ' +
                                (
                                    priv.config.orientation === OrientationModel.Horizontal ?
                                        'горизонтальной' :
                                        'вертикальной'
                                ) +
                                ' ориентации'
                            );
                            return;
                        }
                        let acceptorPanel = priv.DOM.panel;
                        acceptorPanel.insertBefore(drawElement, acceptorElement);
                    }
                }
            )
    };
}

function pubPanel(priv) {
    this.setStyle = function(propName, propValue){
        this.DOM.panel.style[propName] = propValue;
    }.bind(priv);

    this.addItem = function (key, item){

        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
        this.items[key] = item;
        this.DOM.panel.appendChild(item);
        item.classList.add(ClassModel.PanelItem);
        this.setPanelItemAsDraggable(item);
    }.bind(priv);

    this.setScrollable = function(){
        let div = document.createElement('div')
        div.classList.add('panel-scroll-wrapper')
        div.classList.add('flex-grid-panel')
        div.classList.add('flex-grid-nowrapped-panel')
        div.classList.add('flex-grid-vertical-panel')
        let options = [];
        while (this.DOM.panel.children.length) {
            let panelItem = this.DOM.panel.children[0]
            div.appendChild(panelItem);
            options.push(panelItem)
        }
        this.DOM.panel.appendChild(div)


        let scroller = new Scroller(
            {
                firstIndex:0,
                itemsCount: options.length,
                DOM: {
                    container: this.DOM.panel,
                    scrolledItemsContainer: div,
                },
                getElement: function (index) {
                    return options[index];
                },
                name: 'Panel'
            }
        );
        // let scroller = new Scroller(
        //     {
        //         firstIndex:0,
        //         itemsCount: () => div.children.length,
        //         DOM: {
        //             container: this.DOM.panel,
        //             scrolledItemsContainer: div,
        //         },
        //         getElement: (index) => div.children[index]
        //     }
        // );

        scroller.reload();

        // scroller.reload();
    }.bind(priv);

    this.addItemAfter = function (key, item, after){
        //TODO Если after - число, то
        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
        this.items[key] = item;
        this.DOM.panel.appendChild(item);
    }.bind(priv)

    this.addItemBefore = function (key, item, before){
        //TODO Можно добавить after, before
        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
        this.items[key] = item;
        this.DOM.panel.appendChild(item);
    }.bind(priv);

    this.addItemBefore = function (key, item, /** @type {number} */ position){
        //TODO Вставка в позицию №position
        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
        this.items[key] = item;
        this.DOM.panel.appendChild(item);
    }.bind(priv);

    this.removeItem = function (key, item){
        if (key in this.items) {
            this.items[key].parentElement.removeChild(this.items[key]);
        }
    }.bind(priv);

    this.draggable = function(/** @type {boolean} */ flag){
        //Можно ли перемещать панель
    };

    this.droppable = function(/** @type {boolean} */ flag){
        //Может ли панель принимать другие панели после себя
    };
}

function Panel(config){
    let priv = new abstractPanel();
    let pub = new pubPanel(priv);
    priv.pub = pub;
    let errors = priv.validateConfig(config)
    if (errors) {
        throw 'Incorrect config: ' + errors.join('; ');
    }

    priv.setConfig(config);
    priv.init();


    return pub;

};


abstractPanel.prototype = new (function(){
    this.getDefaultConfig = function(){
        return {
            _panel: 'DOM-элемент.',
            panel: undefined,
            _orientation: 'vertical | horizontal',
            orientation: undefined
        };
    };
})();
