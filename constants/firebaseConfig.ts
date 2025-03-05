import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyAvj-V81048ctYTGl0_TPWKk_Mecsw0y3E",
  authDomain: "crud-project-56af6.firebaseapp.com",
  projectId: "crud-project-56af6",
  storageBucket: "crud-project-56af6.appspot.com",
  messagingSenderId: "131991847553",
  appId: "1:131991847553:web:260654ab08c243b0b70380",
  measurementId: "G-QJPSN1GHDG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export ตัวแปร db และ app ให้ไฟล์อื่นเรียกใช้ได้
export { db, app };
