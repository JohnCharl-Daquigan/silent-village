const firebaseConfig = {
    apiKey: "AIzaSyABUc_pCdDLsEFcU9eP0VgaNJ3VdehH0aA",
    authDomain: "silent-village.firebaseapp.com",
    databaseURL: "https://silent-village-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "silent-village",
    storageBucket: "silent-village.firebasestorage.app",
    messagingSenderId: "911256708360",
    appId: "1:911256708360:web:fdf425820ab0b9547eb8bd",
    measurementId: "G-GXFJB3R1ZC"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();
