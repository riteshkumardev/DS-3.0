import React from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

function TransitionDown(props) {
  return <Slide {...props} direction="down" />;
}

const CustomSnackbar = ({ open, message, severity, onClose }) => {
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    onClose();
  };

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={4000} 
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={TransitionDown}
      // ✅ FIX: Z-Index ko max kiya aur Top se gap badhaya
      sx={{ 
        mt: 10, // Navbar ke niche laane ke liye margin-top badhaya (Adjust if needed)
        zIndex: 99999, // Taaki ye Navbar ke upar dikhe
      }}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity || "info"} 
        variant="filled" 
        elevation={10} 
        sx={{ 
          width: '100%', 
          borderRadius: '12px', 
          fontWeight: '600',
          fontSize: '0.9rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', // Visibility behtar karne ke liye
          '& .MuiAlert-icon': { fontSize: '20px' }
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;