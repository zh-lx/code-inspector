import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';

export interface loadingState {
  loading: boolean;
}

const initialState: loadingState = {
  loading: false
};

export const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = loadingSlice.actions;

export const selectLoading = (state: RootState) => state.loading.loading;

export default loadingSlice.reducer;
