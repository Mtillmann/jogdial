# JogDial.js

## A JavaScript lib for jog dial controls.
JogDial is a simple JavaScript plugin that help you to create dial style controller easily on the webpage.

## Supported browsers and device
JogDial supports Chrome, Safari, FireFox, Internet Explorer 7+ and most of modern browsers include mobile device.

## Features
* Improved DOM and CSS features
* Refactored using ES& classes
* Does not require any other JavaScript library like jQuery.
* Cross-browser support (~~IE7+~~)
* Multi-touch support (you can control multiple number of JogDial elements at once in touch screen) 
* Custom Events
* UMD, CJS and ESM Builds

## Demo
[Click here](https://mtillmann.github.io/jogdial/)

## Usage

### Basics
Here is a basic example of JogDial.js initialization. This will start the JogDial in debug mode.

You must create the target element for the JogDial and set up the width and height property before the code start.

    var el = document.getElementById('your_element');
    var dial = new JogDial(el, {debug: true});
    
You can change the setting by passing an options-object in second argument.

    var options = {debug: true, wheelSize: 90%, knobSize: 50%, minDegree: 0};
    var dial = new JogDial(el, options);
    
### Styling
The easiest way to style the JogDial is adding background image to your target element and knob element created from JogDial script.

The wheel and knob DOM nodes created, each have a class describing its function: 

    #dial {
        width: 200px;
        height: 200px;
    }
    
    #dial .knob {
        // This is your knob style
    }
    
You can add any additional elements inside of your target element and it won't interfere the JogDial function.

Additionally, the current `degree` (angle 0-360) and `rotation` is written as data-attributes and css-variables on the main jogdial-element.

### Options
Here is a list of options can be used on JogDial.

Options              | Descriptions                                                     | Default         
:------------------- |:-----------------------------------------------------------------|:---------------
debug `bool`         | Show debug overlay on the top of screen                          |false           |
touchMode `string`   | Set the active touch area of JogDial control. 'knob' or 'wheel'  |knob            |
knobSize `int`       | Set the diameter of knob in percentage or pixel                  |30%             |
wheelSize `int`      | Set the diameter of wheel in percentage or pixel                 |100%            |
zIndex `int`         | Set the z-index of JogDial                                       |9999            |
degreeStartAt `int`  | Set the degree of wheel at start                                 |0               |
minDegree `int`      | Set the minimum degree of wheel rotation                         |null (infinite) |
maxDegree `int`      | Set the maximum degree of wheel rotation                         |null (infinite) |

### Events
Events are attached to the main jogdial element:
    
    
    el.addEventListener("jogdial.start", event => { console.log(event.detail.rotation); });
    

#### Event list
* jogdial.start
* jogdial.update
* jogdial.end

#### Event Data list from callback
    event.detail.rotation  {number}     total sum of rotated degree from the start.
    event.detail.degree    {number}     Current degree of circle in clock angle.
    
#### Triggering
You can change the angle of JogDial element by passing the number value to the `angle` method.

    var dial = new JogDial(el, {debug: true});
    dial.set(45); 
    // This will change the JogDial degree to 45.
    
    
## Copyright
Licensed under the MIT license 
