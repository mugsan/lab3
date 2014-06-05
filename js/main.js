//Setting for JSHint.
/*global $:false, setInterval:false, document:false, clearInterval:false, console:false */

Number.prototype.mod = function(n){
    "use strict";
    return ((this % n) + n) % n;
};

var GLOBAL = {
    CENTER_DIFF     : 50,
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
    var confusorGraph = new Graph(confusorStock,$('#canvasConfusor').get(0), Plank);
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
}//----End Stock

function Graph(arg_stock, arg_canvas, arg_figure){
    "use strict";
    
    var mFigure         = arg_figure;
    var lastFig         = 0;
    var mData           = new FifoQueue(17);
    var POINT_SPEED     = Math.PI / 700;

    var mCanvas         = arg_canvas;
        mCanvas.width   = GLOBAL.CANVAS_WIDTH;
        mCanvas.height  = GLOBAL.CANVAS_HEIGHT;

    var mContext        = mCanvas.getContext('2d');


    var center          = new Point({x: GLOBAL.CENTER_X, y: GLOBAL.CENTER_Y, polar: false});
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

            var tColor = "#" + (255 - 2 * parseInt(arg_value)).toString(16) + (parseInt(arg_value) * 2).toString(16) + "00";
            var tPoint = new Point({theta: 0, radius: GLOBAL.CENTER_DIFF, point: center, polar: true});
            var tFigure= new mFigure({point: tPoint, oldFigure: lastFig, value: parseInt(arg_value), color: tColor});
            mData.addPoint(tFigure);
            console.log(lastFig + "true?");
            lastFig = tFigure;
        }
    };
}//----End Graph

function FifoQueue(arg_size){
    "use strict";
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

}//----End FifoQueue

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

function Tree(arg_object){
    "use strict";
    var mColor          = arg_object.color;
    var mCenter         = arg_object.point;
    var mValue          = arg_object.value;

    var mSatPt          = new Point({polar: true, point: mCenter, theta: 0, radius: mValue});
    var mSatPt2         = new Point({polar: true, point: mSatPt, theta: 0, radius: mValue / 10 + 10});

    this.getValPt       = function(){
        return mSatPt;
    };

    this.draw           = function(arg_context){
        arg_context.beginPath();
        arg_context.arc(mSatPt.getX(), mSatPt.getY(), mValue / 10, 0, 2 * Math.PI);
        arg_context.moveTo(mSatPt2.getX(), mSatPt2.getY());
        arg_context.arc(mSatPt2.getX(), mSatPt2.getY(), 2, 0, 2 * Math.PI);
        arg_context.moveTo(mCenter.getX(), mCenter.getY());
        arg_context.fillStyle = mColor;
        arg_context.fill();
        arg_context.stroke();
    };
    this.move           = function(arg_theta){
        mSatPt.rotate(arg_theta);
        mSatPt2.rotate(3 / arg_theta);
        mCenter.rotate(arg_theta);
    };
}//----End Tree

function Plank(arg_object){
    "use strict";
    var mColor          = arg_object.color;
    var mCenter         = arg_object.point;
    var mValue          = arg_object.value;
    var oldFig          = arg_object.oldFigure;
    console.log(oldFig + "Plank constructor");

    var mPoint          = new Point({polar: true, point: mCenter, theta: 0, radius: mValue});

    this.getValPt       = function(){
        return mPoint;
    };

    this.draw           = function(arg_context){
        arg_context.beginPath();
        arg_context.fillStyle = mColor;
        if(oldFig){
            console.log("true");
            arg_context.moveTo(oldFig.getValPt().getCenter().getX(), oldFig.getValPt().getCenter().getY());
            arg_context.lineTo(oldFig.getValPt().getX(), oldFig.getValPt().getY());
            arg_context.lineTo(mPoint.getX(), mPoint.getY());
        }else if(olgFig === 0){
            console.log("false");
            arg_context.moveTo(mPoint.getX(), mPoint.getY());
        }
        arg_context.lineTo(mCenter.getX(), mCenter.getY());
        arg_context.fill();
        arg_context.stroke();
    };

    this.move           = function(arg_theta){
        mCenter.rotate(arg_theta);
        mPoint.rotate(arg_theta);
    };
}//----End Plank


function TriForce(arg_object){
    "use strict";

    var mColor          = arg_object.color;
    var mCenter         = arg_object.point;
    var mValue          = arg_object.value / 3;

    var mPoints         = [];

    mPoints.push(new Point({polar: true, point: mCenter, theta: 0, radius: 60}));
    mPoints.push(new Point({polar: true, point: mPoints[0], theta: (3 * Math.PI)/ 2, radius: mValue}));
    mPoints.push(new Point({polar: true, point: mPoints[1], theta: Math.PI / 6, radius: mValue}));
    mPoints.push(new Point({polar: true, point: mPoints[2], theta: Math.PI / 6, radius: mValue}));
    mPoints.push(new Point({polar: true, point: mPoints[3], theta: 5 * Math.PI / 6, radius: mValue}));
    mPoints.push(new Point({polar: true, point: mPoints[4], theta: 5 * Math.PI / 6, radius: mValue})); 

    this.draw           = function(arg_context){
        if(mPoints[0].getTheta() < (3 * Math.PI / 2)){
            arg_context.fillStyle = mColor;

            arg_context.beginPath();
            arg_context.moveTo(mPoints[0].getX(), mPoints[0].getY());
            arg_context.lineTo(mPoints[1].getX(), mPoints[1].getY());
            arg_context.lineTo(mPoints[2].getX(), mPoints[2].getY());
            arg_context.closePath();
            arg_context.fill();
            arg_context.stroke();

            arg_context.beginPath();
            arg_context.moveTo(mPoints[2].getX(), mPoints[2].getY());
            arg_context.lineTo(mPoints[3].getX(), mPoints[3].getY());
            arg_context.lineTo(mPoints[4].getX(), mPoints[4].getY());
            arg_context.closePath();
            arg_context.fill();
            arg_context.stroke();

            arg_context.beginPath();
            arg_context.moveTo(mPoints[4].getX(), mPoints[4].getY());
            arg_context.lineTo(mPoints[5].getX(), mPoints[5].getY());
            arg_context.lineTo(mPoints[0].getX(), mPoints[0].getY());
            arg_context.closePath();
            arg_context.fill();
            arg_context.stroke();
        }
    };

    this.move           = function(arg_theta){
        mCenter.rotate(2*arg_theta);
        for(var i = 0; i < 6; i++){
            mPoints[i].rotate(2*arg_theta);
        }
    };
}//----End TriForce
