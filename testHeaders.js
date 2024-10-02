const testHeaders = [
	{
		id: 'id',
		title: 'Идентификатор',
		type: 'string',
		filter: 'string',
		width: 100,
	},
	{
		id: 'name',
		title: 'Наименование',
		type: function(fieldName, itemData, headerData, config){
			return itemData[config.entityClassField] === 'IncomeStageBundle\\Entity\\IncomeStage' ?
				this.getVisualizationComponent('string') :
				this.getVisualizationComponent('budgetNameVisualizer');

		},
		//filter: 'string',
		width: 300,
	},
	{
		id: 'number',
		title: 'Номер',
		type: 'string',
		filter: 'string',
		width: 300,
	},
	{
		id: 'estimateItem',
		title: 'Смета',
		type: function(fieldName, itemData, headerData, config){
			return itemData[config.entityClassField] === 'IncomeStageBundle\\Entity\\IncomeStage' ?
				null :
				this.getVisualizationComponent('budgetEstimateItemVisualizer');

		},
		width: 300,
	},
	{
		id: 'sums',
		title: 'Суммы',
		children: [
			{
				id: 'baseSums',
				title: 'БЦ',
				children: [
					{
						id: 'baseTotalSum',
						title: 'БЦ Итого',
						type: 'money',
						width: 100,
					},
					{
						id: 'baseEquipmentSum',
						title: 'БЦ ОБ',
						type: 'money',
						width: 100,
					},
					{
						id: 'baseServiceSum',
						title: 'БЦ Услуги',
						type: 'money',
						width: 100,
					},
					{
						id: 'baseMaterialSum',
						title: 'БЦ Материалы',
						type: 'money',
						width: 100,
					},

				],
			},
			{
				id: 'factSums',
				title: 'ТЦ',
				children: [
					{
						id: 'sumWoNds',
						title: 'Итого',
						type: 'money',
						width: 100,
					},
					{
						id: 'equipmentSum',
						title: 'Оборудование',
						type: 'money',
						width: 100,
					},
					{
						id: 'serviceSum',
						title: 'Услуги',
						type: 'money',
						width: 100,
					},
					{
						id: 'materialSum',
						title: 'Материалы',
						type: 'money',
						width: 100,
					},

				],
			},

		],
	},
	{
		id: 'delivery',
		title: 'Закупки',
		children: [
			{
				id: 'estimateDelivery',
				title: 'Сметы',
				children: [
					{
						id: 'sumsEstimateDelivery',
						title: 'Суммы',
						children: [
							{
								id: 'baseSumsEstimateDelivery',
								title: 'БЦ',
								children: [
									{
										id: 'baseTotalSumEstimateDelivery',
										title: 'БЦ Итого',
										type: 'money',
										width: 100,
									},
									{
										id: 'baseEquipmentSumEstimateDelivery',
										title: 'БЦ ОБ',
										type: 'money',
										width: 100,
									},
									{
										id: 'baseServiceSumEstimateDelivery',
										title: 'БЦ Услуги',
										type: 'money',
										width: 100,
									},
									{
										id: 'baseMaterialSumEstimateDelivery',
										title: 'БЦ Материалы',
										type: 'money',
										width: 100,
									},

								],
							},
							{
								id: 'factSumsEstimateDelivery',
								title: 'ТЦ',
								children: [
									{
										id: 'sumWoNdsEstimateDelivery',
										title: 'Итого',
										type: 'money',
										width: 100,
									},
									{
										id: 'equipmentSumEstimateDelivery',
										title: 'Оборудование',
										type: 'money',
										width: 100,
									},
									{
										id: 'serviceSumEstimateDelivery',
										title: 'Услуги',
										type: 'money',
										width: 100,
									},
									{
										id: 'materialSumEstimateDelivery',
										title: 'Материалы',
										type: 'money',
										width: 100,
									},

								],
							},

						],
					},
				]
			},
			{
				id: 'stageDelivery',
				title: 'Этапы',
				children: [
					{
						id: 'sumsStageDelivery',
						title: 'Суммы',
						children: [
							{
								id: 'baseSumsStageDelivery',
								title: 'БЦ',
								children: [
									{
										id: 'baseTotalSumStageDelivery',
										title: 'БЦ Итого',
										type: 'money',
										width: 100,
									},
									{
										id: 'baseEquipmentSumStageDelivery',
										title: 'БЦ ОБ',
										type: 'money',
										width: 100,
									},
									{
										id: 'baseServiceSumStageDelivery',
										title: 'БЦ Услуги',
										type: 'money',
										width: 100,
									},
									{
										id: 'baseMaterialSumStageDelivery',
										title: 'БЦ Материалы',
										type: 'money',
										width: 100,
									},

								],
							},
							{
								id: 'factSumsStageDelivery',
								title: 'ТЦ',
								children: [
									{
										id: 'sumWoNdsStageDelivery',
										title: 'Итого',
										type: 'money',
										width: 100,
									},
									{
										id: 'equipmentSumStageDelivery',
										title: 'Оборудование',
										type: 'money',
										width: 100,
									},
									{
										id: 'serviceSumStageDelivery',
										title: 'Услуги',
										type: 'money',
										width: 100,
									},
									{
										id: 'materialSumStageDelivery',
										title: 'Материалы',
										type: 'money',
										width: 100,
									},

								],
							},

						],
					},
				]
			},
		]
	},
	{
		id: 'completed',
		title: 'Выполнена',
		type: function(fieldName, itemData, headerData, config){
			return itemData[config.entityClassField] === 'IncomeStageBundle\\Entity\\IncomeStage' ?
				null :
				this.getVisualizationComponent('budgetCCVisualizer');

		},
		width: 150,
	},
	{
		id: 'contracted',
		title: 'Законтрактована',
		type: function(fieldName, itemData, headerData, config){
			return itemData[config.entityClassField] === 'IncomeStageBundle\\Entity\\IncomeStage' ?
				null :
				this.getVisualizationComponent('budgetCCVisualizer');

		},
		width: 150,
	},


];

export default testHeaders;