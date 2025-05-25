carSection = "car-status-section";
userRole = "monitor";

function updateCar(docId, newStatus) {
    db.collection("cars").doc(docId).update({
        status: newStatus,
        ...(newStatus === "Requested" && { requestTime: new Date() }),
        ...(newStatus === "Exited" && { exitTime: new Date() })
    }).then(() => {
        filterCars();
    }).catch(error => {
        alert("Failed to update car status: " + error.message);
    });
}

function showNotification(message) {
    // Show Bootstrap alert
    const alertContainer = document.getElementById("alert-container");
    const alertId = "alert-" + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-warning alert-dismissible fade show" role="alert">
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            <strong>Notification:</strong> ${message}
        </div>
    `;
    alertContainer.insertAdjacentHTML('beforeend', alertHtml);

    // Play a simple beep using Web Audio API
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz = beep
        oscillator.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.15); // 150ms beep
        oscillator.onended = () => ctx.close();
    } catch (e) {
        // Ignore if audio fails
    }
}
