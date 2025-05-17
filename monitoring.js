const firebaseConfig = {
    apiKey: "AIzaSyAeTbJJEMi1ZWl8JolnWMVm7cRav0cbS74",
    authDomain: "parkingsystem-4355f.firebaseapp.com",
    projectId: "parkingsystem-4355f",
    storageBucket: "parkingsystem-4355f.firebasestorage.app",
    messagingSenderId: "579978374760",
    appId: "1:579978374760:web:e990f2835c058531b895dd"
};
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let monitoringUser;

function login(requiredRole) {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(username, password)
        .then(userCredential => {
            const currentUser = userCredential.user;
            const userId = currentUser.uid;

            // Get user type from Firestore
            db.collection("user_type").doc(userId).get()
                .then(doc => {
                    if (!doc.exists) {
                        alert("Access denied: user role not found.");
                        auth.signOut(); // Optional
                        return;
                    }

                    const userRole = doc.data().role;

                    if (userRole === requiredRole) {
                        // Grant access
                        document.getElementById("login-section").style.display = "none";
                        document.getElementById("car-status-section").style.display = "block";
                        const statusFilter = document.getElementById("status-filter");
                        statusFilter.value = "Requested";
                        filterCars();
                    } else {
                        alert("Access denied: you are not authorized to view this page.");
                        auth.signOut(); // Optional
                    }
                })
                .catch(error => {
                    alert("Failed to get user role: " + error.message);
                    auth.signOut(); // Optional
                });
        })
        .catch(error => {
            alert("Login failed: " + error.message);
        });
}

function filterCars() {
    const statusFilter = document.getElementById("status-filter").value;
    console.log("Dropdown value:", statusFilter);

    const plateFilter = document.getElementById("plate-filter").value.trim().toLowerCase();
    let query = db.collection("cars");
    if (statusFilter !== "All") {
        query = query.where("status", "==", statusFilter);
    }
    query = query.orderBy("enterTime", "desc");
    query.onSnapshot(snapshot => {
        const carList = document.getElementById("car-list");
        carList.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            if (!plateFilter || (data.plateNumber && data.plateNumber.toLowerCase().includes(plateFilter))) {
                carList.innerHTML += window.renderCarCard(data);
                // Show notification for requested cars
                if (data.status === "Requested") {
                    showNotification(`Car ${data.plateNumber} requested!`);
                }
            }
        });
    });
}

function updateCar(docId, newStatus) {
    db.collection("cars").doc(docId).update({
        status: newStatus,
        ...(newStatus === "Requested" && { requestTime: new Date() }),
        ...(newStatus === "Exited" && { exitTime: new Date() })
    }).then(() => {
        // Optionally show a toast or notification
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
            <strong>Notification:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
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