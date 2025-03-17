const OrientationModel = Object.defineProperties(
    Object.create(null),
    {
        Vertical: {
            get: () => 'vertical',
            configurable: false,
            enumerable: false,
        },
        Horizontal: {
            get: () => 'horizontal',
            configurable: false,
            enumerable: false,
        }
    }
);

export {OrientationModel}
