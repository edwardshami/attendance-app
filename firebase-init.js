
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBf7ot3xd9nwqY2tnLDZmVUSgSH0NZsnBc",
  authDomain: "attendance-app-d23dd.firebaseapp.com",
  projectId: "attendance-app-d23dd",
  storageBucket: "attendance-app-d23dd.firebasestorage.app",
  messagingSenderId: "441237393789",
  appId: "1:441237393789:web:9938c1514907e97cc47c14",
  measurementId: "G-GGBL3X5CHW"
};

if (typeof window !== "undefined") {
  if (!window.firebase) {
    console.warn("Firebase SDK not loaded yet.");
  } else if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  window.db = firebase.firestore();
  window.firebaseReady = true;
}
