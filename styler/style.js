import {AbstractStyle} from "./abstractStyle.js";

function Style(config) {
    let priv = new AbstractStyle(config);

    this.key = () => {
        return priv.id
    };

    this.style = () => {
        return priv.style
    };

    this.setStyle = (/** @type {string|null} */ style) => priv.style = style;

}

export {Style}
