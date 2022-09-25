window.addEventListener('load', () => {

    // Example 1
    const example1Node = document.getElementById('example1');
    new JogDial(example1Node,
        {
            minAngle: 0,
            maxAngle: 360
        });

    example1Node.addEventListener('jogdial.update', e => {
        const perc = Math.round((e.detail.rotation / 360) * 100) + '%';
        const node = document.querySelector('#example1_progress div');
        node.textContent = perc;
        node.style.setProperty('width',  perc)
    });

    const example2Node = document.getElementById('example2');
    new JogDial(example2Node,
        {
            debug: true
        });

    example2Node.addEventListener('jogdial.update', e => {
        document.getElementById('jog_dial_two_meter').textContent = 'Rotation:' + Math.round(e.detail.rotation) + ' / Angle: ' + Math.round(e.detail.degree);
    });

});
