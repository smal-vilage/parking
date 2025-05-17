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
let currentUser;

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
                        document.getElementById("car-info-section").style.display = "block";
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

function recordCarInfo() {
    const plateNumber = document.getElementById("plate-number").value;
    const plateType = document.getElementById("plate-type").value;
    const ownerMobile = document.getElementById("owner-mobile").value;

    if (!plateNumber || !plateType || !ownerMobile) {
        alert("Please fill in all car information fields.");
        return;
    }

    const enterTime = new Date();
    const userId = auth.currentUser.uid;

    db.collection("cars").add({
        userId,
        plateNumber,
        plateType,
        ownerMobile,
        enterTime,
        status: "Inside"
    }).then(docRef => {
        const qrCodeContainer = document.getElementById("qr-code");
        qrCodeContainer.innerHTML = "";

        const baseUrl = "https://parking.jorshacos.com/request.html"; // or your public domain
        const qrText = `${baseUrl}?id=${encodeURIComponent(docRef.id)}`;

        new QRCode(qrCodeContainer, {
            text: qrText,
            width: 128,
            height: 128
        });

        // Fill receipt info
        document.getElementById("receipt-info").innerHTML = `
            <div><strong>Plate Number:</strong> ${plateNumber}</div>
            <div><strong>Plate Type:</strong> ${plateType}</div>
            <div><strong>Owner Mobile:</strong> ${ownerMobile}</div>
            <div><strong>Entry Time:</strong> ${enterTime.toLocaleString()}</div>
        `;

        console.log("qrUrl", qrText);
    });
}
