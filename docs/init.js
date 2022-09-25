window.addEventListener('DOMContentLoaded', () => {

    // Example 1
    const example1Node = document.getElementById('example1');
    new JogDial(example1Node,
        {
            minAngle: 0,
            maxAngle: 360
        });

    example1Node.addEventListener('jd.update', e => {
        const node = document.querySelector('#example1_progress div');
        node.textContent = parseInt(e.detail.jdPercent) + '%';
        node.style.setProperty('width', e.detail.jdPercent)
    });

    // Example 2
    const example2Node = document.getElementById('example2');

    example2Node.addEventListener('jd.update', e => {
        const debug = Object.fromEntries(
            Object.entries(e.detail)
                .filter(item => /angle|rotation|percent|progress/i.test(item[0]))
                .map(item => [item[0].replace(/^[a-z]+/, '').toLowerCase(), item[1]])
        );
        document.getElementById('example2_debug').textContent = JSON.stringify(debug, null, 2);
    });

    const example2Instance = new JogDial(example2Node, {debug: true});
    example2Instance.set(123);

    // Example 3
    new JogDial(document.getElementById('example3'),
        {
            touchMode: 'wheel',
            debug: true
        });

    // Example 4
    new JogDial(document.getElementById('example4'),
        {
            touchMode: 'wheel',
            debug: true,
            input: document.getElementById('example4_input')
        });

    // Example 5
    new JogDial(document.getElementById('example5'), {});

});
