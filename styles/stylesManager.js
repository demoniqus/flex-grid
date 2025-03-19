import {AbstractStylesManager} from "./abstractStylesManager.js";
import {StylesManagerInterface} from "./stylesManagerInterface.js";


function StylesManager(config)
{
    config = config && typeof config === typeof {} ?
        {...config} :
        {}
    ;

    let priv = new AbstractStylesManager(config);
    priv.pub = this;

    this.getId = () => priv.id

    this.addStyle = function (
        /** @type {string} */ selector,
        /** @type {string} */ value,
        /** @type {string|null} */ afterSelector,
        /** @type {string|null} */ context
    )
    {
        priv.addStyle(...arguments);

        return this
    }

    this.setStyle = function (
        /** @type {string} */ selector,
        /** @type {string} */ value,
        /** @type {string|null} */ afterSelector,
        /** @type {string|null} */ context
    )
    {
        priv.setStyle(...arguments);

        return this
    }

    this.removeStyle = function (
        /** @type {string} */ selector,
        /** @type {object|array|null} */ keys)
    {
        priv.removeStyle(...arguments);

        return this;
    }

    this.update = () =>  priv.update();

    this.clear = () => {throw 'Method \'clear\' is not implemented';}


}
StylesManager.prototype = new StylesManagerInterface();


export {StylesManager}
