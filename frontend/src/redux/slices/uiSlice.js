import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: false,
    loading: false,
  },
  reducers: {
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { openSidebar, closeSidebar, setLoading } = uiSlice.actions;
export default uiSlice.reducer;
