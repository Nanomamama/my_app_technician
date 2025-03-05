import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import { db } from '../../constants/firebaseConfig';
import { collection, getDocs, QueryDocumentSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import * as Font from 'expo-font';

// อินเตอร์เฟสกำหนดโครงสร้างข้อมูลของช่างเทคนิคตามที่เก็บใน Firestore
interface Technician {
  id: string;
  name: string;
  age: number;
  experience: number;
  address: {
    street: string;
    district: string;
    province: string;
  };
  skills: string[];
  phone: string;
  image_path: string;
  is_available: boolean;
  technician_id: number;
  location?: [number, number];
}

// ฟังก์ชันสำหรับโหลดฟอนต์ Kanit ล่วงหน้าเพื่อใช้ในแอป
const loadFonts = async () => {
  // รอโหลดฟอนต์ทั้งหมดจากไฟล์ใน assets
  await Font.loadAsync({
    'Kanit-Regular': require('../../assets/fonts/Kanit/Kanit-Regular.ttf'),
    'Kanit-Bold': require('../../assets/fonts/Kanit/Kanit-Bold.ttf'),
    'Kanit-Black': require('../../assets/fonts/Kanit/Kanit-Black.ttf'),
    'Kanit-Thin': require('../../assets/fonts/Kanit/Kanit-Thin.ttf'),
    'Kanit-ExtraBold': require('../../assets/fonts/Kanit/Kanit-ExtraBold.ttf'),
    'Kanit-ExtraLight': require('../../assets/fonts/Kanit/Kanit-ExtraLight.ttf'),
    'Kanit-Light': require('../../assets/fonts/Kanit/Kanit-Light.ttf'),
    'Kanit-Medium': require('../../assets/fonts/Kanit/Kanit-Medium.ttf'),
    'Kanit-SemiBold': require('../../assets/fonts/Kanit/Kanit-SemiBold.ttf'),
  });
};

// คอมโพเนนต์ Header แสดงส่วนหัวของหน้า
const Header = () => {
  const { width } = Dimensions.get('window'); // ดึงความกว้างหน้าจอปัจจุบัน
  const headerHeight = width * 0.4; // คำนวณความสูงของส่วนหัวตามสัดส่วนหน้าจอ
  return (
    <View style={[styles.headerContainer, { height: headerHeight }]}>
      <Image
        source={{ uri: 'https://library.wu.ac.th/km/wp-content/uploads/sites/9/2022/10/tool-g69f9434ae_1920.jpg' }}
        style={[styles.headerImage, { width: width, height: headerHeight }]}
        resizeMode="cover" // ปรับขนาดรูปภาพให้ครอบคลุมพื้นที่
      />
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerText}>ระบบจัดการช่างเทคนิคทั่วประเทศไทย</Text>
        <Text style={styles.headerSubText}>เรามีทีมงานมืออาชีพพร้อมให้บริการคุณ</Text>
      </View>
    </View>
  );
};

// คอมโพเนนต์ AboutSection แสดงข้อมูลเกี่ยวกับแอป
const AboutSection = () => {
  const router = useRouter(); // ใช้สำหรับการนำทางในแอป
  return (
    <View style={styles.aboutContainer}>
      <Text style={styles.aboutTitle}>เกี่ยวกับเรา</Text>
      <Text style={styles.aboutText}>
        เราเป็นแพลตฟอร์มที่เชื่อมโยงคุณกับช่างเทคนิคมืออาชีพทั่วประเทศไทย 
        ไม่ว่าคุณจะต้องการซ่อมแซมบ้าน อุปกรณ์ไฟฟ้า {'\n'} หรือบริการอื่นๆ 
        ทีมงานของเราพร้อมให้บริการอย่างรวดเร็วและมีคุณภาพ 
        ด้วยประสบการณ์กว่า 10 ปีในวงการ {'\n'} เรามุ่งมั่นที่จะมอบความพึงพอใจสูงสุดให้กับลูกค้าทุกท่าน
      </Text>
      <TouchableOpacity
        style={styles.aboutButton}
        onPress={() => router.push('/contact')} // นำทางไปยังหน้าติดต่อเมื่อกดปุ่ม
      >
        <Text style={styles.aboutButtonText}>ติดต่อเรา</Text>
      </TouchableOpacity>
    </View>
  );
};

// คอมโพเนนต์ SearchBar แสดงช่องค้นหาและปุ่มค้นหา
const SearchBar = ({ searchQuery, setSearchQuery, performSearch }) => (
  <View style={styles.searchContainer}>
    <View style={styles.searchRow}>
      <TextInput
        style={styles.searchInput}
        placeholder="ค้นหาช่างเทคนิค"
        value={searchQuery} // ค่าปัจจุบันของคำค้นหา
        onChangeText={setSearchQuery} // อัปเดตคำค้นหาเมื่อพิมพ์
      />
      <TouchableOpacity style={styles.searchButton} onPress={performSearch}>
        <Text style={styles.searchButtonText}>ค้นหา</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// คอมโพเนนต์ Footer แสดงส่วนท้ายของหน้า
const Footer = () => (
  <View style={styles.footerContainer}>
    <Text style={styles.footerText}>© 2025 ระบบจัดการช่างเทคนิคทั่วประเทศไทย</Text>
    <Text style={styles.footerSubText}>Developed and maintained by Nuengdiao Tiaksiboon, Full-Stack Developer</Text>
  </View>
);

// คอมโพเนนต์หลักของหน้าจอ HomeScreen
const HomeScreen = () => {
  // กำหนด state ต่างๆ สำหรับจัดการข้อมูลและ UI
  const [technicians, setTechnicians] = useState<Technician[]>([]); // ข้อมูลช่างทั้งหมดจาก Firestore
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]); // ข้อมูลช่างที่ผ่านการกรองจากการค้นหา
  const [displayedTechnicians, setDisplayedTechnicians] = useState<Technician[]>([]); // ข้อมูลช่างที่แสดงจริง (จำกัดหรือทั้งหมด)
  const [searchQuery, setSearchQuery] = useState<string>(''); // คำค้นหาที่ผู้ใช้พิมพ์
  const [loading, setLoading] = useState<boolean>(true); // สถานะการโหลดข้อมูล
  const [error, setError] = useState<string | null>(null); // ข้อความข้อผิดพลาด (ถ้ามี)
  const [modalVisible, setModalVisible] = useState<boolean>(false); // สถานะการแสดง Modal ลบข้อมูล
  const [technicianToDelete, setTechnicianToDelete] = useState<string | null>(null); // ID ช่างที่ต้องการลบ
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false); // สถานะการโหลดฟอนต์
  const [numColumns, setNumColumns] = useState<number>(1); // จำนวนคอลัมน์ตามขนาดหน้าจอ
  const [isExpanded, setIsExpanded] = useState<boolean>(false); // สถานะการขยาย/ย่อรายการช่าง
  const router = useRouter(); // ตัวจัดการการนำทางในแอป

  // ฟังก์ชันคำนวณจำนวนคอลัมน์ตามขนาดหน้าจอ
  const updateLayout = () => {
    const { width } = Dimensions.get('window'); // ดึงความกว้างหน้าจอปัจจุบัน
    if (width >= 1024) {
      setNumColumns(3); // หากหน้าจอใหญ่ (>= 1024px) แสดง 3 คอลัมน์
    } else if (width >= 768) {
      setNumColumns(2); // หากหน้าจอกลาง (>= 768px) แสดง 2 คอลัมน์
    } else {
      setNumColumns(1); // หากหน้าจอเล็ก (< 768px) แสดง 1 คอลัมน์
    }
  };

  // ฟังก์ชันดึงข้อมูลช่างจาก Firestore
  const fetchTechnicians = async () => {
    setLoading(true); // เริ่มโหลดข้อมูล ตั้งสถานะ loading เป็น true
    try {
      const querySnapshot = await getDocs(collection(db, 'technician')); // ดึงข้อมูลจากคอลเลกชัน 'technician'
      const techniciansData: Technician[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => {
        const data = doc.data() as Omit<Technician, 'id'>; // แปลงข้อมูลเอกสารเป็นรูปแบบ Technician
        return { ...data, id: doc.id }; // เพิ่ม ID จากเอกสารลงในข้อมูล
      });
      setTechnicians(techniciansData); // ตั้งค่าข้อมูลช่างทั้งหมด
      setFilteredTechnicians(techniciansData); // ตั้งค่าข้อมูลที่กรองเริ่มต้น
      setDisplayedTechnicians(techniciansData.slice(0, numColumns * 6)); // ตั้งค่าข้อมูลที่แสดงเริ่มต้น (2 แถว)
      setError(null); // ล้างข้อผิดพลาด
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลช่างเทคนิคได้ กรุณาลองใหม่ภายหลัง'); // ตั้งค่าข้อความข้อผิดพลาด
      console.error('Error fetching technicians:', err); // แสดงข้อผิดพลาดในคอนโซล
    } finally {
      setLoading(false); // สิ้นสุดการโหลด ตั้งสถานะ loading เป็น false
    }
  };

  // useEffect เริ่มต้นโหลดทรัพยากรและข้อมูลเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    // ฟังก์ชันโหลดทรัพยากรทั้งหมด (ฟอนต์และข้อมูลช่าง)
    const loadResources = async () => {
      updateLayout(); // อัปเดตจำนวนคอลัมน์ตามขนาดหน้าจอก่อน
      await loadFonts(); // โหลดฟอนต์
      setFontsLoaded(true); // ตั้งสถานะว่าฟอนต์โหลดเสร็จแล้ว
      await fetchTechnicians(); // ดึงข้อมูลช่าง
    };
    loadResources(); // เรียกใช้งานฟังก์ชันโหลดทรัพยากร
  }, []); // ทำงานครั้งเดียวเมื่อคอมโพเนนต์โหลด

  // useEffect สำหรับตรวจจับการเปลี่ยนแปลงขนาดหน้าจอ
  useEffect(() => {
    updateLayout(); // อัปเดตจำนวนคอลัมน์เมื่อขนาดหน้าจอเปลี่ยน
    const subscription = Dimensions.addEventListener('change', updateLayout); // ตั้ง listener สำหรับการเปลี่ยนแปลงขนาดหน้าจอ
    return () => subscription?.remove(); // ล้าง listener เมื่อคอมโพเนนต์ถูก unmount
  }, []);

  // ฟังก์ชันกรองข้อมูลช่างตามคำค้นหา
  const performSearch = () => {
    const lowerQuery = searchQuery.toLowerCase(); // แปลงคำค้นหาเป็นตัวพิมพ์เล็ก
    const filtered = technicians.filter((tech) => {
      const nameMatch = tech.name?.toLowerCase().includes(lowerQuery) || false; // ตรวจสอบชื่อ
      const skillsMatch = tech.skills?.some((skill) => skill.toLowerCase().includes(lowerQuery)) || false; // ตรวจสอบทักษะ
      const addressMatch =
        tech.address?.street?.toLowerCase().includes(lowerQuery) ||
        tech.address?.district?.toLowerCase().includes(lowerQuery) ||
        tech.address?.province?.toLowerCase().includes(lowerQuery) ||
        false; // ตรวจสอบที่อยู่
      const phoneMatch = tech.phone ? String(tech.phone).toLowerCase().includes(lowerQuery) : false; // ตรวจสอบเบอร์โทร
      return nameMatch || skillsMatch || addressMatch || phoneMatch; // คืนค่าผลลัพธ์ที่ตรงเงื่อนไข
    });
    setFilteredTechnicians(filtered); // ตั้งค่าข้อมูลที่กรองแล้ว
    setDisplayedTechnicians(isExpanded ? filtered : filtered.slice(0, numColumns * 6)); // อัปเดตข้อมูลที่แสดงตามสถานะการขยาย
  };

  // ฟังก์ชันสลับการแสดงข้อมูลทั้งหมดหรือ 2 แถว
  const toggleExpand = () => {
    setIsExpanded(!isExpanded); // สลับสถานะการขยาย/ย่อ
    if (!isExpanded) {
      setDisplayedTechnicians(filteredTechnicians); // แสดงข้อมูลทั้งหมดถ้ากำลังขยาย
    } else {
      setDisplayedTechnicians(filteredTechnicians.slice(0, numColumns * 6)); // แสดง 2 แถวถ้ากำลังย่อ
    }
  };

  // ฟังก์ชันเริ่มต้นการลบข้อมูลช่าง
  const handleDelete = async (technicianId: string) => {
    if (!technicianId || technicianId.trim() === '') {
      console.error('Technician ID is undefined, null, or empty:', technicianId); // แสดงข้อผิดพลาดถ้า ID ไม่ถูกต้อง
      setError('ID ช่างเทคนิคไม่ถูกต้อง'); // ตั้งค่าข้อความข้อผิดพลาด
      showErrorModal('ID ช่างเทคนิคไม่ถูกต้อง'); // แสดง Modal ข้อผิดพลาด
      return;
    }

    const docRef = doc(db, 'technician', technicianId); // อ้างอิงเอกสารช่างใน Firestore
    let docSnap;
    try {
      docSnap = await getDoc(docRef); // ดึงข้อมูลเอกสาร
      if (!docSnap.exists()) {
        console.error('Document not found with ID:', technicianId); // แสดงข้อผิดพลาดถ้าไม่พบเอกสาร
        setError('ไม่พบข้อมูลช่างเทคนิคนี้ในระบบ');
        showErrorModal('ไม่พบข้อมูลช่างเทคนิคนี้ในระบบ');
        return;
      }
    } catch (err) {
      console.error('Error checking document existence:', err); // แสดงข้อผิดพลาดถ้าดึงข้อมูลไม่สำเร็จ
      setError('ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองใหม่');
      showErrorModal('ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองใหม่');
      return;
    }

    setTechnicianToDelete(technicianId); // ตั้งค่า ID ช่างที่ต้องการลบ
    setModalVisible(true); // แสดง Modal ยืนยันการลบ
  };

  // ฟังก์ชันยืนยันการลบข้อมูลช่าง
  const confirmDelete = async () => {
    if (!technicianToDelete) return; // หยุดถ้าไม่มี ID ช่างที่ลบ

    setModalVisible(false); // ปิด Modal
    try {
      setLoading(true); // เริ่มโหลด
      await deleteDoc(doc(db, 'technician', technicianToDelete)); // ลบเอกสารจาก Firestore
      const updatedTechnicians = technicians.filter(tech => tech.id !== technicianToDelete); // กรองช่างที่ถูกลบออก
      setTechnicians(updatedTechnicians); // อัปเดตข้อมูลช่างทั้งหมด
      setFilteredTechnicians(updatedTechnicians); // อัปเดตข้อมูลที่กรอง
      setDisplayedTechnicians(isExpanded ? updatedTechnicians : updatedTechnicians.slice(0, numColumns * 6)); // อัปเดตข้อมูลที่แสดง
      showSuccessModal('ลบข้อมูลช่างเทคนิคเรียบร้อยแล้ว'); // แสดง Modal ความสำเร็จ
    } catch (err) {
      console.error('Error deleting technician:', err); // แสดงข้อผิดพลาดถ้าลบไม่สำเร็จ
      setError('ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่');
      showErrorModal('ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่');
    } finally {
      setLoading(false); // สิ้นสุดการโหลด
      setTechnicianToDelete(null); // ล้าง ID ช่างที่ลบ
    }
  };

  // ฟังก์ชันยกเลิกการลบข้อมูล
  const cancelDelete = () => {
    setModalVisible(false); // ปิด Modal
    setTechnicianToDelete(null); // ล้าง ID ช่างที่ลบ
  };

  // ฟังก์ชันแสดง Modal ข้อผิดพลาด
  const showErrorModal = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`ข้อผิดพลาด: ${message}`); // แสดง alert บนเว็บ
    } else {
      import('react-native').then(({ Alert }) => {
        Alert.alert('ข้อผิดพลาด', message, [{ text: 'ตกลง', onPress: () => setError(null) }]); // แสดง Alert บนแอปมือถือ
      });
    }
  };

  // ฟังก์ชันแสดง Modal ความสำเร็จ
  const showSuccessModal = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`สำเร็จ: ${message}`); // แสดง alert บนเว็บ
    } else {
      import('react-native').then(({ Alert }) => {
        Alert.alert('สำเร็จ', message, [{ text: 'ตกลง', onPress: () => {} }]); // แสดง Alert บนแอปมือถือ
      });
    }
  };

  // ฟังก์ชันเรนเดอร์ข้อมูลช่างแต่ละรายการใน FlatList
  const renderItem = ({ item }: { item: Technician }) => (
    <View style={[styles.itemContainer, { flex: 1 / numColumns }]}>
      <Image
        source={{ uri: item.image_path.startsWith('http') ? item.image_path : `https://your-domain.com${item.image_path}` }}
        style={styles.image}
        onError={(e) => console.log('Image load error:', e.nativeEvent.error)} // แสดงข้อผิดพลาดถ้ารูปโหลดไม่สำเร็จ
      />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.details}>อายุ: {item.age} ปี</Text>
      <Text style={styles.details}>ประสบการณ์: {item.experience} ปี</Text>
      <Text style={styles.details}>ที่อยู่: {item.address.street}, {item.address.district}, {item.address.province}</Text>
      <Text style={styles.details}>ทักษะ: {item.skills.join(', ')}</Text>
      <Text style={styles.details}>โทร: {item.phone}</Text>
      {item.is_available ? <Text style={styles.available}>มีบริการ</Text> : <Text style={styles.unavailable}>ไม่ว่าง</Text>}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.bootstrapPrimaryButton, styles.button]}
          onPress={() => router.push(`/edit-technician?technicianId=${item.id}`)} // นำทางไปหน้าแก้ไขข้อมูล
        >
          <Text style={styles.buttonText}>แก้ไขข้อมูล</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bootstrapDangerButton, styles.button]}
          onPress={() => handleDelete(item.id)} // เรียกฟังก์ชันลบข้อมูล
          disabled={loading} // ปิดใช้งานปุ่มขณะโหลด
        >
          <Text style={styles.buttonText}>ลบ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // คอมโพเนนต์ส่วนหัวที่เลื่อนได้ใน FlatList
  const HeaderWithAbout = () => (
    <>
      <Header />
      <AboutSection />
    </>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" /> {/* แสดงตัวโหลดขณะรอฟอนต์หรือข้อมูล */}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null); // ล้างข้อผิดพลาด
            fetchTechnicians(); // ลองดึงข้อมูลใหม่
          }}
        >
          <Text style={styles.retryButtonText}>ลองใหม่</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SearchBar ล็อกอยู่ด้านบน */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        performSearch={performSearch}
      />
      {/* FlatList เลื่อนทับได้ */}
      <FlatList
        data={displayedTechnicians} // ข้อมูลช่างที่แสดงใน FlatList
        renderItem={renderItem} // ฟังก์ชันเรนเดอร์ข้อมูลแต่ละรายการ
        keyExtractor={(item) => item.id} // กำหนดคีย์เฉพาะสำหรับแต่ละรายการ
        numColumns={numColumns} // จำนวนคอลัมน์ที่แสดง
        key={numColumns} // อัปเดต key เมื่อ numColumns เปลี่ยนเพื่อให้ FlatList รีเรนเดอร์
        ListHeaderComponent={<HeaderWithAbout />} // ส่วนหัวของ FlatList
        ListEmptyComponent={<Text style={styles.emptyText}>ไม่พบช่างเทคนิค</Text>} // ข้อความเมื่อไม่มีข้อมูล
        ListFooterComponent={
          <>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleExpand}>
              <Text style={styles.toggleButtonText}>
                {isExpanded ? 'ปิด' : 'แสดงข้อมูลทั้งหมด'}
              </Text>
            </TouchableOpacity>
            <Footer />
          </>
        } // ส่วนท้ายของ FlatList รวมปุ่มสลับและ Footer
        contentContainerStyle={styles.flatListContent}
        style={styles.flatList}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible} // แสดง Modal ตามสถานะ
        onRequestClose={() => {
          setModalVisible(false); // ปิด Modal เมื่อกดปิด
          setTechnicianToDelete(null); // ล้าง ID ช่าง
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ยินยันการลบข้อมูล</Text>
            {technicianToDelete && (
              <Text style={styles.modalMessage}>
                คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลช่างเทคนิค "{technicians.find(tech => tech.id === technicianToDelete)?.name}" อย่างถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้
              </Text>
            )}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.bootstrapPrimaryButton]}
                onPress={cancelDelete} // เรียกฟังก์ชันยกเลิกการลบ
              >
                <Text style={styles.modalButtonText}>ยกเลิก</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.bootstrapDangerButton]}
                onPress={confirmDelete} // เรียกฟังก์ชันยืนยันการลบ
              >
                <Text style={styles.modalButtonText}>ลบ</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatList: {
    marginTop: 70,
  },
  headerContainer: {
    position: 'relative',
    backgroundColor: '#f8f9fa',
  },
  headerImage: {
    borderRadius: 2,
  },
  headerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 50,
    fontFamily: 'Kanit-Bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.82)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  headerSubText: {
    fontSize: 24,
    fontFamily: 'Kanit-Regular',
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  aboutContainer: {
    padding: 150,
    backgroundColor: '#fff',
  },
  aboutTitle: {
    fontSize: 40,
    fontFamily: 'Kanit-Bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 18,
    fontFamily: 'Kanit-Regular',
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  aboutButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    alignSelf: 'center',
  },
  aboutButtonText: {
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    color: '#fff',
    // paddingVertical: 12,
    paddingHorizontal: 20,
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontFamily: 'Kanit-Regular',
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    color: '#fff',
    paddingHorizontal: 40,
  },
  toggleButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 16,
  },
  toggleButtonText: {
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
    color: '#fff',
  },
  footerContainer: {
    padding: 80,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.93)',
    top:30
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
    color: '#fff',
  },
  footerSubText: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
    textAlign: 'center',
    marginBottom: 10,
  },
  flatListContent: {
    paddingBottom: 16,
  },
  itemContainer: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    margin: 10,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    marginTop: 8,
  },
  details: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#333',
    marginTop: 4,
  },
  available: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: 'green',
    marginTop: 4,
  },
  unavailable: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: 'red',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
    color: '#666',
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  bootstrapPrimaryButton: {
    backgroundColor: '#007bff',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  bootstrapDangerButton: {
    backgroundColor: '#dc3545',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Kanit-Bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Kanit-Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    width: '40%',
    marginRight: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Kanit-Bold',
  },
});

export default HomeScreen;