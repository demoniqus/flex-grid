import {AbstractStylesManager} from "./abstractStyle.js";

function Style(config) {
    let priv = new AbstractStylesManager(config);

    this.key = () => {
        return priv.id
    };

    this.style = () => {
        return priv.style
    };

    this.setStyle = (/** @type {string|null} */ style) => priv.style = style;

    this.toString = () => priv.context + priv.id + ' {' + priv.style + '}';
}

export {Style}
