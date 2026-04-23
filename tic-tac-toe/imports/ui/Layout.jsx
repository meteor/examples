import React from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import GridOnIcon from '@mui/icons-material/GridOn';

export const Layout = ({ children }) => (
  <>
    <AppBar position="static">
      <Toolbar>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <GridOnIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="div">
            Tic-Tac-Toe
          </Typography>
        </Link>
      </Toolbar>
    </AppBar>
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {children}
    </Container>
  </>
);
