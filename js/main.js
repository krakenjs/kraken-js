$(function () {

    var bodyWidth = $(document).width();

    //Bubbles!
    //Make some seed bubbles
    for (var i = 0; i < 10; i++) {
        setTimeout(makeBubble, Math.random() * 10 * 1000);
    }


    //Make a bubble with some random initial values and make it rise.
    function makeBubble() {
        var r = Math.random() * 10;  //Radius
        var x = Math.round(Math.random() * bodyWidth); //Starting position along the bottom of the ocean
        var speed = Math.round(Math.random() * 20) + 10 + "s"; //How fast it rises.
        var bubble = $("<div></div>").addClass("bubble");
        bubble.css({
            width: r + "px", 
            height: r + "px", 
            right: x + "px",
            webkitAnimationDuration: speed,
            mozAnimationDuration: speed,
            animationDuration: speed
        });

        $("#MainBlock").prepend(bubble);

        // When the bubble reaches the top, remove it and create a new one.
        bubble.on("animationend webkitAnimationEnd oanimationend msAnimationEnd", function (e) {
            $(this).remove();
            makeBubble();
        //If it's moused over, pop it :)
        }).on("mouseover", function () {
            $(this).stop().animate({
                width: 15, 
                opacity: 0
            }, function () {
                $(this).remove();
                makeBubble();
            });
        });
    }

    //Parallax!
    /*
     Determine mouse position on screen from -1 to +1;
     Shift elements according to their range (+ -)
     Higher ranges means more movement.
     element: What I want to move
     property: What css attribute I'll tweak to show movement
     base: zero position.
     suffix: Necessary for the css property ot work (eg: px, em, %)
     range: +- range of motion for the property.
     direction: Direction of the offset to be applied.
     */

    //Elements to move
    var parallax = [
        {
            element: $("body"),
            property: "backgroundPosition",
            base: -200,
            suffix: "px",
            range: 3,
            direction: 1
        },
        {
            element: $("#Tentacle"),
            property: "right",
            base: 20,
            suffix: "%",
            range: 0.75,
            direction: 1
        },
        {
            element: $("#Rocks"),
            property: "backgroundPosition",
            base: 0,
            suffix: "px",
            range: 10,
            direction: 1
        }
    ];

    //Parallax effect
    $(window).on("mousemove", function (e) {
            //Look at mouse position within the screen, and determine it's relative location.
            //-1 would be the far left, 1 would be the far right.
            var position = -(bodyWidth - 2 * e.screenX) / (bodyWidth);

            //Iterate through all the elements in the parallax group, and shift them according to the mouse position
            for (var i in parallax) {
                var p = parallax[i];
                //Determine the new position as: The zero (base) position + (new offset in -range to +range)
                var newPos = p.base + (position * p.range * p.direction) + p.suffix;
                var newCss = {};
                //Background positions have two coordinates, which required the clause below.
                //The property becomes "N 0" for movement along the x axis, where N is the new position.
                newCss[p.property] = (p.property === "backgroundPosition" ? newPos + " 0" : newPos);
                p.element.css(newCss);

            }

        }
    )

});

































































































//Konami code!
$(function(){
    var easter_egg = new Konami();
    easter_egg.code = replaceLogo;
    easter_egg.load();

    function replaceLogo(){
        var newLogo = $('#MainLogo');
        var oldLogo = $('<div></div>').attr('id','OldLogo').hide();
        newLogo.fadeOut(function(){
            newLogo.replaceWith(oldLogo);
            oldLogo.fadeIn();
        })

    }

})
/*
 * Konami-JS ~
 * :: Now with support for touch events and multiple instances for
 * :: those situations that call for multiple easter eggs!
 * Code: http://konami-js.googlecode.com/
 * Examples: http://www.snaptortoise.com/konami-js
 * Copyright (c) 2009 George Mandis (georgemandis.com, snaptortoise.com)
 * Version: 1.4.2 (9/2/2013)
 * Licensed under the MIT License (http://opensource.org/licenses/MIT)
 * Tested in: Safari 4+, Google Chrome 4+, Firefox 3+, IE7+, Mobile Safari 2.2.1 and Dolphin Browser
 */

var Konami = function (callback) {
    var konami = {
        addEvent: function (obj, type, fn, ref_obj) {
            if (obj.addEventListener)
                obj.addEventListener(type, fn, false);
            else if (obj.attachEvent) {
                // IE
                obj["e" + type + fn] = fn;
                obj[type + fn] = function () {
                    obj["e" + type + fn](window.event, ref_obj);
                }
                obj.attachEvent("on" + type, obj[type + fn]);
            }
        },
        input: "",
        pattern: "38384040373937396665",
        load: function (link) {
            this.addEvent(document, "keydown", function (e, ref_obj) {
                if (ref_obj) konami = ref_obj; // IE
                konami.input += e ? e.keyCode : event.keyCode;
                if (konami.input.length > konami.pattern.length)
                    konami.input = konami.input.substr((konami.input.length - konami.pattern.length));
                if (konami.input == konami.pattern) {
                    konami.code(link);
                    konami.input = "";
                    e.preventDefault();
                    return false;
                }
            }, this);
            this.iphone.load(link);
        },
        code: function (link) {
            window.location = link
        },
        iphone: {
            start_x: 0,
            start_y: 0,
            stop_x: 0,
            stop_y: 0,
            tap: false,
            capture: false,
            orig_keys: "",
            keys: ["UP", "UP", "DOWN", "DOWN", "LEFT", "RIGHT", "LEFT", "RIGHT", "TAP", "TAP"],
            code: function (link) {
                konami.code(link);
            },
            load: function (link) {
                this.orig_keys = this.keys;
                konami.addEvent(document, "touchmove", function (e) {
                    if (e.touches.length == 1 && konami.iphone.capture == true) {
                        var touch = e.touches[0];
                        konami.iphone.stop_x = touch.pageX;
                        konami.iphone.stop_y = touch.pageY;
                        konami.iphone.tap = false;
                        konami.iphone.capture = false;
                        konami.iphone.check_direction();
                    }
                });
                konami.addEvent(document, "touchend", function (evt) {
                    if (konami.iphone.tap == true) konami.iphone.check_direction(link);
                }, false);
                konami.addEvent(document, "touchstart", function (evt) {
                    konami.iphone.start_x = evt.changedTouches[0].pageX;
                    konami.iphone.start_y = evt.changedTouches[0].pageY;
                    konami.iphone.tap = true;
                    konami.iphone.capture = true;
                });
            },
            check_direction: function (link) {
                x_magnitude = Math.abs(this.start_x - this.stop_x);
                y_magnitude = Math.abs(this.start_y - this.stop_y);
                x = ((this.start_x - this.stop_x) < 0) ? "RIGHT" : "LEFT";
                y = ((this.start_y - this.stop_y) < 0) ? "DOWN" : "UP";
                result = (x_magnitude > y_magnitude) ? x : y;
                result = (this.tap == true) ? "TAP" : result;

                if (result == this.keys[0]) this.keys = this.keys.slice(1, this.keys.length);
                if (this.keys.length == 0) {
                    this.keys = this.orig_keys;
                    this.code(link);
                }
            }
        }
    }

    typeof callback === "string" && konami.load(callback);
    if (typeof callback === "function") {
        konami.code = callback;
        konami.load();
    }

    return konami;
};