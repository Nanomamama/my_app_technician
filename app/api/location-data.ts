// app/api/location-data.ts
import axios from 'axios';

export interface Province {
  id: number;
  name_th: string;
  amphures: Amphure[];
}

export interface Amphure {
  id: number;
  name_th: string;
  province_id: number;
}

// ฟังก์ชันสำหรับดึงข้อมูลจังหวัดทั้งหมดจาก API
export const fetchLocationData = async () => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json');
    const data = response.data as Province[];
    return data;
  } catch (error) {
    console.error('Error fetching location data:', error);
    throw new Error('ไม่สามารถดึงข้อมูลจังหวัดได้ กรุณาลองใหม่');
  }
};

// ฟังก์ชันสำหรับดึงรายการอำเภอตามชื่อจังหวัด
export const getAmphuresByProvince = (provinces: Province[], provinceName: string) => {
  const province = provinces.find(p => p.name_th === provinceName);
  return province ? province.amphures : [];
};

// ฟังก์ชันสำหรับดึงตำบล (ถ้าต้องการเพิ่มในอนาคต, ปัจจุบัน API ไม่มีข้อมูลตำบลชัดเจน)
export const getTambonsByAmphure = (amphures: Amphure[], amphureName: string) => {
  const amphure = amphures.find(a => a.name_th === amphureName);
  // หาก API มีข้อมูลตำบล (tambon) สามารถขยายได้ที่นี่
  return amphure ? [] : []; // ตัวอย่างเปล่าๆ ถ้ายังไม่มีข้อมูลตำบล
};