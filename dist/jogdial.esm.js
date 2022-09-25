class JogDial {

    toRad = Math.PI / 180;

    toDeg = 180 / Math.PI;

    quadrant = {
        current: 1,
        previous: 1
    };

    rotation = {
        current: 0,
        previous: 0
    }

    pressed = false;

    // Detect mouse event type
    mobileEvent = ('ontouchstart' in window) && window.navigator.userAgent.match(/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/);
    pointerEvent = (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) ? true : false;

    // Predefined options
    defaults = {
        touchMode: 'knob',  // knob | wheel
        knobSize: '30%',
        wheelSize: '100%',
        zIndex: 9999,
        degreeStartAt: 0,
        minDegree: null,  // (null) infinity
        maxDegree: null   // (null) infinity
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
    getRotation(quadrant, newDegree) {
        let rotation;
        let delta = 0;
        if (quadrant === 1 && this.quadrant.previous === 2) { //From 360 to 0
            delta = 360;
        } else if (quadrant === 2 && this.quadrant.previous === 1) { //From 0 to 360
            delta = -360;
        }
        rotation = newDegree + delta - this.rotation.previous + this.rotation.current;
        this.rotation.previous = newDegree; // return 0 ~ 360
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
        if (element.dataset.isAttachedToJogDialInstance) {
            console.error('Please Check your code: JogDial can not be initialized twice in a same element.');
            return false;
        }

        this.element = element;

        this.element.dataset.isAttachedToJogDialInstance = true;
        this.options = {...this.defaults, ...options};

        this.setupDOM();

        this.setupEvents();

        this.angleTo(this.convertClockToUnit(this.options.degreeStartAt));
    }

    set(input){
        const maxDegree = this.options.maxDegree || 360;
        const degree = (input > maxDegree) ? maxDegree: input;
        this.angleTo(this.convertClockToUnit(degree), degree);
    }

    setupDOM() {
        this.knob = document.createElement('div');
        this.wheel = document.createElement('div');

        this.knob.classList.add('knob');
        this.wheel.classList.add('wheel');

        //Set position property as relative if it's not predefined in Stylesheet
        if (window.getComputedStyle(this.element).getPropertyValue('position') === 'static') {
            this.element.style.setProperty('position', 'relative');
        }

        //Append to base and extend {object} item
        this.element.appendChild(this.knob);
        this.element.appendChild(this.wheel);

        //Set global position and size
        this.knob.style.setProperty('position', 'absolute');
        this.knob.style.setProperty('width', this.options.knobSize);
        this.knob.style.setProperty('height', this.options.knobSize);

        this.wheel.style.setProperty('position', 'absolute');
        this.wheel.style.setProperty('width', this.options.wheelSize);
        this.wheel.style.setProperty('height', this.options.wheelSize);

        //Set radius value
        const KRad = this.knob.clientWidth / 2;
        const WRad = this.wheel.clientWidth / 2;

        //Set knob properties
        this.knob.style.setProperty('margin', -KRad + 'px 0 0 ' + -KRad + 'px');
        this.knob.style.setProperty('z-index', this.options.zIndex + 1);

        const WMargnLT = (this.element.clientWidth - this.wheel.clientWidth) / 2;
        const WMargnTP = (this.element.clientHeight - this.wheel.clientHeight) / 2;

        this.wheel.style.setProperty('left', 0);
        this.wheel.style.setProperty('top', 0);
        this.wheel.style.setProperty('margin', WMargnTP + 'px 0 0 ' + WMargnLT + 'px');
        this.wheel.style.setProperty('z-index', this.options.zIndex);

        //set radius and center point value
        this.radius = WRad - KRad;
        this.center = {x: WRad + WMargnLT, y: WRad + WMargnTP};

        if (this.options.debug) {
            this.knob.style.setProperty('background-color', '#0000FF');
            this.knob.style.setProperty('opacity', '0.4');
            this.knob.style.setProperty('border-radius', '50%');
            this.wheel.style.setProperty('border-radius', '50%');
            this.wheel.style.setProperty('background-color', '#00FF00');
            this.wheel.style.setProperty('opacity', '0.4');
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

                let radian = Math.atan2(y, x) * this.toDeg;
                let quadrant = this.getQuadrant(x, y);
                let degree = this.convertUnitToClock(radian);

                //Calculate the current rotation value based on pointer offset
                this.rotation.current = this.getRotation((quadrant === undefined) ? this.quadrant.previous : quadrant, degree);
                let rotation = this.rotation.current;

                if (this.options.maxDegree != null && this.options.maxDegree <= rotation) {
                    rotation = this.options.maxDegree;
                    radian = this.convertClockToUnit(rotation);
                    degree = this.convertUnitToClock(radian);
                } else if (this.options.minDegree !== null && this.options.minDegree >= rotation) {
                    rotation = this.options.minDegree;
                    radian = this.convertClockToUnit(rotation);
                    degree = this.convertUnitToClock(radian);
                }

                this.element.dataset.rotation = rotation;
                this.element.style.setProperty('--rotation',rotation + 'deg');
                this.element.dataset.degree = degree;
                this.element.style.setProperty('--degree', degree + 'deg');

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

    angleTo(radian, triggeredDegree = false) {
        radian *= this.toRad;
        const x = Math.cos(radian) * this.radius + this.center.x;
        const y = Math.sin(radian) * this.radius + this.center.y;
        const quadrant = this.getQuadrant(x, y);

        this.knob.style.setProperty('left', x + 'px');
        this.knob.style.setProperty('top', y + 'px');

        if (!this.element.dataset.rotation === undefined) {
            this.element.dataset.rotation = this.options.degreeStartAt;
            this.element.style.setProperty('--rotation',this.options.degreeStartAt + 'deg');
            this.element.dataset.degree = this.convertUnitToClock(radian);
            this.element.style.setProperty('--degree', this.convertUnitToClock(radian) + 'deg');
        }

        if (triggeredDegree) {
            this.quadrant.current = quadrant;
            this.quadrant.previous = quadrant;
            this.rotation.current = triggeredDegree;
            this.rotation.previous = triggeredDegree % 360;

            this.element.dataset.rotation = triggeredDegree;
            this.element.style.setProperty('--rotation',triggeredDegree + 'deg');
            this.element.dataset.degree = triggeredDegree % 360;
            this.element.style.setProperty('--degree', triggeredDegree % 360 + 'deg');
        }

        this.element.dispatchEvent(new CustomEvent('jogdial.update', {
            detail: this.element.dataset
        }));
    }

}

export { JogDial as default };
