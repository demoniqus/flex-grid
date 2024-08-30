window.dragger = new function (){
	//Пользователь в окне может за один раз перетягивать единственный элемент.
	let actualDrawElement = undefined;

	this.initDraw = function(
		config
	){
		let drawElement = config.drawElement;

		drawElement.setAttribute('draggable', 'true');

		drawElement.addEventListener(
			'dragstart',
			function(e){
				//Запомним компонент, который перетягивает пользователь
				actualDrawElement = e.target || e.srcElement;
			}
		);

		drawElement.addEventListener(
			'dragend',
			function(e){
				//В любом случае после завершения drop (или без него) очищаем информацию о перетаскиваемом элементе
				actualDrawElement = undefined;
			}
		);

		return this;
	};

	this.initAcceptor = function(
		config
	){
		let acceptorElement = config.acceptorElement;

		acceptorElement.addEventListener(
			'dragover',
			function(e){
				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';
			}
		);

		acceptorElement.addEventListener(
			'drop',
			function(e){
				e.preventDefault();
				let acceptorElement = this;
				let drawElement = actualDrawElement;
				//В любом случае после завершения drop (или без него) очищаем информацию о перетаскиваемом элементе
				actualDrawElement = undefined;
				if (!drawElement) {
					return;
				}
				config.onDrop(drawElement, acceptorElement);
			}
		);

		return this;

	};
};