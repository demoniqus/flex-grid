<html>
<head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" href="/img/f.jpg"/>
    <link rel="stylesheet" href="/custom.css">
    <link rel="stylesheet" href="/bootstrap-5.0.2-dist/css/bootstrap.css">
    <link rel="stylesheet" href="/bootstrap-5.0.2-dist/css/bootstrap-grid.css">
    <link rel="stylesheet" href="/bootstrap-5.0.2-dist/css/bootstrap-reboot.css">
    <link rel="stylesheet" href="/bootstrap-5.0.2-dist/css/bootstrap-utilities.css">

    <style>
        .error-result {
            color: darkgreen;
            background-color: rgba(255, 220, 220, .2)
        }
        .completed-result {
            color: darkgreen;
            background-color: rgba(220, 255, 220, .2)
        }
    </style>
    <script type="module">
        import {MetadataInterface} from "/tests/metadataInterface.js";
        import {Tester as ReactTester} from "/react/tests/tests.js";


        ReactTester.runTests();
        let result = ReactTester.result();

        let container = document.getElementById('test');
        result.forEach(function(res){
            /**
             * @type {MetadataInterface}
             */
            let metadata = res.metadata;

            /**
             * @type {object}
             */
            let testResult = res.result.result();

            let block = document.createElement('div');
            block.classList.add('test-block');


            let blockMetadata = document.createElement('div');
            blockMetadata.classList.add('metadata-block');
            block.appendChild(blockMetadata);

            let blockTestName = document.createElement('div');
            blockTestName.classList.add('metadata-block-name');
            blockMetadata.appendChild(blockTestName);
            blockTestName.innerText = metadata.name();

            // let blockTestsCount = document.createElement('div');
            // blockTestsCount.classList.add('metadata-block-tests-count');
            // blockMetadata.appendChild(blockTestsCount);
            // blockTestsCount.innerText = 'Кол-во тестов: ' + testResult.length;

            let blockTestResult = document.createElement('div');
            blockTestResult.classList.add('result-block');
            block.appendChild(blockTestResult);

            let blockTestErrors = document.createElement('div');
            blockTestErrors.classList.add('errors-result-block');
            blockTestResult.appendChild(blockTestErrors);

            let blockTestCompleted = document.createElement('div');
            blockTestCompleted.classList.add('completed-result-block');
            blockTestResult.appendChild(blockTestCompleted);

            testResult.errors.forEach(
                (message) => {
                    let resultBlock = document.createElement('div');
                    resultBlock.classList.add('error-result');
                    blockTestErrors.appendChild(resultBlock);
                    resultBlock.innerText = message;
                }
            )
            testResult.completed.forEach(
                (message) => {
                    let resultBlock = document.createElement('div');
                    resultBlock.classList.add('completed-result');
                    blockTestCompleted.appendChild(resultBlock);
                    resultBlock.innerText = message;
                }
            )




            container.appendChild(block);
        })


    </script>

</head>
<body>
    <div id="container"></div>
    <div id="container2"><div class="spinner"></div></div>
    <div id="test"></div>
</body>
</html>
