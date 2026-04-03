import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/apiClient";

/* 🔄 Fetch Purchase */
export const fetchPurchase = createAsyncThunk(
  "purchase/fetch",
  async () => {
    const res = await api.get("/purchase");
    return res.data;
  }
);

/* ➕ Add Purchase */
export const addPurchase = createAsyncThunk(
  "purchase/add",
  async (data) => {
    const res = await api.post("/purchase", data);
    return res.data;
  }
);

const purchaseSlice = createSlice({
  name: "purchase",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearPurchase: (state) => {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchase.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchase.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPurchase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addPurchase.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export const { clearPurchase } = purchaseSlice.actions;
export default purchaseSlice.reducer;
