"use strict";

function DataSetElement(config)
{
    let priv = {
        expanded: false,
        config: config,

    };

    Object.defineProperties(
        this,
        {
            Id: {
                get: () => priv.config.id,
                configurable: false,
                enumerable: false,
            },
            Expanded: {
                get: () => priv.expanded,
                set: (value) => priv.expanded = value,
                enumerable: false
            }
        }
    )
}

export {DataSetElement}
