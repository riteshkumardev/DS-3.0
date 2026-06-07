import Staff from "../models/Staff.js";
import User from "../models/User.js"; // 🎯 Added User model import for Universal Cross-Sync Fallback
import logService from "../services/logService.js"; 
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";

// 🔧 Core Formatting Helper
const safeUpper = (v) => String(v || "").toUpperCase().trim();

// 🎯 Deep Debugger Layer: Safe ID Extractor with Console Tracking
const getTargetId = (payloadId, tokenUserId, contextName) => {
    console.log(`\n================= [DEBUG] ${contextName.toUpperCase()} IDENTIFIER RESOLVER =================`);
    console.log(`👉 Raw Payload ID received:`, payloadId);
    console.log(`👉 Active Token req.user._id:`, tokenUserId);

    const rawId = payloadId ? String(payloadId).trim() : "";
    
    if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
        const resolvedId = new mongoose.Types.ObjectId(rawId);
        console.log(`🎯 Decision: Valid Hex Hexadecimal ObjectId detected in payload. Target set to: ${resolvedId}`);
        return resolvedId;
    }
    
    console.log(`🎯 Decision: Payload ID missing or invalid. Falling back strictly to Token Context ID: ${tokenUserId}`);
    return tokenUserId;
};

/* ================= 🎯 A. FETCH SELF PROFILE ================= */
export const getSelfProfile = async (req, res, next) => {
    try {
        console.log("\n⚡ [API ROUTE INTERCEPT] => FETCH PROFILE CALL triggered");
        console.log("🔐 Decoded Token Context Session User:", req.user);

        if (!req.user?._id) {
            console.error("❌ CRITICAL BUG: protect middleware did not attach verified user profile context!");
            return res.status(401).json({ success: false, message: "Token execution context corrupted." });
        }

        // Try fetching from Staff first
        let currentAccount = await Staff.findById(req.user._id).select("-password");
        let modelType = "STAFF";

        // Fallback to User model if not found in Staff
        if (!currentAccount) {
            console.log("⚠️ Not found in Staff. Looking inside User (Admin) table context...");
            currentAccount = await User.findById(req.user._id).select("-password");
            modelType = "USER/ADMIN";
        }
        
        console.log(`🔍 [${modelType}] Database lookup output for self profile ID:`, currentAccount);

        if (!currentAccount) {
            console.error(`⚠️ Mismatch Alert: User ID ${req.user._id} does not exist in Staff or User registry.`);
            return res.status(404).json({ success: false, message: "Profile context not found in cluster registry." });
        }

        res.status(200).json({ success: true, data: currentAccount });
    } catch (error) {
        console.error("💥 Crash inside getSelfProfile:", error);
        next(error);
    }
};

/* ================= 👤 B. UPDATE PROFILE DETAILS ================= */
export const updateSelfProfile = async (req, res, next) => {
    try {
        console.log("\n⚡ [API ROUTE INTERCEPT] => UPDATE PROFILE DATA triggered");
        console.log("📦 Incoming Request Body Payload:", req.body);

        const { employeeId, name, phone } = req.body;
        const targetUserId = getTargetId(employeeId, req.user?._id, "Update Details");

        if (!targetUserId) {
            console.error("❌ Target scope identification parameters failed entirely.");
            return res.status(400).json({ success: false, message: "Missing target identification payload scope." });
        }

        let currentAccount = null;
        let oldAccountData = null;
        let accountType = "STAFF";

        // 🚀 TIER 1: Check Pre-Update State in Staff
        oldAccountData = await Staff.findById(targetUserId).select("name phone employeeId");
        
        if (oldAccountData) {
            let updateFields = {};
            if (name) updateFields.name = safeUpper(name);
            if (phone) updateFields.phone = phone.trim();

            console.log("🛠️ Formulating DB Query updateFields dataset object for Staff:", updateFields);

            currentAccount = await Staff.findByIdAndUpdate(
                targetUserId,
                { $set: updateFields },
                { new: true, runValidators: false }
            ).select("-password");
        } else {
            // 🚀 TIER 2: Fallback look inside User (Admin) collection
            console.log(`⚠️ Not found in Staff registry. Checking User (Admin) Collection for ID: ${targetUserId}`);
            oldAccountData = await User.findById(targetUserId).select("name username email phone");
            
            if (oldAccountData) {
                accountType = "USER/ADMIN";
                let updateFields = {};
                if (name) updateFields.name = safeUpper(name);
                if (phone) updateFields.phone = phone.trim();

                console.log("🛠️ Formulating DB Query updateFields dataset object for User table:", updateFields);

                currentAccount = await User.findByIdAndUpdate(
                    targetUserId,
                    { $set: updateFields },
                    { new: true, runValidators: false }
                ).select("-password");
            }
        }

        console.log(`✅ [${accountType}] Post-Update Final Database Entry Data state:`, currentAccount);

        if (!currentAccount) {
            console.error(`⚠️ Account Matrix Unmapped: Document target not found anywhere for identifier: ${targetUserId}`);
            return res.status(404).json({ success: false, message: "Profile update target missing." });
        }

        // Dispatch Audit log entries dynamically
        console.log("📡 Dispatching Audit stream entry into logService layer...");
        logService.logUpdate(
            req.user?._id || targetUserId, 
            accountType, 
            currentAccount._id, 
            { name: oldAccountData.name || oldAccountData.username, phone: oldAccountData.phone }, 
            { name: currentAccount.name || currentAccount.username, phone: currentAccount.phone }, 
            req
        );

        res.status(200).json({
            success: true,
            message: "Profile details updated successfully",
            data: currentAccount
        });
    } catch (error) {
        console.error("💥 Crash inside updateSelfProfile execution loop:", error);
        next(error);
    }
};

/* ================= 🔐 C. SECURE PASSWORD MUTATION (🎯 Universal Matrix Fix) ================= */
export const changeSelfPassword = async (req, res, next) => {
    try {
        console.log("\n⚡ [API ROUTE INTERCEPT] => MUTATE PASS-PIN ACCESS BLOCK triggered");
        console.log("📦 Incoming Security Payload tracker:", {
            employeeId: req.body.employeeId,
            passwordLength: req.body.password ? req.body.password.length : 0
        });

        const { employeeId, password } = req.body;

        if (!password || password.trim().length < 4) {
            console.warn("⚠️ User pinning layout configuration rejected: PIN too short constraint failure.");
            return res.status(400).json({ success: false, message: "PIN code parameters constraint unmatched (min 4 digits)." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const targetUserId = getTargetId(employeeId, req.user?._id, "Password Mutation");
        let accountType = "STAFF";

        // 🚀 TIER 1: Primary attempt update sequence inside STAFF Collection
        console.log(`🚀 Executing Tier-1 Password mutation check targeting Staff index: ${targetUserId}`);
        let targetAccount = await Staff.findByIdAndUpdate(
            targetUserId,
            { $set: { password: hashedPassword } },
            { new: true }
        );

        // 🚀 TIER 2: Fallback lookup inside USER (Admin/Global) Collection
        if (!targetAccount) {
            console.log(`⚠️ Not found in Staff collection. Attempting User (Admin) table write for ID: ${targetUserId}`);
            targetAccount = await User.findByIdAndUpdate(
                targetUserId,
                { $set: { password: hashedPassword } },
                { new: true }
            );
            accountType = "USER/ADMIN";
        }

        // 🚀 TIER 3: Structural alphanumeric string sequence fallback search (e.g. custom payload string "DS-2026-001")
        if (!targetAccount && employeeId) {
            const rawStringId = String(employeeId).trim().toUpperCase();
            console.log(`⚠️ ObjectId lookup sequence failed. Trying alphanumeric custom code search in Staff for: ${rawStringId}`);
            targetAccount = await Staff.findOneAndUpdate(
                { employeeId: rawStringId },
                { $set: { password: hashedPassword } },
                { new: true }
            );
            accountType = "STAFF_STRING_MATCH";
        }

        console.log("🔍 Result of password mutation document retrieval state:", targetAccount ? `Success: Updated doc for ${targetAccount.name || targetAccount.username}` : "Failed: Documents are NULL");

        if (!targetAccount) {
            console.error("❌ CRITICAL METRIC MISMATCH: Target account tracking could not be mapped anywhere inside the database grid.");
            return res.status(404).json({ success: false, message: "Target account missing inside Registry Cluster." });
        }

        // Trigger professional security audit handshake logs
        console.log("📡 Dispatching Security audit handshake event logging data block...");
        logService.createLog({
            performedBy: req.user?._id || targetUserId,
            action: "PASSWORD_CHANGE",
            module: "SECURITY",
            documentId: targetAccount._id,
            remark: `Security Alert: Dynamic password parameters forced reset complete for [${accountType}] user: ${targetAccount.name || targetAccount.username || 'System Account'}`,
            req
        });

        res.status(200).json({ success: true, message: "Access PIN updated securely inside registry grid." });
    } catch (error) {
        console.error("💥 Crash inside changeSelfPassword execution block matrix:", error);
        next(error);
    }
};

/* ================= 🖼️ D. IMAGE UPLOAD ================= */
export const uploadSelfPhoto = async (req, res, next) => {
    try {
        console.log("\n⚡ [API ROUTE INTERCEPT] => ASSET PHOTO PIPELINE STREAM triggered");
        console.log("📂 File stream parsing object details context:", req.file);
        console.log("📦 Text metadata input keys:", req.body);

        const { employeeId } = req.body;

        if (!req.file) {
            console.warn("⚠️ Asset stream validation failed: Multipart buffer chunk asset detected as NULL.");
            return res.status(400).json({ success: false, message: "No dynamic asset buffer file detected." });
        }

        const targetUserId = getTargetId(employeeId, req.user?._id, "Upload Asset Photo");
        let accountType = "STAFF";

        // Try searching inside Staff first
        let currentAccount = await Staff.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : null },
                { employeeId: String(employeeId || "").toUpperCase().trim() }
            ]
        });

        // Fallback lookup inside User table
        if (!currentAccount) {
            console.log(`⚠️ Document missing in Staff table. Querying User (Admin) database records for ID: ${targetUserId}`);
            currentAccount = await User.findById(targetUserId);
            accountType = "USER/ADMIN";
        }

        console.log(`🔍 Lookup outcome for identity profile match [${accountType}]:`, currentAccount);

        if (!currentAccount) {
            console.error("❌ File allocation stream failed: Profile document mapping rejected target context parameters mapping lookup.");
            return res.status(404).json({ success: false, message: "Profile context identification refused." });
        }

        const oldPhotoPath = currentAccount.photo;
        console.log(`📸 Previous Asset File Path tracked in registry: "${oldPhotoPath}"`);

        // Local storage unlinker disk parser
        if (oldPhotoPath && !oldPhotoPath.startsWith("http")) {
            const oldFilePath = path.join(process.cwd(), oldPhotoPath);
            console.log(`⚙️ File System Trigger: Attempting storage disk sweep unlinking file at: ${oldFilePath}`);
            try { 
                await fs.unlink(oldFilePath); 
                console.log("🗑️ Old local node asset unlinked safely complete.");
            } catch (e) { 
                console.warn(`⚠️ Disk unlink skipped gracefully: ${e.message}`); 
            }
        }

        // Construct path string delivery destination URL
        const secureCloudUrl = req.file.path || req.file.secure_url || `/uploads/${req.file.filename}`;
        console.log(`🚀 Formulated new dynamic asset target node path delivery address: "${secureCloudUrl}"`);
        
        currentAccount.photo = secureCloudUrl;
        await currentAccount.save();

        // Media update log stream push
        console.log("📡 Dispatching Media stream audit logging parameters pipeline tracking standard...");
        logService.logUpdate(
            req.user?._id || targetUserId, 
            `${accountType}_MEDIA`, 
            currentAccount._id, 
            { photo: oldPhotoPath }, 
            { photo: secureCloudUrl }, 
            req
        );

        res.status(200).json({
            success: true,
            message: "Cloud photo sync stream updated complete",
            photo: secureCloudUrl
        });
    } catch (error) {
        console.error("💥 Crash inside uploadSelfPhoto asset engine tracking flow:", error);
        next(error);
    }
};

/* ================= 🚪 E. LOGOUT LOGIC ================= */
export const logoutSelfSession = async (req, res, next) => {
    try {
        console.log("\n⚡ [API ROUTE INTERCEPT] => TERMINATE WORKSPACE SESSION TERMINATION CALL");
        const { employeeId } = req.body;
        const targetUserId = getTargetId(employeeId, req.user?._id, "Session Logout");

        console.log(`⚙️ Query Execution: Erasing currentSessionId pointers across clusters.`);
        
        // Wipe pointers from Staff table first
        let currentAccount = await Staff.findOneAndUpdate(
            { 
                $or: [
                    { _id: mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : null },
                    { employeeId: String(employeeId || "").toUpperCase().trim() }
                ]
            }, 
            { $set: { currentSessionId: null } },
            { new: true }
        );

        // Fallback: Wipe pointers from User table
        if (!currentAccount) {
            console.log("⚠️ Target missing in Staff table registry. Cleansing session data inside User collection...");
            currentAccount = await User.findByIdAndUpdate(targetUserId, { $set: { currentSessionId: null } }, { new: true });
        }
        
        console.log("🔍 Post-Logout validation state check reference document output:", currentAccount);

        // Dispatch dynamic session logging metrics streams
        console.log("📡 Dispatching session log matrix cleanup alert stream event handler...");
        logService.createLog({
            performedBy: req.user?._id || targetUserId || null,
            action: "LOGOUT",
            module: "SESSION",
            documentId: currentAccount?._id || null,
            remark: `User triggered dynamic logoff session complete for account: ${currentAccount?.name || currentAccount?.username || "Unknown Identity Registry"}`,
            req
        });

        res.status(200).json({ success: true, message: "Logged out session successfully" });
    } catch (error) {
        console.error("💥 Crash inside logoutSelfSession routing channel matrix:", error);
        next(error);
    }
};