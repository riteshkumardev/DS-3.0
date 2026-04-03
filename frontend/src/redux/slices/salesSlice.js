// src/redux/slices/salesSlice.js
import { createSlice } from "@reduxjs/toolkit";

const salesSlice = createSlice({
  name: "sales",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },

  reducers: {
    /* ➕ ADD SALE */
    addSale: (state, action) => {
      state.list.push({
        ...action.payload,
        id: Date.now(), // unique id
      });
    },

    /* ✏️ UPDATE SALE */
    updateSale: (state, action) => {
      const index = state.list.findIndex(
        (sale) => sale.id === action.payload.id
      );
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },

    /* ❌ DELETE SALE */
    deleteSale: (state, action) => {
      state.list = state.list.filter(
        (sale) => sale.id !== action.payload
      );
    },

    /* 🧹 CLEAR ALL SALES */
    clearSales: (state) => {
      state.list = [];
    },
  },
});

export const {
  addSale,
  updateSale,
  deleteSale,
  clearSales,
} = salesSlice.actions;

export default salesSlice.reducer;
