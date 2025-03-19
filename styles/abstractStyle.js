function AbstractStylesManager(config)
{
    this.id = config.key;

    this.style = config.style;

    this.context = config.context || '';
}

export {AbstractStylesManager}
