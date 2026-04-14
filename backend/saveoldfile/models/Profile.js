/* ================= IMAGE UPLOAD LOGIC (FIXED) ================= */
const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 1. Validation: Size (2MB) + File Type Check (Zaroori hai!)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    showMsg("❌ Only JPG, JPEG & PNG files are allowed", "warning");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showMsg("❌ File is too large. Max limit is 2MB", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("photo", file); 
  // employeeId check: Agar user object load nahi hua toh error na aaye
  formData.append("employeeId", user?.employeeId || "");

  try {
    setLoading(true);
    
    const res = await axios.post(`${API_URL}/api/profile/upload`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data" 
      }
    });

    // Backend 'success' bhej raha hai ya direct status 200, dono check karein
    if (res.data.success || res.status === 200) {
      const photoPath = res.data.photo; 
      
      // 2. URL Fix: Extra slash check (Prevent //uploads/...)
      const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const cleanPhotoPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
      
      const fullPhotoPath = photoPath.startsWith('http') 
        ? photoPath 
        : `${cleanApiUrl}${cleanPhotoPath}`;

      // 3. User State Update (Solid logic)
      const updatedUser = { ...user, photo: fullPhotoPath };
      
      setUser(updatedUser);
      setPhotoURL(fullPhotoPath); 
      
      // LocalStorage Sync: Pure app mein profile sync rahegi
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      showMsg("✅ Profile photo updated successfully!", "success");
    }
  } catch (err) {
    console.error("Upload Error:", err.response?.data);
    const errorMsg = err.response?.data?.message || "Internal Server Error";
    showMsg(`❌ ${errorMsg}`, "error");
  } finally {
    setLoading(false);
    // 4. Input Reset: Same file dobara select karne par bhi trigger ho
    e.target.value = null; 
  }
};