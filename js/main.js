//Setting for JSHint.
/*global $:false, setInterval:false, document:false, clearInterval:false, console:false */

Number.prototype.mod = function(n){
    "use strict";
    return ((this % n) + n) % n;
};

var GLOBAL = {
    CENTER_DIFF     : 60,
    CANVAS_WIDTH    : 320,
    CANVAS_HEIGHT   : 160,
    CANVAS_BG_COLOR : "#77BBFF",
    CANVAS_STROKE   : "#333333",
    CENTER_Y        : 160,
    CENTER_X        : 160,
    STOCK_INTERVAL  : 1000,
    GRAPH_INTERVAL  : 20
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
        },GLOBAL.STOCK_INTERVAL);
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
    
    var lastVal         = 0;
    var mCanvas         = arg_canvas;
        mCanvas.width   = GLOBAL.CANVAS_WIDTH;
        mCanvas.height  = GLOBAL.CANVAS_HEIGHT;

    var mContext        = mCanvas.getContext('2d');

    var POINT_SPEED     = Math.PI / 700;

    var center          = new Point({x: GLOBAL.CENTER_X, y: GLOBAL.CENTER_Y, polar: false});
    var mData           = new Polygon(center, 17);
    var intervalId;

        arg_stock.subscribe(this);


    function physics(){
        mData.rotate(POINT_SPEED);
    }


    function draw(){
        mContext.beginPath();
        mContext.fillStyle = GLOBAL.CANVAS_BG_COLOR;
        mContext.fillRect(0, 0, GLOBAL.CANVAS_WIDTH, GLOBAL.CANVAS_HEIGHT);
        mContext.fill();

        mData.draw(mContext);

        mContext.beginPath();
        mContext.arc(center.getX(), center.getY(), GLOBAL.CENTER_DIFF, 0, 2 * Math.PI);
        mContext.fillStyle = "#FFAA00";
        mContext.fill();

        mContext.moveTo(0, 0);
        mContext.lineTo(0,GLOBAL.CANVAS_HEIGHT);
        mContext.lineTo(GLOBAL.CANVAS_WIDTH, GLOBAL.CANVAS_HEIGHT);
        mContext.lineTo(GLOBAL.CANVAS_WIDTH, 0);
        mContext.lineTo(0, 0);
        mContext.stroke();
    }

    this.start          = function(){
        intervalId      = setInterval(function(){
            physics();
            draw();
        },GLOBAL.GRAPH_INTERVAL);
    };

    this.update         = function(arg_value){
        if(arg_value){

            var tColor = "#" + (255 - 2 * parseInt(arg_value)).toString(16) + (parseInt(arg_value) * 2).toString(16) + "33";
            var tPoint = new Point({theta: 0, radius: 60, point: center, polar: true});
            mData.addPoint(new GlassPinne(tPoint, arg_value, lastVal, tColor));
            //mData.addPoint(new Tree(tPoint, arg_value, tColor));
            lastVal = arg_value;
        }
    };
}//----End Graph

function Polygon(arg_point, arg_size){
    "use strict";
    var mCenter         = arg_point;
    var mSize           = arg_size;
    var mQueue          = [];


    this.addPoint       = function(arg_object){
        if(mQueue[mSize -1]){
            mQueue = mQueue.slice(1);
        }
        mQueue.push(arg_object);
    };

    this.rotate         = function(arg_theta){
        if(mQueue){
            for(var i = mQueue.length - 1; i > 0; i--){
                mQueue[i].move(arg_theta);
            }
        }
    };

    this.draw           = function(arg_context){
        if(mQueue){
            for(var i = mQueue.length - 1; i > 0; i--){
                mQueue[i].draw(arg_context);
            }
        }
    };

}//----End Polygon

function Point(arg_object){
    "use strict";

    var center          = arg_object.point;
    var theta           = arg_object.theta;
    var radius          = parseInt(arg_object.radius);
    var isPolar         = arg_object.polar;

    var x,y;

    if(isPolar){
        x = center.getX() + radius * Math.cos(theta);
        y = center.getY() - radius * Math.sin(theta);
    }else{
        x = arg_object.x;
        y = arg_object.y;
    }

    this.getCenter      = function(){
        return center;
    };

    this.getTheta       = function(){
        return theta;
    };

    this.getX           = function(){
        return x;
    };
    this.getY           = function(){
        return y;
    };
    this.move           = function(arg_dX, arg_dY){
        x += arg_dX;
        y += arg_dY;
    };
    this.moveTo         = function(arg_x, arg_y){
        x = arg_x;
        y = arg_y;
    };
    this.rotate         = function(arg_theta){
        theta += arg_theta;
        this.rotateTo(theta);
    };
    this.rotateTo       = function(arg_theta){
        x = center.getX() + radius * Math.cos(arg_theta);
        y = center.getY() - radius * Math.sin(arg_theta);
    };
}//----End Point

function Tree(arg_point, arg_value, arg_color){
    "use strict";
    var mColor          = arg_color;
    var mCenter         = arg_point;
    var mValue          = arg_value;
    var mSatPt          = new Point({polar: true, point: mCenter, theta: 0, radius: mValue});

    this.draw           = function(arg_context){
        arg_context.beginPath();
        arg_context.arc(mSatPt.getX(), mSatPt.getY(), mValue / 3, 0, 2 * Math.PI);
        arg_context.moveTo(mCenter.getX(), mCenter.getY());
        arg_context.lineTo(mSatPt.getX(), mSatPt.getY());
        arg_context.fillStyle = mColor;
        arg_context.fill();
        arg_context.stroke();
    };
    this.move           = function(arg_theta){
        mSatPt.rotate(arg_theta);
        mCenter.rotate(arg_theta);
    };
}//----End Tree


function GlassPinne(arg_point, arg_value, arg_oldValue, arg_color){
    "use strict";
    var mColor          = arg_color;
    var mStartPt        = arg_point;
    var mValue          = arg_value;
    var mOldVal         = arg_oldValue;

    var mEndPt          = new Point({polar: true, point: arg_point.getCenter(), theta: -48 * Math.PI / 700, radius: GLOBAL.CENTER_DIFF});
    var mSecPt          = new Point({polar: true, point: mStartPt, theta: 0, radius: mOldVal});
    var mThirdPt        = new Point({polar: true, point: mEndPt, theta: -48 * Math.PI / 700, radius: mValue});

    this.draw           = function(arg_context){
        arg_context.beginPath();
        arg_context.moveTo(mStartPt.getX(), mStartPt.getY());
        arg_context.lineTo(mSecPt.getX(), mSecPt.getY());
        arg_context.lineTo(mThirdPt.getX(), mThirdPt.getY());
        arg_context.lineTo(mEndPt.getX(), mEndPt.getY());
        arg_context.fillStyle = mColor;
        arg_context.fill();
        arg_context.stroke();
    };

    this.move            = function(arg_theta){
        mStartPt.rotate(arg_theta);
        mSecPt.rotate(arg_theta);
        mThirdPt.rotate(arg_theta);
        mEndPt.rotate(arg_theta);
    };

}




