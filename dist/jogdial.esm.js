class JogDial {


    quadrant = {
        current: 1,
        previous: 1
    };

    rotation = {
        current: 0,
        previous: 0
    };

    angle = {
        previous : 0,
        current : 0
    }

    pressed = false;

    // Detect mouse event type
    mobileEvent = ('ontouchstart' in window) && window.navigator.userAgent.match(/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/);
    pointerEvent = (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) ? true : false;

    // Predefined options
    defaults = {
        touchMode: 'knob',  // knob | wheel
        angle: 0,
        minAngle: null,  // (null) infinity
        maxAngle: null   // (null) infinity
    };

    // Predefined DOM events
    domEvent = {
        MOUSE_DOWN: 'mousedown', MOUSE_MOVE: 'mousemove', MOUSE_OUT: 'mouseout', MOUSE_UP: 'mouseup'
    };

    // Predefined custom events
    customEvent = {
        MOUSE_DOWN: 'mousedown', MOUSE_MOVE: 'mousemove', MOUSE_UP: 'mouseup'
    };

    //Calculating x and y coordinates
    getCoordinates(e) {
        const target = e.target;
        const rect = target.getBoundingClientRect();
        const x = ((this.mobileEvent) ? e.targetTouches[0].clientX : e.clientX) - rect.left;
        const y = ((this.mobileEvent) ? e.targetTouches[0].clientY : e.clientY) - rect.top;
        return {x, y};
    };

    // Return the current quadrant.
    // Note: this's Cartesian plane is flipped, hence it's returning reversed value.
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

    addEvent(el, type, handler, capture) {
        type.split(' ').forEach(t => el.addEventListener(t, handler, capture));
    };

    convertClockToUnit(n) {
        return n % 360 - 90;
    }

    convertUnitToClock(n) {
        return (n >= -180 && n < -90) ? 450 + n : 90 + n;
    }

    constructor(element, options) {
        if (element.dataset.jogdialIsAttached) {
            console.error('Please Check your code: JogDial can not be initialized twice in a same element.');
            return false;
        }
        this.element = element;
        this.element.dataset.jogdialIsAttached = 'true';
        this.options = {...this.defaults, ...options};
        this.setupDOM();
        this.setupEvents();
        this.angleTo(this.convertClockToUnit(this.options.angle));
    }

    set(input){
        const maxAngle = this.options.maxAngle || 360;
        const angle = (input > maxAngle) ? maxAngle: input;
        this.angleTo(this.convertClockToUnit(angle), angle);
    }

    setupDOM() {


        this.knob = document.createElement('div');
        this.wheel = document.createElement('div');

        this.knob.classList.add('knob');
        this.wheel.classList.add('wheel');


        this.element.appendChild(this.knob);
        this.element.appendChild(this.wheel);

        //Set radius value
        const KRad = this.knob.clientWidth / 2;
        const WRad = this.wheel.clientWidth / 2;

        //Set knob properties
        this.knob.style.setProperty('margin', -KRad + 'px 0 0 ' + -KRad + 'px');

        const WMargnLT = (this.element.clientWidth - this.wheel.clientWidth) / 2;
        const WMargnTP = (this.element.clientHeight - this.wheel.clientHeight) / 2;

        this.wheel.style.setProperty('margin', WMargnTP + 'px 0 0 ' + WMargnLT + 'px');

        //set radius and center point value
        this.radius = WRad - KRad;
        this.center = {x: WRad + WMargnLT, y: WRad + WMargnTP};

        if (this.options.debug) {
            this.element.dataset.jogdialDebug = 'true';
        }
    }


    setupEvents() {
        //Detect event support type and override values
        if (this.mobileEvent) { // Mobile standard
            this.domEvent = {
                ...this.domEvent, ...{
                    MOUSE_DOWN: 'touchstart', MOUSE_MOVE: 'touchmove', MOUSE_OUT: 'touchleave', MOUSE_UP: 'touchend'
                }
            };
        }

        // mouseDownEvent (MOUSE_DOWN)
        const mouseDownEvent = e => {
            switch (this.options.touchMode) {
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
                this.element.dispatchEvent(new CustomEvent('jogdial.start', {
                    detail: this.element.dataset
                }));
            }
        };

        // mouseDragEvent (MOUSE_MOVE)
        const mouseDragEvent = e => {
            if (this.pressed) {
                // Prevent default event
                (e.preventDefault) ? e.preventDefault() : e.returnValue = false;

                const offset = this.getCoordinates(e);
                const x = offset.x - this.center.x + this.wheel.offsetLeft;
                const y = offset.y - this.center.y + this.wheel.offsetTop;

                let radian = Math.atan2(y, x) * (180 / Math.PI);
                let quadrant = this.getQuadrant(x, y);
                let angle = this.convertUnitToClock(radian);

                //Calculate the current rotation value based on pointer offset
                this.rotation.current = this.getRotation((quadrant === undefined) ? this.quadrant.previous : quadrant, angle);
                let rotation = this.rotation.current;

                if (this.options.maxAngle != null && this.options.maxAngle <= rotation) {
                    rotation = this.options.maxAngle;
                    radian = this.convertClockToUnit(rotation);
                    angle = this.convertUnitToClock(radian);
                } else if (this.options.minAngle !== null && this.options.minAngle >= rotation) {
                    rotation = this.options.minAngle;
                    radian = this.convertClockToUnit(rotation);
                    angle = this.convertUnitToClock(radian);
                }

                this.setAttributes(rotation, angle);

                // update angle
                this.angleTo(radian);
            }
        };

        // mouseDragEvent (MOUSE_UP, MOUSE_OUT)
        const mouseUpEvent = () => {
            if (this.pressed) {
                this.pressed = false;

                // Trigger up event
                this.element.dispatchEvent(new CustomEvent('jogdial.end', {
                    detail: this.element.dataset
                }));
            }
        };


        // Add events
        this.addEvent(this.wheel, this.domEvent.MOUSE_DOWN, mouseDownEvent, false);
        this.addEvent(this.wheel, this.domEvent.MOUSE_MOVE, mouseDragEvent, false);
        this.addEvent(this.wheel, this.domEvent.MOUSE_UP, mouseUpEvent, false);
        this.addEvent(this.wheel, this.domEvent.MOUSE_OUT, mouseUpEvent, false);

    };

    angleTo(radian, triggeredAngle = false) {
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

        this.element.dispatchEvent(new CustomEvent('jogdial.update', {
            detail: this.element.dataset
        }));
    }

    setAttributes(rotation, angle){
        this.element.dataset.rotation = rotation;
        this.element.style.setProperty('--rotation',rotation + 'deg');
        this.element.dataset.angle = angle;
        this.element.style.setProperty('--angle', angle + 'deg');

        this.angle.previous = this.angle.current;
        this.angle.current = angle;

        let progress = (angle / this.options.maxAngle);
        console.log(angle, this.options.maxAngle, progress);

    }
}

export { JogDial as default };
