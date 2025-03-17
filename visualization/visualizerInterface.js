function VisualizerInterface(){
    this.init = () => {
        throw 'Define init method';
    };
    this.setHeaders = (/**@type {Object[]} */headers) => {
        throw 'Define setHeaders method';
    };
    this.setContainer = (/**@type {DOMElement|string} */container) => {
        throw 'Define setContainer method';
    };
    this.setCallbacks = (/**@type {callable{}}  */callbacks) => {
        throw 'Define setCallbacks method';
    };
    this.updatePreview = () => {
        throw 'Define updatePreview method';
    };
    this.updateColumnsWidth = function(/**@type {Object[]|string[]|null} */columns){
        throw 'Define updateColumnsWidth method';
    };
    this.setColumnWidth = function(/**@type {Object|string} */column, /**@type {int} */width){
        throw 'Define setColumnWidth method';
    };
    this.getContainer = function(){
        throw 'Define getContainer method';
    }

    return this;
}

export {VisualizerInterface}
