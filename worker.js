onmessage = function(e){
    let counter = 0;
    let i = setInterval(function(){
        postMessage({count: ++counter})
        if (counter > 100) {
            clearInterval(i)};
    }, 1000);
};