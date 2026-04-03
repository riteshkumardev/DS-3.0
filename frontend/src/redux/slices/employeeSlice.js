import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/apiClient";

/* 🔄 Fetch Employees */
export const fetchEmployee = createAsyncThunk(
  "employee/fetch",
  async () => {
    const res = await api.get("/employee");
    return res.data;
  }
);

/* ➕ Add Employee */
export const addEmployee = createAsyncThunk(
  "employee/add",
  async (data) => {
    const res = await api.post("/employee", data);
    return res.data;
  }
);

const employeeSlice = createSlice({
  name: "employee",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearEmployee: (state) => {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployee.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export const { clearEmployee } = employeeSlice.actions;
export default employeeSlice.reducer;
