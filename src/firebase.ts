import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAEB5ZavBNzFEUmA4qrtW7k0_b_qXd7V_k",
  authDomain: "gen-lang-client-0886706384.firebaseapp.com",
  projectId: "gen-lang-client-0886706384",
  storageBucket: "gen-lang-client-0886706384.firebasestorage.app",
  messagingSenderId: "329529754712",
  appId: "1:329529754712:web:5a098e115006320434362d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-e8362eab-a326-4b5b-9b76-83e95f8a017c");
const auth = getAuth(app);

export { app, db, auth };
