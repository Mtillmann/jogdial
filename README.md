# JogDial.js 2.1.0

Forked from [Sean Oh's JogDial.js](https://github.com/ohsiwon/JogDial.js) with the following changes:

* rewritten using es6 classes
* dropped support for obsolete devices
* removed deprecated features and apis, duplicate/dead code
* removed options in favor of CSS properties and vars
* improved events, DOM and default styles
* exposes internal state through data-attr and css-vars
* provides ESM, CJS and UMD builds
* simple input binding
* improved examples
* about 2KiB minified and zipped

## Examples

[Click here for some examples](https://mtillmann.github.io/JogDial.js/)

## Installation

`npm install Mtillmann/JogDial.js --save`

Use the `dist/jogdial.umd.min.js` for browser inclusion, otherwise pick the file best suited for your module system.
Don't forget to include `dist/jogdial.css`.

## Usage

Create the
markup, [make sure that the box your instance will live inside is square](https://stackoverflow.com/a/28985475/8797350):

```html5
<div class="your-square-box">
    <div class="jogdial" id="my-jogdial-instance"></div>
</div>
```

Next, create a JogDial instance:

```ecmascript 6
const element = document.getElementById('my-jogdial-instance');
const myJogDialInstance = new JogDial(element, {});
```

### Options

Here is a list of options can be used on JogDial.

| Options                  | Descriptions                                                        | Default   |
|:-------------------------|:--------------------------------------------------------------------|:----------|
| debug `bool`             | Adds default styling on the instance                                | false     |
| mode `string`            | Set the active touch area of JogDial control. 'knob' or 'wheel'     | knob      |
| wheelSnap | When set, the wheel will snap to where it was touched/clicked. _Added in 2.1.0_ | false |
| ~~knobSize~~ `int`       | see below...                                                        |           |
| ~~wheelSize~~ `int`      | see below...                                                        |           |
| angle `int`              | Set the angle of wheel at start                                     | 0         |
| minAngle `int`           | Set the minimum angle of wheel rotation                             | -Infinity |
| maxAngle `int`           | Set the maximum angle of wheel rotation                             | Infinity  |
| attrPrefix `string`      | prefix for the data-attributes                                      | jd        |
| cssVarPrefix `string`    | prefix for the CSS-variables                                        | jd        |
| eventPrefix `string`     | prefix for the custom events                                        | jd        |
| roundInputValue `bool`   | When set, input values will be rounded                              | true      |
| input `HTMLInputElement` | input-element to bind the dial to                                   | null      |
| roundStateValues `bool`  | When set, the state values propagated to dom and events are rounded | false     |

### CSS Options

Deprecated options `knobSize` and `wheelSize` are now set via CSS vars since they were never actually used in javascript code:

```css
#my-jogdial-instance{
    --wheelsize: 100%;
    --knobsize: 30%;
}

/* the values above are used in the actual default styles like this: */

.jogdial .wheel {
    /* ... */
    --size: var(--wheelsize);
    width: var(--size);
    height: var(--size);
}
```

### Events

Events are attached to the main jogdial element:
```ecmascript 6
element.addEventListener("jd.start", event => { console.log(event.detail); });
```

Event payload inside the `event.detail` always looks like this:

```json5
{
  "rotation": 123,
  "progress": 0.3416666666666667,
  "angle": 123,
  "percent": "34.166666666666664%"
}
```
Available Events are: `$PREFIX.start`, `$PREFIX.update` and `$PREFIX.end` where `$PREFIX` is `options.eventPrefix`.

### Exposed state

Primarily to enable usage in CSS, the state of the instance is exposed css-vars inside a style-attribute and data-attributes on the instance's element. After an update of the instance, the associated element's DOM will look like this:

```html
<div class="jogdial" id="my-jogdial-instance" 
     data-jd-is-attached="true" 
     data-jd-progress="0.3910449178663543" 
     data-jd-percent="39.10449178663543%"
     data-jd-rotation="140.77617043188755"
     data-jd-angle="140.77617043188755"
     style="
        --jd-progress:0.391045; 
        --jd-percent:39.1045%; 
        --jd-rotation:140.776deg; 
        --jd-angle:140.776deg;
    ">
    ...
</div>
```

This way you can easily write the current state of the dial into a pseudo-element or use it to calculate rotation on the
knob etc (see examples...). Set `options.roundStateValues = true` for rounded values. 

Additionally, there's the `data-$PREFIX-pressed`-attribute, only present when the pointer is down. It can be used as an alternative for the `:active`-pseudo class.

### Setting the angle

You can change the angle of JogDial element by calling the `set` method.

```ecmascript 6
myJogDialInstance.set(55);
```

Pass an optional second argument `false` to prevent `update`-events from being fired.

## Copyright

Licensed under the MIT license 
