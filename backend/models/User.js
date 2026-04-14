import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        uppercase: true 
    },
    // Login ID generation ke liye naya field ✅
    employeeId: {
        type: String,
        unique: true,
        sparse: true, // Purane users (bina ID waale) ke liye null allow karega
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an identity (Email)'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [4, 'Password must be at least 4 characters'], 
        select: false 
    },
    role: {
        type: String,
        enum: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF'],
        default: 'STAFF'
    },
    phone: {
        type: String,
        trim: true,
        unique: true, // Phone bhi unique rakhein toh behtar hai
        sparse: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true 
});

// Password Encryption (Save hone se pehle)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Password match karne ke liye method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Modern Export Syntax (Overwrite error se bachne ke liye)
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;