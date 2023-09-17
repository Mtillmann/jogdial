export default class JogDial {


    quadrant = {
        current: 1,
        previous: 1
    };

    rotation = {
        current: 0,
        previous: 0
    };

    pressed = false;
    wheelTouchOffset = 0;
    setWheelTouchOffset = false;

    // Detect mouse event type
    supportsTouchEvents = ('ontouchstart' in window);

    // Predefined options
    defaults = {
        debug: false,
        mode: 'wheel',
        wheelSnap: false,
        angle: 0,
        minAngle: -Infinity,
        maxAngle: Infinity,
        attrPrefix: 'jd',
        cssVarPrefix: 'jd',
        eventPrefix: 'jd',
        roundInputValue: true,
        input: null,
        roundStateValues: false,
        mouseWheel: true,
        mouseWheelDeltaScale: 0.25,
        mouseWheelMaxDelta: 5,
    };

    // Predefined DOM events
    domEvent = {
        MOUSE_DOWN: 'mousedown',
        MOUSE_MOVE: 'mousemove',
        MOUSE_OUT: 'mouseout',
        MOUSE_UP: 'mouseup',
        MOUSE_WHEEL: 'wheel',
    };

    attrNames = {};
    cssVarNames = {};

    inputSamples = [];

    mouseWheelEndTimeout = null;

    constructor(element, options) {

        options = { ...this.defaults, ...options };
        this.options = options;

        ['angle', 'minAngle', 'maxAngle'].forEach(key => {
            if (typeof this.options[key] === 'string') {
                this.options[key] = parseFloat(this.options[key]);
            }
        });


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
        this.angleTo(this.normalizeRotation(this.options.angle), this.options.angle, false);
    }

    /**
     *
     * @param input
     * @param emitEvent
     */
    set(input, emitEvent = true) {

        //flush input sample stack on external input
        this.inputSamples = [];
        const maxAngle = this.options.maxAngle || 360;
        const angle = (input > maxAngle) ? maxAngle : input;
        this.angleTo(this.normalizeRotation(angle), angle, emitEvent);
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
        this.center = { x: wheelRadius + wheelMarginLeft, y: wheelRadius + wheelMarginTop };

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
                    this.setWheelTouchOffset = true;
                    mouseDragEvent(e);
                    break;
            }

            //Trigger down event
            if (this.pressed) {
                this.element.dataset[this.attrNames.pressed] = this.options.mode;
                this.element.dispatchEvent(new CustomEvent(`${this.options.eventPrefix}.start`, {
                    detail: this.getState()
                }))
            } else {
                delete this.element.dataset[this.attrNames.pressed];
            }
        };

        // mouseDragEvent (MOUSE_MOVE)
        const mouseDragEvent = e => {

            if (this.pressed) {
                e.preventDefault();

                const offset = this.getCoordinates(e);
                let x = offset.x - this.center.x + this.wheel.offsetLeft;
                let y = offset.y - this.center.y + this.wheel.offsetTop;

                if (this.setWheelTouchOffset && !this.options.wheelSnap) {
                    const actualAngle = Math.atan2(y, x) * (180 / Math.PI);
                    const currentAngle = this.rotationToNativeAngle(this.rotation.current);
                    this.wheelTouchOffset = (actualAngle - currentAngle) % 360;
                    this.setWheelTouchOffset = false;
                }

                let actualAngle = Math.atan2(y, x) * (180 / Math.PI);

                if (this.wheelTouchOffset) {
                    actualAngle -= this.wheelTouchOffset;
                }

                let angle = this.normalizeAngle(actualAngle);
                this.COMBINEDCALCULATION(angle);

            }
        };

        const mouseUpEvent = () => {
            if (this.pressed) {
                this.pressed = false;
                this.applyMomentum();
                delete this.element.dataset[this.attrNames.pressed];
                this.element.dispatchEvent(new CustomEvent(`${this.options.eventPrefix}.end`, {
                    detail: this.getState()
                }))
            }
        };



        const mouseWheelEvent = e => {

            e.preventDefault();

            let delta = e.deltaY * this.options.mouseWheelDeltaScale;

            if (delta > this.options.mouseWheelMaxDelta) {
                delta = this.options.mouseWheelMaxDelta;
            }
            if (delta < -this.options.mouseWheelMaxDelta) {
                delta = -this.options.mouseWheelMaxDelta;
            }

            let angle = this.enforceRotation(this.normalizeAngle(this.normalizeRotation(this.rotation.current) + delta));
            this.COMBINEDCALCULATION(angle);
            this.mouseWheelEndTimeout = setTimeout(() => {
                this.applyMomentum();
            }, 100);

        };


        // Add events
        this.addEventListeners(this.element, this.domEvent.MOUSE_DOWN, mouseDownEvent, false);
        this.addEventListeners(this.element, this.domEvent.MOUSE_MOVE, mouseDragEvent, false);
        this.addEventListeners(this.element, this.domEvent.MOUSE_UP, mouseUpEvent, false);
        this.addEventListeners(this.element, this.domEvent.MOUSE_OUT, mouseUpEvent, false);

        if (this.options.mouseWheel) {
            this.addEventListeners(this.element, this.domEvent.MOUSE_WHEEL, mouseWheelEvent, false);
        };


    };


    COMBINEDCALCULATION(angle) {


        let rotation;
        let delta = 0;

        const radians = angle * (Math.PI / 180);
        const x = -this.radius * Math.sin(radians);
        const y = -this.radius * Math.cos(radians);
        let quadrant = this.getQuadrant(x, y) ?? this.quadrant.previous;
        let jump = false;

        if (quadrant === 1 && this.quadrant.previous === 2) { //From 360 to 0
            delta = 360;
            jump = 1;
        } else if (quadrant === 2 && this.quadrant.previous === 1) { //From 0 to 360
            delta = -360;
            jump = -1;
        }

        rotation = angle + delta - this.rotation.previous + this.rotation.current;
        this.rotation.previous = angle; //  0 ~ 360
        this.quadrant.previous = quadrant; //  1 ~ 4


        rotation = this.enforceRotation(rotation);
        //when there is no more inifite rotation, this wont work
        
        
/*
        if (this.options.maxAngle !== Infinity && this.options.maxAngle <= rotation) {
            rotation = this.options.maxAngle;

            return;
            
        } else if (this.options.minAngle !== -Infinity && this.options.minAngle >= rotation) {
            rotation = this.options.minAngle;  
            return;
        }
*/

        this.setAttributes(angle, angle);
        this.angleTo(angle - 90);
        this.sampleInput();

        this.rotation.current = rotation;
        return rotation;
    }

    /**
     * 
     * @param rotation
     * @param angle
     * @param actualAngle
     * @returns {rotation: *, angle: *, actualAngle: *}
     * */
    applyConstraints(rotation, angle, actualAngle) {
        if (this.options.maxAngle !== Infinity && this.options.maxAngle <= rotation) {
            rotation = this.options.maxAngle;
            actualAngle = this.normalizeRotation(rotation);
            angle = this.normalizeAngle(actualAngle);
        } else if (this.options.minAngle !== -Infinity && this.options.minAngle >= rotation) {
            rotation = this.options.minAngle;
            actualAngle = this.normalizeRotation(rotation);
            angle = this.normalizeAngle(actualAngle);
        }

        return { rotation, angle, actualAngle };
    }


    sampleInput() {
        //do this regardless of origin
        clearTimeout(this.mouseWheelEndTimeout);

        const cutoff = 1000;
        const lastSample = this.inputSamples.at(-1);
        const diff = Date.now() - (lastSample?.[0] || 0);

        if (diff > cutoff) {
            this.inputSamples = [];
        }

        this.inputSamples.push([Date.now(), this.rotation.current]);
    }

    //todo...
    applyMomentum() {
        return;
        /*
        //sample into last 1 second
        const cutoff = 1000;
        const samples = this.inputSamples.filter(([time, value]) => Date.now() - time < cutoff);
        
        //reset anyway
        this.inputSamples = [];
        if(samples.length < 2){
            return
        }

        const first = samples[0];
        const last = samples.at(-1);
        const time = last[0] - first[0];
        let dist = last[1] - first[1];
        */
    }

    /**
     *
     * @param degrees
     * @param triggeredAngle
     * @param emitEvent
     */
    angleTo(degrees, triggeredAngle = false, emitEvent = true) {

        degrees = degrees % 360;

        const radian = degrees * (Math.PI / 180);
        const x = Math.cos(radian) * this.radius + this.center.x;
        const y = Math.sin(radian) * this.radius + this.center.y;
        const quadrant = this.getQuadrant(x, y);

        this.knob.style.setProperty('left', x + 'px');
        this.knob.style.setProperty('top', y + 'px');

        if (!this.element.dataset.rotation === undefined) {
            this.setAttributes(this.options.angle, this.normalizeAngle(radian));
        }

        if (triggeredAngle) {
            this.quadrant.current = quadrant;
            this.quadrant.previous = quadrant;
            this.rotation.current = triggeredAngle;
            this.rotation.previous = triggeredAngle % 360;

            this.setAttributes(triggeredAngle, triggeredAngle % 360);
        }

        if (emitEvent) {
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
            rotation: parseFloat(this.element.dataset[this.attrNames.rotation] || 0),
            progress: parseFloat(this.element.dataset[this.attrNames.progress] || 0),
            angle: parseFloat(this.element.dataset[this.attrNames.angle] || 0),
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

        if (this.options.roundStateValues) {
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
        const x = (this.supportsTouchEvents ? e.targetTouches[0].clientX : e.clientX) - rect.left;
        const y = (this.supportsTouchEvents ? e.targetTouches[0].clientY : e.clientY) - rect.top;
        return { x, y };
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

        return this.enforceRotation(rotation);
    };

    //Checking collision
    checkBoxCollision(bound, point) {
        return bound.x1 < point.x && bound.x2 > point.x && bound.y1 < point.y && bound.y2 > point.y;
    };

    addEventListeners(el, type, handler, capture) {
        type.split(' ').forEach(t => el.addEventListener(t, handler, capture));
    };


    enforceRotation(rotation) {
        rotation = rotation % 360;
        if (rotation < 0) {
            rotation += 360;
        }
        if (rotation > 360) {
            rotation -= 360;
        }

        return rotation;

    }

    //no idea
    normalizeRotation(n) {
        return n % 360 - 90;
    }

    enforceAngleBounds(n) {
        if (n < 0) {
            return n + 360;
        }
        if (n > 360) {
            return n - 360;
        }
        return n;
    }

    normalizeAngle(n) {
        n = (n >= -180 && n < -90) ? 450 + n : 90 + n;



        return this.enforceAngleBounds(n);
    }


    rotationToNativeAngle(n) {

        return n - 90;
    }


}