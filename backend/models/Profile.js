/* ================= IMAGE UPLOAD LOGIC ================= */
const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 1. Validation: Max 2MB file size (Server crash rokne ke liye)
  if (file.size > 2 * 1024 * 1024) {
    showMsg("❌ File is too large. Max limit is 2MB", "warning");
    return;
  }

  // 2. FormData Setup: Strictly 'photo' name use karein (Backend se matching)
  const formData = new FormData();
  formData.append("photo", file); 
  formData.append("employeeId", user.employeeId);

  try {
    setLoading(true);
    
    // 3. API Call: Axios headers ke saath multipart data bhejein
    const res = await axios.post(`${API_URL}/api/profile/upload`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data" 
      }
    });

    if (res.data.success) {
      const photoPath = res.data.photo; // Backend path (e.g., /uploads/name.jpg)
      
      // 4. URL Fix: Local aur Live server compatibility ke liye
      const fullPhotoPath = photoPath.startsWith('http') 
        ? photoPath 
        : `${API_URL}${photoPath}`;

      const updatedUser = { ...user, photo: fullPhotoPath };
      
      // State aur LocalStorage update: Taaki Dashboard/ID Card par turant dikhe
      setUser(updatedUser);
      setPhotoURL(fullPhotoPath); 
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      showMsg("✅ Profile photo updated successfully!", "success");
    }
  } catch (err) {
    console.error("Upload Error:", err.response?.data);
    showMsg("❌ " + (err.response?.data?.message || "Internal Server Error"), "error");
  } finally {
    setLoading(false);
  }
};