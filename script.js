const scriptURL = 'https://script.google.com/macros/s/AKfycbyTYyuUAENJLK3p82_LCJ0SaVOpcnrrI6-elsQNi6jVvVTMs_gIEhNGezCrNdIXEvagWA/exec';

function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    });
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function selectName(val) {
    document.getElementById('nama').value = val;
    document.getElementById('selected-name-display').innerText = val;
    document.getElementById('selected-name-display').style.color = '#000';
    closeModal('modal-name-list');
}

function submitData() {
    const nama = document.getElementById('nama').value;
    const nominal = document.getElementById('nominal').value;

    if(!nama || !nominal) {
        alert("Mohon lengkapi data!");
        return;
    }

    const btn = document.querySelector('.btn-input');
    btn.innerHTML = "Mengirim...";
    btn.disabled = true;

    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({ nama: nama, nominal: nominal }),
    })
    .then(response => {
        openModal('modal-success');
        // Reset form
        document.getElementById('nama').value = '';
        document.getElementById('selected-name-display').innerText = '-- Pilih Nama --';
        document.getElementById('selected-name-display').style.color = '#555';
        document.getElementById('nominal').value = '';
        btn.innerHTML = "INPUT";
        btn.disabled = false;
    })
    .catch(error => {
        alert('Gagal mengirim data!');
        btn.innerHTML = "INPUT";
        btn.disabled = false;
    });
}

function closeSuccessModal() {
    closeModal('modal-success');
    const iframe = document.querySelector('iframe');
    // Refresh iframe untuk update data
    iframe.src = iframe.src;
}
