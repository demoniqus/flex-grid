// import {StylerInterface} from "./stylerInterface.js";
import {Style} from "./style.js";

let pluginIds = {};

function AbstractStylesManager(config)
{
    this.pub = undefined;

    this.id = undefined;

    this.config = undefined;

    this.styleContainer = undefined;


    this.stylesDict = {};
    /**
     *
     * @type {Style[]}
     */
    this.styles = [];

    this.createId = function(){
        let r = 'styler_' + this.config.baseId;
        while (r in pluginIds) {
            (r = 'styler_' + this.config.baseId + '_' + (Math.ceil(Math.random() * 1000000) + 1))
        }
        this.id = r;
        pluginIds[r] = this;
    };

    this.setConfig = function(config){
        let errors = this.validateConfig(config);

        if (errors) {
            throw 'Incorrect config: ' + errors.join('; ');
        }

        this.config = config;

        this.setDefaultStyles();

        return this;

    };

    this.validateConfig = function(config){
        let errors = [];
        let baseId = config.baseId ;
        if (!baseId) {
            errors.push('Config doesn\'t contain id for Styler')
        }

        if (
            config.defaultStyles &&
            !(config.defaultStyles instanceof Array)
        ) {
            errors.push('Default styles list for styles must be instance of array');
        }

        if (config.defaultStyles instanceof Array) {
            let i = -1;

            while (++i < config.defaultStyles.length) {
                let styleItem = config.defaultStyles[i];
                if (
                    typeof styleItem !== typeof {} ||
                    !('key' in styleItem) ||
                    !('style' in styleItem)
                ) {
                    errors.push('Incorrect style item format');
                }

            }
        }







        return errors.length ? errors: null;
    }

    this.setDefaultStyles = function(){
        if (!this.config.defaultStyles) {
            return;
        }

        let i = -1;

        while (++i < this.config.defaultStyles.length) {
            let styleItem = new Style(this.config.defaultStyles[i]);
            if (styleItem.key() in this.stylesDict) {
                continue;
            }
            this.stylesDict[styleItem.key()] = styleItem;
            this.styles.push(styleItem);
            /**
             * Здесь не производим объединения стилей, т.к. это начальные стили - здесь не ожидается конфликтов
             */
        }
    }

    this.mergeStyle = (
        /** @type {Style} */ styleItem,
        /** @type {string} */ newStyle,
    ) => {
        let originStyleDict = {}
        let originStyle = (styleItem.style || '').split(';');
        originStyle = originStyle.map(function(item){
            item = item.split(':');

            let style = {
                key: item[0],
                style: item[1]
            };

            originStyleDict[style.key] = style;

            return style;
        });

        newStyle = (newStyle || '').split(';');
        newStyle.forEach(function(item){
            item = item.split(':');
            let style = {
                key: item[0],
                style: item[1]
            };

            if (style.key in originStyleDict) {
                originStyleDict[style.key] = style.style;
            }
            else {
                originStyle.push(style);
            }

        });

        let style = (
            originStyle.map(function(style){
                return style.key + ': ' + style.style;
            })
        ).join('; ')

        styleItem.setStyle(style);
    };



    this.addStyle = function (
        /** @type {string} */ selector,
        /** @type {string} */ value,
        /** @type {string|null} */ afterSelector,
        /** @type {string|null} */ context
    ) {
        let styleItem;
        if (selector in this.stylesDict) {
            styleItem = this.stylesDict[selector];
            if (afterSelector) {
                let i = -1;
                while (++i < this.styles.length) {
                    if (this.styles[i].key === selector) {
                        this.styles.splice(i, 1);
                    }
                }
                /**
                 * Удалить из общей очереди
                 */
            }
            if (value) {
                /**
                 * Выполнить слияние стилей
                 */

                this.mergeStyle(styleItem, value)

            }
            else {
                styleItem.setStyle('');
            }
        }
        else {
            styleItem = new Style({key: selector, style: value, context});
            this.stylesDict[styleItem.key()] = styleItem;
            if (!afterSelector) {
                this.styles.push(styleItem);
            }
        }

        if (afterSelector) {
            /**
             * найти afterSelector и поместить после него, либо в конце, если не найден
             */
            let i = -1;
            while (++i < this.styles.length) {
                if (this.styles[i].key === afterSelector) {
                    break;
                }
            }
            this.styles.splice(i, 0, styleItem);
        }
    }


    this.setStyle = function (
        /** @type {string} */ selector,
        /** @type {string} */ value,
        /** @type {string|null} */ afterSelector,
        /** @type {string|null} */ context
    ) {
        let styleItem;
        if (selector in this.stylesDict) {
            styleItem = this.stylesDict[selector];
            if (afterSelector) {
                let i = -1;
                while (++i < this.styles.length) {
                    if (this.styles[i].key === selector) {
                        this.styles.splice(i, 1);
                    }
                }
                /**
                 * Удалить из общей очереди
                 */
            }
            styleItem.setStyle(value);
        }
        else {
            styleItem = new Style({key: selector, style: value, context});
            this.stylesDict[styleItem.key()] = styleItem;
            if (!afterSelector) {
                this.styles.push(styleItem);
            }
        }

        if (afterSelector) {
            /**
             * найти afterSelector и поместить после него, либо в конце, если не найден
             */
            let i = -1;
            while (++i < this.styles.length) {
                if (this.styles[i].key === afterSelector) {
                    break;
                }
            }
            this.styles.splice(i, 0, styleItem);
        }
    }

    this.removeStyle = (/** @type {string} */ selector, /** @type {object|array|null} */  keys) => {
        //Если keys не указан, удаляем весь стиль, иначе удаляем его отдельные части по указанным ключам
        throw 'Method \'removeStyle\' is not implemented';
    }

    this.clear = () => {
        throw 'Method \'clear\' is not implemented';
    }

    this.init = function() {
        this.createId();
        this.createStyleElement();
        this.setDefaultStyles();
        this.update();
    };

    this.update = function(){
        let styles = '';

        let i = -1;

        while (++i < this.styles.length) {
            let style = this.styles[i];
            styles += style.toString() + "\n"
        }

        this.styleContainer.textContent = styles;
    };

    this.createStyleElement = function(){
        //TODO Добавить префикс - корневой класс типа '.flex-grid-visualizer-' + this.id, чтобы стили влияли только на используемый DOM-контейнер
        this.styleContainer = document.createElement('style');
        this.styleContainer.id = this.id;
        document.getElementsByTagName('head')[0].appendChild(this.styleContainer);
    };


    this
        .setConfig(config)
        .init()
    ;

}


// AbstractStyler.prototype = new StylerInterface();

export {AbstractStylesManager}
