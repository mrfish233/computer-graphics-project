// keyboard source: https://stackoverflow.com/questions/3691461/remove-key-press-delay-in-javascript

/**
Keyboard input with customisable repeat (set to 0 for no key repeat)
KeyboardController({
    32: {interval:0, callback: startGame },
    37: {interval:10, callback: function() { padSpeed -= 5; } },
    39: {interval:10, callback: function() { padSpeed += 5; } }
});
*/
function keyboardController(keys) {
    // Lookup of key codes to timer ID, or null for no repeat
    let timers = {};

    // When key is pressed and we don't already think it's pressed, call the
    // key action callback and set a timer to generate another one after a delay
    document.onkeydown = function(event) {
        let key = event.key;

        if (!(key in keys)) {
            return true;
        }

        if (!(key in timers)) {
            timers[key] = null;
            keys[key].callback();

            if (keys[key].interval !== 0) {
                timers[key] = setInterval(keys[key].callback, keys[key].interval);
            }
        }

        return false;
    };

    // Cancel timeout and mark key as released on keyup
    document.onkeyup = function(event) {
        let key = event.key;

        if (key in timers) {
            if (timers[key] !== null)
                clearInterval(timers[key]);
            delete timers[key];
        }
    };

    // When window is unfocused we may not get key events. To prevent this
    // causing a key to 'get stuck down', cancel all held keys
    window.onblur = function() {
        for (let key in timers) {
            if (timers[key] !== null) {
                clearInterval(timers[key]);
            }
        }

        timers = {};
    };
};

/**
Mouse input controller
Usage:
mouseController(canvas, {
    mousedown: (event) => { console.log(event.clientX + ' ' + event.clientY); },
    mouseup: (event) => { console.log(event.clientX + ' ' + event.clientY); },
    mousemove: (event) => { console.log(event.clientX + ' ' + event.clientY); },
    mousewheel: (event) => { console.log(event.deltaY); }
});
 */

function mouseController(canvas, mouse) {
    canvas.onmousedown = function (event) {
        if (mouse.mousedown) {
            mouse.mousedown(event);
        }
    }

    canvas.onmouseup = function (event) {
        if (mouse.mouseup) {
            mouse.mouseup(event);
        }
    }

    canvas.onmousemove = function (event) {
        if (mouse.mousemove) {
            mouse.mousemove(event);
        }
    }

    canvas.onmousewheel = function (event) {
        if (mouse.mousewheel) {
            mouse.mousewheel(event);
        }
    }
}
