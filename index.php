<?php
if (array_key_exists('index', $_GET)) {
	$index = +$_GET['index'];
	$count = $index + 1000;
	$data = [];
	for ($i = $index; $i < $count; $i++) {
		$data[] = [
			'id' => $i,
			'name' => 'Name ' . $i,
			'number' => 'Number ' . $i,
			"entityClass" =>  "IncomeStageBundle\\Entity\\IncomeStage",
			"sums"=> [
				'baseTotalSumEstimateDelivery' => $i,
				'sumWoNdsEstimateDelivery' => $i,
				'baseTotalSumStageDelivery' => $i,
				'sumWoNdsStageDelivery' => $i,
			]
		];

	}
	echo json_encode($data);
	die();
}



?>
<html>
<head>
    <meta charset="UTF-8">
	<link rel="icon" type="image/png" href="img/f.jpg"/>
    <link rel="stylesheet" href="custom.css">
    <link rel="stylesheet" href="bootstrap-5.0.2-dist/css/bootstrap.css">
    <link rel="stylesheet" href="bootstrap-5.0.2-dist/css/bootstrap-grid.css">
    <link rel="stylesheet" href="bootstrap-5.0.2-dist/css/bootstrap-reboot.css">
    <link rel="stylesheet" href="bootstrap-5.0.2-dist/css/bootstrap-utilities.css">
    <script type="text/javascript" src="./testdata.js"></script>

    <script type="module">
        import * as FlexGridPlugin from './flexGrid.js';
        import testHeaders from "./testHeaders.js";



        var config = FlexGridPlugin.FlexGrid.getDefaultConfig();

        let nn = (new Date).getTime();

        config.dataTransmitter = (function(){
            //Загрузки с сервака можно либо в асинхронность убрать, либо в отдельные воркеры (и стоит ли вообще с ними связываться??)
            let loader = function(){
				// this.getData =  (dataAcceptor) => setTimeout(function(){dataAcceptor(data)}, 0);
				this.getData =  (dataAcceptor) => {
					let xhr = new XMLHttpRequest();
					xhr.onload = function(){
						// console.log(xhr);
						let data = typeof xhr.responseText === typeof 'aaa' ?
							JSON.parse(xhr.responseText) :
							xhr.responseText;

						let estimateItems = [];
						let i = 1;
						while (i < 11) {
							let eri = {
								estimate: {number: 'Estimate ' + i++}
							};
							eri[config.entityClassField] = 'EstimateReestrItem';
							eri.estimate[config.entityClassField] = 'Estimate';
							estimateItems.push(eri);
						}

						window.estimateItems = estimateItems;

						data.forEach((dataItem, index) => dataItem.estimateItem = estimateItems[index % 10]);

						dataAcceptor(data);
						window.testData = data;
					}
					xhr.onerror = function(){
						console.log(xhr);
					}
					xhr.open('GET', '/?index=0&rand=' + (Math.random() * 10000), false );

					xhr.send();

				};
				// this.getData =   (dataAcceptor) => setTimeout(function(){
				// 	let data = [];
				// 	for (let i = 0; i < 1; i++)
				// 	{
				// 		!(i % 100000) && console.log('counter', i)
				// 		data.push({
				// 			"entityClass": "IncomeStageBundle\\Entity\\IncomeStage",
				// 			"id": i,
				// 			"number": "number " + i,
				// 			"name": "Name " + i,
				// 			"sums": []
				// 		})
				// 	}
				// 	dataAcceptor(data);
				// }, 0);
                this.getHeaders =  (headersAcceptor) => setTimeout(function(){headersAcceptor(testHeaders)}, 500);
				this.getMetadata = (metadataAcceptor) => metadataAcceptor({
					'tableName': 'Test Tree Grid'
				})
                // this.getData = (dataAcceptor) => dataAcceptor(data);
                // this.getHeaders = (headersAcceptor) => headersAcceptor(headers);
            };
            loader.prototype = new FlexGridPlugin.FlexGrid.DataTransmitterInterface;

            return new loader();
        })()
        // config.dataTransmitter = (function(){
        //     //Загрузки с сервака можно либо в асинхронность убрать, либо в отдельные воркеры (и стоит ли вообще с ними связываться??)
        //     let loader = function(){
        //         this.getData =   (dataAcceptor) => setTimeout(function(){
		// 			dataAcceptor(data)
		// 		}, 3000);
        //         this.getHeaders =  (headersAcceptor) => setTimeout(function(){headersAcceptor(testHeaders)}, 1000);
        //         // this.getData = (dataAcceptor) => dataAcceptor(data);
        //         // this.getHeaders = (headersAcceptor) => headersAcceptor(headers);
        //     };
        //     loader.prototype = new FlexGridPlugin.FlexGrid.DataTransmitterInterface;
		//
        //     return new loader();
        // })()




        config.container = document.getElementById('container');
        config.entityClassField = 'entityClass';
        config.entityIdField = 'id';
        config.draggableColumns = true;
        config.draggableRows = true;
        config.scrollStepSize = 3;
        config.events = {
            moveItem: config._events.moveItem,
			childItemChanged: function(eventObj){
				console.log(eventObj);
				// let parent = eventObj.sourceEventParams.parent;
				// if (parent[config.entityClassField] === 'EstimateReestrItem') {
				// 	let parentProperties = eventObj.sourceEventParams.parentProperties;
				//
				// 	parentProperties.forEach(function(parentPropName){
				// 		FlexGridPlugin.EventManager.fire(
				// 			eventObj.sourceEventParams.parent,
				// 			'itemChanged',
				// 			{
				// 				origValue: parent,
				// 				newValue: parent,
				// 				propertyName: parentPropName,
				// 				originalEvent: eventObj
				// 			}
				// 		)
				// 	});
				// }
				// let parent = eventObj.sourceEventParams.parent;
				// if (parent[config.entityClassField] === 'EstimateReestrItem') {
				// 	let parentProperties = eventObj.sourceEventParams.parentProperties;
				//
				// 	parentProperties.forEach(function(parentPropName){
				// 		FlexGridPlugin.EventManager.fire(
				// 			eventObj.sourceEventParams.parent,
				// 			'childItemChanged',
				// 			{
				// 				origValue: parent,
				// 				newValue: parent,
				// 				propertyName: parentPropName,
				// 				originalEvent: eventObj
				// 			}
				// 		)
				// 	});
				// }
			}

        };
        config.id = {
            gridClass: 'TestFlatGrid',
            id: 1,
        };

		let budgetNameVisualizer = (function(){
			let v = function(){
				this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {object}*/gridElement, /** @type {object}*/headerData){
					if (!DOMContainer) {
						//У элемента еще пока нет визуального представления
					}
					let dataItem = gridElement.getData();

					DOMContainer.innerHTML = '(' + dataItem.entityClass + ') ' + dataItem.number;
				};
			};
			v.prototype = new FlexGridPlugin.FlexGrid.StringVisualizationComponent();

			return new v();
		})();

		let budgetEstimateItemVisualizer = (function(){
			let v = function(){
				this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {object}*/gridElement, /** @type {object}*/headerData){
					let dataItem = gridElement.getData();
					// if (dataItem[config.entityClassField] === 'IncomeStageBundle\\Entity\\IncomeStage') {
					// 	return;
					// }
					if (!dataItem.estimateItem || !dataItem.estimateItem.estimate) {
						DOMContainer.innerHTML = 'Отсутствует привязка к смете';
					}
					else {

						DOMContainer.innerHTML = dataItem.estimateItem.estimate.number;
					}
				};
			};
			v.prototype = new FlexGridPlugin.FlexGrid.StringVisualizationComponent();

			return new v();
		})();

		let budgetCCVisualizer = (function(){
			let v = function(){
				this.buildReadForm = function (/** @type {Element}*/DOMContainer, /** @type {string}*/fieldName, /** @type {object}*/gridElement, /** @type {object}*/headerData){
					let itemType = gridElement.get('itemType');
					DOMContainer.innerHTML = '';
					if (itemType in {estimate_cust: true, est_contr: true}) {
						let flag = !!gridElement.get(fieldName);
						let input = '<input class="form-check-input" type="checkbox" value="" id="flexCheckCheckedDisabled" ' + (flag ? 'checked' : '') + ' disabled>';
						// let icon = '<img style="width: 20px; max-width: 20px; height: 20px; max-height: 20px;" src="img/' + (flag ? 'true' : 'false') + '-icon.png" />';
						DOMContainer.innerHTML = input;
						DOMContainer.style.textAlign = 'center'
					}
				};
			};
			v.prototype = new FlexGridPlugin.FlexGrid.BooleanVisualizationComponent();

			return new v();
		})();

		let treeCustomVisualizer = (function(){
			let v = function(){
				//&#128447; - черная папка
				let f = function (
					/** @type {Element}*/DOMContainer,
					/** @type {string}*/fieldName,
					/** @type {object}*/gridElement,
					/** @type {object}*/headerData,
				){
					let dataItem = gridElement.getData();

					if (dataItem.entityClass === "IncomeStageBundle\\Entity\\IncomeStage") {
						if (gridElement.children.length) {
							if (gridElement.expanded()) {

								// DOMContainer.innerHTML = '<span style="color: blue; font-weight: bold;">&#128449;</span>'
								DOMContainer.innerHTML = '<img src="img/folder-fill-opened.png" style="opacity: .5; max-width: 25px; max-height: 25px;" />'
							}
							else {
								DOMContainer.innerHTML = '<img src="img/folder-fill-closed.png" style="opacity: .5; max-width: 25px; max-height: 25px;" />'
								// DOMContainer.innerHTML = '<span style="color: green;">&#128447;</span>'
							}
						}
						else {
							// DOMContainer.innerHTML = '<span style="color: red;">&#128447;</span>'
							if (gridElement.expanded()) {

								// DOMContainer.innerHTML = '<span style="color: blue; font-weight: bold;">&#128449;</span>'
								DOMContainer.innerHTML = '<img src="img/folder-empty-opened.png" style=" max-width: 25px; max-height: 25px;" />'
							}
							else {
								DOMContainer.innerHTML = '<img src="img/folder-empty-closed.png" style=" max-width: 25px; max-height: 25px;" />'
								// DOMContainer.innerHTML = '<span style="color: green;">&#128447;</span>'
							}
						}
					} else{
						if (gridElement.children.length) {
							if (gridElement.expanded()) {

								DOMContainer.innerHTML = '<span style="color: blue; font-weight: bold;">&#128459;</span>'
							}
							else {
								DOMContainer.innerHTML = '<span style="color: green;">&#128464;</span>'
							}
						}
						else {
							DOMContainer.innerHTML = '<span style="color: red;">&#128464;</span>'
						}
					}


				};
				this.buildReadForm = this.buildEditform = f;
			};
			v.prototype = new FlexGridPlugin.FlexGrid.TreeVisualizationComponent();

			return new v();
		})();


        var flatGrid = FlexGridPlugin.FlexGrid.GridManager.createFlatGrid(config);
        flatGrid.addVisualizationComponent('budgetNameVisualizer', budgetNameVisualizer);
        flatGrid.addVisualizationComponent('budgetEstimateItemVisualizer', budgetEstimateItemVisualizer);
        flatGrid.addVisualizationComponent('budgetCCVisualizer', budgetCCVisualizer);

        flatGrid.getFilterComponent('string').customizeComponents = function(componentsDict){
            componentsDict.inputField.classList.add('form-control');
            componentsDict.resetButton.classList.add('btn');
            componentsDict.resetButton.classList.add('btn-light');
            componentsDict.resetButton.classList.add('filter');
        }
        let n = (new Date).getTime();
        //Полностью сконфигурировали компоненты. Теперь можно начинать загрузку
        // flatGrid.build();
		window.FlatGridInstance = flatGrid;


		//Иерархический грид


		config.dataTransmitter = (function(){
		    //Загрузки с сервака можно либо в асинхронность убрать, либо в отдельные воркеры (и стоит ли вообще с ними связываться??)
		    let loader = function(){
		        this.getData =   (dataAcceptor) => setTimeout(function(){
					data.splice(2000, 10000)
					data.forEach(function(item){
						let sum = 1;
						item.delivery = {
							baseEstimate: {
								baseTotalSumEstimateDelivery: sum++,
								baseEquipmentSumEstimateDelivery: sum++,
								baseServiceSumEstimateDelivery: sum++,
								baseMaterialSumEstimateDelivery: sum++,
							},
							factEstimate: {
								sumWoNdsEstimateDelivery: sum++,
								equipmentSumEstimateDelivery: sum++,
								serviceSumEstimateDelivery: sum++,
								materialSumEstimateDelivery: sum++,
							},
							baseStage: {
								baseTotalSumStageDelivery: sum++,
								baseEquipmentSumStageDelivery: sum++,
								baseServiceSumStageDelivery: sum++,
								baseMaterialSumStageDelivery: sum++,
							},
							factStage: {
								sumWoNdsStageDelivery: sum++,
								equipmentSumStageDelivery: sum++,
								serviceSumStageDelivery: sum++,
								materialSumStageDelivery: sum++,
							},
						};
						item.estContrDelivery = {
							base: {
								baseTotalSumEstContrDelivery: sum++,
								baseEquipmentSumEstContrDelivery: sum++,
								baseServiceSumEstContrDelivery: sum++,
								baseMaterialSumEstContrDelivery: sum++,
							},
							fact: {
								sumWoNdsEstContrDelivery: sum++,
								equipmentSumEstContrDelivery: sum++,
								serviceSumEstContrDelivery: sum++,
								materialSumEstContrDelivery: sum++,
							},
						}
					});

					dataAcceptor(data)
				}, 3000);
		        this.getHeaders =  (headersAcceptor) => setTimeout(function(){
					/**
					 * Из-за повторного использования надо клонировать заголовки
					 */
					let headers = [];
					let i = 0;
					let clone = function(header){
						let res = Object.create(header);
						if (header.children) {
							let children = [];
							let x = 0;
							while (x < header.children.length) {
								children.push(clone(header.children[x++]));
							}
						}
						return res;
					};
					while (i < testHeaders.length) {
						headers.push(clone(testHeaders[i++]));
					}
					headersAcceptor(headers)
				}, 1000);
				this.getMetadata = (metadataAcceptor) => metadataAcceptor({
					'tableName': 'Test Flat Grid'
				})
		        // this.getData = (dataAcceptor) => dataAcceptor(data);
		        // this.getHeaders = (headersAcceptor) => headersAcceptor(headers);
		    };
		    loader.prototype = new FlexGridPlugin.FlexGrid.DataTransmitterInterface;

		    return new loader();
		})()

		config.id = {
			gridClass: 'TestTreeGrid',
			id: 1,
		};

		config.container = document.getElementById('container2');


		var treeGrid = FlexGridPlugin.FlexGrid.GridManager.createTreeGrid(config);

		treeGrid.addVisualizationComponent('budgetNameVisualizer', budgetNameVisualizer);
		treeGrid.addVisualizationComponent('budgetEstimateItemVisualizer', budgetEstimateItemVisualizer);
		treeGrid.addVisualizationComponent('budgetCCVisualizer', budgetCCVisualizer);
		treeGrid.addVisualizationComponent('tree', treeCustomVisualizer);

		treeGrid.getFilterComponent('string').customizeComponents = function(componentsDict){
			componentsDict.inputField.classList.add('form-control');
			componentsDict.resetButton.classList.add('btn');
			componentsDict.resetButton.classList.add('btn-light');
			componentsDict.resetButton.classList.add('filter');
		}

		treeGrid.build();
		window.TreeGridInstance = treeGrid;

        console.log('time building ', (new Date()).getTime() - n);
        (function(){
            const ro = new ResizeObserver(function(mutations){
                //TODO НЕ выполнять при первой инициализации страницы
                // Возможно, timeout тут вообще не нужен, т.к. пока пользователь не остановит перемещение resizer'а, событие не наступает
                ro.timeout && clearTimeout(ro.timeout);
                ro.timeout = setTimeout(
                    function(){
                        // flatGrid.updatePreview();
						treeGrid.updatePreview();
                    },
                    //100
                        7000
                )
                //TODO resize для скроллируемых панелей!!
            })
            ro.observe(document.getElementById('container'));
        })();




    </script>



</head>
<body>
    <div id="container"></div>
    <div id="container2"><div class="spinner"></div></div>
</body>
</html>