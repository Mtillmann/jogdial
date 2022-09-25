window.addEventListener('DOMContentLoaded', () => {

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

        const debug = Object.fromEntries(
            Object.entries(e.detail)
                .filter(item => /angle|rotation|percent|progress/i.test(item[0]))
                .map(item => [item[0].replace(/^[a-z]+/,'').toLowerCase(), item[1]])
        );
        document.getElementById('example2_debug').textContent = JSON.stringify(debug, null, 2);
        console.log({debug})
    });

});
