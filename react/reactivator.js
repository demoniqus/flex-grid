import {AbstractReactivator} from "./abstractReactivator.js";


function Reactivator(config)
{
    let priv = new AbstractReactivator(config);

    this.reactivate = (dataItem) => priv.reactivateEntity(dataItem);
    //TODO Добавить возможность добавлять поля с прямыми ссылками на родителя priv.setEntityParentFields
}

export {Reactivator}
