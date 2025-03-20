function TesterInterface()
{

    this.addTest = (/** @type {object} */ testInstance) => {
        throw 'Method \'addTest\' not implemented';
    }

    this.runTests = () => {
        throw 'Method \'runTests\' not implemented';
    }

    this.result = () => {
        throw 'Method \'result\' not implemented';
    }


}

export {TesterInterface}
