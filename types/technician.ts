export interface Technician {
  address: {
    district: string;
    province: string;
    street: string;
    map?: any; // ถ้าต้องการกำหนดประเภทชัดเจน สามารถเปลี่ยนเป็น interface หรือ type ที่เหมาะสม เช่น GeoJSON
  };
  age: number;
  experience: number;
  image_path: string;
  is_available: boolean;
  location: [number, number]; // Geopoint เป็น array ของ latitude และ longitude
  name: string;
  phone: number;
  skills: string[];
  technician_id: number; // เก็บเป็น number ถ้าข้อมูลจาก Firestore เป็น number
  id?: string; // ID จาก Firestore เป็น optional string (ใช้ใน HomeScreen)
}