function DataProviderInterface()
{
    this.getData = function(/**@type {function} */dataAcceptor){throw 'Method getData not implemented'};
    this.getHeaders = function(/**@type {function} */headersAcceptor){throw 'Method getData not implemented'};
    this.getEntity = function(/**@type {function} */headersAcceptor, /**@type {string}*/entityId,/**@type {string}*/entityClass){throw 'Method getData not implemented'};
}

export {DataProviderInterface}
