import {AbstractStyler} from "./abstractStyler.js";
import {StylerInterface} from "./stylerInterface.js";


function Styler(config)
{
    config = config && typeof config === typeof {} ?
        {...config} :
        {}
    ;

    let priv = new AbstractStyler(config);
    priv.pub = this;

    this.getId = () => priv.id

    this.addStyle = function (
        /** @type {string} */ selector,
        /** @type {string} */ value,
        /** @type {string|null} */ afterSelector
    )
    {
        priv.addStyle(...arguments);

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
Styler.prototype = new StylerInterface();


export {Styler}
