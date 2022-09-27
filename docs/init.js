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
        node.textContent = parseInt(e.detail.percent) + '%';
        node.style.setProperty('width', e.detail.percent)
    });

    // Example 2
    const example2Node = document.getElementById('example2');

    example2Node.addEventListener('jd.update', e => {
        document.getElementById('example2_debug').textContent = JSON.stringify(e.detail, null, 2);
    });

    const example2Instance = new JogDial(example2Node, {debug: true});
    example2Instance.set(123);

    // Example 3
    new JogDial(document.getElementById('example3'),
        {
            mode: 'wheel',
            debug: true
        });

    // Example 4
    new JogDial(document.getElementById('example4'),
        {
            mode: 'wheel',
            debug: true,
            input: document.getElementById('example4_input')
        });

    // Example 5
    new JogDial(document.getElementById('example5'), {mode: 'wheel'});

    // Example 6
    new JogDial(document.getElementById('example6'), {debug: true, mode: 'wheel', roundStateValues: true});

    // hover examples


    let hoverInstances = [];

    hoverInstances = Array.from(document.querySelectorAll('.hover-examples .jogdial')).map((node, index) => {
        node.dataset.index = index;

        node.addEventListener('jd.update', e => {
            hoverInstances.forEach((instance, index) => {
                if(parseInt(e.target.dataset.index) !== index){
                    instance.set(e.detail.angle, false);
                }
            })
        });
        return new JogDial(node, { debug : true, mode : node.dataset.mode, });
    })


    document.querySelector('.hover-examples').addEventListener('jd.update', e => {
        console.log(e);
    });

});
