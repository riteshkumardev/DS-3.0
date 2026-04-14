import mongoose from 'mongoose';

const stockLogSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product reference is required']
    },
    transactionType: {
        type: String,
        enum: [
            'INWARD',    // Stock aane par (Purchase)
            'OUTWARD',   // Stock jane par (Sale)
            'ADJUSTMENT',// Manual change (Counting error theek karne ke liye)
            'RETURN',    // Customer return ya Supplier return
            'WASTAGE'    // Maal kharab hone ya girne par
        ],
        required: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    // --- Consistency Tracking ---
    previousStock: {
        type: Number,
        required: true,
        comment: 'Action se pehle kitna stock tha'
    },
    newStock: {
        type: Number,
        required: true,
        comment: 'Action ke baad kitna stock bacha'
    },
    // --- Linking ---
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        comment: 'Link to Sale ID, Purchase ID, or Adjustment ID'
    },
    remarks: {
        type: String,
        trim: true,
        uppercase: true, // Consistency for reports
        placeholder: 'e.g., LOADING WASTE, MANUAL COUNTING'
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Kis admin/staff ne stock change kiya
    }
}, {
    timestamps: true
});

// Indexing for faster stock history reports
stockLogSchema.index({ productId: 1, createdAt: -1 });

// Modern Export Syntax (Default Export)
const StockLog = mongoose.model("StockLog", stockLogSchema);
export default StockLog;