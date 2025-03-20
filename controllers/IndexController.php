<?php

class IndexController
{
    public function IndexAction()
    {

    }

    public function DataAction()
    {
        $index = +$_GET['index'];
        $count = $index + 200;
        $data = [];
        for ($i = $index; $i < $count; $i++) {
            $sum = 1000000000 + $i;
            $data[] = [
                'id' => $i,
                'name' => 'Name ' . $i,
                'number' => 'Number ' . $i,
                "entityClass" =>  "IncomeStageBundle\\Entity\\IncomeStage",
//			"sums"=> [
//			]
                'baseTotalSumEstimateDelivery' => $sum,
                'sumWoNdsEstimateDelivery' => $sum * 2,
                'baseTotalSumStageDelivery' => $sum * 3,
                'sumWoNdsStageDelivery' => $sum * 4,
            ];

        }

        return $data;
    }
}
