function TestResultInterface()
{
    this.expect = (
        /** @type {string} */ key,
        /** @type {string} */ message,
        /** @type {int} */ count,
    ) => {
        throw 'Method \'expect\' not implemented';
    }

    this.unexpect = (
        /** @type {string} */ key,
        /** @type {string} */ message
    ) => {
        throw 'Method \'notExpect\' not implemented';
    }

    this.complete = (/** @type {string} */ message) => {
        throw 'Method \'complete\' not implemented';
    }

    this.error = (/** @type {string} */ message) => {
        throw 'Method \'error\' not implemented';
    }

    this.setExpected = (
        /** @type {string} */ key,
        /** @type {int} */ count,
    ) => {
        throw 'Method \'setExpected\' not implemented';
    }

    this.result = () => {
        throw 'Method \'result\' not implemented';
    }
}

export {TestResultInterface}
