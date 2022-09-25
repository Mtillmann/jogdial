window.addEventListener('DOMContentLoaded', () => {

    // Example 1
    const example1Node = document.getElementById('example1');
    new JogDial(example1Node,
        {
            minAngle: 0,
            maxAngle: 360
        });

    example1Node.addEventListener('jogdial.update', e => {
        const node = document.querySelector('#example1_progress div');
        node.textContent = parseInt(e.detail.jdPercent) + '%';
        node.style.setProperty('width',  e.detail.jdPercent)
    });

    const example2Node = document.getElementById('example2');
    const example2Instance = new JogDial(example2Node,
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
    });

    example2Instance.set(44);

    new JogDial(document.getElementById('example3'),
        {
            touchMode: 'wheel',
            debug: true
        });


});
