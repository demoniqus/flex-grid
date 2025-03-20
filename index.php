<?php




function camelize($str) {
    $tmp = explode('_', $str);
    return implode('', array_map('ucfirst', $tmp));
}

$uri = $_SERVER['REQUEST_URI'];

if (!preg_match('/\.[a-z]+$/', $uri)) {

    $uri = explode('/', $uri);





    $controllerAlias = trim($uri[1] ?? '') ?: 'index';
    $controllerName = camelize($controllerAlias) . 'Controller';


    $actionAlias = trim($uri[2] ?? '') ?: 'index';
    $actionName = camelize($actionAlias) . 'Action';




    if (!file_exists('controllers/' . $controllerName . '.php')) {

        throw new RuntimeException('Unable to load controller: ' . $controllerName);
    }


    require_once 'controllers/' . $controllerName . '.php';

    $controller = new $controllerName();

    if (!method_exists($controller, $actionName)) {
        throw new RuntimeException('Invalid URI: ' . $controllerAlias . '/' . $actionAlias);
    }
    $res = $controller->$actionName();

    $viewName = 'views/' . $controllerAlias . '/' . $actionAlias . '.view.php';


//echo __DIR__ . '<br/>';
//echo $viewName . '<br/>';
//die();
    if (file_exists($viewName)) {
//    echo 1111111111111;
//    die();
        if (is_array($res)) {

            foreach ($res as $key => $value) {
                $$key = $value;
            }

            require_once $viewName;
        }
    }
    else {
//    echo 222222222222222;
//    die();
        echo json_encode($res);
    }
}



