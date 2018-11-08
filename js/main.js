//as the speed of falling gets faster, does the traverse speed need to increase too?


var ntiles = 12 //12 is still hard-coded for tile generation!
var sweep_pos = 2;//in the middle of the second tile from the top when update distance = 0;

var obstacle_reservation = 4
var tile_width = 32;
var display_width = tile_width * 10;
var display_height = tile_width * (ntiles - 1);//one less so that the top and bottom of the canvas element always has overflow; there are never blank gaps

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = display_width;
canvas.height = display_height;
document.body.appendChild(canvas);

canvas.addEventListener('click', function (evt) {
    var mousePos = getMousePos(canvas, evt);
    if (playing == true) {
        var lane;
        for (i = 0; i < 5; i++) {
            if (mousePos.x < 2*tile_width*(i+1)) {
                lane = i;
                break;
            }
        }
        for (i = 0; i < sweep_list.length; i++) {
            if (sweep_list[i].lane == lane) {
                sweep_list[i].changeDirection();
            }
        }
    }

}, false);

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // absolute size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    return {
        x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
        y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
}


//load images into an array
var tiles = [];//use array literals rather than new keyword

tiles[0] = new Image();
tiles[0].src = "images/Wall Left.png";

tiles[1] = new Image();
tiles[1].src = "images/Wall Right.png";

tiles[2] = new Image();
tiles[2].src = "images/Obstacle Left.png";

tiles[3] = new Image();
tiles[3].src = "images/Obstacle Right.png";

//load other images
var background = new Image();
background.src = "images/Background.png";

var sweeper = new Image();
sweeper.src = "images/Sweeper.png";

//need something to check images are loaded

//game variables
var playing = true;//move this somewhere else? - will be set to false initially for menu to come up

var total_distance = 0;//pixels
var update_distance = 0;//pixels
var initial_speed = 60;//pixels per second - initial speed can only be changed in the menu
var speed = 0;//pixels per second
var bg_total_distance = 0;//pixels
var bg_update_distance = 0;//pixels
//bg_initial_speed doesn't exist - bg_speed set in reset() as initial_speed (which is set in menu) minus parallax_offset
//var bg_speed = 0;//pixels per second

var acceleration = 0;//change in pixels per second, per second

var parallax_offset = 10;//the background starts out at a speed this number below that of the foreground

var lanes = [];//needed here?

var sweeps_chosen = [4, 1, 2, 0, 3];//to be defined in the menu
var sweep_list = [];

var reset = function () {
    total_distance = 0;
    speed = initial_speed;
    bg_speed = initial_speed - parallax_offset;

    for (i = 0; i < sweeps_chosen.length; i++) {
        var status = "none";
        if (i in sweeps_chosen) {
            status = "left";
        }
        sweep_list[i] = new Sweep(status, sweeps_chosen[i], sweep_pos, tile_width);
    }

    //will set acceleration, used lanes and initial speed to user defined values **from menu** in this function

    //create 3-dimensional array (5 lanes, 2 sides per lane, 8 tiles per side)
    lanes = [];
    for (i = 0; i < 5; i++) {
        lanes[i] = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];
    }
};


//ES2015 class Sweep downgraded to a function for compatability with Internet Explorer
function Sweep(status, lane, sweep_pos, tile_width) {//don't need var delta for update() or var sweeper for render() because they're passed in through the function calls
    this.lane = lane;
    this.status = status;
    this.speed = 100;//pixels per second
    this.width = 16;//length of side of hitbox
    this.limit_x = 8;//pos_x_limit and neg_x_limit no longer used, it's just calculated using -this.x_limit
    this.rel_x = -this.limit_x;//starts out on left side of lane
    this.y = (sweep_pos - 0.5) * tile_width + this.width / 2;


    this.render = function (sweeper, tile_width) {
        ctx.drawImage(sweeper, this.lane * tile_width * 2 + tile_width + this.rel_x - this.width / 2, this.y - this.width / 2);
    }


    this.changeDirection = function () {
        if (this.status == "right" || this.rel_x == this.limit_x) {//if it's moving right or is idle on the right side
            this.status = "left";
        }
        else if (this.status == "left" || this.rel_x == -this.limit_x) {//if it's moving left or is idle on the left side
            this.status = "right";
        }
        //change else if to just else above?
    }

    this.update = function (delta) {
        if (this.status == "right") {
            this.rel_x += delta * this.speed;
            if (this.rel_x > this.limit_x) {
                this.rel_x = this.limit_x;//to elimatinate any overshoot, before collision detection or rendering
                this.status = "idle";
            }
        }
        else if (this.status == "left") {
            this.rel_x -= delta * this.speed;
            if (this.rel_x < -this.limit_x) {
                this.rel_x = -this.limit_x;//to elimatinate any overshoot, before collision detection or rendering
                this.status = "idle";
            }
        }
        //if (this.status == "idle") don't do anything
    }

    this.collide = function (pad) {
        //left side
        if (this.rel_x - this.width / 2 < -pad) {
            if (lanes[this.lane][0][sweep_pos-1] == 2) {
                if (this.y - this.width / 2 < sweep_pos * tile_width - (total_distance - update_distance)) {
                    playing = false;
                }
            }
            if (lanes[this.lane][0][sweep_pos] == 2) {
                if (this.y - this.width / 2 < (sweep_pos + 1) * tile_width - (total_distance - update_distance)) {
                    playing = false;
                }
            }
        }
        //right side
        if (this.rel_x + this.width / 2 > pad) {
            if (lanes[this.lane][1][sweep_pos-1] == 3) {
                if (this.y - this.width / 2 < sweep_pos * tile_width - (total_distance - update_distance)) {
                    playing = false;
                }
            }
            if (lanes[this.lane][1][sweep_pos] == 3) {
                if (this.y - this.width / 2 < (sweep_pos + 1) * tile_width - (total_distance - update_distance)) {
                    playing = false;
                }
            }
        }
    }
}



var generateBgTiles = function () {
    if (bg_total_distance - bg_update_distance > tile_width) {
        bg_update_distance = bg_update_distance + tile_width;
    }
}

var generateTiles = function () {
    if (total_distance - update_distance > tile_width) {//if the distance since the most recent row of tiles were generated is over 1 tile
        for (i = 0; i < 5; i++) {
            lanes[i][0].splice(0, 1);//delete oldest tile on the left side
            lanes[i][1].splice(0, 1);//delete oldest tile on the right side
            var length = lanes[i][0].length - 1;//could equally be lanes[i][1].length - get a var for number of y tiles?
            if (lanes[i][0][length] === 2 || lanes[i][1][length] === 3) {//if the last tile to be generated on either side is an obstacle
                lanes[i][0].push(0);
                lanes[i][1].push(1);
            }
            else {
                switch (Math.floor(Math.random() * 12)) {//1/6 chance of an obstacle
                    case 0://obstacle on the left side
                        lanes[i][0].push(2);//left obstacle
                        lanes[i][1].push(1);//right wall
                        break;//won't bother testing other cases
                    case 1://obstacle on the right side
                        lanes[i][0].push(0);//left wall
                        lanes[i][1].push(3);//right obstacle
                        break;
                    default://no obstacles
                        lanes[i][0].push(0);
                        lanes[i][1].push(1);
                }
            }
        }
        update_distance = update_distance + tile_width;
    }
};


var checkCollisions = function (obstacle_reservation) {
    for (i = 0; i < sweep_list.length; i++) {
        sweep_list[i].collide(obstacle_reservation);
    }
};

var updateSweeps = function (delta) {
    for (i = 0; i < sweep_list.length; i++) {
        sweep_list[i].update(delta);
    }
}

//RENDER FUNCTIONS
var renderBackground = function () {
    var x = 0;
    var y = 0;
    for (i = 0; i < 10; i++) {
        x = i * tile_width;
        for (k = 0; k < ntiles; k++) {
            y = k * tile_width;
            ctx.drawImage(background, x, y - (bg_total_distance - bg_update_distance));
        }
    }
};

var renderSweeps = function () {
    for (i = 0; i < sweep_list.length; i++) {
        sweep_list[i].render(sweeper, tile_width);
    }
}

var renderObstacles = function () {
    var x = 0;
    var y = 0;
    for (i = 0; i < 5; i++) {
        for (j = 0; j < 2; j++) {
            x = i * 2 * tile_width + j * tile_width;
            for (k = 0; k < ntiles; k++) {
                y = k * tile_width;
                ctx.drawImage(tiles[lanes[i][j][k]], x, y - (total_distance - update_distance));
                
            }
        }

    }
};


//MAIN GAME LOOP
var main = function () {
    var now = Date.now();
    var delta = (now - then) / 1000;
    
    if (playing) {
        speed = speed + acceleration * delta;
        total_distance = total_distance + delta * speed;
        bg_total_distance = bg_total_distance + delta * (speed - parallax_offset);//(speed - parallax_offset) = bg speed
        generateBgTiles();
        generateTiles();
        //changeDirection function triggered by click event
        updateSweeps(delta);
        checkCollisions(obstacle_reservation);
    }
    else {
        //do menu things
    }

    //render everything from the back layer to the top
    //ctx.clearRect(0, 0, display_width, display_height); //shouldn't need this but can be useful for testing
    renderBackground();
    renderSweeps();
    renderObstacles();

    then = now;

    //debug

    //call this function again when browser ready
    requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

var then = Date.now();//has to be done the first time
reset();
main();