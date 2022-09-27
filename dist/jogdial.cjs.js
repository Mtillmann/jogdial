'use strict';

class JogDial {


    quadrant = {
        current: 1,
        previous: 1
    };

    rotation = {
        current: 0,
        previous: 0
    };

    pressed = false;

    // Detect mouse event type
    supportsTouchEvents = ('ontouchstart' in window);

    // Predefined options
    defaults = {
        debug: false,
        mode: 'knob',
        angle: 0,
        minAngle: -Infinity,
        maxAngle: Infinity,
        attrPrefix: 'jd',
        cssVarPrefix: 'jd',
        eventPrefix: 'jd',
        roundInputValue: true,
        input: null,
        roundStateValues : false
    };

    // Predefined DOM events
    domEvent = {
        MOUSE_DOWN: 'mousedown', MOUSE_MOVE: 'mousemove', MOUSE_OUT: 'mouseout', MOUSE_UP: 'mouseup'
    };

    attrNames = {};
    cssVarNames = {};

    constructor(element, options) {

        options = {...this.defaults, ...options};
        this.options = options;

        this.attrNames = {
            attached: `${options.attrPrefix}IsAttached`,
            debug: `${options.attrPrefix}Debug`,
            angle: `${options.attrPrefix}Angle`,
            rotation: `${options.attrPrefix}Rotation`,
            progress: `${options.attrPrefix}Progress`,
            percent: `${options.attrPrefix}Percent`,
            pressed: `${options.attrPrefix}Pressed`,
        };

        this.cssVarNames = {
            angle: `--${options.attrPrefix}-angle`,
            rotation: `--${options.attrPrefix}-rotation`,
            progress: `--${options.attrPrefix}-progress`,
            percent: `--${options.attrPrefix}-percent`,
        };

        if (this.attrNames.attached in element.dataset) {
            console.error('Please Check your code: JogDial can not be initialized twice in a same element.');
            return false;
        }

        this.element = element;
        this.element.dataset[this.attrNames.attached] = 'true';

        this.setupDOM();
        this.setupEvents();
        this.angleTo(this.convertClockToUnit(this.options.angle));
    }

    /**
     *
     * @param input
     * @param emitEvent
     */
    set(input, emitEvent = true) {
        const maxAngle = this.options.maxAngle || 360;
        const angle = (input > maxAngle) ? maxAngle : input;
        this.angleTo(this.convertClockToUnit(angle), angle, emitEvent);
    }

    setupDOM() {

        this.knob = document.createElement('div');
        this.wheel = document.createElement('div');

        this.wheel.classList.add('wheel');
        this.knob.classList.add('knob');

        this.element.appendChild(this.wheel);
        this.element.appendChild(this.knob);

        if (this.options.mode === 'wheel') {
            let foreground = document.createElement('div');
            foreground.classList.add('foreground');
            this.element.appendChild(foreground);
        }

        //Set radius value
        const knobRadius = this.knob.clientWidth / 2;
        const wheelRadius = this.wheel.clientWidth / 2;

        //Set knob properties
        this.knob.style.setProperty('margin', -knobRadius + 'px 0 0 ' + -knobRadius + 'px');

        const wheelMarginLeft = (this.element.clientWidth - this.wheel.clientWidth) / 2;
        const wheelMarginTop = (this.element.clientHeight - this.wheel.clientHeight) / 2;

        this.wheel.style.setProperty('margin', wheelMarginTop + 'px 0 0 ' + wheelMarginLeft + 'px');

        //set radius and center point value
        this.radius = wheelRadius - knobRadius;
        this.center = {x: wheelRadius + wheelMarginLeft, y: wheelRadius + wheelMarginTop};

        if (this.options.debug) {
            this.element.dataset[this.attrNames.debug] = 'true';
        }

        if (this.options.input) {
            this.options.input.addEventListener('input', e => {
                this.set(parseInt(e.target.value));
            });
        }
    }


    setupEvents() {
        //Detect event support type and override values
        if (this.supportsTouchEvents) { // Mobile standard
            this.domEvent = {
                ...this.domEvent, ...{
                    MOUSE_DOWN: 'touchstart', MOUSE_MOVE: 'touchmove', MOUSE_OUT: 'touchleave', MOUSE_UP: 'touchend'
                }
            };
        }

        // mouseDownEvent (MOUSE_DOWN)
        const mouseDownEvent = e => {
            switch (this.options.mode) {
                case 'knob':
                default:
                    this.pressed = this.checkBoxCollision({
                        x1: this.knob.offsetLeft - this.wheel.offsetLeft,
                        y1: this.knob.offsetTop - this.wheel.offsetTop,
                        x2: this.knob.offsetLeft - this.wheel.offsetLeft + this.knob.clientWidth,
                        y2: this.knob.offsetTop - this.wheel.offsetTop + this.knob.clientHeight
                    }, this.getCoordinates(e));
                    break;
                case 'wheel':
                    this.pressed = true;
                    mouseDragEvent(e);
                    break;
            }

            //Trigger down event
            if (this.pressed) {
                this.element.dataset[this.attrNames.pressed] = this.options.mode;
                this.element.dispatchEvent(new CustomEvent(`${this.options.eventPrefix}.start`, {
                    detail: this.getState()
                }));
            }else {
                delete this.element.dataset[this.attrNames.pressed];
            }
        };

        // mouseDragEvent (MOUSE_MOVE)
        const mouseDragEvent = e => {
            if (this.pressed) {
                e.preventDefault();

                const offset = this.getCoordinates(e);
                const x = offset.x - this.center.x + this.wheel.offsetLeft;
                const y = offset.y - this.center.y + this.wheel.offsetTop;

                let radian = Math.atan2(y, x) * (180 / Math.PI);
                let quadrant = this.getQuadrant(x, y);
                let angle = this.convertUnitToClock(radian);

                //Calculate the current rotation value based on pointer offset
                this.rotation.current = this.getRotation((quadrant === undefined) ? this.quadrant.previous : quadrant, angle);
                let rotation = this.rotation.current;

                if (this.options.maxAngle !== Infinity && this.options.maxAngle <= rotation) {
                    rotation = this.options.maxAngle;
                    radian = this.convertClockToUnit(rotation);
                    angle = this.convertUnitToClock(radian);
                } else if (this.options.minAngle !== -Infinity && this.options.minAngle >= rotation) {
                    rotation = this.options.minAngle;
                    radian = this.convertClockToUnit(rotation);
                    angle = this.convertUnitToClock(radian);
                }

                this.setAttributes(rotation, angle);

                // update angle
                this.angleTo(radian);
            }
        };

        const mouseUpEvent = () => {
            if (this.pressed) {
                this.pressed = false;
                delete this.element.dataset[this.attrNames.pressed];
                this.element.dispatchEvent(new CustomEvent(`${this.options.eventPrefix}.end`, {
                    detail: this.getState()
                }));
            }
        };


        // Add events
        this.addEventListeners(this.element, this.domEvent.MOUSE_DOWN, mouseDownEvent, false);
        this.addEventListeners(this.element, this.domEvent.MOUSE_MOVE, mouseDragEvent, false);
        this.addEventListeners(this.element, this.domEvent.MOUSE_UP, mouseUpEvent, false);
        this.addEventListeners(this.element, this.domEvent.MOUSE_OUT, mouseUpEvent, false);

    };

    /**
     *
     * @param radian
     * @param triggeredAngle
     * @param emitEvent
     */
    angleTo(radian, triggeredAngle = false, emitEvent = true) {
        radian *= Math.PI / 180;
        const x = Math.cos(radian) * this.radius + this.center.x;
        const y = Math.sin(radian) * this.radius + this.center.y;
        const quadrant = this.getQuadrant(x, y);

        this.knob.style.setProperty('left', x + 'px');
        this.knob.style.setProperty('top', y + 'px');

        if (!this.element.dataset.rotation === undefined) {
            this.setAttributes(this.options.angle, this.convertUnitToClock(radian));
        }

        if (triggeredAngle) {
            this.quadrant.current = quadrant;
            this.quadrant.previous = quadrant;
            this.rotation.current = triggeredAngle;
            this.rotation.previous = triggeredAngle % 360;

            this.setAttributes(triggeredAngle, triggeredAngle % 360);
        }

        if(emitEvent){
            this.element.dispatchEvent(new CustomEvent(`${this.options.eventPrefix}.update`, {
                detail: this.getState()
            }));
        }
    }

    /**
     *
     * @returns {{rotation: number, progress: number, angle: number, percent: (*|string)}}
     */
    getState() {
        return {
            rotation : parseFloat(this.element.dataset[this.attrNames.rotation] || 0),
            progress: parseFloat(this.element.dataset[this.attrNames.progress] || 0),
            angle : parseFloat(this.element.dataset[this.attrNames.angle] || 0),
            percent: this.element.dataset[this.attrNames.percent] || '0%',
        }
    }

    /**
     *
     * @param rotation
     * @param angle
     */
    setAttributes(rotation, angle) {

        let progress;
        if (this.options.maxAngle === Infinity) {
            progress = angle / 360;
        } else {
            progress = rotation / this.options.maxAngle;
        }

        let percent = (progress * 100) + '%';

        if(this.options.roundStateValues){
            percent = Math.round(progress * 100) + '%';
            rotation = Math.round(rotation);
            angle = Math.round(angle);
        }

        this.element.dataset[this.attrNames.progress] = progress;
        this.element.style.setProperty(this.cssVarNames.progress, progress);
        this.element.dataset[this.attrNames.percent] = percent;
        this.element.style.setProperty(this.cssVarNames.percent, percent);

        this.element.dataset[this.attrNames.rotation] = rotation;
        this.element.style.setProperty(this.cssVarNames.rotation, rotation + 'deg');
        this.element.dataset[this.attrNames.angle] = angle;
        this.element.style.setProperty(this.cssVarNames.angle, angle + 'deg');

        if (this.options.input) {
            this.options.input.value = this.options.roundInputValue ? Math.round(angle) : angle;
        }
    }

    //Calculating x and y coordinates
    getCoordinates(e) {
        const target = this.wheel;
        const rect = target.getBoundingClientRect();
        const x = ((this.supportsTouchEvents) ? e.targetTouches[0].clientX : e.clientX) - rect.left;
        const y = ((this.supportsTouchEvents) ? e.targetTouches[0].clientY : e.clientY) - rect.top;
        return {x, y};
    };

    // Return the current quadrant.
    // Note: Cartesian plane is flipped, hence it's returning reversed value.
    getQuadrant(x, y) {
        if (x > 0 && y > 0) return 4; else if (x < 0 && y > 0) return 3; else if (x < 0 && y < 0) return 2; else if (x >= 0 && y < 0) return 1;
    };

    // Return the sum of rotation value
    getRotation(quadrant, newAngle) {
        let rotation;
        let delta = 0;
        if (quadrant === 1 && this.quadrant.previous === 2) { //From 360 to 0
            delta = 360;
        } else if (quadrant === 2 && this.quadrant.previous === 1) { //From 0 to 360
            delta = -360;
        }
        rotation = newAngle + delta - this.rotation.previous + this.rotation.current;
        this.rotation.previous = newAngle; // return 0 ~ 360
        this.quadrant.previous = quadrant; // return 1 ~ 4
        return rotation;
    };

    //Checking collision
    checkBoxCollision(bound, point) {
        return bound.x1 < point.x && bound.x2 > point.x && bound.y1 < point.y && bound.y2 > point.y;
    };

    addEventListeners(el, type, handler, capture) {
        type.split(' ').forEach(t => el.addEventListener(t, handler, capture));
    };

    convertClockToUnit(n) {
        return n % 360 - 90;
    }

    convertUnitToClock(n) {
        return (n >= -180 && n < -90) ? 450 + n : 90 + n;
    }


}

module.exports = JogDial;
