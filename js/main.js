$(function () {

    var bodyWidth = $(document).width();

    //Bubbles!
    //Make some seed bubbles
    for (var i = 0; i < 10; i++) {
        setTimeout(makeBubble, Math.random() * 10000);
    }


//Make a bubble with some random initial values and make it rise.
    function makeBubble() {
        var r = Math.random() * 10;  //Radius
        var x = Math.round(Math.random() * bodyWidth); //Starting position along the bottom of the ocean
        var speed = Math.round(Math.random() * 10 + 17) * 1000; //How fast it rises.
        var bubble = $("<div></div>").addClass("bubble");
        bubble.css({width: r + "px", height: r + "px", right: x + "px"});
        $("#MainBlock").prepend(bubble);

        bubble
            .animate({bottom: 580}, speed, "linear",
            //Once it reaches the top, remove it, and launch a new random bubble
            function () {
                $(this).remove();
                makeBubble();
            })
            //If it's moused over, pop it :)
            .on("mouseover", function () {
                $(this)
                    .stop()
                    .animate({width: 15, opacity: 0}, function () {
                        $(this).remove();
                        makeBubble();
                    })
            })
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