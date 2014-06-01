/*global $:false*/
Number.prototype.mod = function(n){
    "use strict";
    return ((this % n) + n) % n;
};

var GLOBAL = {
    CANVAS_WIDTH    : 320,
    CANVAS_HEIGHT   : 320,
    CANVAS_BG_COLOR : "#F9F9F9",
    CANVAS_FILL     : "#333333",
    CANVAS_IN_R     : 70,
    CANVAS_OUT_R    : 150,
    CENTER_Y        : 160,
    CENTER_X        : 160,
    STOCK_INTERVAL  : 1000,
    GRAPH_INTERVAL  : 40
};


$(document).on('pageinit', function(){
    "use strict";
    var confusorStock = new Stock("Confusor","./js/Bizarro.js");
    var confusorGraph = new Graph(confusorStock,$('#canvasConfusor').get(0));
    confusorGraph.start();
    confusorStock.start();
});

function Stock(arg_name, arg_path){
    "use strict";
    var name            = arg_name;
    var path            = arg_path;
    var observers       = [];
    var value;
    var intervalId; 

    function update(){
        $.getJSON(path, function(data){
            for(var key in data){
                if(data.hasOwnProperty(key)){
                    value = data[key][new Date().getSeconds()].stockValue;
                    notify();
                    break;
                }
            }
        });
    }
    function notify(){
        $.each(observers, function(arg_index, arg_object){
            arg_object.update(value);
        });
    }
    this.getName        = function(){
        return name;
    };
    this.start          = function(){
        intervalId          = setInterval(function(){
            update();
        },1000);
    };
    this.stop           = function(){
        clearInterval(intervalId);
    };
    this.subscribe      = function(arg_subscriber){
        observers.push(arg_subscriber);
    };
    this.unSubscribe    = function(arg_subscriber){
    };
}//----End Stock

function Graph(arg_stock, arg_canvas){
    "use strict";
    var POINT_SPEED     = Math.PI / 750;
    var mData           = new FifoQueue(32);
    var theta           = 0;//Math.PI / 2;
    var endTheta        = Math.PI;//5 * Math.PI / 2;
    var intervalId;
    
    var mCanvas         = arg_canvas;
        mCanvas.width   = GLOBAL.CANVAS_WIDTH;
        mCanvas.height  = GLOBAL.CANVAS_HEIGHT;

    var mContext       = mCanvas.getContext('2d');
        mContext.fillStyle     = GLOBAL.CANVAS_BG_COLOR;
        mContext.strokeStyle   = GLOBAL.CANVAS_FILL;

        arg_stock.subscribe(this);

    function draw(){
        mContext.fillRect(0, 0, GLOBAL.CANVAS_WIDTH, GLOBAL.CANVAS_HEIGHT);
        mContext.beginPath();
        mContext.strokeStyle = "#000";

        if(mData.getLastObject()){
            mContext.moveTo(mData.getLastObject().getX(),mData.getLastObject().getY());
            mData.exec(function(entry){
                mContext.lineTo(entry.getX(), entry.getY());
                if(entry.getTheta() < endTheta){
                    mContext.lineTo(GLOBAL.CENTER_X, GLOBAL.CENTER_Y);
                    mContext.moveTo(entry.getX(), entry.getY());
                    entry.move();
                }
            });
        }
        mContext.fill();
        mContext.stroke();
        mContext.beginPath();
        mContext.strokeStyle = "#FF0000";
        mContext.moveTo(GLOBAL.CENTER_X, GLOBAL.CENTER_Y - GLOBAL.CANVAS_OUT_R);
        mContext.lineTo(GLOBAL.CENTER_X, GLOBAL.CENTER_Y);
        mContext.stroke();

    }
    this.start          = function(){
        intervalId      = setInterval(function(){
            draw();
        },GLOBAL.GRAPH_INTERVAL);
    };
    this.update         = function(arg_value){
        if(arg_value){
            mData.enQueue(new Point(GLOBAL.CENTER_X, GLOBAL.CENTER_Y, arg_value,theta,POINT_SPEED));
        }
    };
}//----End Graph

function FifoQueue(arg_size){
    "use strict";
    var length          = arg_size;
    var queue           = [];

    this.enQueue        = function(arg_object){
        if(queue[length -1]){
            queue = queue.slice(1);
        }
        queue.push(arg_object);
    };

    this.getObjectAt    = function(arg_index){
        return queue[arg_index];
    };
    this.getLastObject  = function(){
        return queue[queue.length - 1];
    };
    this.exec           = function(arg_callBack){
        for(var len = queue.length - 2; 0 < len; len--){
            arg_callBack(queue[len]);
        }
    };
}//----End Fifoqeue

function Point(arg_center_x, arg_center_y, arg_value, arg_theta, arg_speed){
    "use strict";
    var value           = parseInt(arg_value) + GLOBAL.CANVAS_IN_R;
    var centerX         = arg_center_x;
    var centerY         = arg_center_y;
    var theta           = arg_theta;
    var speed           = arg_speed;

    this.getX           = function(){
        return centerX + value * Math.cos(theta);
    };
    this.getY           = function(){
        return centerY - value * Math.sin(theta);
    };
    this.move           = function(){
        //value           = value * (theta/ (2 * Math.PI));
        theta          += speed;
    };
    this.setTheta       = function(arg_theta){
        theta           = arg_theta;
    };
    this.getTheta       = function(){
        return theta;
    };
    this.getValue       = function(){
        return value;
    };
}//----End Point

function Gauge(arg_context, arg_radius, arg_length, arg_point){
    "use strict";
    var mContext        = arg_context;
    var mPoint          = arg_point;
    var radius          = arg_radius;
    var length          = arg_length;

    function update(arg_point){
        if(arg_point) mPoint = arg_point;
    }
    this.draw           = function(){
        var startArc    = 0;
        var endArc      = 0;
        mContext.beginPath();

    };
};

