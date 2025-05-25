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

function showLoginAndClearCredentials() {
    auth.signOut();
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    document.getElementById("login-section").style.display = "";
    document.getElementById(carSection).style.display = "none";
    hideLoadingOverlay();
}

function hideLoadingOverlay() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.style.display = "none";
}

function login(auto = false) {
    const username = auto
        ? localStorage.getItem("username") || ""
        : document.getElementById("username").value;
    const password = auto
        ? localStorage.getItem("password") || ""
        : document.getElementById("password").value;

    if (!username || !password) {
        showLoginAndClearCredentials();
        return;
    }

    auth.signInWithEmailAndPassword(username, password)
        .then(userCredential => {
            const currentUser = userCredential.user;
            const userId = currentUser.uid;

            // Get user type from Firestore
            db.collection("user_type").doc(userId).get()
                .then(doc => {
                    if (!doc.exists) {
                        alert("Access denied: user role not found.");
                        showLoginAndClearCredentials();
                        hideLoadingOverlay();
                        return;
                    }

                    const requiredRole = doc.data().role;
                    if (userRole === requiredRole) {
                        // Grant access
                        document.getElementById("login-section").style.display = "none";
                        document.getElementById(carSection).style.display = "";

                        if(userRole === "monitor" || userRole === "accountant") {
                            const statusFilter = document.getElementById("status-filter");
                            if(userRole === "monitor") {
                                statusFilter.value = "Requested";
                            }
                            else if(userRole === "accountant") {
                                statusFilter.value = "Exited";
                            }
                            handleStatusFilterChange();
                            filterCars();
                        }
                        // Save credentials if not auto-login
                        if (!auto) {
                            localStorage.setItem("username", username);
                            localStorage.setItem("password", password);
                        }
                        hideLoadingOverlay();
                    } else {
                        if (!auto) {
                            alert("Access denied: you are not authorized to view this page.");
                        }
                        showLoginAndClearCredentials();
                        hideLoadingOverlay();
                    }
                })
                .catch(error => {
                    if (!auto) {
                        alert("Failed to get user role: " + error.message);
                    }
                    showLoginAndClearCredentials();
                    hideLoadingOverlay();
                });
        })
        .catch(error => {
            if (!auto) alert("Login failed: " + error.message);
            showLoginAndClearCredentials();
            hideLoadingOverlay();
        });
}

function logout() {
    auth.signOut().then(() => {
        showLoginAndClearCredentials();
    });
}

window.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    if (username && password) {
        login(true);
    } else {
        showLoginAndClearCredentials();
        hideLoadingOverlay();
    }
});