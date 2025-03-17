"use strict";


import {ScrollerDefaultConfig} from "./scrollerDefaultConfig.js";
import {ScrollerFlags} from "./scrollerFlags.js";
import {StandardScroller} from "./standardScroller.js";
import {ClassModel} from "./classModel.js";
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



function Scroller(/** @type Object */ config){


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

    let priv = new StandardScroller(p);

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
        Flags: {
            get: () => ScrollerFlags,
            configurable: false,
            enumerable: false
        },
        ClassModel: {
            get: () => ClassModel,
            configurable: false,
            enumerable: false
        },
    }
);

export {Scroller}
