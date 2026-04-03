import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/apiClient";

/* 🔄 Fetch Stock */
export const fetchStock = createAsyncThunk(
  "stock/fetch",
  async () => {
    const res = await api.get("/stock");
    return res.data;
  }
);

/* ➕ Add Stock */
export const addStock = createAsyncThunk(
  "stock/add",
  async (data) => {
    const res = await api.post("/stock", data);
    return res.data;
  }
);

const stockSlice = createSlice({
  name: "stock",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearStock: (state) => {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStock.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStock.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addStock.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export const { clearStock } = stockSlice.actions;
export default stockSlice.reducer;
