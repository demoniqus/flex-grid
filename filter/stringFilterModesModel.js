"use strict"

let StringFilterModesModel = Object.defineProperties(
    Object.create(null),
    {
        StartWith: {
            get: () =>  'startWith',
            configurable: false,
            enumerable: false,
        },
        EndWith: {
            get: () => 'endWith',
            configurable: false,
            enumerable: false
        },
        Contains: {
            get: () => 'contains',
            configurable: false,
            enumerable: false
        },
        Equals: {
            get: () => 'equals',
            configurable: false,
            enumerable: false
        },
    }
);

export {StringFilterModesModel}
