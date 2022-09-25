window.addEventListener('load', () => {

    // Example 1
    const jogDialOneElement = document.getElementById('example1');
    new JogDial(jogDialOneElement,
        {
            wheelSize: '80%',
            knobSize: '25%',
            minDegree: 0,
            maxDegree: 360,
            degreeStartAt: 0
        });

    jogDialOneElement.addEventListener('jogdial.update', e => {
        const perc = Math.round((e.detail.rotation / 360) * 100) + '%';
        const node = document.querySelector('#example1_progress div');
        node.textContent = perc;
        node.style.setProperty('width',  perc)
    });

    const jogDialTwoElement = document.getElementById('jog_dial_two');

    const jd2 = new JogDial(jogDialTwoElement,
        {debug: true, wheelSize: '260px', knobSize: '100px', degreeStartAt: 0});



    jogDialTwoElement.addEventListener('jogdial.update', e => {
        document.getElementById('jog_dial_two_meter').textContent = 'Rotation:' + Math.round(e.detail.rotation) + ' / Degree: ' + Math.round(e.detail.degree);
    });
    // document.querySelector('.dial:nth-child(2)').style.setProperty('opacity',0);

    //Example swap buttons
    document.querySelector('.btn-group').addEventListener('click', (e) => {
        const btn = e.target;

        document.querySelectorAll('.dial').forEach((item, i) => {
            item.classList.toggle('hidden', i !== parseInt(btn.dataset.dial))
            document.querySelectorAll('.btn-group .btn')[i].classList.toggle('active', i === parseInt(btn.dataset.dial));

        });
    });
})
