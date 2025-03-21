import {TestResultInterface} from "./testResultInterface.js";

function TestResult()
{
    let expected = {};
    let completed = [];
    let errors = [];

    this.expect = (
        /** @type {string} */ key,
        /** @type {string} */ message,
        /** @type {int} */ count,
    ) => {
        if (key in expected && expected[key].unexpect) {
            throw 'Try to rewrite expected to unexpected!';
        }

        !(key in expected) && (count = count || 1, expected[key] = {message, count, unexpect: false});
    }

    this.unexpect = (
        /** @type {string} */ key,
        /** @type {string} */ message
    ) => {
        if (key in expected && !expected[key].unexpect) {
            throw 'Try to rewrite unexpected to expected!';
        }

        !(key in expected) && (expected[key] = {message, count: 0, unexpect: true})
    };

    this.complete = (
        /** @type {string} */ message
    ) => completed.push(message);

    this.error = (
        /** @type {string} */ message
    ) => errors.push(message);

    this.register = function (
        /** @type {string} */ key,
        /** @type {int} */ count,
    ) {
        if (!(key in expected)) {
            errors.push('Не ожидался \'' + key + '\'');
            return;
        }

        if (expected[key].unexpect) {
            ++expected[key].count;
            errors.push('Не ожидался \'' + key + '\'');
            return;
        }

        --expected[key].count;

        completed.push(expected[key].message);

        if (!expected[key].count) {
            delete expected[key];
        }
    }

    this.result = () => {
        let tmpE = [...errors];
        let tmpC = [...completed];

        for (let key in expected) {
            let e = expected[key];
            e.unexpect && !e.count ?
                tmpC.push(e.message):
                tmpE.push(e.message + ' (' + e.count + ') [' + key + ']')
        }
        return {
            errors: tmpE,
            completed: tmpC
        }
    }
}

TestResult.prototype = new TestResultInterface();

export {TestResult}
