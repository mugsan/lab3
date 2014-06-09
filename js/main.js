//Setting for JSHint.
/*global $:false, setInterval:false, document:false, clearInterval:false, console:false */


//Global Objects and Constants.
var GLOBAL = {
    init: function(){
        this.abnorma         = new Stock("Abnorma","./js/Abnorma.js");
        this.bizarro         = new Stock("Bizarro","./js/Bizarro.js");
        this.confusor        = new Stock("Confusor","./js/Confusor.js");
        this.graph           = new Graph();
    },
    CENTER_DIFF     : 44,
    CANVAS_WIDTH    : 288,
    CANVAS_HEIGHT   : 144,
    CENTER_Y        : 144,
    CENTER_X        : 144,
    STOCK_INTERVAL  : 1000,
    GRAPH_INTERVAL  : 20
};

/*On DOM load:
Initialize GLOBAL objects (i.e. stocks, graph),
Start observables (i.e. stocks read their files),
Bind events to buttons*/
$(document).on('pageinit', function(){
    GLOBAL.init();

    GLOBAL.abnorma.start();
    GLOBAL.abnorma.subscribe(new StockObserver('.abnormaValue'));
    GLOBAL.bizarro.start();
    GLOBAL.bizarro.subscribe(new StockObserver('.bizarroValue'));
    GLOBAL.confusor.start();
    GLOBAL.confusor.subscribe(new StockObserver('.confusorValue'));

    $( ".buttonPlank" ).bind( "click", function(event, ui) {
        GLOBAL.graph.setFigure(Plank);
    });
    $( ".buttonPlanet" ).bind( "click", function(event, ui) {
        GLOBAL.graph.setFigure(Planet);
    });
    $( ".buttonTriforce" ).bind( "click", function(event, ui) {
        GLOBAL.graph.setFigure(TriForce);
    });
});


/*pagebeforeshow:
assigns canvas of incoming page to the GLOBAL.graph object,
subscribes graph to relevant stock and starts the graph.

pagehide:
unsubscribes and stops graph.*/
$(document).on("pagebeforeshow","#Confusor",function(){
    GLOBAL.graph.setCanvas($('#canvasConfusor').get(0));
    GLOBAL.confusor.subscribe(GLOBAL.graph);
    GLOBAL.graph.start();
});

$(document).on("pagehide","#Confusor",function(){
    GLOBAL.confusor.unSubscribe(GLOBAL.graph);
    GLOBAL.graph.stop();
});

$(document).on("pagebeforeshow","#Bizarro",function(){
    GLOBAL.graph.setCanvas($('#canvasBizarro').get(0));
    GLOBAL.bizarro.subscribe(GLOBAL.graph);
    GLOBAL.graph.start();
});

$(document).on("pagehide","#Bizarro",function(){
    GLOBAL.bizarro.unSubscribe(GLOBAL.graph);
    GLOBAL.graph.stop();
});

$(document).on("pagebeforeshow","#Abnorma",function(){
    GLOBAL.graph.setCanvas($('#canvasAbnorma').get(0));
    GLOBAL.abnorma.subscribe(GLOBAL.graph);
    GLOBAL.graph.start();
});

$(document).on("pagehide","#Abnorma",function(){
    GLOBAL.abnorma.unSubscribe(GLOBAL.graph);
    GLOBAL.graph.stop();
});


/*Class StockObserver (Observer)
* @param: {string} Css class to update.
*/
function StockObserver(arg_clas_string){
    "use strict";
    var mClass          = arg_clas_string;
    var lValue;
    /*Priviliged method called by Stock (Observable).
    * Updates DOM with given value, changes color in relation to last value.
    * @param: {string} new value given from Stock (Observable).
    */
    this.update         = function(arg_value){
        var tVal = parseInt(arg_value);
        if(lValue > tVal){
            $(mClass).text(arg_value)
                     .css("color", "#ff8e8e");
        }else{
            $(mClass).text(arg_value)
                     .css("color", "#74ff74");
        }
        lValue = tVal;
    };
}

/*Class Stock (Observable)
* Reads JSON file and notifies Observers of value.
* @param1: {string} Name of Stock.
* @param2: {string} Path to JSON file.
*/
function Stock(arg_name, arg_path){
    "use strict";
    var name            = arg_name;
    var path            = arg_path;
    var observers       = [];
    var value;
    var intervalId; 

    /*Private method called by this.start().
    * Reads JSON file and notifies observers of new value.
    */
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
    /*Private method called by update().
    * Calls update() of all subscribed observers.
    */
    function notify(){
        $.each(observers, function(arg_index, arg_object){
            arg_object.update(value);
        });
    }
    this.getName        = function(){
        return name;
    };
    /*Privileged method called on DOM init.
    * Starts a loop that will call update().
    */
    this.start          = function(){
        intervalId          = setInterval(function(){
            update();
        },GLOBAL.STOCK_INTERVAL);
    };
    this.stop           = function(){
        clearInterval(intervalId);
    };
    /*Privileged method called by Observers
    * Adds a subscriber to notification list (observers[]).
    * @param: {object} Subscriber to be added.
    */
    this.subscribe      = function(arg_subscriber){
        observers.push(arg_subscriber);
    };
    /*Privileged method called by Observers
    * Removes a subscriber from notification list.
    * @param: {object} Subscriber to be removed.
    */
    this.unSubscribe    = function(arg_subscriber){
        var index       = observers.indexOf(arg_subscriber);
        observers.splice(index,1);
    };
}//----End Stock

/*Class Graph (Observer)
* Draws figures on current canvas representing data of Observable.
*/
function Graph(){
    "use strict";
    //Default figure to be drawn.
    var mFigure         = Plank;
    //Last figure that was drawn.
    var lastFig         = 0;
    //Figures are stored in a FifoQueue.
    var mData           = new FifoQueue(17);
    //FifoQueue holds values of 30 updates.
    var mValues         = new FifoQueue(30);
    //Magicnumber, velocity of figures.
    var POINT_SPEED     = Math.PI / 700;
    //Center of movement. Figures rotate around this Point.
    var center          = new Point({x: GLOBAL.CENTER_X, y: GLOBAL.CENTER_Y, polar: false});

    var mCanvas,
        mContext,
        intervalId;

    /*Private function called by this.start().
    * Rotates all Figures.
    */
    function physics(){
        mData.rotate(POINT_SPEED);
    }


    /*Private method called by this.start().
    * Draws all Figures of mData on current canvas.
    */
    function draw(){
        mContext.beginPath();
        mContext.fillStyle = "#F9F9F9";
        mContext.fillRect(0, 0, GLOBAL.CANVAS_WIDTH, GLOBAL.CANVAS_HEIGHT);
        mContext.fill();

        mContext.beginPath();
        mContext.arc(center.getX(), center.getY(), GLOBAL.CENTER_DIFF + 100, 0, 2 * Math.PI);
        mContext.fillStyle = "rgba(119, 187, 255, 0.56)";
        mContext.fill();
        mContext.stroke();

        mData.draw(mContext);

        mContext.beginPath();
        mContext.arc(center.getX(), center.getY(), GLOBAL.CENTER_DIFF, 0, 2 * Math.PI);
        mContext.fillStyle = "#ffb100";
        mContext.fill();
        mContext.stroke();

        mContext.beginPath();
        mContext.arc(center.getX(), center.getY(), GLOBAL.CENTER_DIFF + 50, 0, 2 * Math.PI);


        mContext.moveTo(0,GLOBAL.CANVAS_HEIGHT);
        mContext.lineTo(GLOBAL.CANVAS_WIDTH, GLOBAL.CANVAS_HEIGHT);
        mContext.stroke();
    }
    /*Privileged method called by pagebeforeshow events.
    * @param: {object} canvas of incoming page.
    */
    this.setCanvas      = function(arg_canvas){
        mCanvas         = arg_canvas;
        mCanvas.width   = GLOBAL.CANVAS_WIDTH;
        mCanvas.height  = GLOBAL.CANVAS_HEIGHT;
        mContext        = mCanvas.getContext('2d');
    };

    /*Privileged method called by pagebeforeshow events.
    * Starts a loop that calls physics() and draw() thus rotating and drawing graph on canvas.
    */
    this.start          = function(){
        intervalId      = setInterval(function(){
            physics();
            draw();
        },GLOBAL.GRAPH_INTERVAL);
    };

    /*Privileged method called by pagehide events.
    * Stops the loop and discards Figures.
    */
    this.stop           = function(){
        mData = new FifoQueue(17);
        mValues = new FifoQueue(30);
        lastFig = 0;
        clearInterval(intervalId);
    };

    /*Privileged method called by Stock (Observable).
    * Adds Figure with new value given from Observable to mData.
    * Updates Sibling div with current Time & Value.
    * @param: {string} new Value given from Obvservable.
    */
    this.update         = function(arg_value){
        if(arg_value){
            var tFunc   = function(arg_time){
                if(arg_time < 10){
                    return "0" + arg_time;
                }
                return arg_time;
            };

            var tTime = new Date();

            var tColor = "#" + (220 - 2 * parseInt(arg_value)).toString(16) + (parseInt(arg_value) * 2 + 20).toString(16) + "00";
            var tPoint = new Point({theta: 0, radius: GLOBAL.CENTER_DIFF, point: center, polar: true});
            var tFigure= new mFigure({point: tPoint, oldFigure: lastFig, value: parseInt(arg_value), color: tColor});
            mValues.addPoint(parseInt(arg_value));
            mData.addPoint(tFigure);
            $(mCanvas).siblings().text("Current: " + arg_value + " Average: " + mValues.meanValue() + " @" + tFunc(tTime.getHours()) + ":" + tFunc(tTime.getMinutes()) + ":" + tFunc(tTime.getSeconds()));
            lastFig = tFigure;
        }
    };

    /*Privileged method called by UI buttons.
    * Used by UI to change Figure drawn on graph.
    */
    this.setFigure      = function(arg_figure){
        mFigure = arg_figure;
        lastFig = 0;
    };
}//----End Graph

/*Class FifoQueue
* Used by Graph to store Figures.
* Wraps an array of Figures with a given size.
* If an object is added and the size is met, the oldest object will be removed.
* @param: {number} Size of Queue.
*/
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

    this.meanValue      = function(){

        var sum = 0;
        for(var i = 0; i < mQueue.length; i++){
            sum += mQueue[i];
        }
        return Math.floor(sum / mQueue.length);
    };
    this.rotate         = function(arg_theta){
        if(mQueue){
            for(var i = mQueue.length - 1; i >= 0; i--){
                mQueue[i].rotate(arg_theta);
            }
        }
    };

    this.draw           = function(arg_context){
        if(mQueue){
            for(var i = mQueue.length - 1; i >= 0; i--){
                mQueue[i].draw(arg_context);
            }
        }
    };

}//----End FifoQueue

/*Class Point
* Represents a 2dimensional point.
* @param: {point: Rotation center.
*          theta: Starting angle.
*          radius: Distance from Rotation center.
*          isPolar: if true polar coordinates are given.
*          x: x-position.
*          y: y-position.} Argument object with data describing point position and relations.
*/
function Point(arg_object){
    "use strict";

    var center          = arg_object.point;
    var theta           = arg_object.theta;
    var radius          = arg_object.radius;
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

/*Class Planet (Figure)
* Instantiated by Stock(Observable) via Graph(Observer).
* 1 Planet and 2 moons. Smaller moon rotates around bigger moon that rotates around Planet.
* Changes color and size depending on Stockvalue.
* @param: {object} Point object, represents center of Figure.
*/
function Planet(arg_object){
    "use strict";
    var mColor          = arg_object.color;
    var mCenter         = arg_object.point;
    var mValue          = arg_object.value;

    var mSatPt          = new Point({polar: true, point: mCenter, theta: 0, radius: mValue});
    var mSatPt2         = new Point({polar: true, point: mSatPt, theta: 0, radius: mValue / 8 + 4});
    var mSatPt3         = new Point({polar: true, point: mSatPt2, theta: 0, radius: 9});

    this.getValPt       = function(){
        return mSatPt;
    };

    this.draw           = function(arg_context){
        arg_context.beginPath();
        arg_context.arc(mSatPt.getX(), mSatPt.getY(), mValue / 8, 0, 2 * Math.PI);
        arg_context.moveTo(mSatPt2.getX(), mSatPt2.getY());
        arg_context.arc(mSatPt2.getX(), mSatPt2.getY(), 2, 0, 2 * Math.PI);
        arg_context.moveTo(mSatPt3.getX(), mSatPt3.getY());
        arg_context.arc(mSatPt3.getX(), mSatPt3.getY(), 1, 0, 2 * Math.PI);
        arg_context.fillStyle = mColor;
        arg_context.fill();
        arg_context.stroke();
    };
    this.rotate         = function(arg_theta){
        mSatPt.rotate(arg_theta);
        mSatPt2.rotate(3 * arg_theta);
        mSatPt3.rotate(5 * arg_theta);
        mCenter.rotate(arg_theta);
    };
}//----End Planet
/*Class Plank (Figure)
* Instantiated by Stock(Observable) via Graph(Observer).
* Designed to deliver information. Changes color and draws text and lines depending on Stockvalue.
* @param: {object} Point object, represents center of Figure.
*/
function Plank(arg_object){
    "use strict";
    var mColor         = arg_object.color;
    var mCenter        = arg_object.point;
    var mValue         = arg_object.value;
    var oldFig         = arg_object.oldFigure;

    var mPoint         = new Point({polar: true, point: mCenter, theta: 0, radius: mValue});
    var mSecondPoint   = new Point({polar: true, point: mCenter, theta: 0, radius: 90});

    this.getValPt      = function(){
        return mPoint;
    };

    this.draw          = function(arg_context){
        arg_context.beginPath();
        arg_context.fillStyle = mColor;
        if(oldFig){
            arg_context.moveTo(oldFig.getValPt().getCenter().getX(), oldFig.getValPt().getCenter().getY());
            arg_context.lineTo(oldFig.getValPt().getX(), oldFig.getValPt().getY());
            arg_context.lineTo(mPoint.getX(), mPoint.getY());
        }else{
            arg_context.moveTo(mPoint.getX(), mPoint.getY());
        }
        arg_context.lineTo(mCenter.getX(), mCenter.getY());
        arg_context.fill();
        arg_context.lineTo(mSecondPoint.getX(), mSecondPoint.getY());
        arg_context.strokeText(mValue, mSecondPoint.getX()-5, mSecondPoint.getY());
        arg_context.stroke();
    };

    this.rotate        = function(arg_theta){
        mCenter.rotate(arg_theta);
        mPoint.rotate(arg_theta);
        mSecondPoint.rotate(arg_theta);
    };
}//----End Plank

/*Class Plank (Figure)
* Instantiated by Stock(Observable) via Graph(Observer).
* Triforce figure from the nintendo game Zelda. Changes color and size depending on Stockvalue.
* @param: {object} Point object, represents center of Figure.
*/
function TriForce(arg_object){
    "use strict";

    var mColor         = arg_object.color;
    var mCenter        = arg_object.point;
    var mValue         = arg_object.value / 3;

    var mPoints        = [];

    mPoints.push(new Point({polar: true, point: mCenter, theta: 0, radius: 50}));
    mPoints.push(new Point({polar: true, point: mPoints[0], theta: (3 * Math.PI)/ 2, radius: mValue}));
    mPoints.push(new Point({polar: true, point: mPoints[1], theta: Math.PI / 6, radius: mValue}));
    mPoints.push(new Point({polar: true, point: mPoints[2], theta: Math.PI / 6, radius: mValue}));
    mPoints.push(new Point({polar: true, point: mPoints[3], theta: 5 * Math.PI / 6, radius: mValue}));
    mPoints.push(new Point({polar: true, point: mPoints[4], theta: 5 * Math.PI / 6, radius: mValue})); 

    this.getValPt      = function(){
        return mPoints[0];
    };

    this.draw          = function(arg_context){
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

    this.rotate       = function(arg_theta){
        mCenter.rotate(2*arg_theta);
        for(var i = 0; i < 6; i++){
            mPoints[i].rotate(2*arg_theta);
        }
    };
}//----End TriForce
