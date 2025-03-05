import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { db } from "../../constants/firebaseConfig"; // ไฟล์กำหนดค่า Firestore
import { collection, doc, getDoc, updateDoc } from "firebase/firestore"; // ฟังก์ชัน Firestore สำหรับจัดการเอกสาร
import { Technician } from "../../types/technician"; // อินเตอร์เฟสกำหนดโครงสร้างข้อมูลช่าง
import { Picker } from "@react-native-picker/picker"; // คอมโพเนนต์ dropdown
import { Checkbox, Text as PaperText } from "react-native-paper"; // คอมโพเนนต์ Checkbox และ Text จาก react-native-paper
import { useLocalSearchParams, useRouter } from 'expo-router'; // ใช้สำหรับการนำทางและดึงพารามิเตอร์ใน Expo Router

// คอมโพเนนต์หน้าจอแก้ไขข้อมูลช่างเทคนิค
const EditTechnicianScreen = () => {
  const params = useLocalSearchParams(); // ดึงพารามิเตอร์ทั้งหมดจาก URL
  const technicianId = params?.technicianId as string | undefined; // ดึง technicianId จากพารามิเตอร์และแคสต์เป็น string
  const router = useRouter(); // ออบเจ็กต์สำหรับการนำทางในแอป

  // ตรวจสอบว่า technicianId มีค่าหรือไม่
  if (!technicianId) {
    Alert.alert("ข้อผิดพลาด", "ไม่พบ ID ช่างเทคนิค กรุณาลองใหม่"); // แจ้งเตือนหากไม่มี ID
    router.back(); // กลับไปหน้าที่เรียก
    return null; // หยุดการเรนเดอร์คอมโพเนนต์
  }

  // สถานะเก็บข้อมูลช่างที่กำลังแก้ไข
  const [technician, setTechnician] = useState<Partial<Technician>>({
    name: "",
    age: "",
    experience: "",
    phone: "",
    is_available: true,
    image_path: "",
    skills: [],
    address: {
      street: "",
      district: "",
      province: "",
    },
    location: [0, 0],
  });

  // รายการทักษะที่สามารถเลือกได้
  const availableSkills = [
    "ช่างก่ออิฐ",
    "ช่างฉาบปูน",
    "ช่างไม้ก่อสร้าง",
    "ช่างปูกระเบื้องผนังและพื้น",
    "ช่างก่อและติดตั้งคอนกรีตมวลเบา",
    "ช่างติดตั้งแผ่นเหล็กเคลือบขึ้นรูป",
    "ช่างสีอาคาร",
    "ช่างเขียนแบบก่อสร้างด้วยคอมพิวเตอร์",
    "ช่างอะลูมิเนียมก่อสร้าง",
    "ช่างไม้ในอาคาร",
    "ช่างสีตกแต่ง",
    "ช่างหินขัด",
    "ช่างประกอบติดตั้งโครงหลังคาเหล็กรีดเย็น",
    "ช่างติดตั้งยิปซัม",
    "ช่างฉาบยิปซัม",
    "ช่างมุงหลังคากระเบื้องคอนกรีต",
    "ช่างก่อสร้าง",
    "ช่างยนต์",
    "ช่างกลโรงงาน",
    "ช่างเชื่อมโลหะ",
    "ช่างไฟฟ้ากำลัง",
    "ช่างอิเล็กทรอนิกส์",
    "อื่นๆ"
  ];
  const [checkedSkills, setCheckedSkills] = useState<string[]>([]); // สถานะเก็บทักษะที่เลือก
  const [otherSkill, setOtherSkill] = useState<string>(""); // สถานะเก็บทักษะอื่นๆ ที่ระบุเพิ่มเติม
  const [showOtherInput, setShowOtherInput] = useState<boolean>(false); // สถานะควบคุมการแสดงช่องกรอกทักษะอื่นๆ
  const [loading, setLoading] = useState<boolean>(true); // สถานะการโหลดข้อมูล

  // ดึงข้อมูลช่างจาก Firestore เมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    const fetchTechnician = async () => {
      try {
        setLoading(true); // เริ่มโหลดข้อมูล
        const technicianDoc = await getDoc(doc(db, "technician", technicianId)); // ดึงเอกสารตาม ID
        if (technicianDoc.exists()) {
          const data = technicianDoc.data() as Technician;
          setTechnician(data); // อัปเดตข้อมูลช่าง
          setCheckedSkills(data.skills || []); // อัปเดตทักษะที่เลือก
          // ตรวจสอบทักษะ "อื่นๆ" และจัดการช่องกรอกเพิ่มเติม
          if (data.skills && data.skills.includes("อื่นๆ")) {
            const otherSkillIndex = data.skills.indexOf("อื่นๆ");
            if (otherSkillIndex !== -1 && data.skills.length > otherSkillIndex + 1) {
              setOtherSkill(data.skills[otherSkillIndex + 1] || ""); // ตั้งค่าทักษะอื่นๆ
              setShowOtherInput(true); // แสดงช่องกรอก
            } else {
              setOtherSkill(""); // รีเซ็ตถ้าไม่มีทักษะอื่นๆ
              setShowOtherInput(false);
            }
          } else {
            setOtherSkill(""); // รีเซ็ตถ้าไม่มีทักษะ "อื่นๆ"
            setShowOtherInput(false);
          }
        } else {
          Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลช่างเทคนิค"); // แจ้งเตือนหากไม่พบข้อมูล
          router.back(); // กลับไปหน้าที่เรียก
        }
      } catch (error) {
        console.error("Error fetching technician:", error);
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่"); // แจ้งเตือนข้อผิดพลาด
      } finally {
        setLoading(false); // หยุดการโหลด
      }
    };
    fetchTechnician();
  }, [technicianId]);

  // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("address.")) { // ถ้าเป็นฟิลด์ที่อยู่ใน address
      const addressField = field.split(".")[1];
      setTechnician((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value, // อัปเดตฟิลด์ที่อยู่ใน address
        },
      }));
    } else {
      setTechnician((prev) => ({
        ...prev,
        [field]: value, // อัปเดตฟิลด์ปกติ
      }));
    }
  };

  // ฟังก์ชันจัดการการเปลี่ยนสถานะว่าง/ไม่ว่าง
  const handleAvailabilityChange = (value: string) => {
    setTechnician((prev) => ({
      ...prev,
      is_available: value === "true", // แปลงค่า string เป็น boolean
    }));
  };

  // ฟังก์ชันสลับการเลือกทักษะใน Checkbox
  const handleSkillToggle = (skill: string) => {
    if (skill === "อื่นๆ") { // กรณีเลือก "อื่นๆ"
      setShowOtherInput((prev) => !prev); // สลับการแสดงช่องกรอกเพิ่มเติม
      if (!showOtherInput && !checkedSkills.includes("อื่นๆ")) {
        setCheckedSkills((prev) => [...prev, "อื่นๆ"]); // เพิ่ม "อื่นๆ" เข้าไปในทักษะ
      } else if (showOtherInput && checkedSkills.includes("อื่นๆ")) {
        setCheckedSkills((prev) => prev.filter((s) => s !== "อื่นๆ")); // ลบ "อื่นๆ" ออก
        setOtherSkill(""); // รีเซ็ตช่องกรอก
      }
    } else { // กรณีทักษะทั่วไป
      setCheckedSkills((prev) =>
        prev.includes(skill)
          ? prev.filter((s) => s !== skill) // ลบถ้ามีอยู่แล้ว
          : [...prev, skill] // เพิ่มถ้ายังไม่มี
      );
    }

    let updatedSkills = [...checkedSkills];
    if (skill === "อื่นๆ" && showOtherInput && otherSkill.trim()) {
      updatedSkills = updatedSkills.filter((s) => s !== "อื่นๆ");
      updatedSkills.push(otherSkill.trim()); // เพิ่มทักษะอื่นๆ ที่ระบุ
    } else if (skill !== "อื่นๆ") {
      updatedSkills = updatedSkills.includes(skill)
        ? updatedSkills.filter((s) => s !== skill)
        : [...updatedSkills, skill];
    }

    updatedSkills = updatedSkills.filter((s) => s.trim() !== "" && s !== "อื่นๆ"); // กรองทักษะที่ไม่ว่างและไม่ใช่ "อื่นๆ"
    setTechnician((prev) => ({
      ...prev,
      skills: updatedSkills, // อัปเดตทักษะในข้อมูลช่าง
    }));
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงทักษะอื่นๆ ที่ระบุเพิ่มเติม
  const handleOtherSkillChange = (text: string) => {
    setOtherSkill(text); // อัปเดตค่าทักษะอื่นๆ
    const updatedSkills = [...(technician.skills || []), text.trim()].filter(
      (s) => s.trim() !== "" && s !== "อื่นๆ" // กรองทักษะที่ไม่ว่างและไม่ใช่ "อื่นๆ"
    );
    setTechnician((prev) => ({
      ...prev,
      skills: updatedSkills, // อัปเดตทักษะในข้อมูลช่าง
    }));
  };

  // ฟังก์ชันบันทึกการแก้ไขข้อมูลลง Firestore
  const handleUpdate = async () => {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (
      !technician.name ||
      !technician.phone ||
      !technician.address?.street ||
      !technician.address?.district ||
      !technician.address?.province
    ) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน"); // แจ้งเตือนหากข้อมูลไม่ครบ
      return;
    }

    let finalSkills: string[] = [...checkedSkills];
    if (checkedSkills.includes("อื่นๆ") && otherSkill.trim()) {
      finalSkills = finalSkills.filter((s) => s !== "อื่นๆ");
      finalSkills.push(otherSkill.trim()); // เพิ่มทักษะอื่นๆ ที่ระบุ
    }
    finalSkills = finalSkills.filter((s) => s.trim() !== "" && s !== "อื่นๆ"); // กรองทักษะที่ไม่ว่างและไม่ใช่ "อื่นๆ"

    try {
      // ฟังก์ชันบันทึกการแก้ไขข้อมูลลง Firestore จริงๆ คือตรงนี้
      await updateDoc(doc(db, "technician", technicianId), {
        ...technician,
        skills: finalSkills, // อัปเดตข้อมูลใน Firestore
      });
      Alert.alert("สำเร็จ", "อัปเดตข้อมูลช่างเทคนิคเรียบร้อยแล้ว"); // แจ้งเตือนความสำเร็จ
      router.back(); // กลับไปหน้าที่เรียก
    } catch (error) {
      console.error("Error updating technician:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่"); // แจ้งเตือนข้อผิดพลาด
    }
  };

  // แสดงหน้าจอโหลดขณะรอข้อมูล
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // แสดง UI ฟอร์มแก้ไขข้อมูล
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>แก้ไขข้อมูลช่างเทคนิค</Text>

      <TextInput
        style={styles.input}
        placeholder="ชื่อ-นามสกุล"
        value={technician.name || ""}
        onChangeText={(text) => handleInputChange("name", text)} // อัปเดตชื่อ
      />

      <TextInput
        style={styles.input}
        placeholder="อายุ"
        keyboardType="numeric"
        value={technician.age?.toString() || ""}
        onChangeText={(text) => handleInputChange("age", parseInt(text) || 0)} // อัปเดตอายุ
      />

      <TextInput
        style={styles.input}
        placeholder="ประสบการณ์ (ปี)"
        keyboardType="numeric"
        value={technician.experience?.toString() || ""}
        onChangeText={(text) => handleInputChange("experience", parseInt(text) || 0)} // อัปเดตประสบการณ์
      />

      <TextInput
        style={styles.input}
        placeholder="เบอร์โทรศัพท์"
        keyboardType="numeric"
        value={technician.phone?.toString() || ""}
        onChangeText={(text) => handleInputChange("phone", parseInt(text) || 0)} // อัปเดตเบอร์โทร
      />

      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: "top" }]}
        placeholder="ที่อยู่-บ้านเลขที่"
        value={technician.address?.street || ""}
        onChangeText={(text) => handleInputChange("address.street", text)} // อัปเดตที่อยู่
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="อำเภอ"
        value={technician.address?.district || ""}
        onChangeText={(text) => handleInputChange("address.district", text)} // อัปเดตอำเภอ
      />

      <TextInput
        style={styles.input}
        placeholder="จังหวัด"
        value={technician.address?.province || ""}
        onChangeText={(text) => handleInputChange("address.province", text)} // อัปเดตจังหวัด
      />

      <Text style={styles.label}>ทักษะ ความสามารถ</Text>
      {availableSkills.map((skill) => (
        <View key={skill} style={styles.checkboxContainer}>
          <Checkbox
            status={checkedSkills.includes(skill) ? "checked" : "unchecked"} // สถานะ Checkbox
            onPress={() => handleSkillToggle(skill)} // สลับการเลือกทักษะ
          />
          <PaperText style={styles.checkboxLabel}>{skill}</PaperText>
          {skill === "อื่นๆ" && checkedSkills.includes("อื่นๆ") && showOtherInput && (
            <TextInput
              style={[styles.input, { marginTop: 8, marginLeft: 24 }]}
              placeholder="ระบุทักษะอื่นๆ"
              value={otherSkill}
              onChangeText={handleOtherSkillChange} // อัปเดตทักษะอื่นๆ
            />
          )}
        </View>
      ))}

      <Text style={styles.label}>สถานะ</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={technician.is_available ? "true" : "false"} // ค่าเริ่มต้นของ Picker
          onValueChange={(value) => handleAvailabilityChange(value)} // อัปเดตสถานะว่าง/ไม่ว่าง
          style={styles.picker}
        >
          <Picker.Item label="ว่าง" value="true" />
          <Picker.Item label="ไม่ว่าง" value="false" />
        </Picker>
      </View>

      <Text style={styles.label}>URLรูปภาพ</Text>
      <TextInput
        style={styles.input}
        placeholder="(เช่น technician1.jpg)"
        value={technician.image_path || ""}
        onChangeText={(text) => handleInputChange("image_path", text)} // อัปเดต URL รูปภาพ
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
        <Text style={styles.submitButtonText}>บันทึกการแก้ไข</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  picker: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EditTechnicianScreen;