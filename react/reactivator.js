import {AbstractReactivator} from "./abstractReactivator.js";


function Reactivator(config)
{
    let priv = new AbstractReactivator(config);

    this.reactivate = (dataItem) => priv.reactivateEntity(dataItem);
}

export {Reactivator}
