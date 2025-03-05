// app/add-technician.tsx
import React, { useState } from "react";
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
import { collection, addDoc } from "firebase/firestore"; // ฟังก์ชัน Firestore สำหรับเพิ่มเอกสาร
import { Technician } from "../../types/technician"; // อินเตอร์เฟสกำหนดโครงสร้างข้อมูลช่าง
import { Picker } from "@react-native-picker/picker"; // คอมโพเนนต์ dropdown
import { Checkbox, Text as PaperText } from "react-native-paper"; // คอมโพเนนต์ Checkbox และ Text จาก react-native-paper

// คอมโพเนนต์หน้าจอเพิ่มข้อมูลช่างเทคนิคใหม่
const AddTechnicianScreen = () => {
  // สถานะเก็บข้อมูลช่างที่กำลังเพิ่ม
  const [technician, setTechnician] = useState<Partial<Technician>>({
    name: "",
    age: "",
    experience: "",
    phone: "",
    is_available: true, // ค่าเริ่มต้นเป็น "ว่าง"
    image_path: "",
    skills: [],
    address: {
      street: "",
      district: "",
      province: "",
    },
    location: [0, 0], // ค่าเริ่มต้นสำหรับพิกัดตำแหน่ง (Geopoint)
  });

  // รายการทักษะที่สามารถเลือกได้ผ่าน Checkbox
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
  const [otherSkill, setOtherSkill] = useState<string>(""); // สถานะเก็บทักษะเพิ่มเติมจาก "อื่นๆ"
  const [showOtherInput, setShowOtherInput] = useState<boolean>(false); // สถานะควบคุมการแสดงช่องกรอก "อื่นๆ"

  // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("address.")) { // ถ้าเป็นฟิลด์ใน address
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

  // ฟังก์ชันจัดการการเปลี่ยนสถานะว่าง/ไม่ว่างจาก Picker
  const handleAvailabilityChange = (value: string) => {
    setTechnician((prev) => ({
      ...prev,
      is_available: value === "true", // แปลง string เป็น boolean
    }));
  };

  // ฟังก์ชันสลับการเลือกทักษะใน Checkbox
  const handleSkillToggle = (skill: string) => {
    if (skill === "อื่นๆ") { // กรณีเลือก "อื่นๆ"
      setShowOtherInput((prev) => !prev); // สลับการแสดงช่องกรอก "อื่นๆ"
      if (!showOtherInput && !checkedSkills.includes("อื่นๆ")) {
        setCheckedSkills((prev) => [...prev, "อื่นๆ"]); // เพิ่ม "อื่นๆ" เข้าไปในทักษะ
      } else if (showOtherInput && checkedSkills.includes("อื่นๆ")) {
        setCheckedSkills((prev) => prev.filter((s) => s !== "อื่นๆ")); // ลบ "อื่นๆ" ออก
        setOtherSkill(""); // รีเซ็ตช่องกรอกเมื่อยกเลิก "อื่นๆ"
      }
    } else { // กรณีทักษะทั่วไป
      setCheckedSkills((prev) =>
        prev.includes(skill)
          ? prev.filter((s) => s !== skill) // ลบถ้ามีอยู่แล้ว
          : [...prev, skill] // เพิ่มถ้ายังไม่มี
      );
    }

    // อัปเดตทักษะในสถานะ technician
    let updatedSkills = [...checkedSkills];
    if (skill === "อื่นๆ" && showOtherInput && otherSkill.trim()) {
      updatedSkills = updatedSkills.filter((s) => s !== "อื่นๆ"); // ลบ "อื่นๆ" ออก
      updatedSkills.push(otherSkill.trim()); // เพิ่มทักษะที่กรอก
    } else if (skill !== "อื่นๆ") {
      updatedSkills = updatedSkills.includes(skill)
        ? updatedSkills.filter((s) => s !== skill)
        : [...updatedSkills, skill];
    }

    updatedSkills = updatedSkills.filter(
      (s) => s.trim() !== "" && s !== "อื่นๆ" // กรองทักษะที่ไม่ว่างและไม่ใช่ "อื่นๆ"
    );
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

  // ฟังก์ชันบันทึกข้อมูลช่างใหม่ลง Firestore
  const handleSubmit = async () => {
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

    // รวมทักษะจาก Checkbox และทักษะที่กรอกใน "อื่นๆ"
    let finalSkills: string[] = [...checkedSkills];
    if (checkedSkills.includes("อื่นๆ") && otherSkill.trim()) {
      finalSkills = finalSkills.filter((s) => s !== "อื่นๆ"); // ลบ "อื่นๆ" ออก
      finalSkills.push(otherSkill.trim()); // เพิ่มทักษะที่กรอก
    }
    finalSkills = finalSkills.filter((s) => s.trim() !== "" && s !== "อื่นๆ"); // กรองทักษะที่ไม่ว่างและไม่ใช่ "อื่นๆ"

    try {
      // เพิ่มข้อมูลลง Firestore จริงๆคือตรงนี้
      await addDoc(collection(db, "technician"), {
        ...technician,
        skills: finalSkills, // ใช้ทักษะที่รวมแล้ว
        technician_id: technician.technician_id || Date.now(), // ใช้ timestamp เป็น ID ถ้าไม่มี
        created_at: new Date().toISOString(), // เพิ่มวันที่สร้างเพื่อบันทึกเวลา
      });
      Alert.alert("สำเร็จ", "เพิ่มข้อมูลช่างเทคนิคเรียบร้อยแล้ว"); // แจ้งเตือนความสำเร็จ
      // รีเซ็ตฟอร์มหลังบันทึก
      setTechnician({
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
      setCheckedSkills([]); // รีเซ็ตทักษะที่เลือก
      setOtherSkill(""); // รีเซ็ตช่องกรอก "อื่นๆ"
      setShowOtherInput(false); // ซ่อนช่องกรอก "อื่นๆ"
    } catch (error) {
      console.error("Error adding technician:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเพิ่มข้อมูลได้ กรุณาลองใหม่"); // แจ้งเตือนข้อผิดพลาด
    }
  };

  // แสดง UI ฟอร์มเพิ่มข้อมูลช่าง
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>เพิ่มข้อมูลช่างเทคนิค</Text>

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
        onChangeText={(text) =>
          handleInputChange("experience", parseInt(text) || 0) // อัปเดตประสบการณ์
        }
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
          {skill === "อื่นๆ" &&
            checkedSkills.includes("อื่นๆ") &&
            showOtherInput && (
              <TextInput
                style={[styles.input, { marginTop: 8, marginLeft: 24 }]} // ช่องกรอกทักษะอื่นๆ
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

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>บันทึกข้อมูล</Text>
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
    flex: 1, // ช่วยให้ข้อความไม่หายเมื่อมี TextInput
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
});

export default AddTechnicianScreen;
